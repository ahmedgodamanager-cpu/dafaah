import React from 'react';
import {
  Component,
  useState,
  type ElementType,
  type ErrorInfo,
  type PropsWithChildren,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Activity,
  BarChart3,
  Archive,
  Bell,
  BookOpen,
  CheckSquare,
  DatabaseBackup,
  Download,
  Gauge,
  LayoutDashboard,
  ListTodo,
  Menu,
  Moon,
  Plus,
  Printer,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Upload,
  X,
  Calendar,
  Users,
  Server,
  Briefcase,
  LogOut,
  FileText,
  Wifi,
  WifiOff,
} from "lucide-react";
import { TaskAlert, AppNotification, ConnectionStatus } from "../types";
import { Logo } from "./Logo";

const ease = [0.22, 1, 0.36, 1] as const;

/* One visual language for the whole app: Modern Arabic typography, minimal aesthetics, and clean focus states. */
function ExperienceStyles() {
  return (
    <style>{`
    .app-experience { min-height: 100vh; font-family: var(--font-sans); -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
    .app-experience::selection { background: #6366f1; color: #ffffff; }
    .app-experience button, .app-experience a, .app-experience input, .app-experience select, .app-experience textarea { -webkit-tap-highlight-color: transparent; }
    .app-experience button:focus-visible, .app-experience a:focus-visible, .app-experience input:focus-visible, .app-experience select:focus-visible, .app-experience textarea:focus-visible { outline: 2px solid #6366f1; outline-offset: 3px; }
    .app-experience [data-surface] { transition: transform .28s cubic-bezier(.22,1,.36,1), box-shadow .28s ease, border-color .28s ease; }
    @media (hover: hover) { .app-experience [data-surface]:hover { transform: translateY(-1.5px); box-shadow: 0 14px 25px -18px rgba(15,23,42,.25); } }
    @media (prefers-reduced-motion: reduce) { .app-experience *, .app-experience *::before, .app-experience *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; scroll-behavior: auto !important; } }
  `}</style>
  );
}

type ErrorState = { error: Error | null; runtimeMessage: string | null };
type ErrorBoundaryProps = PropsWithChildren<{
  /**
   * Also show a small banner for errors outside React rendering (window "error" /
   * "unhandledrejection"). Off for the app-wide boundary: those events also fire for harmless
   * browser noise (e.g. ResizeObserver warnings from the charts), so the banner would pop up
   * for nothing.
   */
  catchGlobalErrors?: boolean;
}>;

/**
 * Catches rendering errors so one broken screen shows a recovery card instead of a blank page.
 * (It existed before but was never mounted, and its hand-made typing did not compile against
 * the React type definitions.)
 */
