import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Share2, 
  ExternalLink, 
  ShieldCheck, 
  Sparkles, 
  Layers, 
  ArrowRight,
  TrendingUp,
  FileCheck,
  CalendarDays,
  Target,
  Copy,
  Check,
  AlertTriangle
} from 'lucide-react';
import { Client, TaskItem } from '../types';
import { formatDateArabic, getDaysDifference } from '../utils/dateUtils';
import { getPortalUrl } from '../utils/portalUtils';
import { usePortalLink } from '../context/PortalLinkContext';
import { toast } from 'react-hot-toast';

export interface ClientPortalViewProps {
  client?: Client | null;
  errorMessage?: string | null;
  onBackToApp?: () => void;
  isStaffLoggedIn?: boolean;
}

export const ClientPortalView: React.FC<ClientPortalViewProps> = ({
  client,
  errorMessage,
  onBackToApp,
  isStaffLoggedIn = false,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'first40' | 'remaining' | 'completed'>('first40');
  const [copiedLink, setCopiedLink] = useState(false);
  const getPortalLink = usePortalLink();

  // Calculate task statistics
  // All hooks run BEFORE the early return below: returning first and calling hooks afterwards
  // made React throw "Rendered fewer hooks than expected" when a shown client became unavailable.
  const tasks = useMemo(() => client?.tasks || [], [client?.tasks]);
  
  const completedTasks = useMemo(() => tasks.filter(t => t.completed), [tasks]);
  const remainingTasks = useMemo(() => tasks.filter(t => !t.completed), [tasks]);
  
  const totalTasks = tasks.length;
  const completedCount = completedTasks.length;
  const progressPercent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  // Filter tasks for the First 40 Days (Month 1 / Initial Onboarding & Launch)
  const first40DaysTasks = useMemo(() => {
    return tasks.filter(task => {
      // Check monthIndex
      if (task.monthIndex === 1 || task.monthIndex === 0) return true;
      // Check taskNumber for M1
      if (task.taskNumber && (task.taskNumber.includes('-M1') || task.taskNumber.includes('-M0'))) return true;
      // Check title for (الشهر 1)
      if (task.title && (task.title.includes('(الشهر 1)') || task.title.includes('(الشهر الأول)'))) return true;
      // Default fallback: if client is 1 month or no month assigned, it belongs to first 40 days
      if (client?.durationMonths === 1) return true;
      return false;
    });
  }, [tasks, client?.durationMonths]);

  const first40Completed = useMemo(() => first40DaysTasks.filter(t => t.completed), [first40DaysTasks]);
  const first40Remaining = useMemo(() => first40DaysTasks.filter(t => !t.completed), [first40DaysTasks]);
  const first40Progress = first40DaysTasks.length > 0 
    ? Math.round((first40Completed.length / first40DaysTasks.length) * 100) 
    : 0;

  // Displayed tasks according to active tab
  const displayedTasks = useMemo(() => {
    switch (activeTab) {
      case 'first40':
        return first40DaysTasks;
      case 'remaining':
        return remainingTasks;
      case 'completed':
        return completedTasks;
      case 'all':
      default:
        return tasks;
    }
  }, [activeTab, first40DaysTasks, remainingTasks, completedTasks, tasks]);

  // If client is missing or an error occurred, render clean error screen immediately
  if (!client || errorMessage) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0f0f11] text-slate-900 dark:text-slate-100 flex flex-col justify-center items-center p-4 selection:bg-[#593BFE]/20" dir="rtl">
        <div className="max-w-md w-full bg-white dark:bg-[#18181b] rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-5">
          <div className="flex justify-center mb-1">
            <img src="/logo-light.png" alt="دفة - DEFFA CRM" className="block dark:hidden h-12 w-auto object-contain" />
            <img src="/logo-dark.png" alt="دفة - DEFFA CRM" className="hidden dark:block h-12 w-auto object-contain" />
          </div>

          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/20">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              {errorMessage || 'عفواً، بيانات العميل غير متوفرة أو الرابط غير صحيح'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              يرجى التحقق من الرابط الذي فتحته أو التأكد من إدخال كود العميل الصحيح. يمكنك التواصل مع مسؤول الحساب للدعم.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            {onBackToApp && isStaffLoggedIn ? (
              <button
                type="button"
                onClick={onBackToApp}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#593BFE] hover:bg-[#4b32db] text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
                <span>العودة إلى لوحة التحكم</span>
              </button>
            ) : (
              <a
                href={window.location.origin}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <span>الانتقال للصفحة الرئيسية</span>
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Opened from a portal link: the token is known. Staff previewing a client from the app get the
  // link from the data layer (which creates the portal page the first time).
  const shareUrl = client.portalToken
    ? getPortalUrl(client.portalToken)
    : null;
  const canShare = !!shareUrl || (!!getPortalLink && !!client.id);

  const handleCopyPortalLink = () => {
    const publicUrl = shareUrl || (client.id ? getPortalLink?.(client.id) : null);
    if (!publicUrl) {
      toast.error('تعذر نسخ الرابط');
      return;
    }
    try {
      navigator.clipboard.writeText(publicUrl).then(
        () => {
          setCopiedLink(true);
          toast.success('تم نسخ رابط البوابة بنجاح!');
          setTimeout(() => setCopiedLink(false), 2500);
        },
        () => toast.error('تعذر نسخ الرابط')
      );
    } catch {
      toast.error('تعذر نسخ الرابط');
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'social_media':
        return { label: 'سوشيال ميديا', color: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20' };
      case 'seo':
        return { label: 'تحسين محركات البحث SEO', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' };
      case 'media_buying':
        return { label: 'إعلانات ممولة', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' };
      case 'account_management':
      default:
        return { label: 'إدارة الحساب', color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f0f11] text-slate-900 dark:text-slate-100 font-sans pb-16 selection:bg-[#593BFE]/20" dir="rtl">
      
      {/* Top Banner / Navigation */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#18181b]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isStaffLoggedIn && onBackToApp && (
              <button
                type="button"
                onClick={onBackToApp}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>العودة للوحة التحكم</span>
              </button>
            )}

            <div className="flex items-center gap-2.5 sm:gap-3">
              {/* Official App Logo */}
              <div className="flex items-center shrink-0">
                <img
                  src="/logo-light.png"
                  alt="دفة - DEFFA CRM"
                  className="block dark:hidden h-9 sm:h-10 w-auto object-contain filter drop-shadow-sm"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.dataset.triedFallback !== '1') {
                      target.dataset.triedFallback = '1';
                      target.src = 'https://i.ibb.co/Kpk6wtn2/logo-light.jpg';
                    }
                  }}
                />
                <img
                  src="/logo-dark.png"
                  alt="دفة - DEFFA CRM"
                  className="hidden dark:block h-9 sm:h-10 w-auto object-contain filter drop-shadow-sm"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.dataset.triedFallback !== '1') {
                      target.dataset.triedFallback = '1';
                      target.src = 'https://i.ibb.co/fzL9yFQd/logo-dark.jpg';
                    }
                  }}
                />
              </div>

              <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

              <div>
                <span className="text-xs font-extrabold tracking-wider text-[#593BFE] uppercase block leading-none">
                  بوابة متابعة العميل
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  لوحة متابعة شفافة ومباشرة
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>للقراءة فقط (مباشر)</span>
            </span>

            {canShare && (
              <button
                type="button"
                onClick={handleCopyPortalLink}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                title="مشاركة رابط البوابة"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span className="hidden sm:inline">{copiedLink ? 'تم النسخ!' : 'نسخ الرابط'}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Header with Client & Company Details */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-white to-purple-50/40 dark:from-[#18181b] dark:via-[#18181b] dark:to-[#1e1a33] border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[#593BFE]/10 to-indigo-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            {/* Client Info, with the client's logo first when it has one */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 min-w-0">
              {client.logoUrl && (
                <div className="flex h-20 sm:h-24 min-w-20 sm:min-w-24 max-w-48 sm:max-w-56 shrink-0 self-start sm:self-center items-center justify-center overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-white p-3 shadow-sm">
                  <img src={client.logoUrl} alt={`لوجو ${client.clientName}`} className="h-full w-auto max-w-full object-contain" />
                </div>
              )}
            <div className="space-y-3 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                {client.companyName && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-[#593BFE]/10 text-[#593BFE] border border-[#593BFE]/20">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>شركة: {client.companyName}</span>
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  <Layers className="w-3.5 h-3.5" />
                  <span>باقة العقد: {client.contract}</span>
                </span>
                {client.startDate && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>تاريخ البداية: {formatDateArabic(client.startDate)}</span>
                  </span>
                )}
              </div>

              <div>
                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {client.clientName}
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  مرحباً بك في لوحة متابعة إنجاز وتسليمات مشروعك الرقمي. يتم تحديث البيانات فور إتمام كل مهمة.
                </p>
              </div>
            </div>
            </div>

            {/* Overall Progress Hero Ring / Box */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 flex flex-col items-center justify-center min-w-[220px] shadow-sm">
              <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                <Target className="w-4 h-4 text-[#593BFE]" />
                <span>نسبة الإنجاز الكلية للمشروع</span>
              </div>
              <div className="text-4xl sm:text-5xl font-black font-mono text-[#593BFE] tracking-tight">
                {progressPercent}%
              </div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                تم تنفيذ {completedCount} من أصل {totalTasks} مهمة
              </div>

              {/* Progress Bar inside box */}
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden mt-3">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-[#593BFE] transition-all duration-700 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-200/60 dark:border-slate-800">
            <div className="bg-white/60 dark:bg-slate-900/50 rounded-xl p-3 border border-slate-100 dark:border-slate-800 text-center">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">إجمالي المهام</span>
              <span className="text-xl font-black text-slate-800 dark:text-slate-100 font-mono">{totalTasks}</span>
            </div>
            <div className="bg-emerald-50/60 dark:bg-emerald-950/20 rounded-xl p-3 border border-emerald-100 dark:border-emerald-900/30 text-center">
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 block mb-0.5">منجزة بنجاح</span>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{completedCount}</span>
            </div>
            <div className="bg-amber-50/60 dark:bg-amber-950/20 rounded-xl p-3 border border-amber-100 dark:border-amber-900/30 text-center">
              <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 block mb-0.5">قيد العمل والاستحقاق</span>
              <span className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">{remainingTasks.length}</span>
            </div>
            <div className="bg-purple-50/60 dark:bg-purple-950/20 rounded-xl p-3 border border-purple-100 dark:border-purple-900/30 text-center">
              <span className="text-[11px] font-bold text-[#593BFE] block mb-0.5">خطة الـ 40 يوم الأولى</span>
              <span className="text-xl font-black text-[#593BFE] font-mono">{first40Completed.length}/{first40DaysTasks.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Section: خطة الـ 40 يوم الأولى (مرحلة التأسيس والإطلاق) */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-8">
        <div className="rounded-3xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-indigo-500/10 border-2 border-amber-500/30 dark:border-amber-500/20 p-6 sm:p-7 relative overflow-hidden shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500 text-white shadow-sm mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>التركيز الأساسي • خطة الـ 40 يوم الأولى</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                مرحلة التأسيس والانطلاق الأولي (40 يوماً)
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl leading-relaxed">
                تركز هذه الخطة الحيوية على وضع اللبنات الأساسية للمشروع، إعداد الهوية والاستراتيجية، بناء الحسابات، وإطلاق الحملات الأولى بأعلى معايير الدقة.
              </p>
            </div>

            {/* 40-Day Progress Widget */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-amber-200 dark:border-slate-800 shadow-sm min-w-[200px] shrink-0 text-center">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                إنجاز خطة الـ 40 يوماً
              </span>
              <div className="text-3xl font-black text-amber-600 dark:text-amber-400 font-mono">
                {first40Progress}%
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-500"
                  style={{ width: `${first40Progress}%` }}
                />
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 block">
                {first40Completed.length} من {first40DaysTasks.length} مهام منتهية
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area: Tabs & Task Lists */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-8">
        
        {/* Navigation Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/60 overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => setActiveTab('first40')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'first40'
                  ? 'bg-white dark:bg-slate-900 text-[#593BFE] shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              ⭐ خطة الـ 40 يوم الأولى ({first40DaysTasks.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('remaining')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'remaining'
                  ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              ⏳ المهام المتبقية ({remainingTasks.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('completed')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'completed'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              ✅ المكتملة بنجاح ({completedTasks.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              الكل ({tasks.length})
            </button>
          </div>

          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            عرض {displayedTasks.length} مهمة
          </span>
        </div>

        {/* Task Cards Grid */}
        {displayedTasks.length === 0 ? (
          <div className="bg-white dark:bg-[#18181b] rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3 opacity-80" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              لا توجد مهام في هذا التصنيف حالياً
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              جميع المهام تظهر وتُحدّث فور إنجازها
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedTasks.map((task) => {
              const catBadge = getCategoryBadge(task.category);
              const isFirst40 = task.monthIndex === 1 || task.monthIndex === 0;

              return (
                <div
                  key={task.id}
                  className={`bg-white dark:bg-[#18181b] rounded-2xl p-4 sm:p-5 border transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    task.completed
                      ? 'border-emerald-200/80 dark:border-emerald-900/40 bg-emerald-50/20 dark:bg-emerald-950/10'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3.5">
                    {/* Status Icon Indicator */}
                    <div className="mt-0.5 sm:mt-0 shrink-0">
                      {task.completed ? (
                        <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center">
                          <Clock className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    {/* Task Title & Details */}
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${catBadge.color}`}>
                          {catBadge.label}
                        </span>

                        {isFirst40 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                            خطة 40 يوم
                          </span>
                        )}

                        {task.taskNumber && (
                          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                            {task.taskNumber}
                          </span>
                        )}
                      </div>

                      <h4 className={`text-sm sm:text-base font-bold ${
                        task.completed 
                          ? 'text-slate-800 dark:text-slate-200' 
                          : 'text-slate-900 dark:text-white'
                      }`}>
                        {task.title}
                      </h4>

                      {task.notes && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
                          {task.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Dates & Status Badge */}
                  <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                    {task.completed ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>مكتملة بنجاح</span>
                        {task.completedAt && (
                          <span className="text-[10px] opacity-75 font-mono mr-1">
                            ({formatDateArabic(task.completedAt)})
                          </span>
                        )}
                      </span>
                    ) : (
                      <div className="flex flex-col items-end text-xs">
                        <span className="text-[11px] text-slate-400 font-medium">تاريخ الاستحقاق المتوقع</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300 font-mono mt-0.5">
                          {task.dueDate ? formatDateArabic(task.dueDate) : 'قريباً'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Helpful Footer */}
      <footer className="max-w-6xl mx-auto px-4 sm:px-6 mt-16 text-center border-t border-slate-200 dark:border-slate-800 pt-8">
        <p className="text-xs text-slate-400 dark:text-slate-500">
          تم إنشاء هذه البوابة للمتابعة الحصرية مع عملاء {client.companyName || 'الوكالة'}. جميع البيانات محدثة في الوقت الفعلي.
        </p>
      </footer>

    </div>
  );
};

export default ClientPortalView;
