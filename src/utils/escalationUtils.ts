import { Client, EscalatedTask, TaskCategory } from '../types';
import { getDaysDifference, hasValidDueDate, getTodayStr } from './dateUtils';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { sendDesktopNotification } from './notificationUtils';

/** Minimal user info needed to address notifications (from the `users` collection). */
export interface EscalationRecipient {
  id: string;
  name: string;
  role?: string;
  isActive?: boolean;
}

const MANAGER_ROLES = ['admin', 'account_manager_head', 'manager', 'account_manager'];

export interface EscalationSummary {
  totalEscalated: number;
  level1Count: number; // 1-3 days
  level2Count: number; // 4-7 days
  level3Count: number; // >7 days
  byDepartment: Record<string, number>;
  byEmployee: Record<string, number>;
  tasks: EscalatedTask[];
}

export function detectEscalatedTasks(
  clients: Client[],
  options?: { level1MaxDays?: number; level2MaxDays?: number }
): EscalationSummary {
  const l1Max = options?.level1MaxDays ?? 3;
  const l2Max = options?.level2MaxDays ?? 7;

  const tasks: EscalatedTask[] = [];
  const byDepartment: Record<string, number> = {};
  const byEmployee: Record<string, number> = {};

  clients.forEach(client => {
    if (client.caseStatus === 'مكتمل' || client.isLost || client.isArchived) return;

    (client.tasks || []).forEach(task => {
      if (task.completed || !hasValidDueDate(task)) return;

      const daysDiff = getDaysDifference(task.dueDate);
      if (daysDiff < 0) {
        const daysOverdue = Math.abs(daysDiff);

        let level: 1 | 2 | 3 = 1;
        let levelLabel = 'تنبيه موظف (1-3 أيام)';
        let escalatedToRole = 'الموظف المسؤول';

        if (daysOverdue > l2Max) {
          level = 3;
          levelLabel = 'تصعيد حرج (> 7 أيام)';
          escalatedToRole = 'الإدارة العليا / المدير العام';
        } else if (daysOverdue > l1Max) {
          level = 2;
          levelLabel = 'تصعيد إداري (4-7 أيام)';
          escalatedToRole = 'رئيس القسم / مدير الحسابات';
        }

        const deptName = getCategoryName(task.category);
        byDepartment[deptName] = (byDepartment[deptName] || 0) + 1;

        const empName = task.assignedTo || client.assignedToName || client.accountManager || 'غير معين';
        byEmployee[empName] = (byEmployee[empName] || 0) + 1;

        tasks.push({
          id: `${client.id}_${task.id}`,
          taskId: task.id,
          taskTitle: task.title,
          taskCategory: task.category,
          dueDate: task.dueDate,
          daysOverdue,
          assignedTo: empName,
          clientId: client.id,
          clientName: client.clientName,
          companyName: client.companyName,
          escalationLevel: level,
          levelLabel,
          escalatedToRole,
        });
      }
    });
  });

  // Sort tasks by days overdue descending
  tasks.sort((a, b) => b.daysOverdue - a.daysOverdue);

  const level1Count = tasks.filter(t => t.escalationLevel === 1).length;
  const level2Count = tasks.filter(t => t.escalationLevel === 2).length;
  const level3Count = tasks.filter(t => t.escalationLevel === 3).length;

  return {
    totalEscalated: tasks.length,
    level1Count,
    level2Count,
    level3Count,
    byDepartment,
    byEmployee,
    tasks,
  };
}

function getCategoryName(cat: TaskCategory): string {
  switch (cat) {
    case 'account_management':
      return 'قسم الأكونت مانجمنت';
    case 'seo':
      return 'قسم السيو';
    case 'media_buying':
      return 'قسم الميديا باينج';
    case 'social_media':
      return 'قسم السوشيال ميديا';
    default:
      return 'عام';
  }
}

/**
 * Triggers automated escalation dispatch:
 * 1. Creates notifications in Firestore for managers & assignees
 * 2. Fires a desktop notification summary
 *
 * Notifications are read with `where('userId', '==', <auth uid>)`, so every notification must be
 * addressed to a real user id. The old version wrote `userId: 'all_managers'` and
 * `userId: <employee name>`, which matched nobody — no escalation was ever delivered.
 */
