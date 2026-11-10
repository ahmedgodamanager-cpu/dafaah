import React, { useState, useMemo } from 'react';
import { Client, TaskCategory, TaskItem } from '../types';
import { COMPANY_OPTIONS } from '../data/initialClients';
import { getDaysDifference, formatDateArabic, parseDate, getTodayStr, formatDateToYYYYMMDD } from '../utils/dateUtils';
import {
  Printer,
  Download,
  X,
  Gauge,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Building2,
  TrendingUp,
  Award,
  Layers,
  FileText,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ExecutiveReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
}

interface DeptReportStats {
  name: string;
  category: TaskCategory;
  total: number;
  completedOnTime: number;
  completedLate: number;
  overdue: number;
  pendingDueSoon: number;
  slaRate: number;
  statusRating: 'ممتاز' | 'جيد' | 'يحتاج متابعة' | 'حرج';
}

export const ExecutiveReportModal: React.FC<ExecutiveReportModalProps> = ({
  isOpen,
  onClose,
  clients,
}) => {
  const [reportPeriod, setReportPeriod] = useState<'weekly' | 'monthly' | 'all'>('weekly');
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [meetingNotes, setMeetingNotes] = useState<string>('');

  const todayStr = useMemo(() => {
    return new Date().toLocaleDateString('ar-EG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  // Clients in the report: selected company, and only ongoing clients (completed, lost and archived
  // clients were skipped in the analysis but still counted as "active clients" in the summary).
  const filteredClients = useMemo(() => {
    return clients.filter(c =>
      (selectedCompany === 'all' || (c.companyName || 'بدون شركة') === selectedCompany) &&
      c.caseStatus !== 'مكتمل' && !c.isLost && !c.isArchived
    );
  }, [clients, selectedCompany]);

  // Compute tasks within period
  const tasksAnalysis = useMemo(() => {
    // Calendar days as YYYY-MM-DD (local), so they compare correctly as text.
    const dayKey = (value?: string) => {
      const d = value ? parseDate(value) : null;
      return d ? formatDateToYYYYMMDD(d) : '';
    };
    const shiftDays = (days: number) => {
      const d = new Date();
      d.setDate(d.getDate() + days);
      return formatDateToYYYYMMDD(d);
    };
    const today = getTodayStr();
    const soonLimit = shiftDays(2);
    const windowStart = reportPeriod === 'weekly' ? shiftDays(-7) : reportPeriod === 'monthly' ? shiftDays(-30) : '';

    /**
     * Which tasks belong to the period:
     * - completed: finished inside the period (by completion date; due date if it was not recorded).
     *   A task due long ago but finished this week IS this week's work — it used to be dropped,
     *   which hid late completions and made the SLA look better.
     * - open: overdue (the backlog), due today, or due within 2 days. Open tasks due later in the
     *   contract used to be counted too (no upper limit), inflating every "weekly" total.
     */
    const inPeriod = (task: TaskItem) => {
      if (!windowStart) return true; // 'all'
      if (task.completed) {
        const doneOn = dayKey(task.completedAt) || dayKey(task.dueDate);
        return !!doneOn && doneOn >= windowStart && doneOn <= today;
      }
      const due = dayKey(task.dueDate);
      return !!due && due <= soonLimit;
    };

    const depts: Record<TaskCategory, DeptReportStats> = {
      account_management: {
        name: 'قسم الأكونت مانجمنت',
        category: 'account_management',
        total: 0,
        completedOnTime: 0,
        completedLate: 0,
        overdue: 0,
        pendingDueSoon: 0,
        slaRate: 0,
        statusRating: 'جيد',
      },
      seo: {
        name: 'قسم السيو',
        category: 'seo',
        total: 0,
        completedOnTime: 0,
        completedLate: 0,
        overdue: 0,
        pendingDueSoon: 0,
        slaRate: 0,
        statusRating: 'جيد',
      },
      media_buying: {
        name: 'قسم الميديا باينج',
        category: 'media_buying',
        total: 0,
        completedOnTime: 0,
        completedLate: 0,
        overdue: 0,
        pendingDueSoon: 0,
        slaRate: 0,
        statusRating: 'جيد',
      },
      social_media: {
        name: 'قسم السوشيال ميديا',
        category: 'social_media',
        total: 0,
        completedOnTime: 0,
        completedLate: 0,
        overdue: 0,
        pendingDueSoon: 0,
        slaRate: 0,
        statusRating: 'جيد',
      },
    };

    let totalTasks = 0;
    let totalCompleted = 0;
    let totalCompletedOnTime = 0;
    let totalOverdue = 0;
    let criticalTasksCount = 0;

    const criticalTasksList: Array<{
      clientName: string;
      taskTitle: string;
      deptName: string;
      assignedTo: string;
      daysOverdue: number;
    }> = [];

    const memberContributions: Record<string, { completed: number; overdue: number }> = {};

    filteredClients.forEach(client => {
      (client.tasks || []).forEach(task => {
        if (!task || !inPeriod(task)) return;

        const deptKey = task.category;
        if (!depts[deptKey]) return;

        totalTasks++;
        depts[deptKey].total++;

        const daysDiff = getDaysDifference(task.dueDate);
        const emp = task.assignedTo || client.accountManager || 'غير معين';

        if (!memberContributions[emp]) {
          memberContributions[emp] = { completed: 0, overdue: 0 };
        }

        if (task.completed) {
          totalCompleted++;
          memberContributions[emp].completed++;

          const completedOn = task.completedAt ? parseDate(task.completedAt) : null;
          if (completedOn) {
            const completedDiff = getDaysDifference(task.dueDate, completedOn);
            if (completedDiff >= 0) {
              totalCompletedOnTime++;
              depts[deptKey].completedOnTime++;
            } else {
              depts[deptKey].completedLate++;
            }
          } else {
            totalCompletedOnTime++;
            depts[deptKey].completedOnTime++;
          }
        } else {
          if (daysDiff < 0) {
            totalOverdue++;
            depts[deptKey].overdue++;
            memberContributions[emp].overdue++;

            const overdueDays = Math.abs(daysDiff);
            if (overdueDays > 7) {
              criticalTasksCount++;
              if (criticalTasksList.length < 10) {
                criticalTasksList.push({
                  clientName: client.clientName,
                  taskTitle: task.title,
                  deptName: depts[deptKey].name,
                  assignedTo: emp,
                  daysOverdue: overdueDays,
                });
              }
            }
          } else if (parseDate(task.dueDate) && daysDiff <= 2) {
            // (a task without a due date is not "due soon")
            depts[deptKey].pendingDueSoon++;
          }
        }
      });
    });

    // Calculate SLA Rate & Ratings per department
    Object.values(depts).forEach(d => {
      const eligibleForSla = d.completedOnTime + d.completedLate + d.overdue;
      d.slaRate = eligibleForSla > 0 ? Math.round((d.completedOnTime / eligibleForSla) * 100) : 100;

      if (d.slaRate >= 85) d.statusRating = 'ممتاز';
      else if (d.slaRate >= 70) d.statusRating = 'جيد';
      else if (d.slaRate >= 50) d.statusRating = 'يحتاج متابعة';
      else d.statusRating = 'حرج';
    });

    // Overall SLA
    const overallEligible = totalCompletedOnTime + (totalCompleted - totalCompletedOnTime) + totalOverdue;
    const overallSlaRate = overallEligible > 0 ? Math.round((totalCompletedOnTime / overallEligible) * 100) : 100;
    const overallCompletionRate = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;

    // Top performers
    const sortedMembers = Object.entries(memberContributions)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.completed - a.completed)
      .slice(0, 5);

    return {
      totalTasks,
      totalCompleted,
      totalCompletedOnTime,
      totalOverdue,
      criticalTasksCount,
      criticalTasksList,
      overallSlaRate,
      overallCompletionRate,
      departments: Object.values(depts),
      sortedMembers,
    };
  }, [filteredClients, reportPeriod]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ['القسم', 'إجمالي المهام', 'المنجز بالموعد', 'المنجز متأخراً', 'المتأخر حالياً', 'نسبة الـ SLA', 'تقييم الأداء'];
    const rows = tasksAnalysis.departments.map(d => [
      `"${d.name}"`,
      d.total,
      d.completedOnTime,
      d.completedLate,
      d.overdue,
      `${d.slaRate}%`,
      `"${d.statusRating}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `executive-sla-report-${getTodayStr()}.csv`;
    link.click();
    toast.success('تم تصدير التقرير التنفيذي بنجاح');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto bg-slate-950/70 backdrop-blur-xs print:p-0 print:bg-white print:static">
      <div
        className="relative w-full max-w-5xl max-h-[94vh] flex flex-col rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161618] shadow-2xl text-slate-900 dark:text-slate-100 overflow-hidden print:max-h-none print:h-auto print:border-none print:shadow-none print:rounded-none"
        dir="rtl"
      >
        {/* Top Control Bar (Hidden when printing) */}
        <div className="flex flex-wrap items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/40 print:hidden gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">نطاق التقرير:</span>
            <div className="flex items-center bg-slate-200/60 dark:bg-slate-800 p-0.5 rounded-xl text-xs font-bold">
              <button
                onClick={() => setReportPeriod('weekly')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  reportPeriod === 'weekly'
                    ? 'bg-white dark:bg-slate-700 shadow-xs text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                أسبوعي
              </button>
              <button
                onClick={() => setReportPeriod('monthly')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  reportPeriod === 'monthly'
                    ? 'bg-white dark:bg-slate-700 shadow-xs text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                شهري
              </button>
              <button
                onClick={() => setReportPeriod('all')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  reportPeriod === 'all'
                    ? 'bg-white dark:bg-slate-700 shadow-xs text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                شامل
              </button>
            </div>

            <select
              value={selectedCompany}
              onChange={e => setSelectedCompany(e.target.value)}
              className="h-8 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium outline-none"
            >
              <option value="all">كافة الشركات</option>
              {COMPANY_OPTIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="h-8 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>تصدير CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="h-8 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة / حفظ كـ PDF</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Report Printable Content Area */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 print:p-0 print:space-y-4 print:overflow-visible">
          {/* Executive Header */}
          <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-5">
            <div>
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-extrabold mb-1">
                <Gauge className="w-4 h-4" />
                <span>ملخص الأداء التنفيذي واتفاقية مستوى الخدمة (SLA Report)</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                تقرير أداء الأقسام وسير العمل
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                الفترة:{' '}
                {reportPeriod === 'weekly'
                  ? 'الأسبوعية'
                  : reportPeriod === 'monthly'
                  ? 'الشهرية'
                  : 'الشاملة'}{' '}
                · تاريخ الإصدار: {todayStr} · نطاق الشركات:{' '}
                {selectedCompany === 'all' ? 'جميع الشركات' : selectedCompany}
              </p>
            </div>
            <div className="text-left">
              <span className="inline-block px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs">
                Account Management CRM
              </span>
            </div>
          </div>

          {/* KPI Executive Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {/* SLA Rate */}
            <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/30">
              <span className="text-xs text-slate-500 font-semibold block mb-1">
                نسبة الامتثال للـ SLA
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
                  {tasksAnalysis.overallSlaRate}%
                </span>
                <span className="text-[11px] font-bold text-slate-400">
                  {tasksAnalysis.overallSlaRate >= 75 ? 'ممتاز' : 'يحتاج متابعة'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                {tasksAnalysis.totalCompletedOnTime} مهمة بالموعد
              </span>
            </div>

            {/* Total Tasks */}
            <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/30">
              <span className="text-xs text-slate-500 font-semibold block mb-1">
                إجمالي المهام والمنجز
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 dark:text-white">
                  {tasksAnalysis.totalCompleted}
                </span>
                <span className="text-xs text-slate-400">/ {tasksAnalysis.totalTasks}</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                نسبة الإنجاز {tasksAnalysis.overallCompletionRate}%
              </span>
            </div>

            {/* Overdue */}
            <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/30">
              <span className="text-xs text-slate-500 font-semibold block mb-1">
                المهام المتأخرة حالياً
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-rose-600 dark:text-rose-400">
                  {tasksAnalysis.totalOverdue}
                </span>
              </div>
              <span className="text-[10px] text-rose-500 mt-1 block">
                {tasksAnalysis.criticalTasksCount} مهمة حرجة (&gt; 7 أيام)
              </span>
            </div>

            {/* On-Time Rate */}
            <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/30">
              <span className="text-xs text-slate-500 font-semibold block mb-1">
                العملاء النشطين بالفترة
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 dark:text-white">
                  {filteredClients.length}
                </span>
                <span className="text-[11px] text-slate-400">عميل</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                متابعة دورية مستمرة
              </span>
            </div>
          </div>

          {/* Department Position Matrix Table */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-500" />
                <span>مصفوفة وموقف الأقسام التنفيذية</span>
              </h3>
              <span className="text-xs text-slate-400">ميديا · سيو · سوشيال · أكونت مانجمنت</span>
            </div>
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/20 text-slate-400 font-bold">
                  <th className="py-3 px-4">القسم</th>
                  <th className="py-3 px-3">إجمالي المهام</th>
                  <th className="py-3 px-3">المنجز في الموعد</th>
                  <th className="py-3 px-3">المنجز متأخراً</th>
                  <th className="py-3 px-3">المتأخر حالياً</th>
                  <th className="py-3 px-3">نسبة الـ SLA</th>
                  <th className="py-3 px-4">تقييم الأداء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {tasksAnalysis.departments.map(d => {
                  let ratingClass = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300';
                  if (d.statusRating === 'حرج')
                    ratingClass = 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300';
                  else if (d.statusRating === 'يحتاج متابعة')
                    ratingClass = 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300';

                  return (
                    <tr key={d.category} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {d.name}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-700 dark:text-slate-300">
                        {d.total}
                      </td>
                      <td className="py-3 px-3 text-emerald-600 dark:text-emerald-400 font-bold">
                        {d.completedOnTime}
                      </td>
                      <td className="py-3 px-3 text-amber-600 dark:text-amber-400">
                        {d.completedLate}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`font-bold ${d.overdue > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`}>
                          {d.overdue}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-600 rounded-full"
                              style={{ width: `${d.slaRate}%` }}
                            />
                          </div>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {d.slaRate}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${ratingClass}`}>
                          {d.statusRating}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Critical Tasks & Top Contributors Two-Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Critical Tasks for Executive Action */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/30 dark:bg-slate-900/20">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <span>المهام الحرجة التي تتطلب تدخلاً (أكثر من 7 أيام تأخير)</span>
              </h4>
              {tasksAnalysis.criticalTasksList.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">لا توجد مهام حرجة حالياً</p>
              ) : (
                <div className="space-y-2 text-xs">
                  {tasksAnalysis.criticalTasksList.map((t, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-[#1a1a1d] flex items-center justify-between gap-2"
                    >
                      <div className="truncate">
                        <span className="font-bold text-slate-900 dark:text-white block truncate">
                          {t.taskTitle}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {t.clientName} · {t.deptName} · المسؤول: {t.assignedTo}
                        </span>
                      </div>
                      <span className="shrink-0 text-rose-600 font-bold text-[11px]">
                        تأخير {t.daysOverdue} يوم
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Team Contributors */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/30 dark:bg-slate-900/20">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                <Award className="w-4 h-4 text-amber-500" />
                <span>أبرز المنجزين في الفريق خلال الفترة</span>
              </h4>
              <div className="space-y-2 text-xs">
                {tasksAnalysis.sortedMembers.map((m, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-[#1a1a1d] flex items-center justify-between gap-2"
                  >
                    <span className="font-bold text-slate-900 dark:text-white">{m.name}</span>
                    <div className="flex items-center gap-3 text-[11px]">
                      <span className="text-emerald-600 font-bold">{m.completed} منجزة</span>
                      <span className="text-slate-400">·</span>
                      <span className="text-rose-500">{m.overdue} متأخرة</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Meeting Notes / Executive Action Plan (Can be typed before print) */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/20 dark:bg-slate-900/10">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-indigo-500" />
              <span>مخرجات وتوصيات الاجتماع التنفيذي (Action Items):</span>
            </h4>
            <textarea
              value={meetingNotes}
              onChange={e => setMeetingNotes(e.target.value)}
              placeholder="اكتب هنا التوصيات والقرارات التي تم اتخاذها أثناء الاجتماع التنفيذي لتضمينها في الطباعة أو محضر الاجتماع..."
              rows={3}
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a1a1d] text-xs outline-none focus:border-indigo-500 transition"
            />
          </div>

          {/* Signoff block for printed document */}
          <div className="hidden print:grid grid-cols-2 gap-8 pt-8 border-t border-slate-300 text-xs text-slate-600">
            <div>
              <span className="font-bold block mb-1">اعتماد مدير العمليات / Head of AM:</span>
              <span>التوقيع: ____________________</span>
            </div>
            <div className="text-left">
              <span className="font-bold block mb-1">اعتماد الإدارة العليا / Managing Director:</span>
              <span>التوقيع: ____________________</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
