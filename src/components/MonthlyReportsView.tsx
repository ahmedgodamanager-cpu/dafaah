import React, { useState, useMemo, useRef } from 'react';
import { Client, DailyActivation } from '../types';
import { useAuth } from '../context/AuthContext';
import { COMPANY_OPTIONS } from '../data/initialClients';
import { getDaysDifference, getRemainingContractDays } from '../utils/dateUtils';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart,
  Area,
  ComposedChart,
  Line
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown,
  Users, 
  CheckCircle2, 
  Activity, 
  Calendar, 
  Building2, 
  FileText, 
  Award, 
  Printer, 
  ArrowUpRight, 
  Clock, 
  ChevronLeft,
  PieChart as PieChartIcon,
  Palette,
  Search,
  Megaphone,
  Share2,
  Sparkles,
  Zap
} from 'lucide-react';

interface MonthlyReportsViewProps {
  clients: Client[];
  onSelectClient: (clientId: string) => void;
}

const ARABIC_MONTHS = [
  'يناير (01)',
  'فبراير (02)',
  'مارس (03)',
  'أبريل (04)',
  'مايو (05)',
  'يونيو (06)',
  'يوليو (07)',
  'أغسطس (08)',
  'سبتمبر (09)',
  'أكتوبر (10)',
  'نوفمبر (11)',
  'ديسمبر (12)'
];

const MODERN_DARK_PALETTE = [
  '#6366F1', // Primary Indigo
  '#818CF8', // Light Indigo
  '#A78BFA', // Light Violet
  '#8B5CF6', // Purple 500
  '#C084FC', // Violet 400
  '#38BDF8', // Cool Sky
  '#71717A', // Muted Zinc / Gray (Hold)
  '#F43F5E'  // Soft Coral / Red (Delayed)
];

const COLORS = MODERN_DARK_PALETTE;

