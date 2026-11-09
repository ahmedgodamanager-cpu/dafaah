import React, { useState, useMemo } from 'react';
import { Client, TaskCategory, TaskItem } from '../types';
import { CATEGORIES_INFO } from '../data/initialClients';
import { getDaysDifference, formatDateArabic } from '../utils/dateUtils';
import { DepartmentTasksModal } from './DepartmentTasksModal';
import { ExecutiveReportModal } from './ExecutiveReportModal';
import {
  Gauge,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Award,
  Users,
  Search,
  Smartphone,
  ChevronLeft,
  Filter,
  BarChart3,
  AlertCircle,
  Calendar,
  Layers,
  Zap,
  Building2,
  ArrowUpRight,
  HelpCircle,
  RefreshCw,
  ChevronRight,
  UserCheck,
  FileText
} from 'lucide-react';

interface SlaDashboardViewProps {
  clients: Client[];
  onSelectClient: (clientId: string) => void;
}

export function SlaDashboardView({ clients, onSelectClient }: SlaDashboardViewProps) {
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [selectedClientId, setSelectedClientId] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [slaFilter, setSlaFilter] = useState<'all' | 'delayed' | 'on_time' | 'overdue'>('all');
  const [isExecutiveReportOpen, setIsExecutiveReportOpen] = useState<boolean>(false);

  const [deptModalState, setDeptModalState] = useState<{isOpen: boolean, type: 'completed' | 'delayed' | 'upcoming', categoryId: string}>({
    isOpen: false,
    type: 'completed',
    categoryId: ''
  });

  // Available Companies
  const companyOptions = useMemo(() => {
    const list = Array.from(new Set(clients.map(c => c.companyName || 'بدون شركة'))).filter(Boolean);
    return list;
  }, [clients]);

  // Compute all tasks across selected clients & company filter
  const allClientTasks = useMemo(() => {
    let filteredClients = clients;
    if (selectedCompany !== 'all') {
      filteredClients = clients.filter(c => (c.companyName || 'بدون شركة') === selectedCompany);
    }

    const items: Array<{
      client: Client;
      task: TaskItem;
      daysDiff: number;
      isOverdue: boolean;
      isOnTimeCompleted: boolean;
      isLateCompleted: boolean;
    }> = [];

    filteredClients.forEach(client => {
      (client.tasks || []).forEach(task => {
        const daysDiff = getDaysDifference(task.dueDate);
        const isOverdue = !task.completed && daysDiff < 0;
        
        let isOnTimeCompleted = false;
        let isLateCompleted = false;
        
        if (task.completed) {
          if (task.completedAt) {
            const completedDiff = getDaysDifference(task.dueDate, new Date(task.completedAt));
            if (completedDiff >= 0) {
              isOnTimeCompleted = true;
            } else {
              isLateCompleted = true;
            }
          } else {
            // Default completed task to on-time if no specific completion date logged
            isOnTimeCompleted = true;
          }
        }

        items.push({
          client,
          task,
          daysDiff,
          isOverdue,
          isOnTimeCompleted,
          isLateCompleted
        });
      });
    });

    return items;
  }, [clients, selectedCompany]);

  // Department SLA breakdown calculation
  const departmentStats = useMemo(() => {
    const stats: Record<TaskCategory, {
      total: number;
      completedOnTime: number;
      completedLate: number;
      currentlyOverdue: number;
      inProgressOnTrack: number;
      avgDelayDays: number;
      totalDelayDays: number;
      delayedTasksCount: number;
    }> = {
      account_management: { total: 0, completedOnTime: 0, completedLate: 0, currentlyOverdue: 0, inProgressOnTrack: 0, avgDelayDays: 0, totalDelayDays: 0, delayedTasksCount: 0 },
      seo: { total: 0, completedOnTime: 0, completedLate: 0, currentlyOverdue: 0, inProgressOnTrack: 0, avgDelayDays: 0, totalDelayDays: 0, delayedTasksCount: 0 },
      media_buying: { total: 0, completedOnTime: 0, completedLate: 0, currentlyOverdue: 0, inProgressOnTrack: 0, avgDelayDays: 0, totalDelayDays: 0, delayedTasksCount: 0 },
      social_media: { total: 0, completedOnTime: 0, completedLate: 0, currentlyOverdue: 0, inProgressOnTrack: 0, avgDelayDays: 0, totalDelayDays: 0, delayedTasksCount: 0 }
    };

    allClientTasks.forEach(item => {
      const cat = item.task.category;
      if (!stats[cat]) return;

      stats[cat].total++;

      if (item.task.completed) {
        if (item.isLateCompleted) {
          stats[cat].completedLate++;
        } else {
          stats[cat].completedOnTime++;
        }
      } else if (item.isOverdue) {
        stats[cat].currentlyOverdue++;
        const overdueDays = Math.abs(item.daysDiff);
        stats[cat].totalDelayDays += overdueDays;
        stats[cat].delayedTasksCount++;
      } else {
        stats[cat].inProgressOnTrack++;
      }
    });

    // Calculate averages
    Object.keys(stats).forEach(key => {
      const cat = key as TaskCategory;
      const s = stats[cat];
      s.avgDelayDays = s.delayedTasksCount > 0 ? Math.round((s.totalDelayDays / s.delayedTasksCount) * 10) / 10 : 0;
    });

    return stats;
  }, [allClientTasks]);

  // Global SLA Overview Metrics
  const globalSlaMetrics = useMemo(() => {
    const totalTasks = allClientTasks.length;
    if (totalTasks === 0) {
      return {
        overallSlaRate: 100,
        totalCompleted: 0,
        completionRate: 0,
        totalOverdue: 0,
        topDepartment: 'قسم الأكونت مانجمنت',
        topDepartmentShort: 'الأكونت مانجمنت',
        topDeptSla: 100,
        avgOverdueDays: 0,
        totalDelayedEver: 0
      };
    }

    let completedOnTime = 0;
    let currentlyOverdue = 0;
    let totalDelayDays = 0;

    allClientTasks.forEach(item => {
      if (item.isOnTimeCompleted) completedOnTime++;
      if (item.isOverdue) {
        currentlyOverdue++;
        totalDelayDays += Math.abs(item.daysDiff);
      }
    });

    // SLA rate = (completed on time + in progress on track) / total evaluated
    const onTrackCount = allClientTasks.filter(t => !t.isOverdue).length;
    const overallSlaRate = Math.round((onTrackCount / totalTasks) * 100);

    // Find top department
    let bestDept: TaskCategory = 'account_management';
    let maxDeptSla = -1;

    (Object.keys(departmentStats) as TaskCategory[]).forEach(cat => {
      const s = departmentStats[cat];
      if (s.total > 0) {
        const deptSla = Math.round(((s.completedOnTime + s.inProgressOnTrack) / s.total) * 100);
        if (deptSla > maxDeptSla) {
          maxDeptSla = deptSla;
          bestDept = cat;
        }
      }
    });

    const deptInfo = CATEGORIES_INFO.find(c => c.id === bestDept);
    const shortNames: Record<TaskCategory, string> = {
      social_media: 'السوشيال ميديا',
      account_management: 'الأكونت مانجمنت',
      seo: 'السيو (SEO)',
      media_buying: 'الميديا باينج'
    };
    const topDepartmentShort = shortNames[bestDept] || (deptInfo ? deptInfo.nameAr : 'الأكونت مانجمنت');
    const totalCompleted = allClientTasks.filter(t => t.task.completed).length;
    const completionRate = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;

    return {
      overallSlaRate,
      totalCompleted,
      completionRate,
      totalOverdue: currentlyOverdue,
      topDepartment: deptInfo ? deptInfo.nameAr : 'قسم الأكونت مانجمنت',
      topDepartmentShort,
      topDeptSla: maxDeptSla >= 0 ? maxDeptSla : 100,
      avgOverdueDays: currentlyOverdue > 0 ? Math.round((totalDelayDays / currentlyOverdue) * 10) / 10 : 0,
    };
  }, [allClientTasks, departmentStats]);

  // Consolidated & sorted department scores (Highest to lowest compliance)
  const sortedDepartments = useMemo(() => {
    return CATEGORIES_INFO.map(cat => {
      const stats = departmentStats[cat.id];
      const deptSla = stats.total > 0 ? Math.round(((stats.completedOnTime + stats.inProgressOnTrack) / stats.total) * 100) : 100;
      return {
        cat,
        stats,
        deptSla
      };
    }).sort((a, b) => b.deptSla - a.deptSla);
  }, [departmentStats]);

  // Frequently Delayed Tasks Analysis
  const recurringDelaysAnalysis = useMemo(() => {
    const taskTitleMap: Record<string, {
      title: string;
      category: TaskCategory;
      totalCount: number;
      delayedCount: number;
      totalOverdueDays: number;
    }> = {};

    allClientTasks.forEach(item => {
      const cleanTitle = (item.task.title || '').replace(/\s*\(الشهر \d+\)/g, '').trim() || 'مهمة بدون اسم';
      if (!taskTitleMap[cleanTitle]) {
        taskTitleMap[cleanTitle] = {
          title: cleanTitle,
          category: item.task.category,
          totalCount: 0,
          delayedCount: 0,
          totalOverdueDays: 0,
        };
      }

      taskTitleMap[cleanTitle].totalCount++;
      if (item.isOverdue || item.isLateCompleted) {
        taskTitleMap[cleanTitle].delayedCount++;
        if (item.isOverdue) {
          taskTitleMap[cleanTitle].totalOverdueDays += Math.abs(item.daysDiff);
        }
      }
    });

    return Object.values(taskTitleMap)
      .filter(t => t.delayedCount > 0)
      .sort((a, b) => b.delayedCount - a.delayedCount)
      .slice(0, 6);
  }, [allClientTasks]);

  // Client SLA Health Ranking (Clients with highest delay count)
  const clientSlaRanking = useMemo(() => {
    const list = clients.map(client => {
      const tasks = client.tasks || [];
      const total = tasks.length;
      let overdue = 0;
      let completed = 0;

      tasks.forEach(t => {
        if (t.completed) completed++;
        else if (getDaysDifference(t.dueDate) < 0) overdue++;
      });

      const slaPercent = total > 0 ? Math.round(((total - overdue) / total) * 100) : 100;
      return {
        client,
        total,
        completed,
        overdue,
        slaPercent
      };
    });

    return list.sort((a, b) => a.slaPercent - b.slaPercent);
  }, [clients]);

  // Clients with calculated stats for the client selector
  const clientOptionsList = useMemo(() => {
    let list = clients;
    if (selectedCompany !== 'all') {
      list = list.filter(c => (c.companyName || 'بدون شركة') === selectedCompany);
    }
    return list.map(client => {
      const tasks = client.tasks || [];
      const overdueCount = tasks.filter(t => !t.completed && getDaysDifference(t.dueDate) < 0).length;
      const completedCount = tasks.filter(t => t.completed).length;
      const totalCount = tasks.length;
      const slaRate = totalCount > 0 ? Math.round(((totalCount - overdueCount) / totalCount) * 100) : 100;
      return {
        client,
        totalCount,
        overdueCount,
        completedCount,
        slaRate
      };
    }).sort((a, b) => {
      if (a.overdueCount !== b.overdueCount) return b.overdueCount - a.overdueCount;
      return a.slaRate - b.slaRate;
    });
  }, [clients, selectedCompany]);

  const selectedClientData = useMemo(() => {
    if (selectedClientId === 'all') return null;
    return clientOptionsList.find(c => c.client.id === selectedClientId) || null;
  }, [clientOptionsList, selectedClientId]);

  // Filtered and logically sorted task items
  const filteredTasksList = useMemo(() => {
    const filtered = allClientTasks.filter(item => {
      // Filter by selected client
      if (selectedClientId !== 'all' && item.client.id !== selectedClientId) {
        return false;
      }

      // Filter by department
      if (selectedCategory !== 'all' && item.task.category !== selectedCategory) {
        return false;
      }

      // Filter by SLA status
      if (slaFilter === 'delayed' && !item.isOverdue && !item.isLateCompleted) {
        return false;
      }
      if (slaFilter === 'overdue' && !item.isOverdue) {
        return false;
      }
      if (slaFilter === 'on_time' && item.isOverdue) {
        return false;
      }

      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          (item.task.title || '').toLowerCase().includes(q) ||
          (item.client.clientName || '').toLowerCase().includes(q) ||
          (item.client.code || '').toLowerCase().includes(q) ||
          (item.task.taskNumber || '').toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });

    // Logical priority sorting:
    // 1. Overdue tasks (most days overdue on top)
    // 2. Due today
    // 3. In-progress tasks (nearest due date first)
    // 4. Completed tasks (newest first)
    return filtered.sort((a, b) => {
      const getUrgency = (item: typeof a) => {
        if (!item.task.completed && item.isOverdue) return 1;
        if (!item.task.completed && item.daysDiff === 0) return 2;
        if (!item.task.completed) return 3;
        if (item.isLateCompleted) return 4;
        return 5;
      };

      const uA = getUrgency(a);
      const uB = getUrgency(b);

      if (uA !== uB) return uA - uB;

      if (uA === 1) return a.daysDiff - b.daysDiff; // More negative first (e.g. -10 before -2)
      if (uA === 2 || uA === 3) return a.daysDiff - b.daysDiff; // Closer deadline first

      return new Date(b.task.dueDate).getTime() - new Date(a.task.dueDate).getTime();
    });
  }, [allClientTasks, selectedClientId, selectedCategory, slaFilter, searchQuery]);

  const PAGE_SIZE = 8;
  const totalPages = Math.max(1, Math.ceil(filteredTasksList.length / PAGE_SIZE));
  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredTasksList.slice(start, start + PAGE_SIZE);
  }, [filteredTasksList, currentPage, PAGE_SIZE]);

  const getCategoryBadge = (cat: TaskCategory) => {
    switch (cat) {
      case 'account_management':
        return { label: 'الأكونت مانجمنت', bg: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-300' };
      case 'seo':
        return { label: 'السيو (SEO)', bg: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300' };
      case 'media_buying':
        return { label: 'الميديا باينج', bg: 'bg-purple-50 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300' };
      case 'social_media':
        return { label: 'السوشيال ميديا', bg: 'bg-indigo-50 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-300' };
      default:
        return { label: cat, bg: 'bg-slate-100 text-slate-800 border-slate-300' };
    }
  };

  const getCategoryIcon = (cat: TaskCategory) => {
    switch (cat) {
      case 'account_management': return <Users className="w-4 h-4 text-slate-600 dark:text-slate-400" />;
      case 'seo': return <Search className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'media_buying': return <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case 'social_media': return <Smartphone className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
    }
  };

  return (
    <div dir="rtl" className="space-y-6 animate-fadeIn">
      {/* Header and Controls Section */}
      <div className="bg-[#18181B] border border-[#27272A] p-5 sm:p-6 rounded-2xl shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
              <Gauge className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#FAFAFA] tracking-tight">
              مؤشرات أداء الـ SLA لفريق
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#A1A1AA] mt-1 pr-10">
            متابعة نسبة التزام الأقسام بالمواعيد وسرعة إنجاز المهام
          </p>
        </div>

        {/* Compact Unified Filter & Search Bar */}
        <div className="w-full md:w-auto flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsExecutiveReportOpen(true)}
            className="h-9 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95"
            title="توليد تقرير أسبوعي/شهري تنفيذي قابل للطباعة والحفظ"
          >
            <FileText className="w-4 h-4" />
            <span>ملخص الأداء التنفيذي (PDF)</span>
          </button>

          <div className="flex items-center gap-2 bg-[#09090B] border border-[#27272A] p-1.5 rounded-xl">
            <span className="text-xs text-[#A1A1AA] font-semibold px-2 whitespace-nowrap">
              الشركة:
            </span>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="bg-[#18181B] text-[#FAFAFA] text-xs font-semibold py-1.5 px-3 rounded-lg border border-[#27272A] outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">جميع الشركات</option>
              {companyOptions.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 4 Decluttered Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Completed Tasks */}
        <div className="bg-[#18181B] p-5 rounded-2xl border border-[#27272A] shadow-xs flex items-center justify-between h-full">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-[#A1A1AA] block">المهام المكتملة</span>
            <div className="text-2xl sm:text-3xl font-black text-[#FAFAFA] tracking-tight">
              {globalSlaMetrics.totalCompleted} <span className="text-base sm:text-lg font-bold text-emerald-400 font-mono">({globalSlaMetrics.completionRate}%)</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Highest Dept */}
        <div className="bg-[#18181B] p-5 rounded-2xl border border-[#27272A] shadow-xs flex items-center justify-between gap-3 h-full">
          <div className="space-y-1.5 min-w-0 flex-1">
            <span className="text-xs font-semibold text-[#A1A1AA] block">القسم الأعلى التزاماً</span>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base sm:text-lg font-black text-[#FAFAFA] tracking-tight leading-snug">
                {globalSlaMetrics.topDepartmentShort}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-black font-mono bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 shrink-0">
                %{globalSlaMetrics.topDeptSla}
              </span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Delayed Tasks */}
        <div className="bg-[#18181B] p-5 rounded-2xl border border-[#27272A] shadow-xs flex items-center justify-between h-full">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-[#A1A1AA] block">المهام المتأخرة</span>
            <div className="text-2xl sm:text-3xl font-black text-rose-400 tracking-tight">
              {globalSlaMetrics.totalOverdue} <span className="text-xs sm:text-sm font-semibold text-[#A1A1AA]">(متوسط {globalSlaMetrics.avgOverdueDays} أيام)</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: SLA Rate */}
        <div className="bg-[#18181B] p-5 rounded-2xl border border-[#27272A] shadow-xs flex items-center justify-between h-full">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-[#A1A1AA] block">نسبة الـ SLA</span>
            <div className="text-2xl sm:text-3xl font-black text-[#FAFAFA] tracking-tight">
              %{globalSlaMetrics.overallSlaRate} <span className="text-xs sm:text-sm font-semibold text-[#A1A1AA]">(الهدف 90%)</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Consolidated Department SLA Scores Card */}
      <div className="bg-[#18181B] rounded-2xl border border-[#27272A] p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#27272A]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-[#FAFAFA]">
              مؤشرات أداء الأقسام (Department SLA Scores)
            </h2>
          </div>
          <span className="text-xs text-[#A1A1AA]">
            ترتيب الأقسام تنازلياً حسب نسبة الالتزام
          </span>
        </div>

        <div className="divide-y divide-[#27272A]">
          {sortedDepartments.map(({ cat, stats, deptSla }, index) => {
            const rank = index + 1;
            const scoreColor = deptSla >= 90
              ? 'text-emerald-400'
              : deptSla >= 75
                ? 'text-amber-400'
                : 'text-rose-400';
            const progressColor = deptSla >= 90
              ? 'bg-emerald-500'
              : deptSla >= 75
                ? 'bg-amber-500'
                : 'bg-rose-500';

            return (
              <div
                key={cat.id}
                className="py-3.5 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                {/* 1. Department Name & Rank */}
                <div className="flex items-center gap-3 min-w-[240px]">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-[#27272A] text-[#A1A1AA]">
                      {getCategoryIcon(cat.id)}
                    </div>
                    <span className="font-bold text-sm text-[#FAFAFA]">
                      {rank}. {cat.nameAr}: <span className={`font-mono ${scoreColor}`}>%{deptSla}</span>
                    </span>
                  </div>
                </div>

                {/* Progress Bar & Score Display */}
                <div className="flex-1 flex items-center gap-4 max-w-md">
                  <div className="flex-1 h-2 bg-[#27272A] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                      style={{ width: `${Math.min(100, deptSla)}%` }}
                    />
                  </div>
                  <span className={`text-base font-black font-mono shrink-0 w-12 text-left ${scoreColor}`}>
                    %{deptSla}
                  </span>
                </div>

                {/* Action Buttons for Tasks Details Modal */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => setDeptModalState({ isOpen: true, type: 'completed', categoryId: cat.id })}
                    className="px-2.5 py-1 text-xs font-semibold bg-[#27272A] hover:bg-[#3F3F46] text-[#A1A1AA] hover:text-[#FAFAFA] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                    title="المهام المكتملة"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>مكتملة ({stats.completedOnTime})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeptModalState({ isOpen: true, type: 'delayed', categoryId: cat.id })}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${stats.currentlyOverdue > 0 ? 'bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 border border-rose-500/30' : 'bg-[#27272A] text-[#A1A1AA] hover:bg-[#3F3F46]'}`}
                    title="المهام المتأخرة"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    <span>متأخرة ({stats.currentlyOverdue})</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: Delays Tracking & Recurring Delay Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Frequently Delayed Tasks */}
        <div className="bg-[#18181B] p-6 rounded-2xl border border-[#27272A] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-rose-500/15 text-rose-400 flex items-center justify-center">
                <AlertCircle className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-base text-[#FAFAFA]">المهام الأكثر تكراراً في التأخير</h3>
            </div>
            <span className="text-xs text-[#A1A1AA]">تحليل الاختناقات المتكررة</span>
          </div>

          {recurringDelaysAnalysis.length === 0 ? (
            <div className="text-center py-8 text-xs text-[#A1A1AA] bg-[#09090B] rounded-xl border border-[#27272A]">
              ممتاز! لا يوجد تكرار ملحوظ في تأخير المهام حالياً.
            </div>
          ) : (
            <div className="space-y-3">
              {recurringDelaysAnalysis.map((item, idx) => {
                const badge = getCategoryBadge(item.category);
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#09090B] border border-[#27272A] text-xs"
                  >
                    <div className="space-y-1 max-w-[65%]">
                      <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-md border ${badge.bg}`}>
                        {badge.label}
                      </span>
                      <p className="font-bold text-[#FAFAFA] text-xs truncate" title={item.title}>
                        {item.title}
                      </p>
                    </div>

                    <div className="text-left space-y-1">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 font-bold text-[11px] border border-rose-500/30">
                        تأخرت {item.delayedCount} مرة
                      </span>
                      {item.totalOverdueDays > 0 && (
                        <p className="text-[10px] text-[#A1A1AA]">
                          مجموع أيام التأخير: {item.totalOverdueDays} يوم
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Client SLA Ranking & Response Health */}
        <div className="bg-[#18181B] p-6 rounded-2xl border border-[#27272A] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-base text-[#FAFAFA]">مستوى الالتزام حسب العميل</h3>
            </div>
            <span className="text-xs text-[#A1A1AA]">العملاء الأعلى تأخراً</span>
          </div>

          <div className="space-y-3 max-h-[310px] overflow-y-auto pr-1">
            {clientSlaRanking.slice(0, 6).map(({ client, overdue, slaPercent }) => (
              <div
                key={client.id}
                onClick={() => {
                  setSelectedClientId(client.id);
                  setCurrentPage(1);
                  const el = document.getElementById('client-tasks-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="flex items-center justify-between p-3 rounded-xl bg-[#09090B] border border-[#27272A] hover:border-indigo-500/50 cursor-pointer transition-all text-xs group"
                title="اضغط لعرض مهام هذا العميل بالأسفل"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${slaPercent >= 90 ? 'bg-emerald-500/15 text-emerald-400' : slaPercent >= 75 ? 'bg-amber-500/15 text-amber-400' : 'bg-rose-500/15 text-rose-400'}`}>
                    %{slaPercent}
                  </div>
                  <div>
                    <h4 className="font-bold text-[#FAFAFA] text-xs group-hover:text-indigo-300 transition-colors">{client.clientName}</h4>
                    <span className="text-[10px] text-[#A1A1AA]">{client.companyName || 'بدون شركة'} • {client.code}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {overdue > 0 ? (
                    <span className="px-2 py-1 rounded-lg bg-rose-500/15 text-rose-400 font-bold text-[11px] border border-rose-500/30">
                      {overdue} تاسك متأخر
                    </span>
                  ) : (
                    <span className="px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 font-bold text-[11px] border border-emerald-500/30">
                      منتظم بالكامل
                    </span>
                  )}
                  <ChevronLeft className="w-4 h-4 text-[#71717A] group-hover:text-indigo-400 group-hover:-translate-x-0.5 transition-all" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section 3: Interactive SLA Tasks Detailed Log by Client Selection */}
      <div id="client-tasks-section" className="bg-[#18181B] p-5 sm:p-6 rounded-2xl border border-[#27272A] shadow-xs space-y-5">
        {/* Header and Client Selector Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#27272A]">
          <div>
            <h3 className="font-bold text-base sm:text-lg text-[#FAFAFA] flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              <span>تتبع المهام والـ SLA حسب العميل</span>
            </h3>
            <p className="text-xs text-[#A1A1AA] mt-1">
              اختر العميل لعرض مهامه ومستوى التزامه بالمواعيد بدقة وترتيب واضح
            </p>
          </div>

          {/* Primary Client Selector */}
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
                <option value="all">جميع العملاء ({clients.length} عميل)</option>
                {clientOptionsList.map(({ client, overdueCount, slaRate }) => (
                  <option key={client.id} value={client.id}>
                    {client.clientName} ({client.companyName || 'بدون شركة'}) • %{slaRate} {overdueCount > 0 ? `[⚠️ ${overdueCount} متأخر]` : ''}
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
          <div className="bg-[#09090B] border border-indigo-500/20 rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
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
                <span className="text-[11px] text-[#A1A1AA]">نسبة الـ SLA:</span>
                <span className={`text-xs font-black font-mono ${selectedClientData.slaRate >= 90 ? 'text-emerald-400' : selectedClientData.slaRate >= 75 ? 'text-amber-400' : 'text-rose-400'}`}>
                  %{selectedClientData.slaRate}
                </span>
              </div>

              <div className="px-3 py-1 rounded-lg bg-[#18181B] border border-[#27272A] flex items-center gap-1.5">
                <span className="text-[11px] text-[#A1A1AA]">المهام:</span>
                <span className="text-xs font-bold text-[#FAFAFA]">{selectedClientData.totalCount}</span>
                {selectedClientData.overdueCount > 0 && (
                  <span className="text-[10px] font-bold text-rose-400 bg-rose-500/15 px-1.5 py-0.5 rounded-sm mr-1">
                    {selectedClientData.overdueCount} متأخرة
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => onSelectClient(selectedClientData.client.id)}
                className="px-3 py-1 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>فتح ملف العميل الكامل</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Secondary Filters Bar (Search, Department, Status) */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 text-[#71717A]" />
              <input
                type="text"
                value={searchQuery || ""}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="بحث في المهمة أو الكود..."
                className="pr-8 pl-3 py-1.5 text-xs bg-[#09090B] border border-[#27272A] rounded-xl text-[#FAFAFA] placeholder-[#71717A] outline-none focus:ring-1 focus:ring-indigo-500 w-full sm:w-48"
              />
            </div>

            {/* Department Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="py-1.5 px-3 text-xs bg-[#09090B] border border-[#27272A] rounded-xl text-[#FAFAFA] font-semibold outline-none cursor-pointer focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">جميع الأقسام</option>
              {CATEGORIES_INFO.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nameAr}</option>
              ))}
            </select>

            {/* SLA Status Filter */}
            <select
              value={slaFilter}
              onChange={(e) => {
                setSlaFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="py-1.5 px-3 text-xs bg-[#09090B] border border-[#27272A] rounded-xl text-[#FAFAFA] font-semibold outline-none cursor-pointer focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">جميع الحالات</option>
              <option value="overdue">المتأخرة حالياً ⚠️</option>
              <option value="delayed">جميع التأخيرات</option>
              <option value="on_time">المنتظمة في الموعد ✅</option>
            </select>
          </div>

          <div className="text-xs text-[#A1A1AA]">
            إجمالي النتائج: <strong className="text-[#FAFAFA] font-mono">{filteredTasksList.length}</strong> مهمة
          </div>
        </div>

        {/* Task Log Table with Scroll Limit */}
        {filteredTasksList.length === 0 ? (
          <div className="text-center py-10 text-xs text-[#A1A1AA] bg-[#09090B] rounded-xl border border-[#27272A]">
            لا توجد مهام تطابق هذا الاختيار أو الفلاتر المحددة.
          </div>
        ) : (
          <div className="space-y-3">
            <div className="overflow-x-auto max-h-[460px] overflow-y-auto border border-[#27272A] rounded-xl">
              <table className="w-full text-right text-xs">
                <thead className="sticky top-0 bg-[#09090B] z-10 shadow-xs">
                  <tr className="text-[#A1A1AA] font-bold border-b border-[#27272A]">
                    <th className="py-2.5 px-4">الكود / المهمة</th>
                    <th className="py-2.5 px-4">العميل</th>
                    <th className="py-2.5 px-4">القسم</th>
                    <th className="py-2.5 px-4">تاريخ الاستحقاق (SLA)</th>
                    <th className="py-2.5 px-4">حالة الالتزام</th>
                    <th className="py-2.5 px-4 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272A] bg-[#18181B]">
                  {paginatedTasks.map(({ client, task, daysDiff, isOverdue, isLateCompleted }) => {
                    const badge = getCategoryBadge(task.category);

                    let slaStatusLabel = 'في الموعد';
                    let slaStatusBadge = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';

                    if (task.completed) {
                      if (isLateCompleted) {
                        slaStatusLabel = 'مكتملة (متأخرة)';
                        slaStatusBadge = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
                      } else {
                        slaStatusLabel = 'تمت في الموعد';
                        slaStatusBadge = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
                      }
                    } else if (isOverdue) {
                      const absDays = Math.abs(daysDiff);
                      slaStatusLabel = `متأخرة بـ ${absDays} يوم`;
                      slaStatusBadge = 'bg-rose-500/15 text-rose-400 border-rose-500/30 font-bold';
                    } else if (daysDiff === 0) {
                      slaStatusLabel = 'تنتهي اليوم!';
                      slaStatusBadge = 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold';
                    } else {
                      slaStatusLabel = `متبقي ${daysDiff} يوم`;
                      slaStatusBadge = 'bg-[#27272A] text-[#A1A1AA] border-[#3F3F46]';
                    }

                    return (
                      <tr key={`${client.id}-${task.id}`} className="hover:bg-[#27272A]/40 transition-colors">
                        <td className="py-2.5 px-4 font-bold text-[#FAFAFA]">
                          <div className="flex flex-col">
                            <span className="text-[#FAFAFA] text-xs line-clamp-1">{task.title}</span>
                            <span className="text-[10px] text-[#A1A1AA] font-mono">{task.taskNumber}</span>
                          </div>
                        </td>

                        <td className="py-2.5 px-4">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedClientId(client.id);
                              setCurrentPage(1);
                            }}
                            className="font-bold text-indigo-400 hover:underline text-xs text-right cursor-pointer"
                            title="تصفية مهام هذا العميل فقط"
                          >
                            {client.clientName}
                          </button>
                          <span className="block text-[10px] text-[#A1A1AA]">{client.companyName || 'بدون شركة'}</span>
                        </td>

                        <td className="py-2.5 px-4">
                          <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-md border ${badge.bg}`}>
                            {badge.label}
                          </span>
                        </td>

                        <td className="py-2.5 px-4 font-mono text-xs text-[#A1A1AA]">
                          {formatDateArabic(task.dueDate)}
                        </td>

                        <td className="py-2.5 px-4">
                          <span className={`inline-block px-2.5 py-0.5 text-[11px] font-bold rounded-md border ${slaStatusBadge}`}>
                            {slaStatusLabel}
                          </span>
                        </td>

                        <td className="py-2.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => onSelectClient(client.id)}
                            className="px-2.5 py-1 bg-indigo-600/15 hover:bg-indigo-600/25 text-indigo-400 border border-indigo-500/30 font-bold text-xs rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                          >
                            <span>الملف</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2 text-xs">
                <span className="text-[#A1A1AA]">
                  الصفحة <strong className="text-[#FAFAFA] font-mono">{currentPage}</strong> من <strong className="text-[#FAFAFA] font-mono">{totalPages}</strong>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className="px-3 py-1 rounded-lg bg-[#09090B] border border-[#27272A] text-[#FAFAFA] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#27272A] transition-colors cursor-pointer"
                  >
                    السابق
                  </button>
                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
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

      <DepartmentTasksModal 
        isOpen={deptModalState.isOpen}
        onClose={() => setDeptModalState(prev => ({ ...prev, isOpen: false }))}
        type={deptModalState.type}
        clients={clients}
        categoryId={deptModalState.categoryId}
        onSelectClient={onSelectClient}
      />

      <ExecutiveReportModal
        isOpen={isExecutiveReportOpen}
        onClose={() => setIsExecutiveReportOpen(false)}
        clients={clients}
      />
    </div>
  );
}
