import React, { useState } from 'react';
import { 
  Calendar, 
  Share2, 
  Plus, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Search, 
  Building2, 
  User, 
  Filter,
  ArrowRight,
  Link2,
  Trash2
} from 'lucide-react';
import { Client, DailyActivation, SocialPlatform, ActivationStatus, DepartmentType } from '../types';
import { formatDateArabic } from '../utils/dateUtils';

interface GlobalActivationsViewProps {
  clients: Client[];
  onOpenAddActivation: (clientId?: string) => void;
  onSelectClient: (clientId: string) => void;
  onBackToDashboard: () => void;
  onDeleteActivation?: (clientId: string, activationId: string) => void;
}

const DEPARTMENTS: { id: DepartmentType; labelAr: string; color: string }[] = [
  { id: 'قسم السيو', labelAr: 'قسم السيو', color: 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800' },
  { id: 'قسم الميديا باينج', labelAr: 'قسم الميديا باينج', color: 'bg-purple-50 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800' },
  { id: 'قسم السوشيال ميديا', labelAr: 'قسم السوشيال ميديا', color: 'bg-indigo-50 text-indigo-800 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800' },
  { id: 'قسم الأكونت مانجمنت', labelAr: 'قسم الأكونت مانجمنت', color: 'bg-slate-50 text-slate-800 border-slate-300 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700' },
];

export const GlobalActivationsView: React.FC<GlobalActivationsViewProps> = ({
  clients,
  onOpenAddActivation,
  onSelectClient,
  onBackToDashboard,
  onDeleteActivation,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentType | 'all'>('all');
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Collect all activations across all clients with client metadata attached
  const allActivationsWithClient = clients.flatMap(client => {
    return (client.dailyActivations || []).map(act => ({
      ...act,
      clientCode: client.code,
      clientName: client.clientName,
      clientId: client.id,
      contract: client.contract
    }));
  });

  // Filter activations for selected date & criteria
  const filteredActivations = allActivationsWithClient.filter(act => {
    // Department filter
    if (selectedDepartment !== 'all' && act.department !== selectedDepartment) return false;

    // Date filter
    if (selectedDate && act.date !== selectedDate) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const match = 
        act.clientName.toLowerCase().includes(q) ||
        act.clientCode.toLowerCase().includes(q) ||
        act.title.toLowerCase().includes(q) ||
        (act.notes && act.notes.toLowerCase().includes(q));
      if (!match) return false;
    }

    return true;
  });

  // Stats for selected date
  const selectedDateActivations = allActivationsWithClient.filter(a => a.date === selectedDate);
  const activeDeptsCount = new Set(selectedDateActivations.map(a => a.department)).size;
  const withLinksCount = selectedDateActivations.filter(a => a.link && a.link.trim()).length;
  const withNotesCount = selectedDateActivations.filter(a => a.notes && a.notes.trim()).length;

  // Department Badge Colors
  const getDepartmentBadge = (dept?: DepartmentType) => {
    switch (dept) {
      case 'قسم السيو':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25';
      case 'قسم الميديا باينج':
        return 'bg-purple-500/15 text-purple-400 border-purple-500/25';
      case 'قسم السوشيال ميديا':
        return 'bg-[#6366F1]/15 text-[#6366F1] border-[#6366F1]/25';
      case 'قسم الأكونت مانجمنت':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/25';
      default:
        return 'bg-[#27272A] text-[#A1A1AA] border-[#3F3F46]';
    }
  };

  return (
    <div className="space-y-6 pb-12" dir="rtl">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={onBackToDashboard}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#A1A1AA] hover:text-[#FAFAFA] mb-2 transition-colors cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة إلى لوحة التحكم</span>
          </button>
          <h1 className="text-xl font-black text-[#FAFAFA] flex items-center gap-2">
            <Share2 className="w-6 h-6 text-[#6366F1]" />
            <span>سجل التفعيل اليومي للأقسام (Daily Departments Master Log)</span>
          </h1>
          <p className="text-xs text-[#A1A1AA] mt-1">
            متابعة شاملة لجميع تفعيلات ومنشورات الأقسام (SEO, Media Buying, Social Media) لكل العملاء
          </p>
        </div>

        <button
          type="button"
          onClick={() => onOpenAddActivation()}
          className="flex items-center gap-2 text-xs font-bold text-white bg-[#6366F1] hover:bg-[#4F46E5] px-4 py-2.5 rounded-xl shadow-xs transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>تسجيل تفعيل يومي جديد</span>
        </button>
      </div>

      {/* Main Container Card */}
      <div className="bg-[#18181B] border border-[#27272A] rounded-2xl p-6 shadow-xs space-y-6">

        {/* Department Filters (SaaS Pills) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedDepartment('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer border ${
              selectedDepartment === 'all'
                ? 'bg-[#6366F1]/15 text-[#6366F1] border-[#6366F1]'
                : 'bg-[#09090B] text-[#A1A1AA] hover:text-[#FAFAFA] border-[#27272A] hover:bg-[#202024]'
            }`}
          >
            <span>كافة الأقسام</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
              selectedDepartment === 'all' ? 'bg-[#6366F1] text-white' : 'bg-[#27272A] text-[#A1A1AA]'
            }`}>
              {allActivationsWithClient.length}
            </span>
          </button>

          {DEPARTMENTS.map(dept => {
            const count = allActivationsWithClient.filter(a => a.department === dept.id).length;
            const isSelected = selectedDepartment === dept.id;
            return (
              <button
                type="button"
                key={dept.id}
                onClick={() => setSelectedDepartment(dept.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer border ${
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

        {/* Inputs & Actions: Search & Date Selector */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          
          {/* Search bar */}
          <div className="relative md:col-span-7">
            <Search className="w-4 h-4 text-[#71717A] absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery || ''}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث باسم العميل، الكود، أو نص التفعيل..."
              className="w-full text-xs pr-10 pl-4 py-2.5 bg-[#09090B] border border-[#27272A] rounded-xl text-[#FAFAFA] placeholder-[#71717A] outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] transition-all font-medium"
            />
          </div>

          {/* Date Picker */}
          <div className="md:col-span-5 flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="date"
                value={selectedDate || ''}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full text-xs px-3 py-2.5 bg-[#09090B] border border-[#27272A] rounded-xl text-[#FAFAFA] font-mono outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] transition-all cursor-pointer"
              />
            </div>

            {selectedDate !== todayStr && (
              <button
                type="button"
                onClick={() => setSelectedDate(todayStr)}
                className="text-xs font-bold text-[#6366F1] hover:text-[#818CF8] bg-[#6366F1]/10 border border-[#6366F1]/20 px-3 py-2.5 rounded-xl whitespace-nowrap transition-colors cursor-pointer"
              >
                اليوم
              </button>
            )}
          </div>

        </div>

        {/* Summary Stats (Mini-Cards Flex) */}
        <div className="flex flex-wrap sm:flex-nowrap gap-3 pt-2">
          
          {/* Total Activations Mini-Card */}
          <div className="flex-1 min-w-[140px] p-4 rounded-xl bg-[#6366F1]/15 border border-[#6366F1]/25 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#6366F1]/20 text-[#6366F1] flex items-center justify-center shrink-0">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-medium text-[#A1A1AA]">إجمالي التفعيلات</div>
              <div className="text-xl font-bold font-mono text-[#FAFAFA] mt-0.5">
                {selectedDateActivations.length}
              </div>
            </div>
          </div>

          {/* With Links Mini-Card */}
          <div className="flex-1 min-w-[140px] p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-medium text-[#A1A1AA]">تفعيلات بروابط</div>
              <div className="text-xl font-bold font-mono text-[#FAFAFA] mt-0.5">
                {withLinksCount}
              </div>
            </div>
          </div>

          {/* With Notes Mini-Card */}
          <div className="flex-1 min-w-[140px] p-4 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-medium text-[#A1A1AA]">تفعيلات بملاحظات</div>
              <div className="text-xl font-bold font-mono text-[#FAFAFA] mt-0.5">
                {withNotesCount}
              </div>
            </div>
          </div>

        </div>

        {/* List of Activations or Empty State */}
        <div className="border border-[#27272A] rounded-2xl overflow-hidden bg-[#09090B]">
          
          {filteredActivations.length === 0 ? (
            <div className="text-center py-20 px-6">
              <Share2 className="w-14 h-14 text-[#27272A] mx-auto mb-3" />
              <h3 className="text-base font-bold text-[#FAFAFA]">لا توجد سجلات تفعيل</h3>
              <p className="text-xs text-[#A1A1AA] mt-1.5 max-w-sm mx-auto leading-relaxed">
                لم يتم العثور على تفعيلات مسجلة لهذا التاريخ أو القسم المختار. يمكنك تسجيل تفعيل جديد للعملاء الآن.
              </p>
              <button
                type="button"
                onClick={() => onOpenAddActivation()}
                className="mt-5 px-4 py-2.5 bg-[#6366F1] hover:bg-[#4F46E5] text-white font-bold text-xs rounded-xl transition-all inline-flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>تسجيل تفعيل جديد</span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#27272A]">
              {filteredActivations.map(act => (
                <div
                  key={act.id}
                  className="p-4 hover:bg-[#18181B] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                >
                  
                  {/* Client & Activation Detail */}
                  <div className="space-y-2 flex-1">
                    
                    <div className="flex items-center gap-2 flex-wrap">
                      
                      {/* Client Code button */}
                      <button
                        type="button"
                        onClick={() => onSelectClient(act.clientId)}
                        className="text-xs font-bold text-[#6366F1] hover:text-[#818CF8] flex items-center gap-1.5 bg-[#6366F1]/10 hover:bg-[#6366F1]/20 px-2.5 py-1 rounded-lg border border-[#6366F1]/20 transition-colors cursor-pointer"
                      >
                        <Building2 className="w-3.5 h-3.5" />
                        <span>{act.clientName}</span>
                        <span className="font-mono text-[11px] opacity-80">({act.clientCode})</span>
                      </button>

                      {/* Department Badge */}
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${getDepartmentBadge(act.department)}`}>
                        <Building2 className="w-3 h-3 opacity-70" />
                        <span>{act.department || 'قسم السوشيال ميديا'}</span>
                      </span>

                      {act.createdBy && (
                        <span className="flex items-center gap-1 text-[#71717A] text-[10px] font-mono">
                          <User className="w-3 h-3" />
                          <span>المسؤول: {act.createdBy}</span>
                        </span>
                      )}

                    </div>

                    {/* Title */}
                    <h3 className="text-sm font-bold text-[#FAFAFA] leading-relaxed group-hover:text-indigo-300 transition-colors">
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

                  {/* Direct Link & Action */}
                  <div className="flex items-center gap-2 shrink-0">
                    {act.link && (
                      <a
                        href={act.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-[#6366F1] bg-[#6366F1]/15 hover:bg-[#6366F1]/25 border border-[#6366F1]/30 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors"
                      >
                        <Link2 className="w-3.5 h-3.5" />
                        <span>الرابط</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}

                    {onDeleteActivation && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('هل أنت متأكد من حذف هذا التفعيل؟')) {
                            onDeleteActivation(act.clientId, act.id);
                          }
                        }}
                        className="p-2 text-[#71717A] hover:text-[#F43F5E] hover:bg-[#F43F5E]/10 rounded-xl transition-colors cursor-pointer"
                        title="حذف التفعيل"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onSelectClient(act.clientId)}
                      className="text-xs font-bold text-[#A1A1AA] hover:text-[#FAFAFA] bg-[#18181B] hover:bg-[#202024] border border-[#27272A] px-3.5 py-1.5 rounded-xl transition-colors cursor-pointer"
                    >
                      عرض العميل
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
