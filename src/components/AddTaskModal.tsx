import React, { useState, useMemo, useEffect } from 'react';
import { getTodayStr, formatDateToYYYYMMDD, isPlausibleDateStr } from '../utils/dateUtils';
import { createPortal } from 'react-dom';
import { X, CheckSquare, Calendar, Tag, FileText, User, AlertTriangle, Zap } from 'lucide-react';
import { TaskCategory, TaskItem } from '../types';
import { CATEGORIES_INFO } from '../data/initialClients';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  onAddTask: (clientId: string, newTask: TaskItem) => void;
  usersMap?: Record<string, string>;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({
  isOpen,
  onClose,
  clientId,
  onAddTask,
  usersMap = {},
}) => {
  // Local dates (toISOString() gives the UTC date, a day behind between 00:00 and 03:00 in UTC+3)
  const todayStr = getTodayStr();
  const defaultDueDate = new Date();
  defaultDueDate.setDate(defaultDueDate.getDate() + 7);
  const defaultDueDateStr = formatDateToYYYYMMDD(defaultDueDate);

  const [title, setTitle] = useState('');
  const [taskNumber, setTaskNumber] = useState(`TSK-${Math.floor(10 + Math.random() * 90)}`);
  const [category, setCategory] = useState<TaskCategory>('account_management');
  const [startDate, setStartDate] = useState(todayStr);
  const [dueDate, setDueDate] = useState(defaultDueDateStr);
  const [assignedTo, setAssignedTo] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [notes, setNotes] = useState('');

  // Start from a clean form every time it opens. The modal stays mounted, so the previous task's
  // title, urgent flag, notes, assignee and number used to appear again for the next client, with
  // default dates from the day the app was opened.
  useEffect(() => {
    if (!isOpen) return;
    const due = new Date();
    due.setDate(due.getDate() + 7);
    setTitle('');
    setTaskNumber(`TSK-${Math.floor(10 + Math.random() * 90)}`);
    setCategory('account_management');
    setStartDate(getTodayStr());
    setDueDate(formatDateToYYYYMMDD(due));
    setAssignedTo('');
    setIsUrgent(false);
    setNotes('');
  }, [isOpen, clientId]);

  // Extract unique staff names from usersMap
  const staffList = useMemo(() => {
    const list = Object.values(usersMap).filter(Boolean);
    return Array.from(new Set(list)).sort();
  }, [usersMap]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('الرجاء كتابة عنوان التاسك');
      return;
    }
    if (!isPlausibleDateStr(dueDate) || (startDate && !isPlausibleDateStr(startDate))) {
      alert('الرجاء التأكد من التواريخ (السنة غير صحيحة)');
      return;
    }
    if (startDate && dueDate < startDate) {
      alert('تاريخ التسليم لا يمكن أن يكون قبل تاريخ البداية');
      return;
    }

    const newTask: TaskItem = {
      id: `t-${Date.now()}`,
      taskNumber: taskNumber || 'TSK-01',
      title: isUrgent ? `🔥 [عاجل جداً] ${title}` : title,
      category,
      startDate,
      dueDate,
      assignedTo: assignedTo || undefined,
      completed: false,
      notes: notes || undefined,
    };

    onAddTask(clientId, newTask);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4" dir="rtl">
      <div className="bg-[var(--surface)] rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-[var(--border)] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--border)] bg-slate-50/60 dark:bg-slate-900/40 text-[var(--text)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-500 flex items-center justify-center">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">إضافة تاسك جديد لرحلة العميل</h2>
              <p className="text-[11px] text-slate-400">تحديد المواعيد، القسم، والموظف المسؤول مع التحقق من الاتصال</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs">
          
          {/* Title */}
          <div>
            <label className="block font-bold text-[var(--text)] mb-1">عنوان التاسك / المهمة *</label>
            <input
              type="text"
              required
              value={title || ''}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: إرسال الميديا بلان واعتماد العميل"
              className="w-full px-3 py-2 border border-[var(--border)] dark:bg-slate-950 dark:text-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Urgent Toggle */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Zap className={`w-4 h-4 ${isUrgent ? 'text-amber-500' : 'text-slate-400'}`} />
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">مهمة عاجلة جداً (أولوية قصوى)</span>
                <span className="text-[10px] text-slate-400">تتطلب تنفيذاً فورياً وتأكيد تواجد الموظف</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isUrgent}
              onChange={(e) => setIsUrgent(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Task Number */}
            <div>
              <label className="block font-bold text-[var(--text)] mb-1">رمز / رقم التاسك</label>
              <input
                type="text"
                value={taskNumber || ''}
                onChange={(e) => setTaskNumber(e.target.value)}
                placeholder="مثال: W1-SEO-01"
                className="w-full px-3 py-2 border border-[var(--border)] dark:bg-slate-950 dark:text-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block font-bold text-[var(--text)] mb-1">المرحلة / التصنيف</label>
              <select
                value={category || ''}
                onChange={(e) => setCategory(e.target.value as TaskCategory)}
                className="w-full px-3 py-2 border border-[var(--border)] dark:bg-slate-950 dark:text-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                {CATEGORIES_INFO.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.nameAr}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Assigned To */}
          <div>
            <label className="block font-bold text-[var(--text)] mb-1">الموظف المسؤول</label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border)] dark:bg-slate-950 dark:text-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="">بدون تعيين (غير محدد)</option>
              {staffList.map((staffName) => (
                <option key={staffName} value={staffName}>
                  {staffName}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Start Date */}
            <div>
              <label className="block font-bold text-[var(--text)] mb-1">تاريخ البداية</label>
              <input
                type="date"
                required
                value={startDate || ''}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--border)] dark:bg-slate-950 dark:text-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Due Date */}
            <div>
              <label className="block font-bold text-[var(--text)] mb-1">تاريخ التسليم (Due Date) *</label>
              <input
                type="date"
                required
                value={dueDate || ''}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--border)] dark:bg-slate-950 dark:text-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-rose-700 dark:text-rose-400"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-bold text-[var(--text)] mb-1">ملاحظات والتفاصيل</label>
            <textarea
              rows={2}
              value={notes || ''}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ملاحظات توضيحية للفريق..."
              className="w-full px-3 py-2 border border-[var(--border)] dark:bg-slate-950 dark:text-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-[var(--border)] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-bold text-[var(--text-muted)] hover:bg-[var(--surface-hover)] dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all active:scale-95"
            >
              إضافة التاسك
            </button>
          </div>

        </form>

      </div>
    </div>,
    document.body
  );
};