// Custom Recharts Dark Tooltip for Premium Modern Dark Theme
const CustomChartTooltip = ({ active, payload, label, unit = '' }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#18181B]/95 backdrop-blur-md border border-[#27272A] rounded-xl px-4 py-3 shadow-2xl text-right text-xs dir-rtl ring-1 ring-indigo-500/20 min-w-[140px]">
        {label !== undefined && (
          <p className="font-bold text-[#FAFAFA] mb-2 pb-1.5 border-b border-[#27272A] text-[11px] flex items-center justify-between">
            <span>{label}</span>
          </p>
        )}
        <div className="space-y-1.5">
          {payload.map((entry: any, index: number) => (
            <div key={`tooltip-${index}`} className="flex items-center justify-between gap-3 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span 
                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs" 
                  style={{ backgroundColor: entry.color || entry.fill || '#6366F1' }}
                />
                <span className="text-[#A1A1AA] font-medium">{entry.name}:</span>
              </div>
              <span className="font-bold text-[#818CF8] font-mono">
                {entry.value} {unit}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export const MonthlyReportsView: React.FC<MonthlyReportsViewProps> = ({
  clients,
  onSelectClient
}) => {
  const { profile } = useAuth();
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1); // 1-indexed (1..12)
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const handleExportPDF = () => {
    window.print();
  };

  // Filter keys helper YYYY-MM
  const selectedMonthStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
  
  // Previous month string YYYY-MM for growth calculation
  const prevMonthDate = new Date(selectedYear, selectedMonth - 2, 1);
  const prevMonthStr = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;

  // 1. Filter New Clients for Selected Month
  const newClientsInMonth = useMemo(() => {
    return clients.filter(c => {
      const start = c.startDate || c.createdAt;
      return start && start.startsWith(selectedMonthStr);
    });
  }, [clients, selectedMonthStr]);

  const newClientsPrevMonth = useMemo(() => {
    return clients.filter(c => {
      const start = c.startDate || c.createdAt;
      return start && start.startsWith(prevMonthStr);
    });
  }, [clients, prevMonthStr]);

  // 2. Filter Completed & Total Tasks for Selected Month
  const { completedTasksInMonth, totalTasksDueInMonth, allCompletedTasksList } = useMemo(() => {
    let completedCount = 0;
    let dueCount = 0;
    const completedList: { client: Client; taskTitle: string; category: string; date: string }[] = [];

    clients.forEach(client => {
      client.tasks.forEach(task => {
        const taskMonth = task.completedAt ? task.completedAt.substring(0, 7) : task.dueDate ? task.dueDate.substring(0, 7) : '';
        if (taskMonth === selectedMonthStr) {
          dueCount++;
          if (task.completed) {
            completedCount++;
            completedList.push({
              client,
              taskTitle: task.title,
              category: task.category,
              date: task.completedAt || task.dueDate
            });
          }
        }
      });
    });

    return {
      completedTasksInMonth: completedCount,
      totalTasksDueInMonth: dueCount,
      allCompletedTasksList: completedList
    };
  }, [clients, selectedMonthStr]);

  // 3. Filter Daily Activations in Selected Month & Previous Month
  const activationsInMonth = useMemo(() => {
    const list: { client: Client; act: DailyActivation }[] = [];
    clients.forEach(client => {
      client.dailyActivations?.forEach(act => {
        if (act.date && act.date.startsWith(selectedMonthStr)) {
          list.push({ client, act });
        }
      });
    });
    return list;
  }, [clients, selectedMonthStr]);

  const activationsInPrevMonth = useMemo(() => {
    let count = 0;
    clients.forEach(client => {
      client.dailyActivations?.forEach(act => {
        if (act.date && act.date.startsWith(prevMonthStr)) {
          count++;
        }
      });
    });
    return count;
  }, [clients, prevMonthStr]);

  // Tasks in previous month for comparison
  const completedTasksPrevMonth = useMemo(() => {
    let count = 0;
    clients.forEach(client => {
      client.tasks.forEach(task => {
        const taskMonth = task.completedAt ? task.completedAt.substring(0, 7) : task.dueDate ? task.dueDate.substring(0, 7) : '';
        if (taskMonth === prevMonthStr && task.completed) {
          count++;
        }
      });
    });
    return count;
  }, [clients, prevMonthStr]);

  // 4. Company Performance Breakdown Chart Data
  const companyData = useMemo(() => {
    return COMPANY_OPTIONS.map(comp => {
      const compClients = clients.filter(c => c.companyName === comp);
      const newClients = compClients.filter(c => (c.startDate || c.createdAt || '').startsWith(selectedMonthStr)).length;
      
      let compCompletedTasks = 0;
      let compTotalTasks = 0;

      compClients.forEach(c => {
        c.tasks.forEach(t => {
          const tMonth = t.completedAt ? t.completedAt.substring(0, 7) : t.dueDate ? t.dueDate.substring(0, 7) : '';
          if (tMonth === selectedMonthStr) {
            compTotalTasks++;
            if (t.completed) compCompletedTasks++;
          }
        });
      });

      return {
        name: comp,
        'عملاء جدد': newClients,
        'مهام مكتملة': compCompletedTasks,
        'إجمالي التكليفات': compTotalTasks
      };
    });
  }, [clients, selectedMonthStr]);

  // 5. Daily Activity Timeline Chart Data (Days 1 to 31)
  const dailyTimelineData = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    const data: { day: string; 'مهام مكتملة': number; 'تفعيلات يومية': number }[] = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const dayStr = `${selectedMonthStr}-${String(d).padStart(2, '0')}`;
      
      let tasksCount = 0;
      clients.forEach(c => {
        c.tasks.forEach(t => {
          if (t.completed && (t.completedAt === dayStr || (!t.completedAt && t.dueDate === dayStr))) {
            tasksCount++;
          }
        });
      });

      let activationsCount = 0;
      clients.forEach(c => {
        c.dailyActivations?.forEach(a => {
          if (a.date === dayStr) activationsCount++;
        });
      });

      data.push({
        day: `${d}`,
        'مهام مكتملة': tasksCount,
        'تفعيلات يومية': activationsCount
      });
    }

    return data;
  }, [clients, selectedMonthStr, selectedYear, selectedMonth]);

  // 6. Contract Types Breakdown for New Clients
  const contractTypesData = useMemo(() => {
    const typeCounts: Record<string, number> = {};
    newClientsInMonth.forEach(c => {
      const type = c.contract || 'غير محدد';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    return Object.entries(typeCounts).map(([name, value], index) => ({ 
      name, 
      value,
      fill: COLORS[index % COLORS.length]
    }));
  }, [newClientsInMonth]);

  // 7. Task Status & Delay Data
  const taskStatusData = useMemo(() => {
    let completed = 0;
    let delayed = 0;
    let pending = 0;

    clients.forEach(client => {
      client.tasks.forEach(task => {
        const taskMonth = task.completedAt ? task.completedAt.substring(0, 7) : task.dueDate ? task.dueDate.substring(0, 7) : '';
        if (taskMonth === selectedMonthStr) {
          if (task.completed) {
            completed++;
          } else {
             const today = new Date().toISOString().split('T')[0];
             const isDelayed = task.dueDate && task.dueDate < today;
             if (isDelayed) delayed++;
             else pending++;
          }
        }
      });
    });

    return [
      { name: 'مكتملة', value: completed, fill: '#6366F1' },
      { name: 'قيد التنفيذ', value: pending, fill: '#A78BFA' },
      { name: 'متأخرة', value: delayed, fill: '#F43F5E' },
    ];
  }, [clients, selectedMonthStr]);

  // 8. Weekly Task Completion per User (Chart Data)
  const weeklyUserCompletionData = useMemo(() => {
    const data: Record<string, any>[] = [
      { weekIndex: 1, week: 'الأسبوع 1' },
      { weekIndex: 2, week: 'الأسبوع 2' },
      { weekIndex: 3, week: 'الأسبوع 3' },
      { weekIndex: 4, week: 'الأسبوع 4' },
      { weekIndex: 5, week: 'الأسبوع 5' }
    ];

    const usersSet = new Set<string>();

    clients.forEach(client => {
      client.tasks.forEach(task => {
        if (task.completed && task.completedAt && task.completedAt.startsWith(selectedMonthStr)) {
          const user = task.createdBy || 'مستخدم غير محدد';
          usersSet.add(user);
          
          const day = parseInt(task.completedAt.substring(8, 10), 10);
          let weekIndex = Math.ceil(day / 7);
          if (weekIndex > 5) weekIndex = 5;

          const weekData = data.find(d => d.weekIndex === weekIndex);
          if (weekData) {
            weekData[user as keyof typeof weekData] = ((weekData[user as keyof typeof weekData] as number) || 0) + 1;
          }
        }
      });
    });

    const usersArray = Array.from(usersSet);
    
    // Calculate cumulative for work progress line
    const finalData = data.map(d => ({ ...d }));
    usersArray.forEach(user => {
      let cumulative = 0;
      finalData.forEach(weekData => {
        cumulative += ((weekData[user as keyof typeof weekData] as number) || 0);
        weekData[`${user}_cumulative` as keyof typeof weekData] = cumulative;
      });
    });

    return {
      data: finalData,
      users: usersArray
    };
  }, [clients, selectedMonthStr]);

  // 9. Client Status Distribution
  const clientStatusData = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    clients.forEach(c => {
       statusCounts[c.caseStatus] = (statusCounts[c.caseStatus] || 0) + 1;
    });
    
    const colors: Record<string, string> = {
      'نشط': '#6366F1',          // Luxury Indigo
      'مكتمل': '#818CF8',        // Light Indigo
      'جديد': '#A78BFA',         // Light Violet
      'قيد المراجعة': '#C084FC',  // Purple
      'hold': '#71717A',         // Muted Zinc
      'مؤجل': '#71717A'          // Muted Zinc
    };

    return Object.entries(statusCounts).map(([name, value]) => ({ 
      name, 
      value,
      fill: colors[name] || '#6366F1' 
    }));
  }, [clients]);

  // Growth rates calculation
  const clientGrowthDiff = newClientsInMonth.length - newClientsPrevMonth.length;
  const clientGrowthPercent = newClientsPrevMonth.length > 0 
    ? Math.round((clientGrowthDiff / newClientsPrevMonth.length) * 100)
    : newClientsInMonth.length * 100;

  const complianceRate = totalTasksDueInMonth > 0 
    ? Math.round((completedTasksInMonth / totalTasksDueInMonth) * 100) 
    : 100;

  const totalClientsCount = clients.length;
  const activeClientsCount = clients.filter(c => c.caseStatus === 'نشط').length;
  const holdClientsCount = clients.filter(c => c.caseStatus === 'hold').length;
  const lostClientsCount = clients.filter(c => c.isLost || (c.endDate && getRemainingContractDays(c) < 0)).length;

  return (
    <div ref={reportRef} className="space-y-6 pb-12 animate-fadeIn">
      
      {/* Company Summaries */}
      <div className="bg-[var(--surface)] p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {(profile?.role === 'admin' || profile?.role === 'account_manager_head' || profile?.role === 'manager') ? 'إحصائيات الشركات (إجمالي العملاء)' : 'الشركات الخاصة بك (عدد عملائك)'}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {(profile?.role === 'admin' || profile?.role === 'account_manager_head' || profile?.role === 'manager') ? 'إجمالي العملاء المسجلين في كل شركة عبر النظام' : 'العملاء المسندين إليك أو قمت بإنشائهم في كل شركة'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {COMPANY_OPTIONS.map((cName) => {
            const count = clients.filter(c => (c.companyName || 'بدون شركة') === cName).length;
            
            return (
              <div
                key={cName}
                className="relative overflow-hidden flex flex-col p-5 rounded-2xl border bg-slate-50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/80 text-right transition-all hover:shadow-md"
              >
                <div className="flex items-center justify-between w-full mb-4">
                  {cName === 'رمّاح - Ramah' ? (
                    <div className="flex items-center justify-center h-14 w-20 rounded-2xl bg-white/95 dark:bg-slate-900 overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm p-1">
                      <img
                        src="/companies/ramah-light.png"
                        alt="رمّاح - Ramah"
                        className="dark:hidden w-full h-full object-contain filter drop-shadow-xs"
                        onError={(e) => {
                          const t = e.currentTarget;
                          if (t.dataset.fallback !== '1') {
                            t.dataset.fallback = '1';
                            t.src = 'https://i.ibb.co/0pPzF0vq/Ramah-Agency-Arabic-Calligraphy-Logo.png';
                          }
                        }}
                      />
                      <img
                        src="/companies/ramah-dark.png"
                        alt="رمّاح - Ramah"
                        className="hidden dark:block w-full h-full object-contain filter drop-shadow-xs"
                        onError={(e) => {
                          const t = e.currentTarget;
                          if (t.dataset.fallback !== '1') {
                            t.dataset.fallback = '1';
                            t.src = 'https://i.ibb.co/q3DZckq2/Ramah-Agency-White-and-Red-Logo.png';
                          }
                        }}
                      />
                    </div>
                  ) : cName === 'AL - Ahly' ? (
                    <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-white dark:bg-transparent overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
                      <img src="https://i.ibb.co/d0KGfwr0/Chat-GPT-Image-Aug-8-2026-05-18-21-PM.png" alt="AL - Ahly" className="dark:hidden w-full h-full object-contain scale-90" />
                      <img src="https://i.ibb.co/RGwxNcLQ/image.png" alt="AL - Ahly" className="hidden dark:block w-full h-full object-contain scale-90" />
                    </div>
                  ) : cName === 'Herak' ? (
                    <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-white dark:bg-transparent overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
                      <img src="https://i.ibb.co/8nZzHJfw/image.png" alt="Herak" className="dark:hidden w-full h-full object-contain scale-90" />
                      <img src="https://i.ibb.co/39625k7S/image.png" alt="Herak" className="hidden dark:block w-full h-full object-contain scale-90" />
                    </div>
                  ) : cName === 'SYT' ? (
                    <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-white dark:bg-transparent overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
                      <img src="https://i.ibb.co/SDtvxvbQ/image.png" alt="SYT" className="dark:hidden w-full h-full object-contain scale-90" />
                      <img src="https://i.ibb.co/d0j14h76/image.png" alt="SYT" className="hidden dark:block w-full h-full object-contain scale-90" />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 shadow-sm">
                      <Building2 className="w-7 h-7 text-slate-400" />
                    </div>
                  )}
                </div>
                
                <div className="mt-auto">
                  <h4 className="text-[var(--text)] font-bold text-xl mb-1">{cName}</h4>
                  <div className="flex items-baseline gap-1.5">
                    <span className={`text-4xl font-black ${count > 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-600'}`}>
                      {count}
                    </span>
                    <span className="text-sm font-semibold text-[var(--text-muted)]">عميل</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Page Header & Month Selector */}
      <div className="bg-[var(--surface)] p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-1">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-md shadow-emerald-900/20 shrink-0">
              <PieChartIcon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                التقرير والإحصائيات الشهرية
              </h1>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                ملخص إنجاز أداء الشركة، العملاء الجدد، والتفعيلات لـ ({ARABIC_MONTHS[selectedMonth - 1].split(' ')[0]} {selectedYear})
              </p>
            </div>
          </div>

          {/* Prominent Action Buttons: Primary (Export PDF) & Secondary (Print) */}
          <div data-html2canvas-ignore="true" className="flex items-center gap-2.5 shrink-0">
            {/* Primary Button: Export PDF */}
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl bg-[#6366f1] hover:bg-[#4f46e5] active:scale-95 text-white shadow-md shadow-indigo-600/25 transition-all duration-200 cursor-pointer disabled:opacity-50"
              title="تصدير كملف PDF"
            >
              {isExporting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              <span>تصدير PDF</span>
            </button>

            {/* Secondary Button: Print */}
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#18181B] dark:hover:bg-[#27272A] text-slate-800 dark:text-[#FAFAFA] border border-slate-300/80 dark:border-[#27272A] shadow-xs active:scale-95 transition-all duration-200 cursor-pointer"
              title="طباعة التقرير الشهري"
            >
              <Printer className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
              <span>طباعة</span>
            </button>
          </div>
        </div>

        {/* Filters & Month Selector */}
        <div data-html2canvas-ignore="true" className="flex items-center gap-2 flex-wrap border-t lg:border-t-0 lg:border-r border-slate-200 dark:border-[#27272A] pt-3 lg:pt-0 lg:pr-4">
          
          {/* Month Selector */}
          <div className="flex items-center gap-1.5 bg-[var(--surface-hover)] p-1.5 rounded-xl border border-[var(--border)]">
            <Calendar className="w-4 h-4 text-indigo-500 mr-1" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent text-xs font-bold text-[var(--text)] focus:outline-none cursor-pointer py-1 pl-2"
            >
              {ARABIC_MONTHS.map((mName, idx) => (
                <option key={idx + 1} value={idx + 1} className="bg-[var(--surface)] text-[var(--text)]">
                  {mName}
                </option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent text-xs font-bold text-[var(--text)] focus:outline-none cursor-pointer py-1 border-r border-[var(--border)] pr-2"
            >
              <option value={2026} className="bg-[var(--surface)]">2026</option>
              <option value={2025} className="bg-[var(--surface)]">2025</option>
              <option value={2027} className="bg-[var(--surface)]">2027</option>
            </select>
          </div>

          {/* Quick Filter: Current Month */}
          <button
            onClick={() => {
              setSelectedYear(currentDate.getFullYear());
              setSelectedMonth(currentDate.getMonth() + 1);
            }}
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors cursor-pointer"
          >
            الشهر الحالي
          </button>
        </div>
      </div>

      {/* Top Cards Grid - Modern Dark SaaS Styling */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* New Clients Card */}
        <div className="bg-[#18181B] p-5 rounded-xl border border-[#27272A] shadow-lg relative overflow-hidden transition-all duration-300 hover:border-indigo-500/40 hover:shadow-indigo-950/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-[#09090B] border border-[#27272A] text-indigo-400">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-[#A1A1AA]">عملاء جدد هذا الشهر</span>
            </div>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
              clientGrowthDiff >= 0 
                ? 'text-indigo-300 bg-indigo-500/10 border-indigo-500/30' 
                : 'text-rose-300 bg-rose-500/10 border-rose-500/30'
            }`}>
              {clientGrowthDiff >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>{clientGrowthDiff >= 0 ? `+${clientGrowthDiff}` : clientGrowthDiff} عن السابق</span>
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-extrabold text-[#FAFAFA] tracking-tight font-mono">
              {newClientsInMonth.length}
            </span>
            <span className="text-[11px] text-[#A1A1AA] font-medium">
              عميل مسجل
            </span>
          </div>
          <p className="text-[11px] text-[#A1A1AA]/80 mt-2 border-t border-[#27272A] pt-2 flex items-center justify-between">
            <span>إجمالي التعاقدات المسجلة</span>
            <span className="font-bold text-[#FAFAFA]/90">{newClientsPrevMonth.length} بالشهر السابق</span>
          </p>
        </div>

        {/* Completed Tasks Card */}
        <div className="bg-[#18181B] p-5 rounded-xl border border-[#27272A] shadow-lg relative overflow-hidden transition-all duration-300 hover:border-indigo-500/40 hover:shadow-indigo-950/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-[#09090B] border border-[#27272A] text-indigo-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-[#A1A1AA]">المهام المنجزة خلال الشهر</span>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border text-indigo-300 bg-indigo-500/10 border-indigo-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span>{complianceRate}% إنجاز</span>
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-extrabold text-[#FAFAFA] tracking-tight font-mono">
              {completedTasksInMonth}
            </span>
            <span className="text-[11px] text-[#A1A1AA] font-medium">
              من أصل {totalTasksDueInMonth} تكليف
            </span>
          </div>
          <p className="text-[11px] text-[#A1A1AA]/80 mt-2 border-t border-[#27272A] pt-2 flex items-center justify-between">
            <span>معدل إنجاز المهام الكلي</span>
            <span className="font-bold text-[#FAFAFA]/90">
              {completedTasksInMonth - completedTasksPrevMonth >= 0 ? `+${completedTasksInMonth - completedTasksPrevMonth}` : completedTasksInMonth - completedTasksPrevMonth} مقارنة بالسابق
            </span>
          </p>
        </div>

        {/* Daily Activations Card */}
        <div className="bg-[#18181B] p-5 rounded-xl border border-[#27272A] shadow-lg relative overflow-hidden transition-all duration-300 hover:border-indigo-500/40 hover:shadow-indigo-950/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-[#09090B] border border-[#27272A] text-indigo-400">
                <Activity className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-[#A1A1AA]">التفعيلات اليومية المسجلة</span>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border text-indigo-300 bg-indigo-500/10 border-indigo-500/30 flex items-center gap-1">
              <Zap className="w-3 h-3 text-indigo-400" />
              <span>{activationsInMonth.length - activationsInPrevMonth >= 0 ? `+${activationsInMonth.length - activationsInPrevMonth}` : activationsInMonth.length - activationsInPrevMonth} تفعيل</span>
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-extrabold text-[#FAFAFA] tracking-tight font-mono">
              {activationsInMonth.length}
            </span>
            <span className="text-[11px] text-[#A1A1AA] font-medium">
              تفعيل تسويقي
            </span>
          </div>
          <p className="text-[11px] text-[#A1A1AA]/80 mt-2 border-t border-[#27272A] pt-2 flex items-center justify-between">
            <span>مستمرة عبر كافة الحسابات</span>
            <span className="font-bold text-[#FAFAFA]/90">{activationsInPrevMonth} بالشهر السابق</span>
          </p>
        </div>

        {/* Active Companies Breakdown */}
        <div className="bg-[#18181B] p-5 rounded-xl border border-[#27272A] shadow-lg relative overflow-hidden transition-all duration-300 hover:border-indigo-500/40 hover:shadow-indigo-950/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-[#09090B] border border-[#27272A] text-violet-400">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-[#A1A1AA]">الشركات المستفيدة</span>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border text-violet-300 bg-violet-500/10 border-violet-500/30">
              {COMPANY_OPTIONS.length} شركات
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-extrabold text-[#FAFAFA] tracking-tight font-mono">
              {COMPANY_OPTIONS.length}
            </span>
            <span className="text-[11px] text-[#A1A1AA] font-bold">
              تغطية شاملة
            </span>
          </div>
          <p className="text-[11px] text-[#A1A1AA]/80 mt-2 border-t border-[#27272A] pt-2 flex items-center justify-between truncate">
            <span>نطاق العمل:</span>
            <span className="font-bold text-[#FAFAFA]/90 text-[10px] truncate max-w-[140px]">{COMPANY_OPTIONS.join(' ، ')}</span>
          </p>
        </div>

      </div>

      {/* Circular Charts Grid - 2 cards side-by-side on md: and above as requested */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Task Completion Status (Pie Chart) */}
        <div className="bg-[#18181B] p-5 rounded-xl border border-[#27272A] shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-[#FAFAFA] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                <span>معدل إنجاز المهام</span>
              </h3>
              <span className="text-[10px] font-bold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                {complianceRate}% مكتمل
              </span>
            </div>
            <p className="text-[11px] text-[#A1A1AA] mb-3">
              حالة إنجاز المهام والتكليفات للشهر الحالي
            </p>
            {taskStatusData.reduce((acc, curr) => acc + curr.value, 0) > 0 ? (
              <div className="h-52 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={taskStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={58}
                      outerRadius={78}
                      paddingAngle={5}
                      cornerRadius={6}
                      dataKey="value"
                    >
                      {taskStatusData.map((entry, index) => (
                        <Cell 
                          key={`cell-task-${index}`} 
                          fill={entry.name === 'مكتملة' ? '#6366F1' : entry.name === 'متأخرة' ? '#F43F5E' : '#A78BFA'} 
                          stroke="#18181B"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<CustomChartTooltip unit="مهمة" />} />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36} 
                      iconType="circle"
                      formatter={(val) => <span className="text-[11px] font-medium text-[#FAFAFA]">{val}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-44 flex items-center justify-center text-xs text-[#A1A1AA] font-medium">
                لا توجد مهام هذا الشهر
              </div>
            )}
          </div>
        </div>

        {/* Client Status Distribution (Pie Chart) */}
        <div className="bg-[#18181B] p-5 rounded-xl border border-[#27272A] shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-[#FAFAFA] flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                <span>توزيع حالات العملاء</span>
              </h3>
              <span className="text-[10px] font-bold text-indigo-300 bg-[#09090B] px-2 py-0.5 rounded-full border border-[#27272A]">
                {clients.length} عميل
              </span>
            </div>
            <p className="text-[11px] text-[#A1A1AA] mb-3">
              نظرة عامة على حالات العملاء الحالية وتوزيع نسبها
            </p>
            {clientStatusData.length > 0 ? (
              <div className="h-52 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={clientStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={58}
                      outerRadius={78}
                      paddingAngle={5}
                      cornerRadius={6}
                      dataKey="value"
                    >
                      {clientStatusData.map((entry, index) => (
                        <Cell 
                          key={`cell-status-${index}`} 
                          fill={entry.fill || MODERN_DARK_PALETTE[index % MODERN_DARK_PALETTE.length]} 
                          stroke="#18181B"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<CustomChartTooltip unit="عميل" />} />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36} 
                      iconType="circle"
                      formatter={(val) => <span className="text-[11px] font-medium text-[#FAFAFA]">{val}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-44 flex items-center justify-center text-xs text-[#A1A1AA] font-medium">
                لا يوجد عملاء
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Performance Rates & Contract Types Grid - 2 cards side-by-side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Delay Rates (Bar Chart) */}
        <div className="bg-[#18181B] p-5 rounded-xl border border-[#27272A] shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-[#FAFAFA] flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span>نسب الإنجاز والتأخير</span>
              </h3>
              <span className="text-[10px] font-bold text-indigo-300 bg-[#09090B] px-2 py-0.5 rounded-full border border-[#27272A]">
                مقارنة الأداء
              </span>
            </div>
            <p className="text-[11px] text-[#A1A1AA] mb-3">
              مقارنة بين المهام المكتملة والمتأخرة
            </p>
            <div className="h-52 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={taskStatusData.filter(d => d.name === 'مكتملة' || d.name === 'متأخرة')} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366F1" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#4F46E5" stopOpacity={0.4} />
                    </linearGradient>
                    <linearGradient id="gradDelayed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#F43F5E" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#BE123C" stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272A" opacity={0.5} vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#A1A1AA' }} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#A1A1AA' }} />
                  <RechartsTooltip content={<CustomChartTooltip unit="مهمة" />} cursor={{ fill: 'rgba(99, 102, 241, 0.15)' }} />
                  <Bar dataKey="value" name="المهام" radius={[8, 8, 0, 0]} maxBarSize={48}>
                    {taskStatusData.filter(d => d.name === 'مكتملة' || d.name === 'متأخرة').map((entry, index) => (
                      <Cell 
                        key={`cell-perf-${index}`} 
                        fill={entry.name === 'مكتملة' ? 'url(#gradCompleted)' : 'url(#gradDelayed)'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Contract Types Pie Chart */}
        <div className="bg-[#18181B] p-5 rounded-xl border border-[#27272A] shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-[#FAFAFA] flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                <span>أنواع العقود الجديدة هذا الشهر</span>
              </h3>
              <span className="text-[10px] font-bold text-indigo-300 bg-[#09090B] px-2 py-0.5 rounded-full border border-[#27272A]">
                {contractTypesData.length} باقات
              </span>
            </div>
            <p className="text-[11px] text-[#A1A1AA] mb-3">
              توزيع الخدمات المتعاقد عليها للعملاء الجدد
            </p>

            {contractTypesData.length > 0 ? (
              <div className="h-52 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={contractTypesData}
                      cx="50%"
                      cy="50%"
                      innerRadius={58}
                      outerRadius={78}
                      paddingAngle={5}
                      cornerRadius={6}
                      dataKey="value"
                    >
                      {contractTypesData.map((entry, index) => (
                        <Cell 
                          key={`cell-contract-${index}`} 
                          fill={entry.fill || MODERN_DARK_PALETTE[index % MODERN_DARK_PALETTE.length]} 
                          stroke="#18181B"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<CustomChartTooltip unit="عقد" />} />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36} 
                      iconType="circle"
                      formatter={(val) => <span className="text-[11px] font-medium text-[#FAFAFA]">{val}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-44 flex items-center justify-center text-xs text-[#A1A1AA] font-medium">
                لم يتم إيجاد عملاء جدد في هذا الشهر المحدد
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Charts Section Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Company Performance Bar Chart */}
        <div className="bg-[#18181B] p-5 rounded-xl border border-[#27272A] shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#FAFAFA] flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-400" />
                <span>أداء وإنجاز المهام حسب الشركة</span>
              </h3>
              <p className="text-[11px] text-[#A1A1AA]">
                مقارنة عدد العملاء الجدد والمهام المكتملة بين الشركات خلال هذا الشهر
              </p>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={companyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="barNewClients" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818CF8" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#4F46E5" stopOpacity={0.4} />
                  </linearGradient>
                  <linearGradient id="barCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366F1" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#4338CA" stopOpacity={0.4} />
                  </linearGradient>
                  <linearGradient id="barTotalTasks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#A78BFA" stopOpacity={0.85} />
                    <stop offset="100%" stopColor="#7C3AED" stopOpacity={0.4} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272A" opacity={0.5} vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#A1A1AA' }} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#A1A1AA' }} />
                <RechartsTooltip content={<CustomChartTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.15)' }} />
                <Legend 
                  wrapperStyle={{ paddingTop: '10px', fontSize: '11px' }} 
                  iconType="circle"
                  formatter={(val) => <span className="text-[11px] font-medium text-[#FAFAFA]">{val}</span>}
                />
                <Bar dataKey="عملاء جدد" fill="url(#barNewClients)" radius={[8, 8, 0, 0]} maxBarSize={28} />
                <Bar dataKey="مهام مكتملة" fill="url(#barCompleted)" radius={[8, 8, 0, 0]} maxBarSize={28} />
                <Bar dataKey="إجمالي التكليفات" fill="url(#barTotalTasks)" radius={[8, 8, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Daily Activity Wave Trend Chart */}
        <div className="bg-[#18181B] p-5 rounded-xl border border-[#27272A] shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#FAFAFA] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                <span>النشاط والإنجاز اليومي خلال أيام الشهر</span>
              </h3>
              <p className="text-[11px] text-[#A1A1AA]">
                تتبع مسار إنهاء المهام والتفعيلات اليومية يوم بيوم (1 إلى 31)
              </p>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyTimelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366F1" stopOpacity={0.6}/>
                    <stop offset="100%" stopColor="#4F46E5" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorActivations" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#A78BFA" stopOpacity={0.5}/>
                    <stop offset="100%" stopColor="#27272A" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272A" opacity={0.5} vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#A1A1AA' }} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#A1A1AA' }} />
                <RechartsTooltip 
                  content={<CustomChartTooltip />}
                  labelFormatter={(day) => `يوم ${day} في الشهر`}
                  cursor={{ stroke: '#818CF8', strokeWidth: 1, strokeDasharray: '3 3' }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '10px', fontSize: '11px' }} 
                  iconType="circle" 
                  formatter={(val) => <span className="text-[11px] font-medium text-[#FAFAFA]">{val}</span>}
                />
                <Area type="monotone" dataKey="مهام مكتملة" stroke="#6366F1" strokeWidth={2.5} dot={{ r: 2.5, fill: '#6366F1', strokeWidth: 0 }} activeDot={{ r: 5, fill: '#FAFAFA', stroke: '#09090B', strokeWidth: 2 }} fillOpacity={1} fill="url(#colorTasks)" />
                <Area type="monotone" dataKey="تفعيلات يومية" stroke="#A78BFA" strokeWidth={2.5} dot={{ r: 2.5, fill: '#A78BFA', strokeWidth: 0 }} activeDot={{ r: 5, fill: '#FAFAFA', stroke: '#09090B', strokeWidth: 2 }} fillOpacity={1} fill="url(#colorActivations)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Weekly User Completion Chart */}
      <div className="bg-[#18181B] p-5 rounded-xl border border-[#27272A] shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#FAFAFA] flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              <span>معدل إنجاز المهام الأسبوعي لكل مستخدم</span>
            </h3>
            <p className="text-[11px] text-[#A1A1AA]">
              تتبع إنجاز المهام على مدار أسابيع الشهر مصنفة حسب المستخدمين (منفذي المهام)
            </p>
          </div>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={weeklyUserCompletionData.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                {weeklyUserCompletionData.users.map((user, index) => {
                  const color = MODERN_DARK_PALETTE[index % MODERN_DARK_PALETTE.length];
                  return (
                    <linearGradient key={`user-grad-${user}`} id={`userGrad-${index}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={color} stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#18181B" stopOpacity={0.5} />
                    </linearGradient>
                  );
                })}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272A" opacity={0.5} vertical={false} />
              <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#A1A1AA' }} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#A1A1AA' }} />
              <RechartsTooltip content={<CustomChartTooltip unit="مهمة" />} cursor={{ fill: 'rgba(99, 102, 241, 0.15)' }} />
              <Legend 
                wrapperStyle={{ paddingTop: '10px', fontSize: '11px' }} 
                iconType="circle"
                formatter={(val) => <span className="text-[11px] font-medium text-[#FAFAFA]">{val}</span>}
              />
              {weeklyUserCompletionData.users.map((user, index) => (
                <Bar 
                  key={`bar-${user}`} 
                  dataKey={user} 
                  name={`مهام ${user}`} 
                  fill={`url(#userGrad-${index})`} 
                  radius={[8, 8, 0, 0]} 
                  barSize={20}
                />
              ))}
              {weeklyUserCompletionData.users.map((user, index) => (
                <Line
                  key={`line-${user}`}
                  type="monotone"
                  dataKey={`${user}_cumulative`}
                  name={`تطور ${user}`}
                  stroke={index % 2 === 0 ? '#6366F1' : '#A78BFA'}
                  strokeWidth={2.5}
                  dot={{ r: 3.5, strokeWidth: 2, fill: '#09090B', stroke: index % 2 === 0 ? '#6366F1' : '#A78BFA' }}
                  activeDot={{ r: 5.5, fill: '#FAFAFA', stroke: '#09090B', strokeWidth: 2 }}
                />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed New Clients List in Selected Month (Modern SaaS Table) */}
      <div className="bg-[#18181B] p-5 rounded-xl border border-[#27272A] shadow-lg space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#27272A]">
          <h3 className="text-sm font-bold text-[#FAFAFA] flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            <span>قائمة العملاء الجدد المضافين في ({ARABIC_MONTHS[selectedMonth - 1].split(' ')[0]} {selectedYear})</span>
          </h3>
          <span className="text-xs font-bold text-indigo-300 bg-indigo-500/10 border border-indigo-500/30 px-2.5 py-1 rounded-full">
            {newClientsInMonth.length} عميل
          </span>
        </div>

        {newClientsInMonth.length > 0 ? (
          <div className="w-full overflow-hidden rounded-xl border border-[#27272A] bg-[#09090B]">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right border-collapse">
                <thead>
                  <tr className="border-b border-[#27272A] bg-[#09090B] text-[#A1A1AA] text-sm font-medium">
                    <th className="py-3 px-4 font-semibold whitespace-nowrap">الكود</th>
                    <th className="py-3 px-4 font-semibold whitespace-nowrap">اسم العميل</th>
                    <th className="py-3 px-4 font-semibold whitespace-nowrap">الشركة</th>
                    <th className="py-3 px-4 font-semibold whitespace-nowrap">نوع العقد</th>
                    <th className="py-3 px-4 font-semibold whitespace-nowrap">تاريخ البداية</th>
                    <th className="py-3 px-4 font-semibold whitespace-nowrap">الحالة</th>
                    <th className="py-3 px-4 font-semibold text-center whitespace-nowrap">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272A] text-sm">
                  {newClientsInMonth.map((client) => (
                    <tr key={client.id} className="hover:bg-[#18181B] transition-colors duration-150">
                      <td className="py-3 px-4 font-mono text-indigo-400 font-bold text-xs">{client.code}</td>
                      <td className="py-3 px-4 font-bold text-[#FAFAFA]">{client.clientName}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-[#18181B] border border-[#27272A] text-[#A1A1AA] font-medium text-[11px]">
                          {client.companyName || 'عام'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#A1A1AA] text-xs">{client.contract}</td>
                      <td className="py-3 px-4 font-mono text-[#A1A1AA] text-xs">{client.startDate}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                          client.caseStatus === 'نشط' ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30' :
                          client.caseStatus === 'جديد' ? 'bg-violet-500/10 text-violet-300 border-violet-500/30' :
                          client.caseStatus === 'مؤجل' ? 'bg-rose-500/10 text-rose-300 border-rose-500/30' :
                          'bg-zinc-500/15 text-zinc-300 border-zinc-500/30'
                        }`}>
                          {client.caseStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => onSelectClient(client.id)}
                          className="px-2.5 py-1 text-xs font-bold text-indigo-400 hover:text-indigo-200 hover:bg-[#27272A] rounded-lg transition-colors inline-flex items-center gap-1 border border-[#27272A]"
                        >
                          <span>عرض</span>
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-[#A1A1AA] font-medium">
            لم يتم تسجيل أي عملاء جدد خلال هذا الشهر المحدد.
          </div>
        )}
      </div>

      {/* Completed Tasks & Activations Log (Activity Timeline Cards) */}
      <div className="bg-[#18181B] p-5 rounded-xl border border-[#27272A] shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#27272A]">
          <h3 className="text-sm font-bold text-[#FAFAFA] flex items-center gap-2">
            <Award className="w-4 h-4 text-indigo-400" />
            <span>سجل إنجاز المهام والتفعيلات المنفذة بنجاح هذا الشهر</span>
          </h3>
          <span className="text-xs text-[#A1A1AA] font-bold bg-[#09090B] px-2.5 py-1 rounded-full border border-[#27272A]">
            إجمالي {allCompletedTasksList.length} مهمة منجزة
          </span>
        </div>

        {allCompletedTasksList.length > 0 ? (
          <div className="max-h-[500px] overflow-y-auto pr-1.5 pl-1.5 scroll-smooth custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {allCompletedTasksList.map((item, index) => (
                <div 
                  key={index} 
                  className="p-3.5 rounded-xl bg-[#09090B] border border-[#27272A] flex items-start justify-between gap-3 hover:border-indigo-500/60 hover:bg-[#18181B] transition-all duration-200 cursor-pointer group"
                  onClick={() => onSelectClient(item.client.id)}
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0 shadow-xs shadow-indigo-400/50" />
                      <h4 className="font-bold text-[#FAFAFA] text-xs truncate group-hover:text-indigo-300 transition-colors">
                        {item.taskTitle}
                      </h4>
                    </div>
                    <p className="text-[11px] text-[#A1A1AA] truncate">
                      العميل: <strong className="text-white font-medium">{item.client.clientName}</strong> ({item.client.companyName || 'عام'})
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-[#A1A1AA] pt-1">
                      <span className="px-2 py-0.5 rounded-full bg-[#18181B] border border-[#27272A] text-indigo-300 font-bold">
                        {item.category}
                      </span>
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-[#A1A1AA]" />
                        {item.date}
                      </span>
                    </div>
                  </div>
                  <div className="p-1.5 rounded-lg bg-[#18181B] border border-[#27272A] text-[#A1A1AA] group-hover:text-[#FAFAFA] group-hover:border-indigo-500 transition-colors shrink-0">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-[#A1A1AA] font-medium">
            لا توجد مهام منجزة في الشهر المختار حتى الآن.
          </div>
        )}
      </div>

    </div>
  );
};
