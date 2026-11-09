import { collection, getDocs, doc, writeBatch, setDoc, updateDoc } from 'firebase/firestore';
import { getTodayStr, toLocalDateStr } from './dateUtils';
import { db } from '../firebase';
import { TaskItem, ClientActivity } from '../types';

export interface RestoredTaskDetail {
  clientId: string;
  clientName: string;
  taskId: string;
  taskTitle: string;
  completedAt: string;
  sourceActivity: string;
}

export interface EmergencyRecoveryReport {
  success: boolean;
  clientsScanned: number;
  tasksScanned: number;
  tasksRestored: number;
  restoredDetails: RestoredTaskDetail[];
  error?: string;
}

/**
 * دالة الاسترجاع المباشرة باللوجز وباتش فايرستور
 */
export const recoverCompletedTasksFromLogs = async (): Promise<boolean> => {
  try {
    console.log("بدء عملية استرجاع المهام المفقودة...");
    const clientsSnap = await getDocs(collection(db, 'clients'));
    let recoveredCount = 0;

    // المرور على جميع العملاء
    for (const clientDoc of clientsSnap.docs) {
      const clientId = clientDoc.id;

      // 1. قراءة المجموعة الفرعية activities (سجل النشاطات) الخاصة بكل عميل
      const activitiesSnap = await getDocs(collection(db, 'clients', clientId, 'activities'));
      const activities = activitiesSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));

      // 2. البحث داخل السجلات عن أي نشاط يدل على إكمال مهمة
      const completionLogs = activities.filter(act => 
        (act.action === 'تحديث حالة المهمة' && act.details && act.details.includes('مكتملة')) ||
        act.action === 'task_completed' || 
        (act.details && act.details.toLowerCase().includes('completed')) ||
        (act.details && act.details.includes('- مكتملة')) ||
        (act.details && act.details.includes('تم إكمال')) ||
        (act.details && act.details.includes('تم إنجاز')) ||
        (act.action && act.action.includes('إكمال'))
      );

      if (completionLogs.length === 0) continue;

      // جلب مهام العميل الحالية لمطابقتها
      const tasksSnap = await getDocs(collection(db, 'clients', clientId, 'tasks'));
      const batch = writeBatch(db);
      let hasUpdates = false;

      // 3. استخراج معرّف المهمة وتاريخ الإنجاز
      for (const taskDoc of tasksSnap.docs) {
        const taskData = taskDoc.data() as TaskItem;

        // إذا كانت المهمة غير مكتملة حالياً، نبحث لها عن سجل إنجاز
        if (!taskData.completed) {
          // المطابقة بتتم إما عن طريق taskId إذا كان محفوظ في السجل، أو عن طريق اسم المهمة في تفاصيل السجل
          const matchedLog = completionLogs.find(log => 
            (log.taskId && log.taskId === taskDoc.id) || 
            (taskData.title && log.details && log.details.includes(taskData.title)) ||
            (taskData.title && log.details && log.details.includes(taskData.title.replace(/\s*\(الشهر\s*\d+\)$/, '').trim()))
          );

          if (matchedLog) {
            const taskRef = doc(db, 'clients', clientId, 'tasks', taskDoc.id);
            // استخراج تاريخ الإنجاز من السجل (سواء كان محفوظ كـ timestamp أو createdAt أو completedAt)
            const recoveredDate = toLocalDateStr(matchedLog.completedAt || matchedLog.createdAt || matchedLog.timestamp) || getTodayStr();

            // 4. تحديث المهمة لتعود completed: true مع استرجاع completedAt
            batch.update(taskRef, {
              completed: true,
              completedAt: recoveredDate
            });
            
            hasUpdates = true;
            recoveredCount++;
            console.log(`تم استرجاع المهمة: ${taskData.title} للعميل ${clientId}`);
          }
        }
      }

      // تنفيذ التحديثات المجمعة لهذا العميل
      if (hasUpdates) {
        await batch.commit();
      }
    }

    console.log(`✅ تمت عملية الاسترجاع بنجاح! تم استعادة ${recoveredCount} مهمة.`);
    try {
      window.alert(`✅ تمت عملية الاسترجاع بنجاح! تم استعادة ${recoveredCount} مهمة.`);
    } catch {
      // alert might be suppressed in some browser iframe contexts
    }
    return true;

  } catch (error) {
    console.error("حدث خطأ أثناء استرجاع المهام:", error);
    try {
      window.alert("❌ حدث خطأ أثناء الاسترجاع. يرجى مراجعة الـ Console للتفاصيل.");
    } catch {
      // alert might be suppressed in some browser iframe contexts
    }
    return false;
  }
};