export async function dispatchAutomatedEscalation(
  summary: EscalationSummary,
  options?: { currentUserId?: string; currentUserName?: string; recipients?: EscalationRecipient[] }
): Promise<{ sentCount: number; unresolvedEmployees: string[] }> {
  const recipients = (options?.recipients || []).filter(r => r.id && r.isActive !== false);
  const unresolvedEmployees: string[] = [];
  if (summary.totalEscalated === 0) {
    return { sentCount: 0, unresolvedEmployees };
  }

  // name → user ids (an employee may be stored by name or by user id on the task)
  const idsByName = new Map<string, string[]>();
  recipients.forEach(r => {
    const key = (r.name || '').trim();
    if (!key) return;
    idsByName.set(key, [...(idsByName.get(key) || []), r.id]);
  });
  const recipientIds = new Set(recipients.map(r => r.id));
  const resolveEmployee = (value: string): string[] => {
    const trimmed = (value || '').trim();
    if (recipientIds.has(trimmed)) return [trimmed];
    return idsByName.get(trimmed) || [];
  };

  // Group tasks by employee to send consolidated escalation alerts
  const employeeGroups: Record<string, EscalatedTask[]> = {};
  summary.tasks.forEach(t => {
    const emp = t.assignedTo || 'غير معين';
    if (!employeeGroups[emp]) employeeGroups[emp] = [];
    employeeGroups[emp].push(t);
  });

  const createdAt = new Date().toISOString();
  const notifications: Array<{ userId: string; title: string; message: string }> = [];

  // Summary for every active manager / department head
  recipients
    .filter(r => MANAGER_ROLES.includes(String(r.role || '').toLowerCase()))
    .forEach(manager => {
      notifications.push({
        userId: manager.id,
        title: `🚨 تقرير التصعيد الآلي للمهام المتأخرة (${summary.totalEscalated} مهمة)`,
        message: `يوجد ${summary.level3Count} مهمة متأخرة بمستوى تصعيد حرج (>7 أيام)، و${summary.level2Count} مهمة بمستوى تصعيد إداري، تم إخطار المسؤولين لمتابعتها فوراً.`,
      });
    });

  // Individual notifications for the employees with overdue tasks
  Object.entries(employeeGroups).slice(0, 15).forEach(([empName, empTasks]) => {
    if (empName === 'غير معين') return;
    const ids = resolveEmployee(empName);
    if (ids.length === 0) {
      unresolvedEmployees.push(empName);
      return;
    }
    const criticalCount = empTasks.filter(t => t.escalationLevel === 3).length;
    ids.forEach(userId => {
      notifications.push({
        userId,
        title: `تنبيه تصعيد مهام: ${empName}`,
        message: `لديك ${empTasks.length} مهمة متأخرة قيد التصعيد (${criticalCount} حرجة)، يرجى مراجعتها وتحديث حالتها في أسرع وقت.`,
      });
    });
  });

  // One atomic write instead of many unawaited ones (errors used to be swallowed by allSettled).
  for (let i = 0; i < notifications.length; i += 400) {
    const batch = writeBatch(db);
    notifications.slice(i, i + 400).forEach(n => {
      batch.set(doc(collection(db, 'notifications')), {
        ...n,
        isRead: false,
        createdAt,
        type: 'system',
      });
    });
    await batch.commit();
  }

  // Desktop Notification
  sendDesktopNotification(`🚨 تقرير التصعيد الآلي للمهام`, {
    body: `تم رصد ${summary.totalEscalated} مهمة متأخرة تتطلب التدخل (${summary.level3Count} حرجة).`,
    tag: 'escalation_report',
  });

  return { sentCount: notifications.length, unresolvedEmployees };
}

/**
 * Exports escalated tasks list to CSV
 */
export function exportEscalatedTasksCSV(tasks: EscalatedTask[]) {
  const headers = ['معرف المهمة', 'اسم العميل', 'الشركة', 'عنوان المهمة', 'القسم', 'الموظف المسؤول', 'تاريخ الاستحقاق', 'أيام التأخير', 'مستوى التصعيد', 'الجهة المصعد إليها'];

  const rows = tasks.map(t => [
    t.taskId,
    `"${(t.clientName || '').replace(/"/g, '""')}"`,
    `"${(t.companyName || 'بدون شركة').replace(/"/g, '""')}"`,
    `"${(t.taskTitle || '').replace(/"/g, '""')}"`,
    `"${getCategoryName(t.taskCategory)}"`,
    `"${(t.assignedTo || 'غير معين').replace(/"/g, '""')}"`,
    t.dueDate,
    t.daysOverdue,
    `"${t.levelLabel}"`,
    `"${t.escalatedToRole}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `escalated-tasks-${getTodayStr()}.csv`;
  // Some browsers (Firefox) ignore clicks on links that are not in the document.
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
