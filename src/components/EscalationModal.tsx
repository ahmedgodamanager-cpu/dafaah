import React, { useState, useMemo } from 'react';
import { Client, EscalatedTask } from '../types';
import { detectEscalatedTasks, dispatchAutomatedEscalation, exportEscalatedTasksCSV, EscalationRecipient } from '../utils/escalationUtils';
import {
  AlertTriangle,
  Flame,
  ShieldAlert,
  Send,
  Download,
  Filter,
  Search,
  CheckCircle2,
  X,
  User,
  Building2,
  Calendar,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

/** The team (users collection) with the same active / role rules as App.tsx. */
async function loadEscalationRecipients(): Promise<EscalationRecipient[]> {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map(d => {
    const data = d.data() as Record<string, any>;
    let role = String(data.role || '').toLowerCase();
    if (role === 'manager' || role === 'account_manager') role = 'account_manager_head';
    const isActive = !(
      ['pending', 'suspended', 'disabled', 'stopped'].includes(role) ||
      ['pending', 'suspended', 'disabled', 'inactive'].includes(String(data.status || '').toLowerCase()) ||
      data.isSuspended === true || data.disabled === true || data.isActive === false
    );
    return { id: d.id, name: data.name || data.email || '', role, isActive };
  });
}

interface EscalationModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  onSelectClient?: (clientId: string) => void;
  currentUserId?: string;
  currentUserName?: string;
  /** Team members (from the users collection) — needed to address the notifications. */
  recipients?: EscalationRecipient[];
}