/**
 * الدالة المفصلة مع تقرير واجهة المستخدم (Report Modal)
 */
export async function recoverCompletedTasksFromActivities(): Promise<EmergencyRecoveryReport> {
  const report: EmergencyRecoveryReport = {
    success: true,
    clientsScanned: 0,
    tasksScanned: 0,
    tasksRestored: 0,
    restoredDetails: []
  };

  try {
    const clientsSnap = await getDocs(collection(db, 'clients'));
    report.clientsScanned = clientsSnap.size;

    for (const clientDoc of clientsSnap.docs) {
      const clientId = clientDoc.id;
      const clientData = clientDoc.data();
      const clientName = clientData.clientName || clientData.companyName || clientId;

      const [activitiesSnap, tasksSnap] = await Promise.all([
        getDocs(collection(db, 'clients', clientId, 'activities')),
        getDocs(collection(db, 'clients', clientId, 'tasks'))
      ]);

      if (tasksSnap.empty || activitiesSnap.empty) {
        continue;
      }

      report.tasksScanned += tasksSnap.size;

      const tasksList: (TaskItem & { id: string })[] = tasksSnap.docs.map(d => ({
        id: d.id,
        ...(d.data() as TaskItem)
      }));

      // فرز النشاطات زمنياً
      const activitiesList = activitiesSnap.docs
        .map(d => ({ id: d.id, ...(d.data() as any) }))
        .sort((a, b) => new Date(a.createdAt || a.timestamp || 0).getTime() - new Date(b.createdAt || b.timestamp || 0).getTime());

      // تتبع حالة كل مهمة من السجلات
      const taskStatusFromLogs = new Map<string, {
        isCompleted: boolean;
        completedAt: string;
        activityText: string;
        taskTitle: string;
      }>();

      for (const act of activitiesList) {
        const action = (act.action || '').trim();
        const details = (act.details || '').trim();
        const fullText = `${action} ${details}`.toLowerCase();

        const isCompletion =
          act.type === 'task_completed' ||
          action === 'task_completed' ||
          (action === 'تحديث حالة المهمة' && details.includes('مكتملة')) ||
          details.includes('- مكتملة') ||
          details.includes('مكتملة') ||
          details.includes('تم إكمال') ||
          details.includes('تم إنجاز') ||
          fullText.includes('completed') ||
          action.includes('إكمال') ||
          action.includes('إنجاز');

        const isUncompletion =
          details.includes('- قيد التنفيذ') ||
          details.includes('قيد التنفيذ') ||
          details.includes('غير مكتمل') ||
          fullText.includes('in_progress') ||
          fullText.includes('incomplete');

        if (!isCompletion && !isUncompletion) {
          continue;
        }

        // استخراج عنوان المهمة إن وجد
        let extractedTitle: string | null = null;
        const matchTitle = details.match(/تم تحديث المهمة:\s*(.+?)\s*-\s*(مكتملة|قيد التنفيذ)/);
        if (matchTitle && matchTitle[1]) {
          extractedTitle = matchTitle[1].trim();
        } else {
          const matchAlt = details.match(/تم (?:إكمال|إنجاز) المهمة:\s*(.+)/);
          if (matchAlt && matchAlt[1]) {
            extractedTitle = matchAlt[1].trim();
          }
        }

        let targetTaskId: string | null = act.taskId || null;
        let matchedTaskTitle: string = extractedTitle || act.taskTitle || '';

        if (!targetTaskId) {
          for (const task of tasksList) {
            const tTitle = (task.title || '').trim();
            const cleanTTitle = tTitle.replace(/\s*\(الشهر\s*\d+\)$/, '').trim();

            if (extractedTitle) {
              const cleanExtracted = extractedTitle.replace(/\s*\(الشهر\s*\d+\)$/, '').trim();
              if (tTitle === extractedTitle || cleanTTitle === cleanExtracted) {
                targetTaskId = task.id;
                matchedTaskTitle = task.title;
                break;
              }
            } else if (tTitle && (details.includes(tTitle) || action.includes(tTitle))) {
              targetTaskId = task.id;
              matchedTaskTitle = task.title;
              break;
            } else if (cleanTTitle && cleanTTitle.length > 4 && details.includes(cleanTTitle)) {
              targetTaskId = task.id;
              matchedTaskTitle = task.title;
              break;
            }
          }
        }

        if (targetTaskId) {
          // Local calendar date of the log entry (the UTC date is a day behind after midnight in UTC+3).
          const rawDate = act.completedAt || act.createdAt || act.timestamp;
          const dateStr = (typeof rawDate === 'string' && toLocalDateStr(rawDate)) || getTodayStr();

          taskStatusFromLogs.set(targetTaskId, {
            isCompleted: isCompletion && !isUncompletion,
            completedAt: dateStr,
            activityText: `${action}: ${details}`,
            taskTitle: matchedTaskTitle || targetTaskId
          });
        }
      }

      // تطبيق التحديثات بواسطة batch
      const batch = writeBatch(db);
      let clientBatchCount = 0;

      for (const [taskId, logStatus] of taskStatusFromLogs.entries()) {
        if (!logStatus.isCompleted) continue;

        const currentTask = tasksList.find(t => t.id === taskId);
        if (!currentTask) continue;

        if (!currentTask.completed || !currentTask.completedAt) {
          const taskDocRef = doc(db, 'clients', clientId, 'tasks', taskId);
          const restoredCompletedAt = logStatus.completedAt || currentTask.completedAt || getTodayStr();

          batch.update(taskDocRef, {
            completed: true,
            completedAt: restoredCompletedAt
          });

          clientBatchCount++;
          report.tasksRestored++;
          report.restoredDetails.push({
            clientId,
            clientName,
            taskId,
            taskTitle: currentTask.title || logStatus.taskTitle,
            completedAt: restoredCompletedAt,
            sourceActivity: logStatus.activityText
          });
        }
      }

      if (clientBatchCount > 0) {
        await batch.commit();

        // تحديث تاريخ آخر تحديث للعميل وإضافة نشاط توثيقي
        await updateDoc(doc(db, 'clients', clientId), {
          lastUpdated: new Date().toISOString()
        });

        const recoveryLogId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        await setDoc(doc(db, 'clients', clientId, 'activities', recoveryLogId), {
          id: recoveryLogId,
          action: 'استرجاع الطوارئ للمهام',
          details: `تم بنجاح استرجاع ${clientBatchCount} مهمة مكتملة من سجل النشاطات التاريخي`,
          createdAt: new Date().toISOString(),
          performedBy: 'مدير النظام (استرجاع آلي)'
        });
      }
    }

    return report;
  } catch (err: any) {
    console.error('Error in emergency task recovery:', err);
    report.success = false;
    report.error = err?.message || String(err);
    return report;
  }
}

if (typeof window !== 'undefined') {
  (window as any).recoverCompletedTasksFromLogs = recoverCompletedTasksFromLogs;
  (window as any).recoverCompletedTasksFromActivities = recoverCompletedTasksFromActivities;
}

