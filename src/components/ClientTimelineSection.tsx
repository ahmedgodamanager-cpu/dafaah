import React, { useState, useMemo } from 'react';
import { Client, TaskItem, DailyActivation } from '../types';
import { formatDateArabic, getTaskTimeStatus, getDaysDifference, getRemainingContractDays } from '../utils/dateUtils';
import { 
  History, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Calendar, 
  Activity, 
  Filter, 
  ArrowDownUp, 
  Sparkles,
  Milestone,
  FileText,
  Tag,
  Share2
} from 'lucide-react';

interface ClientTimelineSectionProps {
  client: Client;
}

type TimelineFilterType = 'all' | 'tasks' | 'activations';
type TimelineSortOrder = 'desc' | 'asc';

interface UnifiedTimelineEvent {
  id: string;
  date: string; // YYYY-MM-DD
  type: 'task' | 'activation' | 'contract_start' | 'contract_end';
  title: string;
  categoryOrPlatform?: string;
  notesOrDetails?: string;
  status: 'completed' | 'delayed' | 'upcoming' | 'info';
  statusLabel: string;
  completedAt?: string;
  taskCategory?: string;
  task?: TaskItem;
  activation?: DailyActivation;
}

export const ClientTimelineSection: React.FC<ClientTimelineSectionProps> = ({ client }) => {
  const [filterType, setFilterType] = useState<TimelineFilterType>('all');
  const [sortOrder, setSortOrder] = useState<TimelineSortOrder>('desc');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Build unified chronological events
  const timelineEvents = useMemo(() => {
    const events: UnifiedTimelineEvent[] = [];

    // 1. Contract Start Milestone
    if (client.startDate) {
      events.push({
        id: 'evt-contract-start',
        date: client.startDate,
        type: 'contract_start',
        title: 'بداية تفعيل العقد الرسمي',
        categoryOrPlatform: client.contract,
        notesOrDetails: `بداية التعاقد لمدة ${client.durationMonths} ${client.durationMonths === 1 ? 'شهر' : 'أشهر'} (+ 10 أيام) (${client.companyName || 'عام'})`,
        status: 'info',
        statusLabel: 'محطة العقد'
      });
    }

    // 2. Tasks
    client.tasks.forEach(task => {
      const taskStatus = getTaskTimeStatus(task);
      let statusType: 'completed' | 'delayed' | 'upcoming' = 'upcoming';
      let statusLabel = taskStatus.label;

      if (task.completed) {
        statusType = 'completed';
        statusLabel = 'مكتملة';
      } else if (taskStatus.type === 'overdue') {
        statusType = 'delayed';
        statusLabel = taskStatus.label;
      } else if (taskStatus.type === 'due_soon' || taskStatus.type === 'due_today') {
        statusType = 'upcoming';
        statusLabel = taskStatus.label;
      }

      // Main date used for timeline sorting (completedAt if done, otherwise dueDate)
      const eventDate = task.completedAt || task.dueDate || client.startDate || '2026-01-01';

      events.push({
        id: `evt-task-${task.id}`,
        date: eventDate,
        type: 'task',
        title: task.title,
        taskCategory: task.category,
        categoryOrPlatform: task.category,
        notesOrDetails: task.notes,
        status: statusType,
        statusLabel,
        completedAt: task.completedAt,
        task
      });
    });

    // 3. Daily Activations
    client.dailyActivations?.forEach(act => {
      events.push({
        id: `evt-act-${act.id}`,
        date: act.date,
        type: 'activation',
        // DailyActivation has `activityType` and `notes` (there is no `type` / `details`, which
        // printed "undefined" in the title and never showed the notes).
        title: `تفعيل يومي: ${[act.platform, act.activityType].filter(Boolean).join(' - ') || act.title || ''}`,
        categoryOrPlatform: act.platform || act.department,
        notesOrDetails: act.notes || act.title,
        status: 'completed',
        statusLabel: 'تم التفعيل',
        activation: act
      });
    });

    // 4. Contract End Milestone
    if (client.endDate) {
      const daysDiff = getRemainingContractDays(client);
      const isExpired = daysDiff < 0;
      events.push({
        id: 'evt-contract-end',
        date: client.endDate,
        type: 'contract_end',
        title: 'تاريخ انتهاء العقد الحالي',
        categoryOrPlatform: client.contract,
        notesOrDetails: isExpired ? `انتهى العقد منذ ${Math.abs(daysDiff)} يوم` : `متبقي على الانتهاء ${daysDiff} يوم`,
        status: isExpired ? 'delayed' : 'info',
        statusLabel: isExpired ? 'عقد منتهي' : 'نهاية العقد'
      });
    }

    return events;
  }, [client]);

  // Filtered & Sorted Events
  const filteredEvents = useMemo(() => {
    let result = timelineEvents.filter(evt => {
      if (filterType === 'tasks' && evt.type !== 'task') return false;
      if (filterType === 'activations' && evt.type !== 'activation') return false;

      if (selectedCategory !== 'all' && evt.taskCategory && evt.taskCategory !== selectedCategory) {
        return false;
      }

      return true;
    });

    // Sort by date
    result.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [timelineEvents, filterType, selectedCategory, sortOrder]);

  // Statistics for timeline header
  const taskEventsCount = timelineEvents.filter(e => e.type === 'task').length;
  const activationEventsCount = timelineEvents.filter(e => e.type === 'activation').length;

  return (
    <div className="bg-[var(--surface)] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-6">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
              الجدول الزمني للعميل (Timeline)
            </h2>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            مسار تتبعي رأسي يستعرض تسلسل التكليفات والتفعيلات اليومية ومراحل العقد بمرور الوقت
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          
          {/* Filter Type */}
          <div className="flex items-center bg-[var(--surface-hover)] p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterType === 'all' 
                  ? 'bg-[var(--surface)] text-indigo-600 dark:text-indigo-400 shadow-xs' 
                  : 'text-[var(--text-muted)] hover:text-slate-900'
              }`}
            >
              الكل ({timelineEvents.length})
            </button>
            <button
              onClick={() => setFilterType('tasks')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterType === 'tasks' 
                  ? 'bg-[var(--surface)] text-indigo-600 dark:text-indigo-400 shadow-xs' 
                  : 'text-[var(--text-muted)] hover:text-slate-900'
              }`}
            >
              المهام ({taskEventsCount})
            </button>
            <button
              onClick={() => setFilterType('activations')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterType === 'activations' 
                  ? 'bg-[var(--surface)] text-indigo-600 dark:text-indigo-400 shadow-xs' 
                  : 'text-[var(--text-muted)] hover:text-slate-900'
              }`}
            >
              التفعيلات ({activationEventsCount})
            </button>
          </div>

          {/* Sort Order Toggle */}
          <button
            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
            className="flex items-center gap-1 px-3 py-2 text-xs font-bold rounded-xl bg-[var(--surface-hover)] text-[var(--text)] hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title="تغيير الترتيب الزمني"
          >
            <ArrowDownUp className="w-3.5 h-3.5 text-indigo-500" />
            <span>{sortOrder === 'desc' ? 'الأحدث أولاً' : 'الأقدم أولاً'}</span>
          </button>
        </div>
      </div>

      {/* Timeline Content */}
      {filteredEvents.length > 0 ? (
        <div className="relative pr-6 md:pr-8 space-y-8 before:absolute before:right-[15px] md:before:right-[19px] before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-indigo-500 before:via-purple-500 before:to-slate-300 dark:before:to-slate-700">
          
          {filteredEvents.map((evt, idx) => {
            // Icon and styling per event type/status
            let IconComponent = Clock;
            let iconBgClass = 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
            let cardBorderClass = 'border-slate-200/80 dark:border-slate-800';

            if (evt.type === 'contract_start') {
              IconComponent = Milestone;
              iconBgClass = 'bg-indigo-600 text-white shadow-md ring-4 ring-indigo-100 dark:ring-indigo-950';
              cardBorderClass = 'border-indigo-200 dark:border-indigo-800 bg-indigo-50/40 dark:bg-indigo-950/20';
            } else if (evt.type === 'contract_end') {
              IconComponent = Milestone;
              iconBgClass = evt.status === 'delayed'
                ? 'bg-rose-600 text-white shadow-md ring-4 ring-rose-100 dark:ring-rose-950'
                : 'bg-purple-600 text-white shadow-md ring-4 ring-purple-100 dark:ring-purple-950';
              cardBorderClass = 'border-purple-200 dark:border-purple-800 bg-purple-50/40 dark:bg-purple-950/20';
            } else if (evt.type === 'activation') {
              IconComponent = Activity;
              iconBgClass = 'bg-amber-500 text-white shadow-xs ring-4 ring-amber-100 dark:ring-amber-950';
              cardBorderClass = 'border-amber-200/80 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-950/10';
            } else if (evt.status === 'completed') {
              IconComponent = CheckCircle2;
              iconBgClass = 'bg-emerald-500 text-white shadow-xs ring-4 ring-emerald-100 dark:ring-emerald-950';
              cardBorderClass = 'border-emerald-200/80 dark:border-emerald-900/40 bg-emerald-50/20 dark:bg-emerald-950/10';
            } else if (evt.status === 'delayed') {
              IconComponent = AlertCircle;
              iconBgClass = 'bg-rose-500 text-white shadow-xs ring-4 ring-rose-100 dark:ring-rose-950';
              cardBorderClass = 'border-rose-200/80 dark:border-rose-900/40 bg-rose-50/30 dark:bg-rose-950/10';
            } else {
              IconComponent = Clock;
              iconBgClass = 'bg-indigo-500 text-white shadow-xs ring-4 ring-indigo-100 dark:ring-indigo-950';
              cardBorderClass = 'border-[var(--border)]';
            }

            return (
              <div key={evt.id} className="relative group animate-fadeIn">
                
                {/* Timeline Icon Node */}
                <div className={`absolute -right-[23px] md:-right-[27px] top-1.5 w-8 h-8 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 z-10 ${iconBgClass}`}>
                  <IconComponent className="w-4 h-4" />
                </div>

                {/* Event Card Content */}
                <div className={`p-4 rounded-2xl border transition-all hover:shadow-md ${cardBorderClass}`}>
                  
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                        {evt.title}
                      </h4>

                      {/* Event Type Badge */}
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        evt.type === 'activation'
                          ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300'
                          : evt.type === 'task'
                          ? 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300'
                          : 'bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300'
                      }`}>
                        {evt.type === 'activation' ? 'تفعيل يومي' : evt.type === 'task' ? 'تاسك' : 'حدث عقد'}
                      </span>

                      {/* Category Badge if any */}
                      {evt.categoryOrPlatform && (
                        <span className="px-2 py-0.5 rounded-md bg-[var(--surface-hover)] text-[var(--text-muted)] text-[10px] font-semibold">
                          {evt.categoryOrPlatform}
                        </span>
                      )}
                    </div>

                    {/* Date Tag */}
                    <div className="flex items-center gap-1 text-xs font-mono font-bold text-[var(--text-muted)] bg-[var(--surface-hover)] px-2.5 py-1 rounded-lg self-start sm:self-auto">
                      <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{formatDateArabic(evt.date)}</span>
                    </div>
                  </div>

                  {/* Notes / Details */}
                  {evt.notesOrDetails && (
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed font-medium bg-white/60 dark:bg-slate-900/60 p-2.5 rounded-xl border border-[var(--border)]/80 mt-2">
                      {evt.notesOrDetails}
                    </p>
                  )}

                  {/* Footer Info */}
                  <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] pt-3 mt-2 border-t border-[var(--border)]/60 font-medium">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3 h-3 text-slate-400" />
                      <span>الحالة: <strong className="text-[var(--text)] font-bold">{evt.statusLabel}</strong></span>
                    </span>

                    {evt.completedAt && (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        تاريخ الإنجاز: {formatDateArabic(evt.completedAt)}
                      </span>
                    )}
                  </div>

                </div>

              </div>
            );
          })}

        </div>
      ) : (
        <div className="py-12 text-center text-slate-400 space-y-2">
          <History className="w-8 h-8 mx-auto opacity-40 text-slate-400" />
          <p className="text-xs font-semibold">لا توجد أحداث مطابقة في الجدول الزمني حالياً.</p>
        </div>
      )}

    </div>
  );
};