export const EscalationModal: React.FC<EscalationModalProps> = ({
  isOpen,
  onClose,
  clients,
  onSelectClient,
  currentUserId,
  currentUserName,
  recipients = [],
}) => {
  const [selectedLevel, setSelectedLevel] = useState<'all' | '1' | '2' | '3'>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isDispatching, setIsDispatching] = useState<boolean>(false);

  // Compute escalated tasks
  const summary = useMemo(() => {
    return detectEscalatedTasks(clients);
  }, [clients]);

  // Unique employees list
  const employeeOptions = useMemo(() => {
    return Object.keys(summary.byEmployee).sort();
  }, [summary.byEmployee]);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return summary.tasks.filter(t => {
      if (selectedLevel !== 'all' && t.escalationLevel.toString() !== selectedLevel) return false;
      if (selectedEmployee !== 'all' && t.assignedTo !== selectedEmployee) return false;
      if (selectedDepartment !== 'all' && t.taskCategory !== selectedDepartment) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesClient = t.clientName.toLowerCase().includes(q);
        const matchesTask = t.taskTitle.toLowerCase().includes(q);
        const matchesEmployee = (t.assignedTo || '').toLowerCase().includes(q);
        if (!matchesClient && !matchesTask && !matchesEmployee) return false;
      }
      return true;
    });
  }, [summary.tasks, selectedLevel, selectedEmployee, selectedDepartment, searchQuery]);

  if (!isOpen) return null;

  const handleDispatchEscalation = async () => {
    if (isDispatching) return;
    setIsDispatching(true);
    try {
      const team = recipients.length > 0 ? recipients : await loadEscalationRecipients();
      const res = await dispatchAutomatedEscalation(summary, {
        currentUserId,
        currentUserName,
        recipients: team,
      });
      if (res.sentCount > 0) {
        toast.success(`تم إرسال إشعارات التصعيد بنجاح (${res.sentCount} إشعار تم توجيهه للإدارة والموظفين)`);
      } else {
        toast('لا توجد إشعارات لإرسالها', { icon: 'ℹ️' });
      }
      if (res.unresolvedEmployees.length > 0) {
        toast(`لم يتم العثور على حساب في النظام باسم: ${res.unresolvedEmployees.join('، ')}`, { icon: '⚠️', duration: 7000 });
      }
    } catch (err) {
      console.error('Error dispatching automated escalation:', err);
      toast.error('حدث خطأ أثناء إرسال إشعارات التصعيد');
    } finally {
      setIsDispatching(false);
    }
  };

  const handleExport = () => {
    if (filteredTasks.length === 0) {
      toast.error('لا توجد مهام مصعدة للتصدير');
      return;
    }
    exportEscalatedTasksCSV(filteredTasks);
    toast.success('تم تصدير ملف التصعيد بنجاح');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto bg-slate-950/60 backdrop-blur-xs">
      <div
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a1a1d] shadow-2xl text-slate-900 dark:text-slate-100 overflow-hidden"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>نظام التصعيد الآلي للمهام المتأخرة</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-extrabold">
                  {summary.totalEscalated} مهمة متأخرة
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                تحديد مواطن التعطيل وتصعيد المهام آلياً حسب مستويات التأخير للموظف المسؤول ورؤساء الأقسام
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tier Cards Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-6 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/30 dark:bg-slate-900/10">
          {/* Level 1 */}
          <div
            onClick={() => setSelectedLevel(selectedLevel === '1' ? 'all' : '1')}
            className={`cursor-pointer p-4 rounded-2xl border transition-all ${
              selectedLevel === '1'
                ? 'border-amber-400 bg-amber-50/50 dark:bg-amber-950/20 shadow-sm'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#222225] hover:border-amber-300'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-amber-600 dark:text-amber-400 font-semibold mb-1">
              <span>المستوى 1: تنبيه مسؤول</span>
              <Clock className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {summary.level1Count}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              تأخير من 1 إلى 3 أيام · إشعار الموظف المنفذ
            </p>
          </div>

          {/* Level 2 */}
          <div
            onClick={() => setSelectedLevel(selectedLevel === '2' ? 'all' : '2')}
            className={`cursor-pointer p-4 rounded-2xl border transition-all ${
              selectedLevel === '2'
                ? 'border-orange-400 bg-orange-50/50 dark:bg-orange-950/20 shadow-sm'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#222225] hover:border-orange-300'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-orange-600 dark:text-orange-400 font-semibold mb-1">
              <span>المستوى 2: تصعيد إداري</span>
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {summary.level2Count}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              تأخير من 4 إلى 7 أيام · إخطار رئيس القسم
            </p>
          </div>

          {/* Level 3 */}
          <div
            onClick={() => setSelectedLevel(selectedLevel === '3' ? 'all' : '3')}
            className={`cursor-pointer p-4 rounded-2xl border transition-all ${
              selectedLevel === '3'
                ? 'border-rose-400 bg-rose-50/50 dark:bg-rose-950/20 shadow-sm'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#222225] hover:border-rose-300'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-rose-600 dark:text-rose-400 font-semibold mb-1">
              <span>المستوى 3: تصعيد حرج</span>
              <Flame className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
              {summary.level3Count}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              تأخير &gt; 7 أيام · تقرير فوري للإدارة العليا
            </p>
          </div>
        </div>

        {/* Filters and Actions Bar */}
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
            {/* Search */}
            <div className="relative flex-1 min-w-[180px]">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="ابحث باسم العميل، المهمة، أو الموظف..."
                className="w-full h-10 pr-9 pl-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-xs outline-none"
              />
            </div>

            {/* Employee Filter */}
            <select
              value={selectedEmployee}
              onChange={e => setSelectedEmployee(e.target.value)}
              className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-xs outline-none font-medium"
            >
              <option value="all">كل الموظفين ({employeeOptions.length})</option>
              {employeeOptions.map(emp => (
                <option key={emp} value={emp}>
                  {emp} ({summary.byEmployee[emp]})
                </option>
              ))}
            </select>

            {/* Department Filter */}
            <select
              value={selectedDepartment}
              onChange={e => setSelectedDepartment(e.target.value)}
              className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-xs outline-none font-medium"
            >
              <option value="all">كل الأقسام</option>
              <option value="account_management">الأكونت مانجمنت</option>
              <option value="seo">السيو</option>
              <option value="media_buying">الميديا باينج</option>
              <option value="social_media">السوشيال ميديا</option>
            </select>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-1.5 transition active:scale-95"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>تصدير CSV</span>
            </button>
            <button
              onClick={handleDispatchEscalation}
              disabled={isDispatching || summary.totalEscalated === 0}
              className="h-10 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition disabled:opacity-50 active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>{isDispatching ? 'جاري الإرسال...' : 'تشغيل التصعيد الآلي'}</span>
            </button>
          </div>
        </div>

        {/* Tasks List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 divide-y divide-slate-100 dark:divide-slate-800/60">
          {filteredTasks.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500/60 mb-2" />
              <p className="text-sm font-bold">لا توجد مهام تطابق معايير الفلترة الحالية</p>
              <p className="text-xs text-slate-500 mt-1">جميع المهام المحددة ضمن الجدول الزمني الطبيعي</p>
            </div>
          ) : (
            filteredTasks.map(t => {
              const badgeStyle =
                t.escalationLevel === 3
                  ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-900/60'
                  : t.escalationLevel === 2
                  ? 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border-orange-200 dark:border-orange-900/60'
                  : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-900/60';

              return (
                <div
                  key={t.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-900/20 px-2 rounded-xl transition"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-md border ${badgeStyle}`}>
                        {t.levelLabel}
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {t.taskTitle}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {t.clientName}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        المسؤول: {t.assignedTo}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        استحقاق: {t.dueDate}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="text-rose-600 dark:text-rose-400 font-bold">
                        متأخرة {t.daysOverdue} يوم
                      </span>
                    </div>
                  </div>

                  {onSelectClient && (
                    <button
                      onClick={() => {
                        onClose();
                        onSelectClient(t.clientId);
                      }}
                      className="shrink-0 self-start sm:self-center h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 flex items-center gap-1 transition"
                    >
                      <span>عرض العميل</span>
                      <ArrowRight className="w-3 h-3 rotate-180" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>يتم تفعيل التصعيد الآلي تلقائياً يومياً عند اكتشاف تجاوز المواعيد النهائية للمهام.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