export class ExperienceErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorState> {
  override state: ErrorState = { error: null, runtimeMessage: null };
  constructor(props: ErrorBoundaryProps) {
    super(props);
  }
  static getDerivedStateFromError(error: Error): Partial<ErrorState> {
    return { error };
  }
  componentDidMount() {
    if (this.props.catchGlobalErrors === false) return;
    window.addEventListener("error", this.runtimeError);
    window.addEventListener("unhandledrejection", this.promiseError);
  }
  componentWillUnmount() {
    window.removeEventListener("error", this.runtimeError);
    window.removeEventListener("unhandledrejection", this.promiseError);
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Application UI error:", error, info.componentStack);
  }
  private runtimeError = (event: ErrorEvent) => {
    if (!this.state.error) {
      console.error("Runtime error:", event.error || event.message);
      this.setState({
        runtimeMessage: "تعذّر إكمال العملية. لم يتم حذف أي بيانات.",
      });
    }
  };
  private promiseError = (event: PromiseRejectionEvent) => {
    if (!this.state.error) {
      console.error("Unhandled promise rejection:", event.reason);
      this.setState({
        runtimeMessage: "تعذّر حفظ أو تحميل بعض البيانات. حاول مرة أخرى.",
      });
    }
  };
  private reset = () => this.setState({ error: null, runtimeMessage: null });
  render() {
    if (this.state.error)
      return (
        <main
          dir="rtl"
          className="grid min-h-screen place-items-center bg-slate-50 p-6 text-center dark:bg-slate-950"
        >
          <section
            data-surface
            className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-950/5 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
              <ShieldAlert className="h-7 w-7" />
            </div>
            <h1 className="mt-5 text-lg font-black">حدثت مشكلة غير متوقعة</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              تم إيقاف هذه الشاشة لحماية بياناتك. يمكنك المحاولة مجددًا أو إعادة
              تحميل التطبيق.
            </p>
            <div className="mt-6 flex justify-center gap-2">
              <button
                onClick={this.reset}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-amber-950"
              >
                <RefreshCw className="h-4 w-4" />
                حاول مجددًا
              </button>
              <button
                onClick={() => window.location.reload()}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 dark:border-slate-700 dark:text-slate-300"
              >
                إعادة التحميل
              </button>
            </div>
          </section>
        </main>
      );
    return (
      <>
        {this.props.children}
        {this.state.runtimeMessage && (
          <div
            dir="rtl"
            role="alert"
            className="fixed bottom-5 left-5 z-[100] flex max-w-sm items-start gap-3 rounded-2xl border border-amber-200 bg-white p-4 text-right shadow-2xl shadow-slate-950/15 dark:border-amber-500/30 dark:bg-slate-900"
          >
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
            <p className="flex-1 text-xs font-semibold leading-5 text-[var(--text-muted)]">
              {this.state.runtimeMessage}
            </p>
            <button
              onClick={this.reset}
              className="rounded-md p-1 text-slate-400"
              aria-label="إغلاق"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </>
    );
  }
}

export function AppExperience({ children }: { children: ReactNode }) {
  return (
    <ExperienceErrorBoundary>
      <ExperienceStyles />
      <div className="app-experience">{children}</div>
    </ExperienceErrorBoundary>
  );
}

export function AppPageTransition({
  viewKey,
  children,
}: {
  viewKey: string;
  children: ReactNode;
}) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={viewKey}
        initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
        // `filter: none` once the animation ends. A leftover `blur(0px)` (or any filter) turns this
        // wrapper into the containing block of every `position: fixed` element inside the view, so
        // pop-ups opened from a view (executive report, escalation, calendar day) were centred on
        // the whole long page and partly hidden under the sticky header instead of on the screen.
        animate={{ opacity: 1, y: 0, filter: "blur(0px)", transitionEnd: { filter: "none" } }}
        exit={{ opacity: 0, y: -6, filter: "blur(3px)" }}
        transition={{ duration: 0.32, ease }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

type View = "dashboard" | "focus" | "activations" | "reports" | "calendar" | "users" | "operations" | "sla" | "archive" | "workload" | "portal";
interface AppHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  alerts: TaskAlert[];
  notifications?: AppNotification[];
  onOpenAlerts: () => void;
  onOpenAddClient: () => void;
  onOpenAddActivation: () => void;
  /** Loads the demo data. Only passed for admins; the menu item is hidden otherwise. */
  onResetData?: () => void;
  onExportCSV: () => void;
  onImportCSV: () => void;
  selectedClientId: string | null;
  onBackToDashboard: () => void;
  activeView: View;
  onViewChange: (view: View) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  isReadingMode?: boolean;
  onToggleReadingMode?: () => void;
  onLogout?: () => void;
  userRole?: string;
  onEmergencyRecovery?: () => void;
  connectionStatus?: ConnectionStatus;
  onOpenEscalation?: () => void;
  onOpenExecutiveReport?: () => void;
  onSyncTasksMatrix?: () => void;
  /** Full backup download (admins only; hidden when not passed). */
  onDownloadBackup?: () => void;
}

/** The entire app header lives here so visual behaviour is owned by one file. */

export function AppHeader(props: AppHeaderProps) {
  const [localSearch, setLocalSearch] = React.useState(props.searchQuery);

  React.useEffect(() => {
    setLocalSearch(props.searchQuery);
  }, [props.searchQuery]);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      props.onSearchChange(localSearch);
    }, 300);
    return () => clearTimeout(handler);
  }, [localSearch, props.onSearchChange]);

  const [toolsOpen, setToolsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close the tools menu on any click outside it (or Escape). This used to be a full-screen
  // `fixed inset-0` button, but inside the header (which has backdrop-blur) "fixed" is relative to
  // the header, so it only covered the 72px header and clicking the page did not close the menu.
  const toolsRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!toolsOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (toolsRef.current && !toolsRef.current.contains(e.target as Node)) setToolsOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setToolsOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [toolsOpen]);
  
  const criticalCount = props.alerts.filter(
    (alert) => alert.severity === "critical",
  ).length;
  const unreadNotifsCount = props.notifications?.filter(n => !n.isRead).length || 0;
  const totalAlertsCount = props.alerts.length + unreadNotifsCount;
  
  const goTo = (view: View) => {
    props.onBackToDashboard();
    props.onViewChange(view);
    setMobileOpen(false);
  };

  const navigation = [
    { id: "dashboard" as const, label: "الرئيسية", icon: LayoutDashboard },
    { id: "operations" as const, label: "الأوبريشن", icon: Server },
    { id: "activations" as const, label: "التفعيلات", icon: Activity },
    { id: "focus" as const, label: "المتابعة", icon: ListTodo },
    { id: "archive" as const, label: "الأرشيف", icon: Archive },
    { id: "calendar" as const, label: "التقويم", icon: Calendar },
    { id: "reports" as const, label: "التقارير", icon: BarChart3 },
    ...((props.userRole === 'admin' || props.userRole === 'account_manager_head' || props.userRole === 'manager') ? [{ id: "sla" as const, label: "أداء الـ SLA", icon: Gauge }] : []),
    ...(props.userRole === 'admin' ? [{ id: "users" as const, label: "المستخدمين", icon: Users }] : []),
  ];
  return (
    <>
      <header
        dir="rtl"
        className="sticky top-0 z-40 border-b border-slate-200/70 bg-[#fbfaf8]/90 backdrop-blur-xl dark:border-[#27272a] dark:bg-[#09090b]/90"
      >
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <div className="flex h-[72px] items-center justify-between gap-3">
          <motion.button
            onClick={() => goTo("dashboard")}
            whileTap={{ scale: 0.97 }}
            className="flex shrink-0 items-center rounded-xl"
            aria-label="الانتقال للرئيسية"
          >
            <Logo size="md" />
          </motion.button>
          <nav className="hidden items-center rounded-2xl border border-slate-200/80 bg-white/70 p-1 dark:border-[#27272a] dark:bg-[#18181b]/90 lg:flex">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active =
                props.activeView === item.id && !props.selectedClientId;
              return (
                <motion.button
                  key={item.id}
                  onClick={() => goTo(item.id)}
                  whileTap={{ scale: 0.96 }}
                  // Below 1720px all the labels do not fit next to the logo and the tools (the left side of
                  // the header was pushed off screen), so only the current page shows its name there and
                  // the other tabs show their icon, with the name as a tooltip.
                  title={item.label}
                  aria-label={item.label}
                  aria-current={active ? "page" : undefined}
                  className={`relative flex items-center shrink-0 gap-2 rounded-xl px-2.5 py-2 text-[15px] font-bold whitespace-nowrap transition-colors min-[1720px]:gap-1.5 min-[1720px]:text-[14px] ${active ? "text-white" : "text-slate-500 hover:text-slate-900 dark:text-[#a1a1aa] dark:hover:text-[#fafafa]"}`}
                >
                  {active && (
                    <motion.span
                      layoutId="active-nav"
                      className="absolute inset-0 overflow-hidden rounded-xl bg-[#6366f1] shadow-[0_4px_16px_rgba(99,102,241,0.45)]"
                      transition={{
                        type: "spring",
                        bounce: 0.18,
                        duration: 0.5,
                      }}
                    >
                      <motion.span
                        aria-hidden
                        className="absolute inset-y-0 w-10 -skew-x-12 bg-gradient-to-r from-transparent via-white/70 to-transparent blur-[1px]"
                        initial={{ x: "-180%" }}
                        animate={{ x: "500%" }}
                        transition={{
                          duration: 1.9,
                          repeat: Infinity,
                          repeatDelay: 2.8,
                          ease: "easeInOut",
                        }}
                      />
                      <span
                        aria-hidden
                        className="absolute inset-px rounded-[10px] border border-white/35"
                      />
                    </motion.span>
                  )}
                  <Icon className="relative h-4 w-4 min-[1720px]:h-3.5 min-[1720px]:w-3.5" />
                  <span className={`relative whitespace-nowrap ${active ? "" : "hidden min-[1720px]:inline"}`}>{item.label}</span>
                </motion.button>
              );
            })}
          </nav>
          <div className="flex items-center justify-end gap-2">
            {/* Also on the archive: it is filtered by the same search, which used to be invisible there. */}
            {!props.selectedClientId && (props.activeView === "dashboard" || props.activeView === "archive") && (
              <div className="relative hidden w-48 xl:block">
                <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={localSearch || ''}
                  onChange={(event) => setLocalSearch(event.target.value)}
                  placeholder="ابحث عن عميل أو كود"
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white pr-9 pl-3 text-xs outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-[#27272a] dark:bg-[#18181b] dark:text-[#fafafa] dark:placeholder-[#71717a] dark:focus:ring-indigo-500/20"
                />
              </div>
            )}
            <div ref={toolsRef} className="relative hidden sm:block">
              <button
                onClick={() => setToolsOpen((value) => !value)}
                className={`grid h-9 w-9 place-items-center rounded-xl border text-slate-500 transition hover:border-indigo-300 hover:text-indigo-600 dark:border-[#27272a] dark:text-[#a1a1aa] dark:hover:border-indigo-500/50 ${toolsOpen ? "border-indigo-400 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300" : "border-slate-200 bg-[var(--surface)]"}`}
                title="الأدوات"
              >
                <SlidersHorizontal className="h-4 w-4" />
              </button>
              <AnimatePresence>
                {toolsOpen && (
                  <div className="contents" key="tools-menu">
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.96 }}
                      transition={{ duration: 0.2, ease }}
                      className="absolute left-0 z-20 mt-2 w-56 overflow-hidden rounded-2xl border border-[var(--border)] bg-white dark:bg-[#18181b] dark:border-[#27272a] p-1.5 shadow-2xl shadow-slate-950/20"
                    >
                      <ExperienceTool
                        icon={CheckSquare}
                        label="تفعيل يومي"
                        onClick={() => {
                          setToolsOpen(false);
                          props.onOpenAddActivation();
                        }}
                      />
                      <ExperienceTool
                        icon={BookOpen}
                        label={
                          props.isReadingMode
                            ? "إلغاء نمط القراءة"
                            : "نمط القراءة"
                        }
                        onClick={() => {
                          setToolsOpen(false);
                          props.onToggleReadingMode?.();
                        }}
                      />
                      {props.onOpenExecutiveReport && (
                        <ExperienceTool
                          icon={FileText}
                          label="ملخص الأداء التنفيذي (PDF)"
                          onClick={() => {
                            setToolsOpen(false);
                            props.onOpenExecutiveReport?.();
                          }}
                        />
                      )}
                      {props.onOpenEscalation && (
                        <ExperienceTool
                          icon={ShieldAlert}
                          label="مركز التصعيد الآلي"
                          onClick={() => {
                            setToolsOpen(false);
                            props.onOpenEscalation?.();
                          }}
                        />
                      )}
                      {props.onSyncTasksMatrix && (
                        <ExperienceTool
                          icon={Sparkles}
                          label="تحديث مصفوفة مهام العملاء الحاليين"
                          onClick={() => {
                            setToolsOpen(false);
                            props.onSyncTasksMatrix?.();
                          }}
                        />
                      )}
                      <div className="my-1 border-t border-[var(--border)] dark:border-[#27272a]" />
                      <ExperienceTool
                        icon={Printer}
                        label="طباعة التقرير"
                        onClick={() => {
                          setToolsOpen(false);
                          window.print();
                        }}
                      />
                      <ExperienceTool
                        icon={Download}
                        label="تصدير CSV"
                        onClick={() => {
                          setToolsOpen(false);
                          props.onExportCSV();
                        }}
                      />
                      <ExperienceTool
                        icon={Upload}
                        label="استيراد CSV"
                        onClick={() => {
                          setToolsOpen(false);
                          props.onImportCSV();
                        }}
                      />
                      {props.onDownloadBackup && (
                        <ExperienceTool
                          icon={DatabaseBackup}
                          label="تنزيل نسخة احتياطية كاملة"
                          onClick={() => {
                            setToolsOpen(false);
                            props.onDownloadBackup?.();
                          }}
                        />
                      )}
                      {props.onEmergencyRecovery && props.userRole === 'admin' && (
                        <ExperienceTool
                          icon={RotateCcw}
                          label="استرجاع المهام من السجل"
                          onClick={() => {
                            setToolsOpen(false);
                            props.onEmergencyRecovery?.();
                          }}
                        />
                      )}
                      {props.onResetData && (
                        <ExperienceTool
                          danger
                          icon={RotateCcw}
                          label="استعادة البيانات"
                          onClick={() => {
                            setToolsOpen(false);
                            props.onResetData?.();
                          }}
                        />
                      )}
                      {props.onLogout && (
                        <>
                          <div className="my-1 border-t border-[var(--border)] dark:border-[#27272a]" />
                          <ExperienceTool
                            danger
                            icon={LogOut}
                            label="تسجيل الخروج"
                            onClick={() => {
                              setToolsOpen(false);
                              props.onLogout?.();
                            }}
                          />
                        </>
                      )}
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </div>
            {/* Live Firestore Connection Status Indicator */}
            {props.connectionStatus && (
              <div
                className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all ${
                  props.connectionStatus === 'offline'
                    ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50'
                    : props.connectionStatus === 'syncing'
                    ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50'
                    : 'bg-emerald-50/80 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/50'
                }`}
                title={
                  props.connectionStatus === 'offline'
                    ? 'الاتصال بقاعدة البيانات غير متوفر حالياً، التطبيق يعمل بنمط التخزين المحلي'
                    : props.connectionStatus === 'syncing'
                    ? 'جاري مزامنة التغييرات مع خادم فايرستور السحابي...'
                    : 'قاعدة البيانات متصلة بالكامل وحفظ التغييرات سحابي في الوقت الفعلي'
                }
              >
                <span className="relative flex h-2 w-2">
                  {props.connectionStatus === 'online' && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  )}
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${
                      props.connectionStatus === 'offline'
                        ? 'bg-rose-500'
                        : props.connectionStatus === 'syncing'
                        ? 'bg-amber-500 animate-pulse'
                        : 'bg-emerald-500'
                    }`}
                  ></span>
                </span>
                <span>
                  {props.connectionStatus === 'offline'
                    ? 'غير متصل'
                    : props.connectionStatus === 'syncing'
                    ? 'مزامنة...'
                    : 'متصل'}
                </span>
              </div>
            )}
            {props.onLogout && (
              <button
                onClick={props.onLogout}
                className="hidden sm:grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-rose-300 hover:text-rose-600 hover:bg-rose-50/50 dark:border-[#27272a] dark:bg-[#18181b] dark:text-[#a1a1aa] dark:hover:border-rose-500/50 dark:hover:text-rose-400 dark:hover:bg-rose-950/20"
                title="تسجيل الخروج"
                aria-label="تسجيل الخروج"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={props.onToggleDarkMode}
              className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-indigo-300 hover:text-indigo-600 dark:border-[#27272a] dark:bg-[#18181b] dark:text-[#a1a1aa] dark:hover:text-indigo-400"
              aria-label="تبديل المظهر"
            >
              {props.isDarkMode ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={() => {
                props.onOpenAlerts();
                if ('Notification' in window && Notification.permission === 'default') {
                  Notification.requestPermission();
                }
              }}
              className="relative grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-indigo-300 hover:text-indigo-600 dark:border-[#27272a] dark:bg-[#18181b] dark:text-[#a1a1aa]"
              aria-label="التنبيهات"
            >
              <Bell className="h-4 w-4" />
              {totalAlertsCount > 0 && (
                <span
                  className={`absolute -left-1 -top-1 grid min-w-4 h-4 place-items-center rounded-full px-1 text-[9px] font-black text-white ${criticalCount ? "bg-rose-500" : (unreadNotifsCount ? "bg-indigo-500" : "bg-indigo-600")}`}
                >
                  {totalAlertsCount > 9 ? "+9" : totalAlertsCount}
                </span>
              )}
            </button>
            {!props.isReadingMode && (
              <motion.button
                onClick={props.onOpenAddClient}
                whileHover={{
                  y: -2,
                  boxShadow: "0 12px 22px -10px rgba(99,102,241,.6)",
                }}
                whileTap={{ scale: 0.97 }}
                className="hidden h-9 w-9 place-items-center rounded-xl bg-[#6366f1] hover:bg-[#4f46e5] text-white sm:grid shadow-md shadow-indigo-600/30"
                title="عميل جديد"
                aria-label="عميل جديد"
              >
                <Briefcase className="h-4 w-4" />
              </motion.button>
            )}
            <button
              onClick={() => setMobileOpen(true)}
              className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 dark:border-[#27272a] dark:bg-[#18181b] dark:text-slate-300 lg:hidden"
              aria-label="فتح القائمة"
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      </header>
      <AnimatePresence>
        {mobileOpen && (
          <div className="contents" key="mobile-menu">
            <motion.div
              className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed inset-y-0 right-0 z-50 w-[min(320px,88vw)] bg-white dark:bg-[#18181b] p-5 shadow-2xl border-l dark:border-[#27272a] lg:hidden"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-[#27272a]">
                <Logo size="sm" />
                <button
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg p-2 text-slate-500"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="relative my-5">
                <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={localSearch || ''}
                  onChange={(event) => setLocalSearch(event.target.value)}
                  placeholder="ابحث عن عميل"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pr-9 pl-3 text-sm outline-none dark:border-[#27272a] dark:bg-[#09090b] dark:text-[#fafafa] dark:placeholder-[#71717a]"
                />
              </div>
              <nav className="space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const active = props.activeView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => goTo(item.id)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-right whitespace-nowrap ${item.id === 'dashboard' || item.id === 'operations' ? 'text-[17px]' : 'text-[15px]'} font-bold ${active ? "bg-indigo-50 text-indigo-700 dark:bg-[#6366f1] dark:text-white" : "text-[var(--text-muted)] hover:text-[var(--text)]"}`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </button>
                  );
                })}
              </nav>
              {!props.isReadingMode && (
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    props.onOpenAddClient();
                  }}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#6366f1] hover:bg-[#4f46e5] py-3 text-sm font-extrabold text-white shadow-lg shadow-indigo-600/30"
                >
                  <Plus className="h-4 w-4" />
                  عميل جديد
                </button>
              )}
              {props.onLogout && (
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    props.onLogout?.();
                  }}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/70 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 dark:text-rose-400 py-3 text-sm font-bold transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>تسجيل الخروج</span>
                </button>
              )}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

function ExperienceTool({
  icon: Icon,
  label,
  onClick,
  danger = false,
}: {
  icon: ElementType;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-right text-xs font-bold transition ${danger ? "text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30" : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"}`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
