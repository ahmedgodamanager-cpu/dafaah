import React, { useState, useMemo, useCallback } from 'react';
import { 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  TrendingUp,
  Filter,
  BarChart3,
  SlidersHorizontal
} from 'lucide-react';
import { Client, FilterState, DashboardConfig } from '../types';
import { calculateClientProgress, getDaysDifference, getRemainingContractDays } from '../utils/dateUtils';
import { COMPANY_OPTIONS } from '../data/initialClients';
import { SectionTasksModal } from './SectionTasksModal';
import { WorkloadDashboardView } from './WorkloadDashboardView';

interface StatsOverviewProps {
  clients: Client[];
  filterState: FilterState;
  onFilterChange: (newFilter: Partial<FilterState>) => void;
  config: DashboardConfig;
  onOpenCustomizer: () => void;
  onOpenUpcomingTasks?: () => void;
  onOpenDelayedTasks?: () => void;
  onSelectClient?: (clientId: string) => void;
}

export const StatsOverview: React.FC<StatsOverviewProps> = React.memo(({
  clients,
  filterState,
  onFilterChange,
  config,
  onOpenCustomizer,
  onOpenUpcomingTasks,
  onOpenDelayedTasks,
  onSelectClient
}) => {
  // Aggregate stats memoized to prevent redundant heavy recalculations
  const {
    totalClients,
    activeClients,
    holdClients,
    lostClients,
    totalTasks,
    totalCompletedTasks,
    totalDelayedTasks,
    totalDueSoonTasks,
    overallProgressPercent,
    delayedClientsCount,
    dueSoonClientsCount,
    completedClientsCount,
  } = useMemo(() => {
    let active = 0;
    let hold = 0;
    let lost = 0;
    let tasksTotal = 0;
    let tasksCompleted = 0;
    let tasksDelayed = 0;
    let tasksDueSoon = 0;
    let delayedClients = 0;
    let dueSoonClients = 0;
    let completedClients = 0;

    for (let i = 0; i < clients.length; i++) {
      const c = clients[i];
      if (c.caseStatus === 'نشط') active++;
      if (c.caseStatus === 'hold') hold++;
      if (c.isLost || (c.endDate && getRemainingContractDays(c) < 0)) lost++;

      const stats = calculateClientProgress(c);
      tasksTotal += stats.totalTasks;
      tasksCompleted += stats.completedTasks;
      tasksDelayed += stats.delayedTasks;
      tasksDueSoon += stats.dueSoonTasks;

      if (stats.delayedTasks > 0) delayedClients++;
      if (stats.dueSoonTasks > 0) dueSoonClients++;
      if (stats.progressPercent === 100 && c.tasks && c.tasks.length > 0) completedClients++;
    }

    const overallProgress = tasksTotal > 0 ? Math.round((tasksCompleted / tasksTotal) * 100) : 0;

    return {
      totalClients: clients.length,
      activeClients: active,
      holdClients: hold,
      lostClients: lost,
      totalTasks: tasksTotal,
      totalCompletedTasks: tasksCompleted,
      totalDelayedTasks: tasksDelayed,
      totalDueSoonTasks: tasksDueSoon,
      overallProgressPercent: overallProgress,
      delayedClientsCount: delayedClients,
      dueSoonClientsCount: dueSoonClients,
      completedClientsCount: completedClients,
    };
  }, [clients]);

  // Calculate clients in their first 30 days
  const first30DaysClients = useMemo(() => {
    return clients.filter(c => {
      const elapsedContractDaysSinceStart = c.startDate ? -getDaysDifference(c.startDate) : -1;
      return elapsedContractDaysSinceStart >= 0 && elapsedContractDaysSinceStart <= 30;
    });
  }, [clients]);

  // Contract list options
  const contractTypes = useMemo(() => {
    return Array.from(new Set(clients.map(c => c.contract).filter(Boolean)));
  }, [clients]);

  const statusTypes = useMemo(() => ['نشط', 'hold', 'مكتمل', 'جديد', 'قيد المراجعة', 'مؤجل'], []);

  const employeeOptions = useMemo(() => {
    const set = new Set<string>();
    clients.forEach(c => {
      if (c.assignedToName) set.add(c.assignedToName);
      if (c.accountManager) set.add(c.accountManager);
      (c.tasks || []).forEach(t => {
        if (t.assignedTo) set.add(t.assignedTo);
      });
    });
    return Array.from(set).filter(Boolean).sort();
  }, [clients]);

  // State for Section Tasks Modal
  const [sectionModalState, setSectionModalState] = useState<{isOpen: boolean, type: 'completed' | 'delayed' | 'upcoming'}>({
    isOpen: false,
    type: 'completed'
  });

  // State for Pie Chart
  const [selectedClientForChart, setSelectedClientForChart] = useState<string>(clients[0]?.id || '');
  
  const chartClient = useMemo(() => {
    return clients.find(c => c.id === selectedClientForChart) || (selectedClientForChart === '' ? null : clients[0]);
  }, [clients, selectedClientForChart]);

  const chartStats = useMemo(() => {
    return chartClient ? calculateClientProgress(chartClient) : null;
  }, [chartClient]);

  // Memoized handlers using useCallback
  const handleOpenCompletedModal = useCallback(() => {
    setSectionModalState({ isOpen: true, type: 'completed' });
  }, []);

  const handleOpenDelayedModal = useCallback(() => {
    setSectionModalState({ isOpen: true, type: 'delayed' });
  }, []);

  const handleOpenUpcomingModal = useCallback(() => {
    setSectionModalState({ isOpen: true, type: 'upcoming' });
  }, []);

  const handleCloseSectionModal = useCallback(() => {
    setSectionModalState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const handleFilterDelayAll = useCallback(() => {
    onFilterChange({ delayFilter: 'all' });
  }, [onFilterChange]);

  const handleFilterDelayDelayed = useCallback(() => {
    onFilterChange({ delayFilter: 'delayed_only' });
  }, [onFilterChange]);

  const handleFilterDelayUpcoming = useCallback(() => {
    onFilterChange({ delayFilter: 'upcoming_only' });
  }, [onFilterChange]);

  const handleFilterDelayCompleted = useCallback(() => {
    onFilterChange({ delayFilter: 'completed_only' });
  }, [onFilterChange]);

  const handleDelayedCardClick = useCallback(() => {
    if (onOpenDelayedTasks) {
      onOpenDelayedTasks();
    } else {
      onFilterChange({ delayFilter: filterState.delayFilter === 'delayed_only' ? 'all' : 'delayed_only' });
    }
  }, [onOpenDelayedTasks, onFilterChange, filterState.delayFilter]);

  const handleUpcomingCardClick = useCallback(() => {
    if (onOpenUpcomingTasks) {
      onOpenUpcomingTasks();
    } else {
      onFilterChange({ delayFilter: filterState.delayFilter === 'upcoming_only' ? 'all' : 'upcoming_only' });
    }
  }, [onOpenUpcomingTasks, onFilterChange, filterState.delayFilter]);

  const handleCompanyChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ company: e.target.value });
  }, [onFilterChange]);

  const handleContractChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ contract: e.target.value });
  }, [onFilterChange]);

  const handleStatusChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ status: e.target.value });
  }, [onFilterChange]);

  const handleEmployeeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ assignedEmployee: e.target.value });
  }, [onFilterChange]);

  const handleChartClientChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedClientForChart(e.target.value);
  }, []);

  return (
    <div className="space-y-4 mb-6">
      
      {/* Customize View Header Button */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[var(--text-muted)]">لوحة المتابعة الإحصائية</span>
        </div>
        <button
          onClick={onOpenCustomizer}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] text-xs font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs transition-colors"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>تخصيص لوحة التحكم</span>
        </button>
      </div>

      {/* 4 Stat Cards */}
      {config.showStatsCards && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 animate-in fade-in duration-200 print:grid-cols-4 print:gap-2 print:mb-4">
          
          {/* Total Clients */}
          <div className="bg-[var(--surface)] p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[var(--text-muted)]">إجمالي العملاء</p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">{totalClients}</h3>
              <div className="flex gap-1 mt-1.5">
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded">{activeClients} نشط</span>
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-400 bg-[var(--surface-hover)] px-1.5 py-0.5 rounded">{holdClients} هولد</span>
                <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 px-1.5 py-0.5 rounded">{lostClients} فقد</span>
              </div>
            </div>
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>

          {/* Delayed Tasks */}
          <div 
            onClick={handleDelayedCardClick}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              filterState.delayFilter === 'delayed_only' 
                ? 'bg-rose-50 dark:bg-rose-900/30 border-rose-300 dark:border-rose-600 ring-2 ring-rose-400/20' 
                : 'bg-[var(--surface)] border-slate-200/80 dark:border-slate-800 hover:border-rose-200 dark:hover:border-rose-700 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-[var(--text-muted)]">التاسكات المتأخرة</p>
                <h3 className={`text-xl font-bold mt-1 ${totalDelayedTasks > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-slate-100'}`}>
                  {totalDelayedTasks}
                </h3>
                <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium mt-0.5">
                  {totalDelayedTasks > 0 ? 'تتطلب متابعة فورية' : 'لا يوجد تأخيرات'}
                </p>
              </div>
              <div className="p-2.5 bg-rose-50 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Due Soon */}
          <div 
            onClick={handleUpcomingCardClick}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              filterState.delayFilter === 'upcoming_only' 
                ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-300 dark:border-amber-600 ring-2 ring-amber-400/20' 
                : 'bg-[var(--surface)] border-slate-200/80 dark:border-slate-800 hover:border-amber-200 dark:hover:border-amber-700 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-[var(--text-muted)]">مواعيد قريبة (3 أيام)</p>
                <h3 className="text-xl font-bold text-amber-700 dark:text-amber-400 mt-1">{totalDueSoonTasks}</h3>
                <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-0.5">
                  تستحق التسليم قريباً
                </p>
              </div>
              <div className="p-2.5 bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl">
                <Clock className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Progress Rate */}
          <div className="bg-[var(--surface)] p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[var(--text-muted)]">نسبة الإنجاز الكلية</p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">{overallProgressPercent}%</h3>
              <p className="text-[11px] text-[var(--text-muted)] font-medium mt-0.5">
                {totalCompletedTasks} من {totalTasks} تاسك
              </p>
            </div>
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

        </div>
      )}

      {/* First 30 Days Callout */}
      {first30DaysClients.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-800/10 p-4 sm:p-5 rounded-xl border border-amber-200/60 dark:border-amber-800/40 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in duration-200 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-xl shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900 dark:text-amber-300">مرحلة الشهر الأول (30 يوم)</h4>
              <p className="text-xs text-amber-700/80 dark:text-amber-400/80 mt-1">
                يوجد <strong className="font-extrabold mx-1">{first30DaysClients.length}</strong> عملاء حالياً ضمن أول 30 يوم ويحتاجون لمتابعة خاصة
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              onClick={handleOpenCompletedModal}
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-100/80 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200/80 dark:hover:bg-emerald-900/60 border border-emerald-200/60 dark:border-emerald-800/50 rounded-lg text-xs font-bold transition-colors shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              المهام المكتملة
            </button>
            <button
              onClick={handleOpenDelayedModal}
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-100/80 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 hover:bg-rose-200/80 dark:hover:bg-rose-900/60 border border-rose-200/60 dark:border-rose-800/50 rounded-lg text-xs font-bold transition-colors shadow-xs"
            >
              <AlertTriangle className="w-4 h-4" />
              المهام المتأخرة
            </button>
            <button
              onClick={handleOpenUpcomingModal}
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-100/80 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 hover:bg-amber-200/80 dark:hover:bg-amber-900/60 border border-amber-200/60 dark:border-amber-800/50 rounded-lg text-xs font-bold transition-colors shadow-xs"
            >
              <Clock className="w-4 h-4" />
              المهام القريبة
            </button>
          </div>
        </div>
      )}

      {/* Filter Controls Bar */}
      {config.showFilterBar && (
        <div className="bg-[var(--surface)] p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in duration-200 print:hidden">
          
          {/* Quick Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[var(--text-muted)] font-medium flex items-center gap-1 ml-1">
              <Filter className="w-3.5 h-3.5" />
              تصفية السريعة:
            </span>

            <button
              onClick={handleFilterDelayAll}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                filterState.delayFilter === 'all'
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                  : 'bg-[var(--surface-hover)] text-[var(--text)] hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              كل العملاء ({totalClients})
            </button>

            <button
              onClick={handleFilterDelayDelayed}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                filterState.delayFilter === 'delayed_only'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              يتأخرون ({delayedClientsCount})
            </button>

            <button
              onClick={handleFilterDelayUpcoming}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                filterState.delayFilter === 'upcoming_only'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              مواعيد قريبة ({dueSoonClientsCount})
            </button>

            <button
              onClick={handleFilterDelayCompleted}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                filterState.delayFilter === 'completed_only'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              مكتملين ({completedClientsCount})
            </button>
          </div>

          {/* Dropdowns for Company, Contract & Status */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Company Select */}
            <select
              value={filterState.company || ''}
              onChange={handleCompanyChange}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-[var(--border)] rounded-lg text-[var(--text)] font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">اسم الشركة (الكل)</option>
              {COMPANY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Contract Select */}
            <select
              value={filterState.contract || ''}
              onChange={handleContractChange}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-[var(--border)] rounded-lg text-[var(--text)] font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">نوع العقد (الكل)</option>
              {contractTypes.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* Status Select */}
            <select
              value={filterState.status || ''}
              onChange={handleStatusChange}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-[var(--border)] rounded-lg text-[var(--text)] font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">حالة العميل (الكل)</option>
              {statusTypes.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {/* Employee Select */}
            <select
              value={filterState.assignedEmployee || ''}
              onChange={handleEmployeeChange}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-[var(--border)] rounded-lg text-[var(--text)] font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">الموظف المسؤول (الكل)</option>
              {employeeOptions.map(emp => (
                <option key={emp} value={emp}>{emp}</option>
              ))}
            </select>
          </div>

        </div>
      )}

      {/* Client Task Status Linear Progress */}
      <div className="bg-[var(--surface)] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs animate-in fade-in duration-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[var(--text)] text-sm">حالة مهام العميل</h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">معدل الإنجاز وسير العمل</p>
            </div>
          </div>
          
          <select
            value={selectedClientForChart || ''}
            onChange={handleChartClientChange}
            className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-[var(--text)] font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 w-full md:w-auto min-w-[200px]"
          >
            <option value="">اختر العميل لعرض إحصائياته...</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.clientName}</option>
            ))}
          </select>
        </div>

        {chartClient ? (
          chartStats?.totalTasks ? (
            <div className="space-y-6">
              
              {/* Stacked Progress Bar */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold px-1">
                  <span className="text-[var(--text)]">{Math.round((chartStats.completedTasks / chartStats.totalTasks) * 100)}% مكتملة</span>
                  <span className="text-[var(--text-muted)]">{chartStats.totalTasks} مهمة إجمالية</span>
                </div>
                <div className="w-full h-3.5 flex rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <div 
                    style={{ width: `${(chartStats.completedTasks / chartStats.totalTasks) * 100}%` }} 
                    className="bg-emerald-500 hover:bg-emerald-400 transition-all duration-500" 
                    title={`مكتملة: ${chartStats.completedTasks}`}
                  ></div>
                  <div 
                    style={{ width: `${((chartStats.totalTasks - chartStats.completedTasks - chartStats.delayedTasks) / chartStats.totalTasks) * 100}%` }} 
                    className="bg-amber-400 hover:bg-amber-300 transition-all duration-500" 
                    title={`قيد التنفيذ: ${chartStats.totalTasks - chartStats.completedTasks - chartStats.delayedTasks}`}
                  ></div>
                  <div 
                    style={{ width: `${(chartStats.delayedTasks / chartStats.totalTasks) * 100}%` }} 
                    className="bg-rose-500 hover:bg-rose-400 transition-all duration-500" 
                    title={`متأخرة: ${chartStats.delayedTasks}`}
                  ></div>
                </div>
              </div>

              {/* 4 Stat Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
                  <span className="text-2xl font-black text-[var(--text)]">{chartStats.totalTasks}</span>
                  <span className="text-[10px] font-bold text-[var(--text-muted)] mt-1">إجمالي المهام</span>
                </div>
                <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-100/50 dark:border-emerald-900/30 flex flex-col items-center text-center">
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{chartStats.completedTasks}</span>
                  <span className="text-[10px] font-bold text-emerald-600/70 dark:text-emerald-400/70 mt-1">المهام المكتملة</span>
                </div>
                <div className="bg-amber-50/50 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-100/50 dark:border-amber-900/30 flex flex-col items-center text-center">
                  <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{chartStats.totalTasks - chartStats.completedTasks - chartStats.delayedTasks}</span>
                  <span className="text-[10px] font-bold text-amber-600/70 dark:text-amber-400/70 mt-1">قيد التنفيذ / قريبة</span>
                </div>
                <div className="bg-rose-50/50 dark:bg-rose-950/20 p-4 rounded-xl border border-rose-100/50 dark:border-rose-900/30 flex flex-col items-center text-center">
                  <span className="text-2xl font-black text-rose-600 dark:text-rose-400">{chartStats.delayedTasks}</span>
                  <span className="text-[10px] font-bold text-rose-600/70 dark:text-rose-400/70 mt-1">المهام المتأخرة</span>
                </div>
              </div>

            </div>
          ) : (
             <div className="text-center py-10 text-[var(--text-muted)] text-sm font-medium">
               لا يوجد مهام لهذا العميل حتى الآن.
             </div>
          )
        ) : (
          <div className="text-center py-12 text-[var(--text-muted)] text-sm font-medium bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
            يرجى اختيار عميل من القائمة لعرض سير العمل وإحصائياته.
          </div>
        )}
      </div>

      <SectionTasksModal 
        isOpen={sectionModalState.isOpen}
        onClose={handleCloseSectionModal}
        type={sectionModalState.type}
        clients={first30DaysClients}
        onSelectClient={onSelectClient}
      />
    
      <WorkloadDashboardView clients={clients} />
    </div>
  );
});

StatsOverview.displayName = 'StatsOverview';
export default StatsOverview;
