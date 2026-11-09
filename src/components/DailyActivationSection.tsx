import React, { useState } from 'react';
import { 
  Calendar, 
  Plus, 
  Share2, 
  ExternalLink, 
  Trash2, 
  Edit3, 
  Building2, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Filter,
  User,
  Link2
} from 'lucide-react';
import { Client, DailyActivation, SocialPlatform, ActivationStatus, DepartmentType } from '../types';
import { formatDateArabic, getTodayStr, parseDate } from '../utils/dateUtils';

interface DailyActivationSectionProps {
  client: Client;
  /** Deletes the activation document itself. */
  onDeleteActivation?: (clientId: string, activationId: string) => Promise<boolean | void> | void;
  onOpenAddActivation: (clientId: string, activation?: DailyActivation) => void;
  /** Reading mode hides edit / delete. */
  isReadingMode?: boolean;
}

const DEPARTMENTS: { id: DepartmentType; labelAr: string; color: string }[] = [
  { id: 'قسم السيو', labelAr: 'قسم السيو', color: 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800' },
  { id: 'قسم الميديا باينج', labelAr: 'قسم الميديا باينج', color: 'bg-purple-50 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800' },
  { id: 'قسم السوشيال ميديا', labelAr: 'قسم السوشيال ميديا', color: 'bg-indigo-50 text-indigo-800 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800' },
  { id: 'قسم الأكونت مانجمنت', labelAr: 'قسم الأكونت مانجمنت', color: 'bg-slate-50 text-slate-800 border-slate-300 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700' },
];

export const DailyActivationSection: React.FC<DailyActivationSectionProps> = ({
  client,
  onDeleteActivation,
  onOpenAddActivation,
  isReadingMode = false,
}) => {
  // Local date: the UTC date is still "yesterday" between 00:00 and 03:00 in Riyadh / Cairo.
  const todayStr = getTodayStr();

  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentType | 'all'>('all');
  const [selectedDate, setSelectedDate] = useState<string>('all'); // 'all', 'today', or 'YYYY-MM-DD'

  const activations = client.dailyActivations || [];

  // Statistics
  const todayActivations = activations.filter(a => a.date === todayStr);
  const withLinksCount = activations.filter(a => a.link && a.link.trim()).length;
  const withNotesCount = activations.filter(a => a.notes && a.notes.trim()).length;

  // Filter logic
  const filteredActivations = activations.filter(a => {
    // Department filter
    if (selectedDepartment !== 'all' && a.department !== selectedDepartment) return false;

    // Date filter
    if (selectedDate === 'today' && a.date !== todayStr) return false;
    if (selectedDate !== 'all' && selectedDate !== 'today' && a.date !== selectedDate) return false;

    return true;
  }).sort((a, b) => (parseDate(b.date)?.getTime() || 0) - (parseDate(a.date)?.getTime() || 0));

  // Delete Activation
  const handleDeleteActivation = (actId: string) => {
    if (confirm('هل أنت تأكد من حذف سجل التفعيل اليومي هذا؟')) {
      // The old code saved the client WITHOUT this activation, but client saves never touch
      // activations, so the record was never deleted and came back on the next refresh.
      onDeleteActivation?.(client.id, actId);
    }
  };

  // Department Badge Colors
  const getDepartmentBadge = (dept?: DepartmentType) => {
    switch (dept) {
      case 'قسم السيو':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300';
      case 'قسم الميديا باينج':
        return 'bg-purple-50 text-purple-800 border-purple-300';
      case 'قسم السوشيال ميديا':
        return 'bg-indigo-50 text-indigo-800 border-indigo-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // Status Badge Colors
  const getStatusBadge = (status: ActivationStatus) => {
    switch (status) {
      case 'تم النشر':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'قيد التنفيذ':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'بانتظار الاعتماد':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'مؤجل':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // Platform Colors & Badges
  const getPlatformBadge = (platform: SocialPlatform) => {
    switch (platform) {
      case 'سناب شات':
        return 'bg-amber-400/15 text-amber-900 border-amber-300';
      case 'انستجرام':
        return 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200';
      case 'تيك توك':
        return 'bg-slate-900 text-white border-slate-800';
      case 'تويتر / X':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'فيسبوك':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'لينكدإن':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'يوتيوب':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'موقع إلكتروني / SEO':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="bg-[#18181B] rounded-2xl border border-[#27272A] shadow-xs p-6 space-y-5" dir="rtl">
      
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#27272A]">
        <div>
          <h2 className="text-base font-bold text-[#FAFAFA] flex items-center gap-2">
            <Share2 className="w-5 h-5 text-[#6366F1]" />
            <span>سجل التفعيل اليومي للأقسام (Daily Departments Activations)</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#6366F1]/15 text-[#6366F1] font-mono font-bold border border-[#6366F1]/25">
              {activations.length} تسجيل
            </span>
          </h2>
          <p className="text-xs text-[#A1A1AA] mt-1">
            تسجيل متابعة منشورات وحملات وتفعيل الأقسام اليومي لحساب العميل
          </p>
        </div>

        <button
          type="button"
          onClick={() => onOpenAddActivation(client.id)}
          className="flex items-center gap-1.5 text-xs font-bold text-white bg-[#6366F1] hover:bg-[#4F46E5] px-4 py-2.5 rounded-xl shadow-xs transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة تفعيل يومي</span>
        </button>
      </div>

      {/* Department Tabs Bar (SEO, Media Buying, Social Media) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setSelectedDepartment('all')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 border cursor-pointer ${
            selectedDepartment === 'all'
              ? 'bg-[#6366F1]/15 text-[#6366F1] border-[#6366F1]'
              : 'bg-[#09090B] text-[#A1A1AA] hover:text-[#FAFAFA] border-[#27272A] hover:bg-[#202024]'
          }`}
        >
          <span>كل الأقسام ({activations.length})</span>
        </button>

        {DEPARTMENTS.map(dept => {
          const count = activations.filter(a => a.department === dept.id).length;
          const isSelected = selectedDepartment === dept.id;
          return (
            <button
              type="button"
              key={dept.id}
              onClick={() => setSelectedDepartment(dept.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 border cursor-pointer ${
                isSelected
                  ? 'bg-[#6366F1]/15 text-[#6366F1] border-[#6366F1]'
                  : 'bg-[#09090B] text-[#A1A1AA] hover:text-[#FAFAFA] border-[#27272A] hover:bg-[#202024]'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 opacity-80" />
              <span>{dept.labelAr}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                isSelected ? 'bg-[#6366F1] text-white' : 'bg-[#27272A] text-[#A1A1AA]'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        
        <div className="p-3.5 bg-[#6366F1]/15 rounded-xl border border-[#6366F1]/25">
          <div className="text-[11px] font-medium text-[#A1A1AA]">إجمالي التفعيلات</div>
          <div className="text-lg font-extrabold font-mono text-[#FAFAFA] mt-0.5">
            {activations.length} <span className="text-xs font-normal text-[#71717A]">سجل</span>
          </div>
        </div>

        <div className="p-3.5 bg-[#6366F1]/10 rounded-xl border border-[#6366F1]/20">
          <div className="text-[11px] font-medium text-[#818CF8]">تفعيلات اليوم</div>
          <div className="text-lg font-extrabold font-mono text-[#FAFAFA] mt-0.5">
            {todayActivations.length} <span className="text-xs font-normal text-[#71717A]">سجل</span>
          </div>
        </div>

        <div className="p-3.5 bg-emerald-500/15 rounded-xl border border-emerald-500/25">
          <div className="text-[11px] font-medium text-emerald-400">تفعيلات تتضمن روابط</div>
          <div className="text-lg font-extrabold font-mono text-[#FAFAFA] mt-0.5">
            {withLinksCount} <span className="text-xs font-normal text-[#71717A]">رابط</span>
          </div>
        </div>

        <div className="p-3.5 bg-amber-500/15 rounded-xl border border-amber-500/25">
          <div className="text-[11px] font-medium text-amber-400">تفعيلات بملاحظات</div>
          <div className="text-lg font-extrabold font-mono text-[#FAFAFA] mt-0.5">
            {withNotesCount} <span className="text-xs font-normal text-[#71717A]">ملاحظة</span>
          </div>
        </div>

      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        
        <div className="flex items-center gap-2 flex-wrap">
          
          {/* Date Selector */}
          <div className="flex items-center gap-1 bg-[var(--surface-hover)] p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setSelectedDate('all')}
              className={`px-3 py-1 rounded-lg transition-all ${
                selectedDate === 'all' ? 'bg-[var(--surface)] text-[var(--text)] shadow-xs' : 'text-[var(--text-muted)] hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              كافة التواريخ
            </button>
            <button
              onClick={() => setSelectedDate('today')}
              className={`px-3 py-1 rounded-lg transition-all ${
                selectedDate === 'today' ? 'bg-[var(--surface)] text-[var(--text)] shadow-xs' : 'text-[var(--text-muted)] hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              تفعيلات اليوم
            </button>
          </div>

        </div>

        {(selectedDate !== 'all' || selectedDepartment !== 'all') && (
          <button
            onClick={() => {
              setSelectedDepartment('all');
              setSelectedDate('all');
            }}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
          >
            إلغاء التصفية
          </button>
        )}

      </div>

      {/* Activations List */}
      {filteredActivations.length === 0 ? (
        <div className="text-center py-16 bg-[#09090B] rounded-xl border border-[#27272A] p-6">
          <Share2 className="w-12 h-12 text-[#27272A] mx-auto mb-3" />
          <h3 className="text-sm font-bold text-[#FAFAFA]">لا توجد سجلات تفعيل</h3>
          <p className="text-xs text-[#A1A1AA] mt-1.5 max-w-sm mx-auto">
            يمكنك تسجيل التغطيات والستوريات والتفعيلات اليومية للقسم بسهولة
          </p>
          <button
            type="button"
            onClick={() => onOpenAddActivation(client.id)}
            className="mt-4 text-xs font-bold text-white bg-[#6366F1] hover:bg-[#4F46E5] px-4 py-2 rounded-xl inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة تفعيل يومي جديد</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredActivations.map(act => (
            <div
              key={act.id}
              className="p-4 rounded-xl border border-[#27272A] bg-[#09090B] hover:border-[#3F3F46] transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 group"
            >
              
              <div className="space-y-1.5 flex-1">
                
                {/* Badges Row */}
                <div className="flex items-center gap-2 flex-wrap">
                  
                  {/* Department Badge */}
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${getDepartmentBadge(act.department)}`}>
                    <Building2 className="w-3 h-3 opacity-70" />
                    <span>{act.department || 'قسم السوشيال ميديا'}</span>
                  </span>

                  <span className="text-[10px] text-[#A1A1AA] font-mono font-medium bg-[#18181B] px-2 py-0.5 rounded-md flex items-center gap-1 border border-[#27272A]">
                    <Calendar className="w-3 h-3 text-[#71717A]" />
                    <span>{formatDateArabic(act.date)}</span>
                    {act.date === todayStr && (
                      <span className="text-[9px] font-bold px-1.5 bg-emerald-500/15 text-emerald-400 rounded border border-emerald-500/25">اليوم</span>
                    )}
                  </span>

                  {act.createdBy && (
                    <span className="flex items-center gap-1 text-[#71717A] text-[10px] font-mono">
                      <User className="w-3 h-3" />
                      <span>المسؤول: {act.createdBy}</span>
                    </span>
                  )}

                </div>

                {/* Title */}
                <h3 className="text-sm font-bold text-[#FAFAFA] leading-relaxed pt-0.5 group-hover:text-indigo-300 transition-colors">
                  {act.title}
                </h3>

                {/* Notes */}
                {act.notes && (
                  <div className="text-xs text-[#A1A1AA] bg-[#18181B] p-2.5 rounded-xl border border-[#27272A] max-w-2xl leading-relaxed">
                    <span className="font-bold text-[#FAFAFA]">ملاحظات: </span>
                    <span>{act.notes}</span>
                  </div>
                )}

              </div>

              {/* Actions & Direct Link */}
              <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#27272A]">
                
                {act.link && (
                  <a
                    href={act.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-[#6366F1] bg-[#6366F1]/15 hover:bg-[#6366F1]/25 border border-[#6366F1]/30 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    <span>رابط المنشور</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}

                <div className="flex items-center gap-1" hidden={isReadingMode}>
                  <button
                    type="button"
                    onClick={() => onOpenAddActivation(client.id, act)}
                    className="p-1.5 text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#27272A] rounded-lg transition-colors cursor-pointer"
                    title="تعديل سجل التفعيل"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteActivation(act.id)}
                    className="p-1.5 text-[#71717A] hover:text-[#F43F5E] hover:bg-[#F43F5E]/10 rounded-lg transition-colors cursor-pointer"
                    title="حذف سجل التفعيل"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};
