import React, { useState, useMemo } from 'react';
import { Client } from '../types';
import { Users, Filter, UserCheck, AlertTriangle, CheckCircle2, Flame, ShieldAlert, ArrowLeft, BarChart2 } from 'lucide-react';
import { getTaskTimeStatus, getDaysDifference } from '../utils/dateUtils';
import { useAuth } from '../context/AuthContext';
import { DepartmentCard, DepartmentStats } from './DepartmentCard';
import { EscalationModal } from './EscalationModal';
import { detectEscalatedTasks } from '../utils/escalationUtils';

interface WorkloadDashboardViewProps {
  clients: Client[];
  onSelectClient?: (clientId: string) => void;
}

interface MemberWorkload {
  name: string;
  total: number;
  completed: number;
  delayed: number;
  dueSoon: number;
  criticalOverdue: number; // > 7 days
  completionRate: number;
  departments: Set<string>;
}

export const WorkloadDashboardView: React.FC<WorkloadDashboardViewProps> = React.memo(({ clients, onSelectClient }) => {
  const { profile } = useAuth();
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');
  const [isEscalationOpen, setIsEscalationOpen] = useState<boolean>(false);

  const isAdminOrManager = profile?.role === 'admin' || profile?.role === 'account_manager_head' || profile?.role === 'manager';
  const userName = profile?.name;
  const userEmail = profile?.email;

  // Escalation summary for top banner
  const escalationSummary = useMemo(() => {
    return detectEscalatedTasks(clients);
  }, [clients]);

  // Extract all team members from tasks and clients
  const teamMembers = useMemo(() => {
    const membersMap: Record<string, MemberWorkload> = {};

    clients.forEach(client => {
      if (client.caseStatus === 'مكتمل' || client.isLost || client.isArchived) return;

      const clientAccountManager = client.accountManager || client.assignedToName;

      (client.tasks || []).forEach(task => {
        const emp = task.assignedTo || clientAccountManager || 'غير معين';

        if (!membersMap[emp]) {
          membersMap[emp] = {
            name: emp,
            total: 0,
            completed: 0,
            delayed: 0,
            dueSoon: 0,
            criticalOverdue: 0,
            completionRate: 0,
            departments: new Set(),
          };
        }

        membersMap[emp].total++;

        let dept = '';
        if (task.category === 'account_management') dept = 'الأكونت مانجمنت';
        else if (task.category === 'seo') dept = 'السيو';
        else if (task.category === 'media_buying') dept = 'الميديا باينج';
        else if (task.category === 'social_media') dept = 'السوشيال ميديا';
        if (dept) membersMap[emp].departments.add(dept);

        if (task.completed) {
          membersMap[emp].completed++;
        } else {
          const timeStatus = getTaskTimeStatus(task);
          const daysDiff = getDaysDifference(task.dueDate);

          if (timeStatus.type === 'overdue' || daysDiff < 0) {
            membersMap[emp].delayed++;
            if (Math.abs(daysDiff) > 7) {
              membersMap[emp].criticalOverdue++;
            }
          } else if (timeStatus.type === 'due_soon' || timeStatus.type === 'due_today') {
            membersMap[emp].dueSoon++;
          }
        }
      });
    });

    // Compute completion rate
    Object.values(membersMap).forEach(m => {
      m.completionRate = m.total > 0 ? Math.round((m.completed / m.total) * 100) : 0;
    });

    return Object.values(membersMap).sort((a, b) => b.delayed - a.delayed || b.total - a.total);
  }, [clients]);

  // Compute department stats filtered by selected employee
  const workloadStats = useMemo(() => {
    const stats: Record<string, DepartmentStats> = {
      'قسم الأكونت مانجمنت': { total: 0, completed: 0, delayed: 0, dueSoon: 0 },
      'قسم السيو': { total: 0, completed: 0, delayed: 0, dueSoon: 0 },
      'قسم الميديا باينج': { total: 0, completed: 0, delayed: 0, dueSoon: 0 },
      'قسم السوشيال ميديا': { total: 0, completed: 0, delayed: 0, dueSoon: 0 },
    };

    clients.forEach(client => {
      if (client.caseStatus === 'مكتمل' || client.isLost || client.isArchived) return;

      const isClientCreator = isAdminOrManager || client.createdBy === userName || client.createdBy === userEmail;

      (client.tasks || []).forEach(task => {
        const empName = task.assignedTo || client.accountManager || client.assignedToName || 'غير معين';
        
        // Filter by employee if selected
        if (selectedEmployee !== 'all' && empName !== selectedEmployee) {
          return;
        }

        const isTaskOwner = isClientCreator || task.assignedTo === userName || task.createdBy === userName;
        if (!isAdminOrManager && !isTaskOwner) {
          return;
        }

        let dept = '';
        if (task.category === 'account_management') dept = 'قسم الأكونت مانجمنت';
        else if (task.category === 'seo') dept = 'قسم السيو';
        else if (task.category === 'media_buying') dept = 'قسم الميديا باينج';
        else if (task.category === 'social_media') dept = 'قسم السوشيال ميديا';
        else return;

        stats[dept].total++;
        if (task.completed) {
          stats[dept].completed++;
        } else {
          const timeStatus = getTaskTimeStatus(task);
          if (timeStatus.type === 'overdue') {
            stats[dept].delayed++;
          } else if (timeStatus.type === 'due_soon' || timeStatus.type === 'due_today') {
            stats[dept].dueSoon++;
          }
        }
      });
    });

    return stats;
  }, [clients, selectedEmployee, isAdminOrManager, userName, userEmail]);

  const departmentList = useMemo(() => {
    return Object.entries(workloadStats) as [string, DepartmentStats][];
  }, [workloadStats]);

  return (
    <div className="space-y-6 mt-8 print:mt-4 print:break-inside-avoid" dir="rtl">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 print:hidden">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white print:text-black">
              {isAdminOrManager ? 'مراقبة حِمل الفريق وتوزيع المهام' : 'حِمل العمل الخاص بك'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isAdminOrManager
                ? 'تحليل الضغط على كل موظف، نسبة الإنجاز ورصد المهام المعطلة'
                : 'متابعة أداء مهامك المسندة عبر الأقسام'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {isAdminOrManager && (
            <button
              onClick={() => setIsEscalationOpen(true)}
              className="h-10 px-3.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 text-xs font-bold flex items-center gap-2 transition active:scale-95 shadow-2xs"
            >
              <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span>نظام التصعيد الآلي</span>
              {escalationSummary.totalEscalated > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[10px] font-black">
                  {escalationSummary.totalEscalated}
                </span>
              )}
            </button>
          )}

          {/* Employee Filter Dropdown */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            <Filter className="w-3.5 h-3.5 text-slate-400 mr-2" />
            <select
              value={selectedEmployee}
              onChange={e => setSelectedEmployee(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 outline-none pr-1 pl-3 py-1 cursor-pointer"
            >
              <option value="all">جميع الموظفين ({teamMembers.length})</option>
              {teamMembers.map(m => (
                <option key={m.name} value={m.name}>
                  {m.name} ({m.total - m.completed} نشطة · {m.delayed} متأخرة)
                </option>
              ))}
            </select>
            {selectedEmployee !== 'all' && (
              <button
                onClick={() => setSelectedEmployee('all')}
                className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold px-2 py-0.5 hover:underline"
              >
                إلغاء
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Selected Employee Filter Alert */}
      {selectedEmployee !== 'all' && (
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/50 text-indigo-900 dark:text-indigo-200 text-xs">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>
              يتم الآن عرض إحصائيات ومهام الموظف:{' '}
              <strong className="underline underline-offset-4">{selectedEmployee}</strong>
            </span>
          </div>
          <button
            onClick={() => setSelectedEmployee('all')}
            className="font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
          >
            إعادة تعيين للكل
          </button>
        </div>
      )}

      {/* Department Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            توزيع المهام حسب الأقسام {selectedEmployee !== 'all' ? `للموظف (${selectedEmployee})` : ''}
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-2 print:gap-4">
          {departmentList.map(([dept, stats]) => (
            <DepartmentCard key={dept} dept={dept} stats={stats} />
          ))}
        </div>
      </div>

      {/* Individual Employee Workload Table (Admin & Managers View) */}
      {isAdminOrManager && (
        <div className="mt-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a1a1d] p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800/80">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>توزيع حِمل العمل والضغط الفعلي على الفريق</span>
                <span className="text-xs font-normal text-slate-400">
                  ({teamMembers.length} موظف ومسؤول)
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                اضغط على أي موظف لتصفية لوحة الأقسام ورؤية تفاصيل مهامه بدقة
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                طبيعي
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                ضغط مرتفع
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                حرج
              </span>
            </div>
          </div>

          <div className="overflow-x-auto mt-3">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold">
                  <th className="py-3 px-3">الموظف المسؤول</th>
                  <th className="py-3 px-3">الأقسام</th>
                  <th className="py-3 px-3">إجمالي المهام</th>
                  <th className="py-3 px-3">المهام المنجزة</th>
                  <th className="py-3 px-3">نسبة الإنجاز</th>
                  <th className="py-3 px-3">المهام المتأخرة</th>
                  <th className="py-3 px-3">تأخير حرج (&gt; 7 أيام)</th>
                  <th className="py-3 px-3">حالة الضغط</th>
                  <th className="py-3 px-3 text-left">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {teamMembers.map(m => {
                  const activeTasks = m.total - m.completed;
                  let loadLevel: 'normal' | 'high' | 'critical' = 'normal';
                  let loadText = 'طبيعي';
                  let loadClass = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50';

                  if (m.criticalOverdue > 3 || m.delayed > 15 || activeTasks > 40) {
                    loadLevel = 'critical';
                    loadText = 'حرج جداً';
                    loadClass = 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-900/50';
                  } else if (m.delayed > 5 || activeTasks > 20) {
                    loadLevel = 'high';
                    loadText = 'ضغط مرتفع';
                    loadClass = 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-900/50';
                  }

                  const isSelected = selectedEmployee === m.name;

                  return (
                    <tr
                      key={m.name}
                      onClick={() => setSelectedEmployee(isSelected ? 'all' : m.name)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-indigo-50/70 dark:bg-indigo-950/40 font-bold'
                          : 'hover:bg-slate-50/60 dark:hover:bg-slate-900/30'
                      }`}
                    >
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs">
                            {m.name.charAt(0)}
                          </div>
                          <span className="text-slate-900 dark:text-white font-semibold">
                            {m.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-500">
                        {Array.from(m.departments).slice(0, 2).join('، ') || 'عام'}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-700 dark:text-slate-300">
                        {m.total}
                      </td>
                      <td className="py-3 px-3 text-emerald-600 dark:text-emerald-400 font-bold">
                        {m.completed}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-600 rounded-full"
                              style={{ width: `${m.completionRate}%` }}
                            />
                          </div>
                          <span className="text-[11px] text-slate-500">{m.completionRate}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`font-bold ${m.delayed > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`}>
                          {m.delayed}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`font-black ${m.criticalOverdue > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                          {m.criticalOverdue}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-md border text-[11px] font-bold ${loadClass}`}>
                          {loadText}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-left">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setSelectedEmployee(isSelected ? 'all' : m.name);
                          }}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        >
                          {isSelected ? 'إلغاء التصفية' : 'تصفية المهام'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Escalation Modal */}
      <EscalationModal
        isOpen={isEscalationOpen}
        onClose={() => setIsEscalationOpen(false)}
        clients={clients}
        onSelectClient={onSelectClient}
        currentUserId={profile?.uid}
        currentUserName={profile?.name}
      />
    </div>
  );
});

WorkloadDashboardView.displayName = 'WorkloadDashboardView';
export default WorkloadDashboardView;
