import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  CircleAlert,
  Clock3,
  MessageCircle,
  SlidersHorizontal,
  ArrowUpRight,
  Users,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Search,
  Trash2
} from 'lucide-react';
import { Client, TaskItem } from '../types';
import { formatDateArabic, getDaysDifference, getTodayStr, getWhatsAppLink } from '../utils/dateUtils';

type FocusItem = { client: Client; task: TaskItem; daysDiff: number };
type FocusFilter = 'all' | 'overdue' | 'today' | 'soon';

interface FocusViewProps {
  clients: Client[];
  onSelectClient: (clientId: string) => void;
  onCompleteTask: (clientId: string, task: Partial<TaskItem> & { id: string }) => Promise<boolean | void>;
  onDeleteTask?: (clientId: string, taskId: string) => Promise<void> | void;
  initialFilter?: FocusFilter;
}


export const FocusView: React.FC<FocusViewProps> = ({ 
  clients, 
  onSelectClient, 
  onCompleteTask, 
  onDeleteTask,
  initialFilter = 'all'
}) => {
  const [filter, setFilter] = useState<FocusFilter>(initialFilter);
  const [selectedClientId, setSelectedClientId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Sync when initialFilter prop changes
  React.useEffect(() => {
    if (initialFilter) {
      setFilter(initialFilter);
      setCurrentPage(1);
    }
  }, [initialFilter]);

  // All open tasks due within 7 days or overdue
  const allTasks = useMemo<FocusItem[]>(() => clients
    .flatMap(client => (client.tasks || [])
      .filter(task => !task.completed)
      .map(task => ({ client, task, daysDiff: getDaysDifference(task.dueDate) })))
    .filter(item => item.daysDiff <= 7), [clients]);

  // Clients options list with stats for client selector
  const clientOptionsList = useMemo(() => {
    // Map clients with their task counts within focus view
    const clientMap = new Map<string, { client: Client; overdueCount: number; todayCount: number; totalFocusTasks: number }>();

    allTasks.forEach(item => {
      const existing = clientMap.get(item.client.id) || {
        client: item.client,
        overdueCount: 0,
        todayCount: 0,
        totalFocusTasks: 0
      };
      existing.totalFocusTasks += 1;
      if (item.daysDiff < 0) existing.overdueCount += 1;
      if (item.daysDiff === 0) existing.todayCount += 1;
      clientMap.set(item.client.id, existing);
    });

    return Array.from(clientMap.values()).sort((a, b) => {
      if (a.overdueCount !== b.overdueCount) return b.overdueCount - a.overdueCount;
      if (a.todayCount !== b.todayCount) return b.todayCount - a.todayCount;
      return b.totalFocusTasks - a.totalFocusTasks;
    });
  }, [allTasks]);

  const selectedClientData = useMemo(() => {
    if (selectedClientId === 'all') return null;
    return clientOptionsList.find(c => c.client.id === selectedClientId) || null;
  }, [clientOptionsList, selectedClientId]);

  // Global counts
  const counts = useMemo(() => ({
    overdue: allTasks.filter(item => item.daysDiff < 0).length,
    today: allTasks.filter(item => item.daysDiff === 0).length,
    soon: allTasks.filter(item => item.daysDiff > 0 && item.daysDiff <= 3).length,
  }), [allTasks]);

  // Filtered tasks by client, filter status, and search query
  const filteredTasks = useMemo(() => {
    const list = allTasks.filter(item => {
      // Filter by selected client
      if (selectedClientId !== 'all' && item.client.id !== selectedClientId) {
        return false;
      }

      // Filter by status category
      if (filter === 'overdue' && item.daysDiff >= 0) return false;
      if (filter === 'today' && item.daysDiff !== 0) return false;
      if (filter === 'soon' && (item.daysDiff <= 0 || item.daysDiff > 3)) return false;

      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = (item.task.title || '').toLowerCase().includes(q);
        const matchesCode = (item.task.taskNumber || '').toLowerCase().includes(q) || (item.client.code || '').toLowerCase().includes(q);
        const matchesClient = (item.client.clientName || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesCode && !matchesClient) return false;
      }

      return true;
    });

    // Priority sorting:
    // 1. Overdue tasks (most days overdue on top, e.g. -10 before -1)
    // 2. Due today (daysDiff === 0)
    // 3. Due soonest (1, 2, 3 days...)
    return list.sort((a, b) => a.daysDiff - b.daysDiff);
  }, [allTasks, selectedClientId, filter, searchQuery]);

  const PAGE_SIZE = 8;
  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / PAGE_SIZE));
  // Never past the last page: when the list shrinks (e.g. the only task on the last page is
  // completed) the stored page could point at an empty page with no page buttons left.
  const safePage = Math.min(currentPage, totalPages);
  const paginatedTasks = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredTasks.slice(start, start + PAGE_SIZE);
  }, [filteredTasks, safePage, PAGE_SIZE]);

  const getTaskBadge = (daysDiff: number) => {
    if (daysDiff < 0) {
      return {
        label: `متأخرة ${Math.abs(daysDiff)} يوم`,
        className: 'bg-[#F43F5E]/15 border-[#F43F5E]/30 text-[#F43F5E]'
      };
    }
    if (daysDiff === 0) {
      return {
        label: 'موعدها اليوم',
        className: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400'
      };
    }
    if (daysDiff === 1) {
      return {
        label: 'موعدها غداً',
        className: 'bg-amber-500/15 border-amber-500/30 text-amber-300'
      };
    }
    return {
      label: `خلال ${daysDiff} أيام`,
      className: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300'
    };
  };

  const complete = async (item: FocusItem) => {
    setCompletingId(item.task.id);
    try {
      // Send complete task with completed status
      await onCompleteTask(item.client.id, { ...item.task, completed: true, completedAt: getTodayStr() });
    } finally {
      setCompletingId(null);
    }
  };

  const handleDelete = async (item: FocusItem) => {
    if (!onDeleteTask) return;
    if (window.confirm(`هل أنت متأكد من حذف المهمة "${item.task.title}" نهائياً؟`)) {
      setDeletingId(item.task.id);
      try {
        await onDeleteTask(item.client.id, item.task.id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleBulkDeleteFiltered = async () => {
    if (!onDeleteTask || filteredTasks.length === 0) return;
    if (window.confirm(`هل أنت متأكد من حذف جميع المهام المعروضة حالياً (${filteredTasks.length} مهمة) نهائياً؟`)) {
      for (const item of filteredTasks) {
        await onDeleteTask(item.client.id, item.task.id);
      }
    }
  };

  return (
    <section className="space-y-5">
      {/* Top Header Card */}
      <div className="rounded-2xl border border-[#27272A] bg-[#18181B] p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full">
                مركز المتابعة
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#FAFAFA] tracking-tight">
              أولوياتك للأيام السبعة القادمة
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-[#A1A1AA]">
              أنهِ المهام أو تواصل مع العملاء مباشرة من مكان واحد.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-[#09090B] border border-[#27272A] px-3.5 py-2 rounded-xl">
            <span className="text-xs text-[#A1A1AA]">المهام المفتوحة:</span>
            <span className="font-mono font-bold text-sm text-[#FAFAFA]">{allTasks.length} مهمة</span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => {
            setFilter(filter === 'overdue' ? 'all' : 'overdue');
            setCurrentPage(1);
          }}
          className={`rounded-2xl border p-4 text-right transition-all cursor-pointer ${
            filter === 'overdue'
              ? 'border-[#F43F5E]/50 bg-[#202024] shadow-xs'
              : 'border-[#27272A] bg-[#18181B] hover:bg-[#202024] hover:border-[#3F3F46]'
          }`}
        >
          <div className="flex items-center justify-between">
            <CircleAlert className="h-5 w-5 text-[#F43F5E]" />
            <span className="text-2xl font-black text-[#FAFAFA] font-mono">{counts.overdue}</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs sm:text-sm font-bold text-[#A1A1AA]">مهام متأخرة</p>
            {filter === 'overdue' && (
              <span className="text-[10px] text-[#F43F5E] bg-[#F43F5E]/15 px-1.5 py-0.5 rounded-md font-medium border border-[#F43F5E]/30">
                مفلتر
              </span>
            )}
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setFilter(filter === 'today' ? 'all' : 'today');
            setCurrentPage(1);
          }}
          className={`rounded-2xl border p-4 text-right transition-all cursor-pointer ${
            filter === 'today'
              ? 'border-indigo-500/50 bg-[#202024] shadow-xs'
              : 'border-[#27272A] bg-[#18181B] hover:bg-[#202024] hover:border-[#3F3F46]'
          }`}
        >
          <div className="flex items-center justify-between">
            <Clock3 className="h-5 w-5 text-indigo-400" />
            <span className="text-2xl font-black text-[#FAFAFA] font-mono">{counts.today}</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs sm:text-sm font-bold text-[#A1A1AA]">مواعيد اليوم</p>
            {filter === 'today' && (
              <span className="text-[10px] text-indigo-400 bg-indigo-500/15 px-1.5 py-0.5 rounded-md font-medium border border-indigo-500/30">
                مفلتر
              </span>
            )}
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setFilter(filter === 'soon' ? 'all' : 'soon');
            setCurrentPage(1);
          }}
          className={`rounded-2xl border p-4 text-right transition-all cursor-pointer ${
            filter === 'soon'
              ? 'border-indigo-500/50 bg-[#202024] shadow-xs'
              : 'border-[#27272A] bg-[#18181B] hover:bg-[#202024] hover:border-[#3F3F46]'
          }`}
        >
          <div className="flex items-center justify-between">
            <SlidersHorizontal className="h-5 w-5 text-indigo-400" />
            <span className="text-2xl font-black text-[#FAFAFA] font-mono">{counts.soon}</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs sm:text-sm font-bold text-[#A1A1AA]">قريبة خلال 3 أيام</p>
            {filter === 'soon' && (
              <span className="text-[10px] text-indigo-400 bg-indigo-500/15 px-1.5 py-0.5 rounded-md font-medium border border-indigo-500/30">
                مفلتر
              </span>
            )}
          </div>
        </button>
      </div>

      {/* Task List Container with Client-Selection Header */}
      <div id="focus-tasks-section" className="overflow-hidden rounded-2xl border border-[#27272A] bg-[#18181B] shadow-xs">
        {/* Header and Client Selector Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#27272A] px-5 py-4 bg-[#18181B]">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-[#FAFAFA] text-sm sm:text-base">قائمة الأولويات والمهام</h2>
              <span className="text-xs font-mono text-[#A1A1AA] bg-[#09090B] px-2 py-0.5 rounded-md border border-[#27272A]">
                {filteredTasks.length} مهمة
              </span>
            </div>
            <p className="text-xs text-[#A1A1AA] mt-1">
              اختر العميل لعرض مهامه العاجلة والمتأخرة بدقة وبدون إطالة
            </p>
          </div>

          {/* Client Selector */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 bg-[#09090B] border border-indigo-500/30 p-1.5 rounded-xl">
              <Users className="w-4 h-4 text-indigo-400 mr-1 shrink-0" />
              <span className="text-xs font-bold text-[#FAFAFA] whitespace-nowrap">اختيار العميل:</span>
              <select
                value={selectedClientId}
                onChange={(e) => {
                  setSelectedClientId(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-[#18181B] text-[#FAFAFA] text-xs font-bold py-1.5 px-3 rounded-lg border border-[#27272A] outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer max-w-[200px] sm:max-w-[280px]"
              >
                <option value="all">جميع العملاء ({clientOptionsList.length} عميل)</option>
                {clientOptionsList.map(({ client, overdueCount, todayCount, totalFocusTasks }) => (
                  <option key={client.id} value={client.id}>
                    {client.clientName} ({client.companyName || 'بدون شركة'}) • {totalFocusTasks} مهام {overdueCount > 0 ? `[⚠️ ${overdueCount} متأخر]` : todayCount > 0 ? `[📅 اليوم ${todayCount}]` : ''}
                  </option>
                ))}
              </select>
            </div>

            {selectedClientId !== 'all' && (
              <button
                type="button"
                onClick={() => {
                  setSelectedClientId('all');
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1.5 text-xs text-[#A1A1AA] hover:text-[#FAFAFA] bg-[#09090B] hover:bg-[#27272A] border border-[#27272A] rounded-xl transition-colors cursor-pointer"
              >
                عرض كل العملاء
              </button>
            )}
          </div>
        </div>

        {/* Selected Client Overview Card */}
        {selectedClientData && (
          <div className="mx-5 my-4 bg-[#09090B] border border-indigo-500/20 rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center shrink-0 font-black text-sm">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-black text-sm sm:text-base text-[#FAFAFA]">
                    {selectedClientData.client.clientName}
                  </h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#27272A] text-[#A1A1AA]">
                    {selectedClientData.client.code}
                  </span>
                </div>
                <p className="text-xs text-[#A1A1AA] mt-0.5">
                  {selectedClientData.client.companyName || 'بدون شركة'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="px-3 py-1 rounded-lg bg-[#18181B] border border-[#27272A] flex items-center gap-1.5">
                <span className="text-[11px] text-[#A1A1AA]">المهام في المتابعة:</span>
                <span className="text-xs font-bold text-[#FAFAFA] font-mono">{selectedClientData.totalFocusTasks}</span>
                {selectedClientData.overdueCount > 0 && (
                  <span className="text-[10px] font-bold text-[#F43F5E] bg-[#F43F5E]/15 px-1.5 py-0.5 rounded-sm mr-1">
                    {selectedClientData.overdueCount} متأخرة
                  </span>
                )}
                {selectedClientData.todayCount > 0 && (
                  <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/15 px-1.5 py-0.5 rounded-sm mr-1">
                    {selectedClientData.todayCount} اليوم
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => onSelectClient(selectedClientData.client.id)}
                className="px-3 py-1 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>فتح ملف العميل</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Quick Search and Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-[#27272A] bg-[#141416]">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 text-[#71717A]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="بحث في المهمة، الكود، أو العميل..."
              className="pr-8 pl-3 py-1.5 text-xs bg-[#09090B] border border-[#27272A] rounded-xl text-[#FAFAFA] placeholder-[#71717A] outline-none focus:ring-1 focus:ring-indigo-500 w-full sm:w-64"
            />
          </div>

          <div className="flex items-center gap-2">
            {onDeleteTask && filteredTasks.length > 0 && (
              <button
                type="button"
                onClick={handleBulkDeleteFiltered}
                className="flex items-center gap-1.5 text-xs font-bold text-[#F43F5E] hover:text-[#FAFAFA] bg-[#F43F5E]/10 hover:bg-[#F43F5E] border border-[#F43F5E]/30 px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-xs"
                title="حذف جميع المهام المعروضة حالياً نهائياً"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>حذف كل المعروض ({filteredTasks.length})</span>
              </button>
            )}
            {filter !== 'all' && (
              <button
                type="button"
                onClick={() => {
                  setFilter('all');
                  setCurrentPage(1);
                }}
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
              >
                إلغاء تصفية الحالة
              </button>
            )}
            <span className="text-xs text-[#A1A1AA]">
              النتائج: <strong className="text-[#FAFAFA] font-mono">{filteredTasks.length}</strong>
            </span>
          </div>
        </div>

        {/* Tasks List Content with Max Height Scroll */}
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#A1A1AA]">
            لا توجد مهام مطابقة للاختيار الحالي.
          </div>
        ) : (
          <div>
            <div className="divide-y divide-[#27272A] max-h-[480px] overflow-y-auto">
              {paginatedTasks.map(item => {
                // Same link builder as the client card / page (adds the 966 country code). The local
                // copy here did not, so "56 580 9017" opened wa.me/565809017 — a Chilean number.
                const whatsAppHref = getWhatsAppLink(item.client.clientNumber || '');
                const isDelayed = item.daysDiff < 0;
                const isToday = item.daysDiff === 0;
                const badge = getTaskBadge(item.daysDiff);

                return (
                  <div
                    key={`${item.client.id}-${item.task.id}`}
                    className="group relative flex flex-col gap-3 p-4 pr-5 sm:flex-row sm:items-center sm:justify-between bg-[#18181B] hover:bg-[#202024] transition-colors duration-150"
                  >
                    {/* Status Accent Indicator */}
                    <div
                      className={`absolute top-0 right-0 bottom-0 w-1 transition-colors ${
                        isDelayed
                          ? 'bg-[#F43F5E]'
                          : isToday
                          ? 'bg-indigo-500'
                          : 'bg-transparent group-hover:bg-[#3F3F46]'
                      }`}
                    />

                    {/* Task & Client Info */}
                    <div className="flex min-w-0 items-start gap-3 text-right relative z-10">
                      <div className="min-w-0">
                        <span className="block truncate font-bold text-[#FAFAFA] text-xs sm:text-sm group-hover:text-indigo-300 transition-colors">
                          {item.task.title}
                        </span>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#A1A1AA] font-mono">
                          <span className="bg-[#09090B] border border-[#27272A] px-1.5 py-0.5 rounded text-[10px] text-[#A1A1AA] uppercase tracking-wider">
                            {item.client.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedClientId(item.client.id);
                              setCurrentPage(1);
                            }}
                            className="text-[#A1A1AA] font-sans font-medium hover:text-indigo-400 hover:underline transition-colors cursor-pointer text-right"
                            title="تصفية مهام هذا العميل"
                          >
                            {item.client.clientName}
                          </button>
                          <span className="text-[#3F3F46]">•</span>
                          <span className="text-[#A1A1AA]">{formatDateArabic(item.task.dueDate)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Badges & Actions */}
                    <div className="flex shrink-0 items-center gap-2 relative z-10">
                      <span className={`rounded-lg px-2.5 py-1 text-[11px] font-bold border ${badge.className}`}>
                        {badge.label}
                      </span>

                      {whatsAppHref !== '#' && (
                        <a
                          href={whatsAppHref}
                          target="_blank"
                          rel="noreferrer"
                          title="فتح واتساب العميل"
                          className="rounded-xl p-2 text-[#A1A1AA] hover:text-emerald-400 bg-transparent hover:bg-emerald-500/10 border border-[#27272A] hover:border-emerald-500/30 transition-all cursor-pointer"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => onSelectClient(item.client.id)}
                        className="px-2.5 py-1.5 text-xs font-bold text-[#A1A1AA] hover:text-indigo-300 bg-transparent hover:bg-indigo-500/10 border border-[#27272A] hover:border-indigo-500/30 rounded-xl transition-all inline-flex items-center gap-1 cursor-pointer"
                        title="عرض الملف الكامل"
                      >
                        <span>الملف</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        disabled={completingId === item.task.id}
                        onClick={() => complete(item)}
                        className="flex items-center gap-1.5 rounded-xl bg-transparent border border-[#27272A] hover:border-indigo-500/40 hover:bg-indigo-500/15 px-3 py-1.5 text-xs font-bold text-[#FAFAFA] hover:text-indigo-300 transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                      >
                        <CheckCircle2 className="h-4 w-4 text-indigo-400" strokeWidth={2} />
                        <span>{completingId === item.task.id ? 'جارٍ الحفظ...' : 'تم'}</span>
                      </button>

                      {onDeleteTask && (
                        <button
                          type="button"
                          disabled={deletingId === item.task.id}
                          onClick={() => handleDelete(item)}
                          className="p-1.5 text-[#71717A] hover:text-[#F43F5E] bg-transparent hover:bg-[#F43F5E]/10 border border-transparent hover:border-[#F43F5E]/30 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                          title="حذف المهمة نهائياً"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-[#27272A] bg-[#141416] text-xs">
                <span className="text-[#A1A1AA]">
                  الصفحة <strong className="text-[#FAFAFA] font-mono">{safePage}</strong> من <strong className="text-[#FAFAFA] font-mono">{totalPages}</strong>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={safePage === 1}
                    onClick={() => setCurrentPage(Math.max(1, safePage - 1))}
                    className="px-3 py-1 rounded-lg bg-[#09090B] border border-[#27272A] text-[#FAFAFA] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#27272A] transition-colors cursor-pointer"
                  >
                    السابق
                  </button>
                  <button
                    type="button"
                    disabled={safePage >= totalPages}
                    onClick={() => setCurrentPage(Math.min(totalPages, safePage + 1))}
                    className="px-3 py-1 rounded-lg bg-[#09090B] border border-[#27272A] text-[#FAFAFA] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#27272A] transition-colors cursor-pointer"
                  >
                    التالي
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};


