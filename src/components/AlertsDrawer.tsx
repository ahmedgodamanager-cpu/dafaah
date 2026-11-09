import React from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  CheckCircle2,
  ChevronDown,
  ArrowLeft,
  User,
  Bell,
  Check,
  CheckCheck,
  Search,
} from 'lucide-react';
import { TaskAlert, AppNotification, TaskCategory } from '../types';
import { formatDateArabic } from '../utils/dateUtils';

interface AlertsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: TaskAlert[];
  notifications: AppNotification[];
  markNotificationAsRead: (id: string) => void | Promise<void>;
  onSelectClient: (clientId: string) => void;
  /**
   * Managers see every client. These are the clients they own, for the "عملائي فقط" switch
   * (not passed for members: they only see their own clients anyway).
   */
  ownClientIds?: string[];
}

type AlertFilter = 'all' | TaskAlert['alertType'];

interface ClientAlertGroup {
  clientId: string;
  clientName: string;
  clientCode: string;
  overdue: number;
  today: number;
  soon: number;
  /** Days of the oldest overdue task (0 when nothing is overdue). */
  oldestDelay: number;
  /** Days until the nearest upcoming task (Infinity when there is none). */
  nearestSoon: number;
  /** The alerts shown for this client (after the filters), most urgent first. */
  items: TaskAlert[];
}

const GROUPS_PAGE = 20;
const TASKS_PREVIEW = 6;
const ONLY_MINE_KEY = 'crm_alerts_only_mine';

const CATEGORY_SHORT: Record<TaskCategory, string> = {
  account_management: 'أكونت',
  seo: 'سيو',
  media_buying: 'ميديا',
  social_media: 'سوشيال',
};

/** Arabic counting: "مهمة واحدة" / "مهمتين" / "5 مهام" / "416 مهمة". */
const countText = (n: number, one: string, two: string, few: string, many: string): string => {
  if (n === 1) return one;
  if (n === 2) return two;
  if (n >= 3 && n <= 10) return `${n} ${few}`;
  return `${n} ${many}`;
};

/** "يوم" / "يومين" / "5 أيام" / "45 يوم" */
const daysText = (n: number): string => countText(n, 'يوم', 'يومين', 'أيام', 'يوم');

const alertBadge = (alert: TaskAlert): { text: string; className: string } => {
  if (alert.alertType === 'overdue') {
    return { text: `متأخرة ${daysText(Math.abs(alert.daysDiff))}`, className: 'text-[#FB7185] bg-[#F43F5E]/12 border-[#F43F5E]/25' };
  }
  if (alert.alertType === 'due_today') {
    return { text: 'مستحقة اليوم', className: 'text-amber-300 bg-amber-500/12 border-amber-500/25' };
  }
  return { text: `بعد ${daysText(alert.daysDiff)}`, className: 'text-[#D4D4D8] bg-[#27272A] border-[#3F3F46]' };
};

/** Lower-case text with the Arabic letter variants folded, so a search finds "أحمد" when typed "احمد". */
const fold = (value: string) =>
  (value || '')
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .trim();

/** "البريف (الشهر 2)" → { title: "البريف", month: 2 } */
const splitMonth = (title: string): { title: string; month: number | null } => {
  const match = (title || '').match(/^(.*?)\s*\(الشهر (\d+)\)\s*$/);
  return match ? { title: match[1], month: Number(match[2]) } : { title: title || '', month: null };
};

const readOnlyMine = (): boolean => {
  try {
    return localStorage.getItem(ONLY_MINE_KEY) === '1';
  } catch {
    return false;
  }
};

export const AlertsDrawer: React.FC<AlertsDrawerProps> = ({
  isOpen,
  onClose,
  alerts,
  notifications,
  markNotificationAsRead,
  onSelectClient,
  ownClientIds,
}) => {
  const [activeTab, setActiveTab] = React.useState<'alerts' | 'notifications'>('notifications');
  const [markingAll, setMarkingAll] = React.useState(false);

  // Task alerts: grouped by client, with filters (the old list showed one big card per task, so a
  // few hundred late tasks made a list nobody could read).
  const [alertFilter, setAlertFilter] = React.useState<AlertFilter>('all');
  const [search, setSearch] = React.useState('');
  const [onlyMine, setOnlyMine] = React.useState<boolean>(readOnlyMine);
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});
  const [showAllTasks, setShowAllTasks] = React.useState<Record<string, boolean>>({});
  const [groupsShown, setGroupsShown] = React.useState(GROUPS_PAGE);

  const canFilterMine = !!ownClientIds;
  const mineActive = canFilterMine && onlyMine;

  const toggleOnlyMine = () => {
    setOnlyMine(prev => {
      const next = !prev;
      try {
        localStorage.setItem(ONLY_MINE_KEY, next ? '1' : '0');
      } catch {
        // storage blocked: the switch still works for this visit
      }
      return next;
    });
    setGroupsShown(GROUPS_PAGE);
  };

  // Alerts left after the search and "mine" filters (the type filter is applied per group, so the
  // three counters always show how many of each kind there are).
  const scopedAlerts = React.useMemo(() => {
    if (!isOpen) return [];
    const own = mineActive ? new Set(ownClientIds) : null;
    const q = fold(search);
    return alerts.filter(a => {
      if (own && !own.has(a.clientId)) return false;
      if (!q) return true;
      return fold(a.clientName).includes(q) || fold(a.clientCode).includes(q) || fold(a.taskTitle).includes(q);
    });
  }, [isOpen, alerts, mineActive, ownClientIds, search]);

  const counts = React.useMemo(() => {
    const c = { overdue: 0, due_today: 0, due_soon: 0 };
    scopedAlerts.forEach(a => {
      c[a.alertType]++;
    });
    return c;
  }, [scopedAlerts]);

  const groups = React.useMemo(() => {
    const byClient = new Map<string, ClientAlertGroup>();
    scopedAlerts.forEach(a => {
      let group = byClient.get(a.clientId);
      if (!group) {
        group = { clientId: a.clientId, clientName: a.clientName, clientCode: a.clientCode, overdue: 0, today: 0, soon: 0, oldestDelay: 0, nearestSoon: Infinity, items: [] };
        byClient.set(a.clientId, group);
      }
      if (a.alertType === 'overdue') {
        group.overdue++;
        group.oldestDelay = Math.max(group.oldestDelay, Math.abs(a.daysDiff));
      } else if (a.alertType === 'due_today') {
        group.today++;
      } else {
        group.soon++;
        group.nearestSoon = Math.min(group.nearestSoon, a.daysDiff);
      }
      if (alertFilter === 'all' || a.alertType === alertFilter) group.items.push(a);
    });
    const list = [...byClient.values()].filter(g => g.items.length > 0);
    list.forEach(g => g.items.sort((x, y) => x.daysDiff - y.daysDiff));
    const byName = (a: ClientAlertGroup, b: ClientAlertGroup) => a.clientName.localeCompare(b.clientName, 'ar');
    if (alertFilter === 'due_today') {
      list.sort((a, b) => b.today - a.today || b.overdue - a.overdue || byName(a, b));
    } else if (alertFilter === 'due_soon') {
      list.sort((a, b) => a.nearestSoon - b.nearestSoon || b.soon - a.soon || byName(a, b));
    } else {
      // Most late tasks first, then the oldest delay, then today's, then the upcoming ones.
      list.sort((a, b) =>
        b.overdue - a.overdue ||
        b.oldestDelay - a.oldestDelay ||
        b.today - a.today ||
        b.soon - a.soon ||
        byName(a, b)
      );
    }
    return list;
  }, [scopedAlerts, alertFilter]);

  const shownTaskCount = React.useMemo(() => groups.reduce((sum, g) => sum + g.items.length, 0), [groups]);

  if (!isOpen) return null;

  const unreadNotifsCount = notifications.filter(n => !n.isRead).length;
  const searching = !!search.trim();
  // A short list opens by itself; a long one stays folded so it can be scanned client by client.
  const autoExpand = searching || groups.length <= 3;
  const isExpanded = (clientId: string) => expanded[clientId] ?? autoExpand;

  // Marks every unread notification as read (the list and the counters update by themselves).
  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.isRead);
    if (unread.length === 0 || markingAll) return;
    setMarkingAll(true);
    try {
      await Promise.all(unread.map(n => Promise.resolve(markNotificationAsRead(n.id))));
    } finally {
      setMarkingAll(false);
    }
  };

  const openClient = (clientId: string) => {
    onSelectClient(clientId);
    onClose();
  };

  const chooseFilter = (filter: AlertFilter) => {
    setAlertFilter(prev => (prev === filter ? 'all' : filter));
    setGroupsShown(GROUPS_PAGE);
  };

  const counterPills: Array<{ key: 'overdue' | 'today' | 'soon'; filter: AlertFilter; label: string; className: string }> = [
    { key: 'overdue', filter: 'overdue', label: 'متأخرة', className: 'bg-[#F43F5E]/15 text-[#FB7185]' },
    { key: 'today', filter: 'due_today', label: 'اليوم', className: 'bg-amber-500/15 text-amber-300' },
    { key: 'soon', filter: 'due_soon', label: 'قريبة', className: 'bg-[#27272A] text-[#D4D4D8]' },
  ];

  const summaryButtons: Array<{ id: Exclude<AlertFilter, 'all'>; label: string; count: number; tone: string; activeTone: string }> = [
    {
      id: 'overdue',
      label: 'متأخرة',
      count: counts.overdue,
      tone: 'text-[#FB7185]',
      activeTone: 'border-[#F43F5E]/60 bg-[#F43F5E]/10',
    },
    {
      id: 'due_today',
      label: 'مستحقة اليوم',
      count: counts.due_today,
      tone: 'text-amber-300',
      activeTone: 'border-amber-500/60 bg-amber-500/10',
    },
    {
      id: 'due_soon',
      label: 'خلال 3 أيام',
      count: counts.due_soon,
      tone: 'text-[#E4E4E7]',
      activeTone: 'border-[#71717A] bg-[#27272A]',
    },
  ];

  const renderAlertsTab = () => {
    if (alerts.length === 0) {
      return (
        <div className="text-center py-16">
          <div className="w-12 h-12 bg-[#18181B] border border-[#27272A] text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Check className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-[#FAFAFA]">لا توجد مهام متأخرة!</h3>
          <p className="text-xs text-[#A1A1AA] mt-1">
            جميع التاسكات قيد المتابعة وتسير وفق الجدول المعتمد.
          </p>
        </div>
      );
    }

    const visibleGroups = groups.slice(0, groupsShown);
    const hiddenGroups = groups.length - visibleGroups.length;

    return (
      <div className="space-y-3">
        {/* Counters, which are also the filters */}
        <div className="grid grid-cols-3 gap-2" role="group" aria-label="تصفية حسب الحالة">
          {summaryButtons.map(btn => {
            const active = alertFilter === btn.id;
            const dimmed = alertFilter !== 'all' && !active;
            return (
              <button
                key={btn.id}
                type="button"
                onClick={() => chooseFilter(btn.id)}
                aria-pressed={active}
                className={`rounded-xl border px-2 py-2.5 text-center transition-colors cursor-pointer ${
                  active ? btn.activeTone : 'border-[#27272A] bg-[#18181B] hover:bg-[#202024]'
                } ${dimmed ? 'opacity-50 hover:opacity-80' : ''}`}
              >
                <span className={`block text-xl font-black leading-none tabular-nums ${btn.tone}`}>{btn.count}</span>
                <span className="mt-1 block text-[11px] font-bold text-[#A1A1AA]">{btn.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search + "my clients" */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#71717A]" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setGroupsShown(GROUPS_PAGE);
              }}
              placeholder="ابحث باسم العميل أو المهمة"
              aria-label="ابحث باسم العميل أو المهمة"
              className="h-9 w-full rounded-xl border border-[#27272A] bg-[#18181B] pr-8 pl-8 text-xs text-[#FAFAFA] placeholder:text-[#71717A] outline-none transition focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/25"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setGroupsShown(GROUPS_PAGE);
                }}
                className="absolute left-1.5 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-md text-[#A1A1AA] hover:bg-[#27272A] hover:text-[#FAFAFA] cursor-pointer"
                aria-label="مسح البحث"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {canFilterMine && (
            <button
              type="button"
              role="switch"
              aria-checked={mineActive}
              onClick={toggleOnlyMine}
              className={`h-9 shrink-0 rounded-xl border px-3 text-xs font-bold transition-colors cursor-pointer ${
                mineActive
                  ? 'border-[#6366F1]/60 bg-[#6366F1]/15 text-indigo-200'
                  : 'border-[#27272A] bg-[#18181B] text-[#A1A1AA] hover:text-[#FAFAFA]'
              }`}
              title="عرض العملاء المسجلين باسمك فقط"
            >
              عملائي فقط
            </button>
          )}
        </div>

        <p className="px-1 text-[11px] font-medium text-[#71717A]" aria-live="polite">
          {groups.length === 0
            ? 'لا توجد مهام مطابقة'
            : `${countText(shownTaskCount, 'مهمة واحدة', 'مهمتين', 'مهام', 'مهمة')} عند ${countText(groups.length, 'عميل واحد', 'عميلين', 'عملاء', 'عميل')}`}
        </p>

        {groups.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#27272A] px-4 py-8 text-center">
            <p className="text-xs text-[#A1A1AA]">جرّب كلمة بحث أخرى أو امسح الفلاتر.</p>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setAlertFilter('all');
                if (mineActive) toggleOnlyMine();
              }}
              className="mt-3 rounded-lg border border-[#27272A] px-3 py-1.5 text-xs font-bold text-[#E4E4E7] hover:bg-[#18181B] cursor-pointer"
            >
              مسح الفلاتر
            </button>
          </div>
        ) : (
          <ul className="space-y-2">
            {visibleGroups.map(group => {
              const open = isExpanded(group.clientId);
              const allTasks = !!showAllTasks[group.clientId];
              const tasks = allTasks ? group.items : group.items.slice(0, TASKS_PREVIEW);
              const severity = group.overdue > 0 ? 'bg-[#F43F5E]' : group.today > 0 ? 'bg-amber-400' : 'bg-[#52525B]';
              const panelId = `alerts-client-${group.clientId}`;
              return (
                <li key={group.clientId} className="relative overflow-hidden rounded-xl border border-[#27272A] bg-[#18181B]">
                  <span aria-hidden className={`absolute inset-y-0 right-0 w-[3px] ${severity}`} />
                  <button
                    type="button"
                    onClick={() => setExpanded(prev => ({ ...prev, [group.clientId]: !open }))}
                    aria-expanded={open}
                    aria-controls={panelId}
                    className="flex w-full items-center gap-3 py-3 pr-4 pl-3 text-right transition-colors hover:bg-[#202024] cursor-pointer"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-bold text-[#FAFAFA]">{group.clientName}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[#A1A1AA]">
                        {group.clientCode && (
                          <span className="rounded-md bg-[#27272A] px-1.5 py-px font-mono text-[10px] text-[#D4D4D8]" dir="ltr">
                            {group.clientCode}
                          </span>
                        )}
                        <span>
                          {group.oldestDelay > 0
                            ? `أقدم تأخير ${daysText(group.oldestDelay)}`
                            : group.today > 0
                              ? 'لديه مهام مستحقة اليوم'
                              : `أقرب موعد بعد ${daysText(group.nearestSoon)}`}
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {counterPills.map(pill => {
                        const value = group[pill.key];
                        if (!value) return null;
                        const dim = alertFilter !== 'all' && alertFilter !== pill.filter;
                        return (
                          <span
                            key={pill.key}
                            className={`flex min-w-9 flex-col items-center rounded-md px-1.5 py-1 ${pill.className} ${dim ? 'opacity-40' : ''}`}
                          >
                            <span className="text-xs font-black leading-none tabular-nums">{value}</span>
                            <span className="mt-1 text-[9px] font-bold leading-none opacity-80">{pill.label}</span>
                          </span>
                        );
                      })}
                      <ChevronDown className={`mr-1 h-4 w-4 text-[#71717A] transition-transform ${open ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  {open && (
                    <div id={panelId} className="border-t border-[#27272A]">
                      <ul className="divide-y divide-[#27272A]/70">
                        {tasks.map(alert => {
                          const badge = alertBadge(alert);
                          const { title, month } = splitMonth(alert.taskTitle);
                          return (
                            <li key={alert.id}>
                              <button
                                type="button"
                                onClick={() => openClient(alert.clientId)}
                                className="group flex w-full items-center gap-3 py-2.5 pr-4 pl-3 text-right transition-colors hover:bg-[#202024] cursor-pointer"
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="truncate text-xs font-bold text-[#E4E4E7] group-hover:text-indigo-300" title={alert.taskTitle}>{title}</div>
                                  <div className="mt-0.5 flex items-center gap-2 text-[10px] text-[#71717A]">
                                    <span>{CATEGORY_SHORT[alert.category] || ''}</span>
                                    {month !== null && <span>الشهر {month}</span>}
                                    <span dir="ltr" className="font-mono">{formatDateArabic(alert.dueDate)}</span>
                                  </div>
                                </div>
                                <span className={`shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-bold ${badge.className}`}>
                                  {badge.text}
                                </span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                      <div className="flex items-center justify-between gap-2 border-t border-[#27272A] px-3 py-2">
                        {group.items.length > TASKS_PREVIEW ? (
                          <button
                            type="button"
                            onClick={() => setShowAllTasks(prev => ({ ...prev, [group.clientId]: !allTasks }))}
                            className="rounded-lg px-2 py-1 text-[11px] font-bold text-[#A1A1AA] hover:bg-[#27272A] hover:text-[#FAFAFA] cursor-pointer"
                          >
                            {allTasks ? 'عرض أقل' : `عرض كل المهام (${group.items.length})`}
                          </button>
                        ) : (
                          <span />
                        )}
                        <button
                          type="button"
                          onClick={() => openClient(group.clientId)}
                          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-bold text-indigo-300 hover:bg-[#6366F1]/15 hover:text-white cursor-pointer"
                        >
                          <span>فتح صفحة العميل</span>
                          <ArrowLeft className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {hiddenGroups > 0 && (
          <button
            type="button"
            onClick={() => setGroupsShown(n => n + GROUPS_PAGE)}
            className="w-full rounded-xl border border-[#27272A] py-2.5 text-xs font-bold text-[#A1A1AA] transition-colors hover:bg-[#18181B] hover:text-[#FAFAFA] cursor-pointer"
          >
            عرض عملاء آخرين ({hiddenGroups})
          </button>
        )}
      </div>
    );
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-sm transition-opacity flex justify-end"
      dir="rtl"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-[#09090B] border-r border-[#27272A] h-full shadow-2xl flex flex-col animate-in slide-in-from-left duration-200"
      >

        {/* Header */}
        <div className="flex flex-col bg-[#09090B] border-b border-[#27272A]">
          <div className="p-4 sm:p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#6366F1]/15 border border-[#6366F1]/25 text-[#6366F1] flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#FAFAFA]">مركز الإشعارات والتنبيهات</h2>
                <p className="text-xs text-[#A1A1AA] mt-0.5">
                  {unreadNotifsCount > 0 ? `${unreadNotifsCount} إشعار غير مقروء` : 'جميع الإشعارات مقروءة'} • {alerts.length} تنبيه مهام
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#27272A] rounded-xl transition-colors cursor-pointer"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Segmented Control Tabs */}
          <div className="px-4 pb-3">
            <div className="bg-[#18181B] border border-[#27272A] p-1 rounded-xl flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('notifications')}
                className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'notifications'
                    ? 'bg-[#27272A] text-[#FAFAFA] shadow-xs'
                    : 'text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#202024]'
                }`}
              >
                <span>الإشعارات</span>
                {unreadNotifsCount > 0 && (
                  <span className="bg-[#6366F1] text-white text-[10px] font-mono px-2 py-0.2 rounded-full">
                    {unreadNotifsCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('alerts')}
                className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'alerts'
                    ? 'bg-[#27272A] text-[#FAFAFA] shadow-xs'
                    : 'text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#202024]'
                }`}
              >
                <span>المهام والمواعيد</span>
                {alerts.length > 0 && (
                  <span className={`text-[10px] font-mono px-2 py-0.2 rounded-full ${
                    alerts.some(a => a.alertType === 'overdue') ? 'bg-[#F43F5E] text-white' : 'bg-[#27272A] text-[#A1A1AA] border border-[#3F3F46]'
                  }`}>
                    {alerts.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">

          {activeTab === 'notifications' ? (
            notifications.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-12 h-12 bg-[#18181B] border border-[#27272A] text-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                </div>
                <h3 className="text-sm font-bold text-[#FAFAFA]">لا توجد إشعارات جديدة</h3>
                <p className="text-xs text-[#A1A1AA] mt-1">ستصلك هنا إشعارات نقل وتوزيع العملاء والتحديثات المهمة.</p>
              </div>
            ) : (
              <div className="space-y-3">
              {unreadNotifsCount > 0 && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    disabled={markingAll}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#6366F1]/30 bg-[#6366F1]/10 px-3 py-1.5 text-xs font-bold text-indigo-300 transition-colors hover:bg-[#6366F1]/20 hover:text-white disabled:cursor-wait disabled:opacity-60 cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>{markingAll ? 'جاري التحديث...' : 'اجعلها كلها مقروءة'}</span>
                  </button>
                </div>
              )}
              <div className="divide-y divide-[#27272A] border border-[#27272A] rounded-2xl overflow-hidden bg-[#18181B]/50">
                {notifications.map(notif => (
                  <div
                    key={notif.id}
                    onClick={() => {
                      if (!notif.isRead) markNotificationAsRead(notif.id);
                      if (notif.linkToClientId) {
                        onSelectClient(notif.linkToClientId);
                        onClose();
                      }
                    }}
                    className={`p-4 flex items-start gap-3.5 cursor-pointer transition-colors relative group ${
                      notif.isRead
                        ? 'bg-[#18181B] hover:bg-[#202024]'
                        : 'bg-[#18181B] hover:bg-[#202024]'
                    }`}
                  >
                    {/* Unread indicator dot */}
                    {!notif.isRead && (
                      <span className="absolute top-4 right-2 w-2 h-2 rounded-full bg-[#6366F1] ring-4 ring-[#6366F1]/20 animate-pulse" />
                    )}

                    {/* Left Icon */}
                    <div className="w-9 h-9 rounded-full bg-[#6366F1]/15 text-[#6366F1] border border-[#6366F1]/25 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-4 h-4" />
                    </div>

                    {/* Notification content */}
                    <div className="flex-1 min-w-0 pr-1">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="text-sm font-medium text-[#FAFAFA] group-hover:text-indigo-300 transition-colors truncate">
                          {notif.title}
                        </h4>
                        {/* Date in top left */}
                        <span className="text-[11px] text-[#71717A] shrink-0 font-mono whitespace-nowrap">
                          {formatDateArabic(notif.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-[#A1A1AA] leading-relaxed line-clamp-2">
                        {notif.message}
                      </p>
                      {/* Mark just this one as read without opening the client */}
                      {!notif.isRead && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            markNotificationAsRead(notif.id);
                          }}
                          className="mt-2 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 -mr-1.5 text-[11px] font-bold text-indigo-300 transition-colors hover:bg-[#6366F1]/15 hover:text-white cursor-pointer"
                        >
                          <Check className="w-3 h-3" />
                          <span>اجعلها مقروءة</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              </div>
            )
          ) : (
            renderAlertsTab()
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#27272A] bg-[#09090B]">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 text-xs font-bold text-[#A1A1AA] hover:text-[#FAFAFA] bg-transparent hover:bg-[#18181B] border border-[#27272A] hover:border-[#3F3F46] rounded-xl transition-all cursor-pointer text-center"
          >
            إغلاق التنبيهات
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};
