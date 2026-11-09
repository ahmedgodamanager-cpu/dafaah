import { useAuth } from '../context/AuthContext';
import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { usePortalLink } from '../context/PortalLinkContext';
import { PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip, 
  Legend,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { ArrowRight, 
  MessageSquare, 
  ExternalLink, 
  Calendar, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  FileText, 
  Trash2, 
  Edit3, 
  Key, 
  Palette, 
  Globe, 
  Users,
  AlignRight, 
  CalendarCheck, 
  CheckSquare,
  Activity,
  Video,
  Link as LinkIcon,
  Filter,
  Info,
  GripVertical,
  Building2,
  Copy,
  Check,
  History,
  Crown,
  BookOpen,
  X,
  Save,
  StickyNote,
  Download,
  Printer,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { VipBadge, VipBanner } from './VipBadge';

const companyBadgeMap: Record<string, string> = {
  'AL - Ahly': 'bg-blue-900 text-blue-50 border-blue-700 dark:bg-blue-950 dark:text-blue-100 dark:border-blue-800',
  'SYT': 'bg-rose-900 text-rose-50 border-rose-700 dark:bg-rose-950 dark:text-rose-100 dark:border-rose-800',
  'Herak': 'bg-amber-950 text-amber-100 border-amber-800 dark:bg-amber-950 dark:text-amber-100 dark:border-amber-700'
};

const contractColorMap: Record<string, string> = {
  slate: 'bg-slate-50 dark:bg-slate-800/40 text-[var(--text-muted)] border-slate-200/50 dark:border-slate-700/50',
  rose: 'bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400 border-rose-200/50 dark:border-rose-800/30',
  orange: 'bg-orange-50 dark:bg-orange-900/10 text-orange-600 dark:text-orange-400 border-orange-200/50 dark:border-orange-800/30',
  amber: 'bg-amber-50 dark:bg-amber-900/10 text-amber-600 dark:text-amber-400 border-amber-200/50 dark:border-amber-800/30',
  emerald: 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-800/30',
  blue: 'bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 border-blue-200/50 dark:border-blue-800/30',
  indigo: 'bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600 dark:text-indigo-400 border-indigo-200/50 dark:border-indigo-800/30',
  violet: 'bg-violet-50 dark:bg-violet-900/10 text-violet-600 dark:text-violet-400 border-violet-200/50 dark:border-violet-800/30',
  pink: 'bg-pink-50 dark:bg-pink-900/10 text-pink-600 dark:text-pink-400 border-pink-200/50 dark:border-pink-800/30',
};

import { Client, TaskItem, TaskCategory, DailyActivation, DashboardConfig } from '../types';
import { CATEGORIES_INFO } from '../data/initialClients';
import { DailyActivationSection } from './DailyActivationSection';
import { ClientTimelineSection } from './ClientTimelineSection';
import { ClientActivitiesSection } from './ClientActivitiesSection';
import { ClientLogo } from './ClientLogo';
import { ClientNotesSection } from './ClientNotesSection';
import { ConfirmationModal } from './ConfirmationModal';
import { TaskComments } from './TaskComments';
import { calculateClientProgress,
  formatDateArabic,
  getDaysDifference, getRemainingContractDays,
  getTaskTimeStatus,
  getWhatsAppLink,
  getTodayStr,
  hasValidDueDate,
  isPlausibleDateStr,
  parseDate
} from '../utils/dateUtils';

/*
 * Every task action below sends exactly ONE command to the data layer.
 * The old page sent two for each action (updateTask + updateClient with a full copy of all
 * tasks) to two different storage places, and whichever arrived last won — which is why
 * ticked tasks sometimes un-ticked themselves or came back after being deleted.
 */
interface ClientDetailPageProps {
  client: Client;
  onBack: () => void;
  /** Saves client fields; send only the fields that change (plus `id`). */
  onUpdateClient: (changes: Partial<Client> & { id: string }) => Promise<boolean | void> | void;
  onUpdateTask?: (clientId: string, task: Partial<TaskItem> & { id: string }) => Promise<boolean | void>;
  onDeleteTask?: (clientId: string, taskId: string) => Promise<boolean | void>;
  onReorderTasks?: (clientId: string, orderedTaskIds: string[]) => Promise<boolean | void>;
  onSyncClientTasks?: (clientId: string) => Promise<boolean | void>;
  onClearClientTasks?: (clientId: string) => Promise<boolean | void>;
  onDeleteActivation?: (clientId: string, activationId: string) => Promise<boolean | void> | void;
  onDeleteClient: (clientId: string) => Promise<boolean | void>;
  onOpenAddTask: (clientId: string) => void;
  onOpenEditClient: (client: Client) => void;
  onOpenAddActivation: (clientId: string, activation?: DailyActivation) => void;
  isReadingMode?: boolean;
  onToggleReadingMode?: () => void;
  dashboardConfig?: DashboardConfig;
}

const MONTH_COLORS = [
  'bg-blue-50/80 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300', // Month 1
  'bg-purple-50/80 border-purple-200 text-purple-700 dark:bg-purple-900/30 dark:border-purple-800 dark:text-purple-300', // Month 2
  'bg-fuchsia-50/80 border-fuchsia-200 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:border-fuchsia-800 dark:text-fuchsia-300', // Month 3
  'bg-orange-50/80 border-orange-200 text-orange-700 dark:bg-orange-900/30 dark:border-orange-800 dark:text-orange-300', // Month 4
  'bg-teal-50/80 border-teal-200 text-teal-700 dark:bg-teal-900/30 dark:border-teal-800 dark:text-teal-300', // Month 5
  'bg-pink-50/80 border-pink-200 text-pink-700 dark:bg-pink-900/30 dark:border-pink-800 dark:text-pink-300', // Month 6
];

const MONTH_CARD_COLORS = [
  'bg-blue-100/50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800/50', // Month 1
  'bg-purple-100/50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800/50', // Month 2
  'bg-fuchsia-100/50 dark:bg-fuchsia-900/30 border-fuchsia-200 dark:border-fuchsia-800/50', // Month 3
  'bg-orange-100/50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800/50', // Month 4
  'bg-teal-100/50 dark:bg-teal-900/30 border-teal-200 dark:border-teal-800/50', // Month 5
  'bg-pink-100/50 dark:bg-pink-900/30 border-pink-200 dark:border-pink-800/50', // Month 6
];

export const ClientDetailPage: React.FC<ClientDetailPageProps> = ({
  client,
  onBack,
  onUpdateClient,
  onUpdateTask,
  onDeleteTask,
  onReorderTasks,
  onSyncClientTasks,
  onClearClientTasks,
  onDeleteActivation,
  onDeleteClient,
  onOpenAddTask,
  onOpenEditClient,
  onOpenAddActivation,
  isReadingMode = false,
  onToggleReadingMode,
}) => {
  const { user, profile } = useAuth();
  const isAdmin = user?.email === 'ahmedgoda.manager@gmail.com' || profile?.role === 'admin';
  const [activeSubTab, setActiveSubTab] = useState<'tasks' | 'activations' | 'timeline' | 'activities' | 'notes'>('tasks');
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory | 'all'>('all');
  const [taskStatusFilter, setTaskStatusFilter] = useState<'all' | 'in_progress' | 'completed' | 'delayed'>('all');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskNotes, setTaskNotes] = useState<string>('');
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);
  React.useEffect(() => {
    setLocalMiniBrief(client.miniBrief || '');
  }, [client.miniBrief]);

  const [copied, setCopied] = useState(false);
  const [localMiniBrief, setLocalMiniBrief] = useState(client.miniBrief || '');
  const [isEditingMiniBrief, setIsEditingMiniBrief] = useState(false);
  const [isEditingPlans, setIsEditingPlans] = useState(false);
  const [tempPlanLinks, setTempPlanLinks] = useState<{title: string; url: string}[]>([]);
  const [copiedPortalLink, setCopiedPortalLink] = useState(false);

  const getPortalLink = usePortalLink();
  const handleCopyPortalLink = () => {
    const publicUrl = getPortalLink?.(client.id);
    if (!publicUrl) {
      toast.error('تعذّر تجهيز رابط بوابة العميل');
      return;
    }
    try {
      navigator.clipboard.writeText(publicUrl).then(
        () => {
          setCopiedPortalLink(true);
          toast.success('تم نسخ الرابط بنجاح');
          setTimeout(() => setCopiedPortalLink(false), 2000);
        },
        () => toast.error('حدث خطأ أثناء نسخ الرابط')
      );
    } catch {
      toast.error('حدث خطأ أثناء نسخ الرابط');
    }
  };

  // The contract badge uses the colour chosen for this client in its form.
  const activeColor = client.themeColor || 'slate';

  const handleEditPlansClick = () => {
    // A copy: editing used to change the client's own link objects in place, so a cancelled edit
    // stayed on screen and was saved by the next unrelated save of this client.
    setTempPlanLinks((client.planLinks || []).map(link => ({ ...link })));
    setIsEditingPlans(true);
  };

  const handleSavePlans = () => {
    onUpdateClient({
      id: client.id,
      planLinks: tempPlanLinks.filter(link => (link.title || '').trim() || (link.url || '').trim())
    });
    setIsEditingPlans(false);
  };

  const handleCopyClientData = async () => {
    const text = `📋 بيانات العميل:
• اسم العميل: ${client.clientName}
• كود العميل: ${client.code}
${client.companyName ? `• الشركة: ${client.companyName}\n` : ''}• نوع العقد: ${client.contract}
• حالة العقد: ${client.caseStatus}
• مدة العقد: ${client.durationMonths} ${client.durationMonths === 1 ? 'شهر' : 'أشهر'} (+ 10 أيام)
• رقم الهاتف: ${client.clientNumber}
${client.groupName ? `• اسم الجروب: ${client.groupName}\n` : ''}${client.contractDate ? `• تاريخ التعاقد: ${formatDateArabic(client.contractDate)}\n` : ''}• تاريخ بداية العمل: ${formatDateArabic(client.startDate)}
• تاريخ النهاية: ${formatDateArabic(client.endDate)}
${client.driveFolderUrl ? `• رابط المجلد: ${client.driveFolderUrl}\n` : ''}${client.notes ? `• ملاحظات: ${client.notes}\n` : ''}`.trim();

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy client data', err);
    }
  };

  // Confirmation Modal state
  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    variant: 'danger' | 'warning' | 'info' | 'primary' | 'success';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'تأكيد',
    variant: 'danger',
    onConfirm: () => {},
  });

  // Task reordering handler
  const handleReorderTasks = async (draggedId: string, targetId: string) => {
    if (draggedId === targetId) return;

    // Use order field if present, otherwise fallback to array index
    const tasksList = client.tasks || [];
    const sortedTasks = [...tasksList].sort((a, b) => {
      const orderA = a.order !== undefined ? a.order : 999;
      const orderB = b.order !== undefined ? b.order : 999;
      if (orderA !== orderB) return orderA - orderB;
      const dateA = new Date(a.dueDate || '2999-12-31').getTime();
      const dateB = new Date(b.dueDate || '2999-12-31').getTime();
      return dateA - dateB;
    });

    const draggedIndex = sortedTasks.findIndex(t => t.id === draggedId);
    const targetIndex = sortedTasks.findIndex(t => t.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const [movedTask] = sortedTasks.splice(draggedIndex, 1);
    sortedTasks.splice(targetIndex, 0, movedTask);

    // One write that only changes the `order` field. The old code sent one full update per task
    // (each with its own activity-log entry) PLUS a second save of the whole list, and a partial
    // `{ id, order }` update could create title-less task documents.
    if (onReorderTasks) {
      await onReorderTasks(client.id, sortedTasks.map(t => t.id));
    }
  };

  const trendData = React.useMemo(() => {
    const data = [];
    const now = new Date();
    
    for (let i = 2; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = d.toLocaleDateString('ar-EG', { month: 'short' });
      
      const monthTasks = (client.tasks || []).filter(t => {
        if (!t.dueDate) return false;
        // Compare the calendar month directly ('YYYY-MM-DD'); `new Date('YYYY-MM-DD')` is parsed as UTC.
        const [year, month] = t.dueDate.split('-').map(Number);
        return month - 1 === d.getMonth() && year === d.getFullYear();
      });
      
      const total = monthTasks.length;
      const completed = monthTasks.filter(t => t.completed).length;
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
      
      data.push({
        month: monthLabel,
        rate: rate,
        total: total,
        completed: completed
      });
    }
    return data;
  }, [client.tasks]);

  // For a client on hold, lateness is frozen at the hold start date. The header stats already did
  // this, but the task chips, filters and badges counted from today, so they disagreed.
  const progressRefDate = (client.caseStatus === 'hold' && client.holdStartDate && parseDate(client.holdStartDate)) || new Date();
  const stats = calculateClientProgress(client);
  const waLink = getWhatsAppLink(client.clientNumber, `مرحباً ${client.clientName}، متابعة بخصوص رحلة العمل والتاسكات`);

  // Days remaining in contract
  const contractDaysDiff = getRemainingContractDays(client);

  // Category Icon Map
  const categoryIconMap: Record<string, React.ReactNode> = {
    Key: <Key className="w-4 h-4" />,
    FileText: <FileText className="w-4 h-4" />,
    Palette: <Palette className="w-4 h-4" />,
    Video: <Video className="w-4 h-4" />,
    Globe: <Globe className="w-4 h-4" />,
    Users: <Users className="w-4 h-4" />,
    CalendarCheck: <CalendarCheck className="w-4 h-4" />,
    CheckSquare: <CheckSquare className="w-4 h-4" />
  };

  // Filter and sort tasks by order and status
  const clientTasks = client.tasks || [];

  const taskCounts = React.useMemo(() => {
    let completed = 0;
    let delayed = 0;
    let inProgress = 0;
    for (const t of clientTasks) {
      if (t.completed) {
        completed++;
      } else {
        inProgress++;
        if (hasValidDueDate(t) && getDaysDifference(t.dueDate, progressRefDate) < 0) {
          delayed++;
        }
      }
    }
    return { all: clientTasks.length, inProgress, completed, delayed };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientTasks, client.caseStatus, client.holdStartDate]);

  const filteredTasks = clientTasks
    .filter(t => {
      // Category filter
      if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;
      
      // Task Status Filter
      if (taskStatusFilter === 'completed') return t.completed;
      if (taskStatusFilter === 'in_progress') return !t.completed;
      if (taskStatusFilter === 'delayed') return !t.completed && hasValidDueDate(t) && getDaysDifference(t.dueDate, progressRefDate) < 0;

      return true;
    })
    .sort((a, b) => {
      const orderA = a.order !== undefined ? a.order : 999;
      const orderB = b.order !== undefined ? b.order : 999;
      if (orderA !== orderB) return orderA - orderB;
      const dateA = new Date(a.dueDate || '2999-12-31').getTime();
      const dateB = new Date(b.dueDate || '2999-12-31').getTime();
      return dateA - dateB;
    });

  const handleMarkLost = () => {
    setConfirmModalConfig({
      isOpen: true,
      title: 'إنهاء / إغلاق حساب العميل',
      message: 'هل أنت متأكد من تغيير حالة العميل إلى "مفقود/منتهي"؟',
      confirmText: 'إغلاق الحساب',
      variant: 'warning',
      onConfirm: () => {
        // Only the changed fields (a full copy would overwrite edits a colleague made meanwhile).
        onUpdateClient({
          id: client.id,
          isLost: true,
          caseStatus: 'مكتمل'
        });
      }
    });
  };

  const handleRenew = () => {
    setConfirmModalConfig({
      isOpen: true,
      title: 'تجديد عقد العميل',
      message: 'هل ترغب بتجديد عقد العميل؟ سيؤدي هذا لتحديث حالة العميل وتصفير التأخيرات السابقة.',
      confirmText: 'تجديد العقد',
      variant: 'info',
      onConfirm: () => {
        const renewal: Partial<Client> = {
          isLost: false,
          isArchived: false,
          renewalCount: (client.renewalCount || 0) + 1,
          caseStatus: 'نشط',
          // A new term: days the client spent on hold in the old term must not extend the new one.
          accumulatedHoldDays: 0,
          accumulatedHoldBusinessDays: 0,
        };
        onUpdateClient({ id: client.id, ...renewal });
        // The edit form must start from the RENEWED values. It used to get the old copy
        // (lost / completed), so saving the form undid the renewal and re-archived the client.
        onOpenEditClient({ ...client, ...renewal } as Client);
      }
    });
  };

  // Toggle Task Completed
  const handleToggleTask = (taskId: string) => {
    const task = (client.tasks || []).find(t => t.id === taskId);
    if (!task || !onUpdateTask) return;

    // Send complete task with toggled completion so no fields are lost
    onUpdateTask(client.id, {
      ...task,
      completed: !task.completed,
      completedAt: !task.completed ? getTodayStr() : undefined
    });
  };

  // Change task completion date directly
  const handleUpdateCompletedAt = (taskId: string, newCompletedAtDate: string) => {
    // Ignore half-typed years (0002, 0020, 0202...): each one used to be saved, could mark the
    // task completed and push SLA dates to the year 1902.
    if (!isPlausibleDateStr(newCompletedAtDate) || !onUpdateTask) return;
    const task = (client.tasks || []).find(t => t.id === taskId);
    if (!task) return;
    onUpdateTask(client.id, {
      ...task,
      completed: true,
      completedAt: newCompletedAtDate
    });
  };

  // Change task due date directly
  const handleUpdateDueDate = (taskId: string, newDueDate: string) => {
    if (!isPlausibleDateStr(newDueDate) || !onUpdateTask) return;
    const task = (client.tasks || []).find(t => t.id === taskId);
    if (!task) return;
    onUpdateTask(client.id, {
      ...task,
      dueDate: newDueDate
    });
  };

  // Save task notes
  const handleSaveNotes = (taskId: string) => {
    if (onUpdateTask) {
      const task = (client.tasks || []).find(t => t.id === taskId);
      if (!task) return;
      onUpdateTask(client.id, {
        ...task,
        notes: taskNotes
      });
    }
    setEditingTaskId(null);
  };

  // Delete task
  const handleDeleteTask = (taskId: string) => {
    setConfirmModalConfig({
      isOpen: true,
      title: 'حذف المهمة',
      message: 'هل أنت متأكد من حذف هذه المهمة من رحلة العميل؟',
      confirmText: 'حذف المهمة',
      variant: 'danger',
      onConfirm: () => {
        if (onDeleteTask) {
          onDeleteTask(client.id, taskId);
        }
      }
    });
  };

  // Delete all tasks for this client
  const handleClearAllTasks = () => {
    const tasksCount = (client.tasks || []).length;
    if (tasksCount === 0 || !onClearClientTasks) return;

    setConfirmModalConfig({
      isOpen: true,
      title: 'حذف كافة المهام لهذا العميل',
      message: `هل أنت متأكد من حذف جميع المهام (${tasksCount} مهمة) نهائياً لهذا العميل؟ سيتم بعدها عرض مصفوفة المهام الافتراضية للعقد من جديد. لا يمكن التراجع عن هذه الخطوة.`,
      confirmText: 'حذف كل المهام',
      variant: 'danger',
      onConfirm: async () => {
        // One batched delete instead of one request (and one log entry) per task.
        await onClearClientTasks(client.id);
      }
    });
  };

  // Re-sync and update all tasks for this client with the new matrix & SLA logic
  const handleSyncClientTasksMatrix = () => {
    if (!onSyncClientTasks) return;
    setConfirmModalConfig({
      isOpen: true,
      title: 'تطبيق مصفوفة المهام المحدثة',
      message: `هل ترغب في تحديث وجدولة كافة مهام "${client.clientName}" وفق مصفوفة المهام المحدثة وتاريخ بداية العمل (${client.startDate}) وقواعد الـ SLA؟ سيتم الحفاظ التام على المهام المكتملة مسبقاً وعلى الملاحظات والمهام المضافة يدوياً.`,
      confirmText: 'تحديث وجدولة المهام',
      variant: 'primary',
      onConfirm: async () => {
        // Calculated by the data layer from the newest copy of the client (not from this page's props).
        const ok = await onSyncClientTasks(client.id);
        if (ok !== false) {
          toast.success('تم تحديث وجدولة مهام العميل بنجاح وفق النظام المحدث!');
        }
      }
    });
  };

  const handleDeleteClient = () => {
    setConfirmModalConfig({
      isOpen: true,
      title: 'حذف العميل نهائياً',
      message: 'هل أنت متأكد من حذف هذا العميل وجميع البيانات الخاصة به؟ لا يمكن التراجع عن هذه الخطوة.',
      confirmText: 'حذف العميل',
      variant: 'danger',
      onConfirm: async () => {
        onBack();
        await onDeleteClient(client.id);
      }
    });
  };

  const isExpired = contractDaysDiff < 0 || client.isLost;


  const handleExportTasksPDF = () => {
    // Every value is escaped: the report opens in a same-origin window, so a task note such as
    // <img src=x onerror=...> written by any staff member used to run as whoever exported the PDF.
    const esc = (value: unknown) => String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('الرجاء السماح بالنوافذ المنبثقة (Pop-ups) لطباعة التقرير');
      return;
    }

    const filteredTasks = client.tasks || [];

    const htmlContent = `
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <title>تقرير مهام - ${esc(client.clientName)}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
          @page {
            size: A4 portrait;
            margin: 12mm 10mm 12mm 10mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body { 
            font-family: 'Cairo', sans-serif; 
            padding: 20px; 
            color: #0f172a; 
            background: #ffffff;
            line-height: 1.6;
            direction: rtl;
            text-align: right;
            width: 100%;
            margin: 0;
          }
          .header { 
            text-align: center; 
            margin-bottom: 24px; 
            border-bottom: 2px solid #0f172a; 
            padding-bottom: 16px; 
            page-break-inside: avoid;
            break-inside: avoid;
          }
          h1 { color: #0f172a; margin: 0 0 8px 0; font-size: 22px; font-weight: 800; }
          .client-info { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 24px; 
            background: #f8fafc; 
            padding: 16px 20px; 
            border-radius: 10px;
            border: 1px solid #cbd5e1;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .info-item {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }
          .info-label { font-size: 12px; color: #475569; font-weight: 600; }
          .info-value { font-size: 15px; color: #0f172a; font-weight: 800; }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 16px; 
          }
          thead {
            display: table-header-group;
          }
          th, td { 
            border: 1px solid #cbd5e1; 
            padding: 10px 12px; 
            text-align: right; 
          }
          th { 
            background-color: #f1f5f9; 
            font-weight: 800; 
            color: #0f172a;
            font-size: 13px;
          }
          td { font-size: 13px; }
          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .status-badge {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 700;
          }
          .status-completed { background: #d1fae5; color: #047857; }
          .status-delayed { background: #ffe4e6; color: #be123c; }
          .status-pending { background: #fef3c7; color: #b45309; }
          .footer {
            margin-top: 36px;
            text-align: center;
            font-size: 11px;
            color: #64748b;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          @media print {
            body { padding: 0; width: 100%; }
            .client-info { break-inside: avoid; page-break-inside: avoid; }
            table { break-inside: auto; width: 100%; }
            tr { break-inside: avoid !important; page-break-inside: avoid !important; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>تقرير متابعة المهام</h1>
          <p style="margin: 0; color: #64748b;">${esc(client.companyName || '')}</p>
        </div>
        <div class="client-info">
          <div class="info-item">
            <span class="info-label">اسم العميل</span>
            <span class="info-value">${esc(client.clientName)}</span>
          </div>
          <div class="info-item">
            <span class="info-label">كود العميل</span>
            <span class="info-value">${esc(client.code)}</span>
          </div>
          <div class="info-item">
            <span class="info-label">إجمالي المهام</span>
            <span class="info-value">${filteredTasks.length}</span>
          </div>
          <div class="info-item">
            <span class="info-label">تاريخ التقرير</span>
            <span class="info-value">${new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th width="35%">المهمة</th>
              <th width="15%">القسم</th>
              <th width="15%">الاستحقاق</th>
              <th width="15%">الحالة</th>
              <th width="20%">ملاحظات</th>
            </tr>
          </thead>
          <tbody>
            ${filteredTasks.map(task => {
              const isCompleted = task.completed;
              const catInfo = CATEGORIES_INFO.find(c => c.id === task.category);
              const daysDiff = getDaysDifference(task.dueDate);
              
              let statusText = '';
              let statusClass = '';
              
              if (isCompleted) {
                statusText = 'مكتملة';
                statusClass = 'status-completed';
              } else if (daysDiff < 0) {
                statusText = 'متأخرة';
                statusClass = 'status-delayed';
              } else {
                statusText = 'قيد التنفيذ';
                statusClass = 'status-pending';
              }

              return `
                <tr>
                  <td style="font-weight: 600;">${esc(task.title)}</td>
                  <td>${esc(catInfo ? catInfo.nameAr : task.category)}</td>
                  <td>${esc(formatDateArabic(task.dueDate))}</td>
                  <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                  <td style="color: #64748b;">${esc(task.notes || '-')}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        <div class="footer">
          تم إنشاء هذا التقرير تلقائياً من نظام الإدارة
        </div>
        <script>
          window.onload = () => { 
            setTimeout(() => {
              window.print(); 
              window.close(); 
            }, 500);
          };
        </script>
      </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 pb-12 print:space-y-4 print:pb-0">
      
      {/* Official Print Report Header (Visible Only in Print) */}
      <div className="hidden print:flex flex-col border-b-2 border-slate-900 pb-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900">تقرير تفاصيل العميل ومراحل العمل</h1>
            <p className="text-sm font-bold text-slate-600 mt-1">
              العميل: {client.clientName} | كود العميل: {client.code} {client.companyName ? `| الشركة: ${client.companyName}` : ''}
            </p>
          </div>
          <div className="text-left text-xs text-slate-600 font-mono space-y-0.5">
            <div>تاريخ التقرير: {new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            <div>حالة الحساب: {client.caseStatus} | نوع العقد: {client.contract || 'عام'} ({client.durationMonths} شهر)</div>
          </div>
        </div>
      </div>

      {/* Reading Mode Focused Alert Banner */}
      {isReadingMode && (
        <div className="bg-amber-500/10 dark:bg-amber-950/40 border border-amber-500/30 rounded-2xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900 dark:text-amber-200 shadow-xs print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-sm block">نمط القراءة والتركيز (Reading Mode) مفعّل</span>
              <span className="text-xs opacity-90 block mt-0.5">تم إخفاء أزرار التعديل والحذف واللوحات التفاعلية الجانبية لضمان تجربة مراجعة هادئة وبدون تشتيت.</span>
            </div>
          </div>
          {onToggleReadingMode && (
            <button
              onClick={onToggleReadingMode}
              className="px-3.5 py-1.5 text-xs font-extrabold bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition-all shrink-0 shadow-xs"
            >
              إلغاء نمط القراءة
            </button>
          )}
        </div>
      )}

      {/* Top Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-bold text-[var(--text)] hover:text-indigo-600 dark:hover:text-indigo-400 bg-[var(--surface)] hover:bg-slate-50 dark:hover:bg-slate-800 px-3.5 py-2 rounded-xl border border-[var(--border)] transition-all shadow-xs"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة إلى قائمة العملاء</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {/* Print Report Button */}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all border bg-[var(--surface)] text-[var(--text)] hover:bg-slate-50 dark:hover:bg-slate-800 border-[var(--border)] shadow-xs"
            title="طباعة تفاصيل العميل والمهام كتقرير احترافي"
          >
            <Printer className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>طباعة التقرير</span>
          </button>

          {!isReadingMode && !isExpired && (
            <button
              onClick={handleMarkLost}
              className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/80 border border-rose-200 dark:border-rose-800 px-3 py-2 rounded-xl transition-all"
            >
              إنهاء / مفقود
            </button>
          )}
          {!isReadingMode && isExpired && (
            <button
              onClick={handleRenew}
              className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 border border-emerald-200 dark:border-emerald-800 px-3 py-2 rounded-xl transition-all"
            >
              تجديد العقد
            </button>
          )}

          <button
            onClick={handleCopyClientData}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all border ${
              copied
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                : 'bg-[var(--surface)] text-[var(--text)] hover:bg-slate-50 dark:hover:bg-slate-800 border-[var(--border)]'
            }`}
            title="نسخ جميع بيانات العميل إلى الحافظة"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copied ? 'تم النسخ!' : 'نسخ بيانات العميل'}</span>
          </button>

          {/* Copy Client Portal Link Button */}
          <button
            onClick={handleCopyPortalLink}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-all border cursor-pointer ${
              copiedPortalLink
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                : 'bg-[#593BFE]/10 hover:bg-[#593BFE]/20 text-[#593BFE] dark:text-purple-300 border-[#593BFE]/30'
            }`}
            title="نسخ رابط بوابة العميل للمشاركة المباشرة"
          >
            {copiedPortalLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <LinkIcon className="w-3.5 h-3.5 text-[#593BFE]" />}
            <span>{copiedPortalLink ? 'تم نسخ الرابط!' : 'نسخ رابط العميل'}</span>
          </button>

          {!isReadingMode && (
            <>
              <button
                onClick={() => onOpenEditClient(client)}
                className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text)] bg-[var(--surface)] hover:bg-slate-50 dark:hover:bg-slate-800 border border-[var(--border)] px-3 py-2 rounded-xl transition-all"
              >
                <Edit3 className="w-3.5 h-3.5" />
                تعديل
              </button>

              {isAdmin && (<button
                onClick={handleDeleteClient}
                className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-[var(--surface)] hover:bg-rose-50 dark:hover:bg-rose-950/60 border border-[var(--border)] px-3 py-2 rounded-xl transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                حذف العميل
              </button>)}

              <button
                onClick={() => onOpenAddActivation(client.id)}
                className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 border border-indigo-200 dark:border-indigo-800 px-3 py-2 rounded-xl transition-all"
              >
                <Plus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                تفعيل يومي
              </button>
              
              <button
                onClick={() => onOpenAddTask(client.id)}
                className="flex items-center gap-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-xl shadow-xs transition-all"
              >
                <Plus className="w-4 h-4" />
                تاسك جديد
              </button>
            </>
          )}
        </div>
      </div>

      {/* VIP Animated Banner */}
      {client.isVip && (
        <div className="print:hidden">
          <VipBanner 
            clientName={client.clientName} 
            onToggleVip={isReadingMode ? undefined : () => onUpdateClient({ id: client.id, isVip: false })}
          />
        </div>
      )}

      {/* Main Client Profile Header Box */}
      <div className={`bg-[var(--surface)] rounded-2xl border print-break-inside-avoid data-client-card ${
        client.isVip 
          ? 'border-amber-400/80 dark:border-amber-500/80 shadow-amber-500/10 shadow-lg' 
          : isExpired 
            ? 'border-rose-200/50 dark:border-rose-900/30 opacity-75 grayscale-[0.3]' 
            : 'border-[var(--border)]'
      } shadow-xs overflow-hidden relative`}>
        {isExpired && (
          <div className="absolute inset-0 bg-slate-50/40 dark:bg-slate-900/40 z-10 pointer-events-none" />
        )}
        
        {/* Color Top Stripe */}
        <div className={`h-2 ${
          client.isVip
            ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600'
            : isExpired 
              ? 'bg-rose-500/50' 
              : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500'
        }`} />

        <div className="p-6 relative z-20">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            
            {/* Main Information */}
            <div className="space-y-4 w-full">
              <div className="flex items-center gap-2.5 flex-wrap">

                <button
                  onClick={() => onUpdateClient({ id: client.id, isVip: !client.isVip })}
                  disabled={isReadingMode}
                  title={client.isVip ? 'إلغاء شارة VIP' : 'تمبيز كـ عميل VIP'}
                  className="transition-transform active:scale-95 cursor-pointer flex items-center h-[26px]"
                >
                  {client.isVip ? (
                    <VipBadge size="md" showText={true} className="!py-0 h-[26px]" />
                  ) : (
                    <span className="h-[26px] px-2.5 rounded-full text-xs font-bold border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 flex items-center gap-1 transition-colors">
                      <Crown className="w-3.5 h-3.5 text-amber-500" />
                      تمييز VIP
                    </span>
                  )}
                </button>
                <span className="h-[26px] px-3 bg-slate-900 dark:bg-slate-800 text-white rounded-lg text-xs font-bold font-mono border border-transparent dark:border-slate-700 flex items-center">
                  كود العميل: {client.code}
                </span>
                {client.companyName && (
                  <span className={`h-[26px] px-3 rounded-lg text-xs font-extrabold flex items-center gap-1.5 border shadow-xs ${companyBadgeMap[client.companyName] || 'bg-slate-800 text-white'}`}>
                    {client.companyName === 'AL - Ahly' ? (
                      <div className="flex items-center justify-center w-[20px] h-[20px] rounded bg-white dark:bg-transparent dark:border-transparent dark:shadow-none overflow-hidden border border-slate-200 shadow-sm shrink-0">
                        <img src="https://i.ibb.co/d0KGfwr0/Chat-GPT-Image-Aug-8-2026-05-18-21-PM.png" alt="AL - Ahly" className="dark:hidden w-full h-full object-contain scale-90" />
                        <img src="https://i.ibb.co/RGwxNcLQ/image.png" alt="AL - Ahly" className="hidden dark:block w-full h-full object-contain scale-90" />
                      </div>
                    ) : client.companyName === 'Herak' ? (
                      <div className="flex items-center justify-center w-[20px] h-[20px] rounded bg-white dark:bg-transparent dark:border-transparent dark:shadow-none overflow-hidden border border-slate-200 shadow-sm shrink-0">
                        <img src="https://i.ibb.co/8nZzHJfw/image.png" alt="Herak" className="dark:hidden w-full h-full object-contain scale-90" />
                        <img src="https://i.ibb.co/39625k7S/image.png" alt="Herak" className="hidden dark:block w-full h-full object-contain scale-90" />
                      </div>
                    ) : client.companyName === 'SYT' ? (
                      <div className="flex items-center justify-center w-[20px] h-[20px] rounded bg-white dark:bg-transparent dark:border-transparent dark:shadow-none overflow-hidden border border-slate-200 shadow-sm shrink-0">
                        <img src="https://i.ibb.co/SDtvxvbQ/image.png" alt="SYT" className="dark:hidden w-full h-full object-contain scale-90" />
                        <img src="https://i.ibb.co/d0j14h76/image.png" alt="SYT" className="hidden dark:block w-full h-full object-contain scale-90" />
                      </div>
                    ) : (
                      <Building2 className="w-3.5 h-3.5 shrink-0" />
                    )}
                    الشركة: {client.companyName}
                  </span>
                )}
                <span className={`h-[26px] px-3 rounded-full text-xs font-bold border flex items-center ${stats.statusColor}`}>
                  {stats.statusLabel}
                </span>
                <span className={`h-[26px] px-3 rounded-full text-xs font-bold border flex items-center ${contractColorMap[activeColor]}`}>
                  نوع العقد: {client.contract}
                </span>
                <span className="h-[26px] px-3 bg-[var(--surface-hover)] text-[var(--text)] rounded-full text-xs font-semibold flex items-center">
                  مدة العقد: {client.durationMonths} {client.durationMonths === 1 ? 'شهر' : 'أشهر'} (+ 10 أيام)
                </span>
                {isExpired && (
                  <span className="h-[26px] px-3 bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-full text-xs font-bold flex items-center">
                    فقد / منتهي
                  </span>
                )}
                {client.renewalCount ? (
                  <span className="h-[26px] px-3 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-full text-xs font-bold flex items-center">
                    تم التجديد
                  </span>
                ) : null}
              
              </div>


              <div>
                <div className="flex flex-col items-start gap-2">
                  <div className="flex items-center gap-3">
                    <ClientLogo client={client} onUpdateClient={onUpdateClient} isReadingMode={isReadingMode} />
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                      {client.clientName}
                    </h1>
                  </div>
                  {(() => {
                    const elapsedContractDaysSinceStart = client.startDate ? -getDaysDifference(client.startDate) : -1;
                    const isFirst30Days = elapsedContractDaysSinceStart >= 0 && elapsedContractDaysSinceStart <= 30;
                    return isFirst30Days ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 shadow-xs">
                        ⭐ الشهر الأول (30 يوم)
                      </span>
                    ) : null;
                  })()}
                </div>
                {client.groupName && (
                  <div className="flex items-center gap-1.5 mt-2 text-[var(--text-muted)]">
                    <Users className="w-4 h-4 opacity-70" />
                    <p className="text-sm font-medium">
                      اسم الجروب: {client.groupName}
                    </p>
                  </div>
                )}
              </div>

              

              
              <div className="pt-2">
                <div className="relative group">
                  <div className="absolute top-3 right-3 text-slate-400 group-focus-within:text-indigo-500 transition-colors z-10">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  {/* Shown as text only once a brief is SAVED; checking the local draft here made the
                      box switch to read-only after the first typed letter of a new brief. */}
                  {!isEditingMiniBrief && client.miniBrief ? (
                    <div className="w-full text-sm bg-indigo-50/20 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/40 text-[var(--text)] rounded-xl py-4 pr-10 pl-12 shadow-sm relative min-h-[60px] whitespace-pre-wrap leading-relaxed overflow-hidden font-medium">
                      {localMiniBrief}
                      {(isAdmin || !client.isBriefLocked) && !isReadingMode && (
                        <button
                          onClick={() => setIsEditingMiniBrief(true)}
                          className="absolute left-2 top-2 p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors print:hidden"
                          title="تعديل النبذة"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="relative">
                      <textarea
                        value={localMiniBrief || ''}
                        onChange={(e) => setLocalMiniBrief(e.target.value)}
                        placeholder="اكتب بريف قسم المبيعات هنا... (متاح التعديل مرة واحدة فقط)"
                        className="w-full text-sm bg-indigo-50/30 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800/50 text-[var(--text)] rounded-xl py-3 pr-10 pl-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700/60 pb-12 leading-relaxed font-medium disabled:opacity-70 disabled:cursor-not-allowed"
                        rows={Math.max(3, localMiniBrief.split('\n').length)}
                        autoFocus={isEditingMiniBrief}
                        disabled={!isAdmin && client.isBriefLocked}
                      />
                      {(localMiniBrief || isEditingMiniBrief) && (isAdmin || !client.isBriefLocked) && (
                        <div className="absolute left-2 bottom-2 flex gap-2">
                          {isEditingMiniBrief && (
                            <button
                              onClick={() => {
                                setIsEditingMiniBrief(false);
                                setLocalMiniBrief(client.miniBrief || '');
                              }}
                              className="px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            >
                              إلغاء
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setIsEditingMiniBrief(false);
                              if (localMiniBrief !== (client.miniBrief || '')) {
                                onUpdateClient({ 
                                  id: client.id, 
                                  miniBrief: localMiniBrief,
                                  isBriefLocked: isAdmin ? !!client.isBriefLocked : true
                                });
                              }
                            }}
                            className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors flex items-center gap-1 shadow-sm"
                          >
                            <Save className="w-3.5 h-3.5" />
                            حفظ البريف
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>


              {client.notes && (
                <div 
                  onClick={() => setActiveSubTab('notes')}
                  className="text-xs text-[var(--text-muted)] bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-[var(--border)] max-w-2xl mt-3 flex items-start gap-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <StickyNote className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <div className="flex-1 line-clamp-2">
                    <span className="font-bold text-[var(--text)] ml-1">مذكرات العميل:</span>
                    {client.notes}
                  </div>
                </div>
              )}

              {/* Plan Links */}
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[var(--text)]">روابط الخطط والبلانات:</span>
                  <button 
                    onClick={handleEditPlansClick}
                    hidden={isReadingMode}
                    className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-0.5 print:hidden"
                  >
                    <Edit3 className="w-3 h-3" /> إدارة الروابط
                  </button>
                </div>

                {isEditingPlans ? (
                  <div className="flex flex-col gap-2 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-[var(--border)]">
                    {tempPlanLinks.map((link, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <input
                          type="text"
                          placeholder="الاسم"
                          value={link.title || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            setTempPlanLinks(prev => prev.map((l, i) => (i === idx ? { ...l, title: value } : l)));
                          }}
                          className="w-1/3 px-2 py-1 text-xs border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <input
                          type="url"
                          placeholder="الرابط"
                          value={link.url || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            setTempPlanLinks(prev => prev.map((l, i) => (i === idx ? { ...l, url: value } : l)));
                          }}
                          className="w-2/3 px-2 py-1 text-xs border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 dir-ltr"
                        />
                        <button
                          onClick={() => setTempPlanLinks(tempPlanLinks.filter((_, i) => i !== idx))}
                          className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/50 rounded"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => setTempPlanLinks([...tempPlanLinks, { title: '', url: '' }])}
                      className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-0.5 mt-1"
                    >
                      <Plus className="w-3 h-3" /> إضافة رابط جديد
                    </button>
                    <div className="flex justify-end gap-1.5 mt-1">
                      <button onClick={() => setIsEditingPlans(false)} className="px-2 py-1 text-xs text-[var(--text-muted)] hover:text-slate-700 dark:hover:text-slate-200 font-bold transition-colors">إلغاء</button>
                      <button onClick={handleSavePlans} className="flex items-center gap-1 px-2 py-1 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded transition-colors">
                        <Save className="w-3 h-3" /> حفظ
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {client.planLinks && client.planLinks.length > 0 ? (
                      client.planLinks.map((link, index) => (
                        <a
                          key={index}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold flex items-center justify-between bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 p-2 rounded-xl transition-colors"
                        >
                          <span className="truncate max-w-[180px]">{link.title || 'رابط خطة'}</span>
                          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                        </a>
                      ))
                    ) : (
                      <p className="text-[10px] text-[var(--text-muted)] text-center py-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-[var(--border)]">
                        لا يوجد خطط مضافة
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Influencer */}
              {client.influencer && (
                <div className="text-xs text-[var(--text-muted)] pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                  <span className="text-[var(--text-muted)]">المؤثر:</span>
                  <span className="font-bold text-[var(--text)]">{client.influencer}</span>
                </div>
              )}

              {/* Copy Data Button */}
              <button
                onClick={handleCopyClientData}
                className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all border mt-1 print:hidden ${
                  copied
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-[var(--text)] hover:bg-slate-100 dark:hover:bg-slate-700 border-[var(--border)]'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span>{copied ? 'تم نسخ كامل بيانات العميل!' : 'نسخ كامل البيانات'}</span>
              </button>

            </div>

          </div>

          {/* Progress Bar, Pie Chart & Contract Dates Bar */}
          <div className="mt-6 pt-6 border-t border-[var(--border)] grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 print:grid-cols-2">
            
            {/* Journey Progress */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between print-break-inside-avoid data-stat-card">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-[var(--text)] mb-2">
                  <span>نسبة إنجاز المهام الكلية:</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{stats.completedTasks} من {stats.totalTasks} ({stats.progressPercent}%)</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-3 rounded-full overflow-hidden mb-3">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      stats.delayedTasks > 0 ? 'bg-rose-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${stats.progressPercent}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs font-medium">
                <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400">
                  <span className="flex items-center gap-1.5 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    مهام مكتملة:
                  </span>
                  <span className="font-extrabold">{stats.completedTasks} تاسك</span>
                </div>

                <div className="flex items-center justify-between text-rose-700 dark:text-rose-400">
                  <span className="flex items-center gap-1.5 font-bold">
                    <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                    مهام متأخرة:
                  </span>
                  <span className="font-extrabold">{stats.delayedTasks} تاسك</span>
                </div>

                <div className="flex items-center justify-between text-indigo-700 dark:text-indigo-400">
                  <span className="flex items-center gap-1.5 font-bold">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
                    مهام قادمة / متبقية:
                  </span>
                  <span className="font-extrabold">{Math.max(0, stats.totalTasks - stats.completedTasks - stats.delayedTasks)} تاسك</span>
                </div>
              </div>
            </div>

            {/* Recharts Tasks Distribution Pie Chart */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between print-break-inside-avoid data-stat-card">
              <div className="flex items-center justify-between text-xs font-bold text-[var(--text)]">
                <span>مخطط نسب حالات المهام:</span>
                <span className="text-[10px] text-slate-400 font-semibold">{stats.totalTasks} تاسك</span>
              </div>

              {stats.totalTasks > 0 ? (
                <div className="h-44 w-full relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'مكتملة', value: stats.completedTasks, color: '#10b981' },
                          { name: 'متأخرة', value: stats.delayedTasks, color: '#f43f5e' },
                          { name: 'متبقية', value: Math.max(0, stats.totalTasks - stats.completedTasks - stats.delayedTasks), color: '#6366f1' },
                        ].filter(item => item.value > 0)}
                        cx="50%"
                        cy="45%"
                        innerRadius={30}
                        outerRadius={55}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {[
                          { name: 'مكتملة', value: stats.completedTasks, color: '#10b981' },
                          { name: 'متأخرة', value: stats.delayedTasks, color: '#f43f5e' },
                          { name: 'متبقية', value: Math.max(0, stats.totalTasks - stats.completedTasks - stats.delayedTasks), color: '#6366f1' },
                        ]
                          .filter(item => item.value > 0)
                          .map((entry, index) => (
                            <Cell key={`pie-cell-${index}`} fill={entry.color} stroke="none" />
                          ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(val: any, name: any) => [
                          `${val} تاسك (${Math.round((Number(val) / stats.totalTasks) * 100)}%)`,
                          name
                        ]}
                        contentStyle={{
                          backgroundColor: '#18181b',
                          borderColor: '#3f3f46',
                          borderRadius: '0.75rem',
                          color: '#fff',
                          fontSize: '11px',
                          direction: 'rtl'
                        }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={24}
                        iconType="circle"
                        formatter={(val) => (
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mx-1">{val}</span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-36 flex items-center justify-center text-xs text-slate-400 font-medium">
                  لا توجد مهام حالياً
                </div>
              )}
            </div>

            {/* 3-Month Trend Chart */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between print-break-inside-avoid data-stat-card">
              <div className="flex items-center justify-between text-xs font-bold text-[var(--text)] mb-2">
                <span>معدل الإنجاز (آخر 3 أشهر):</span>
              </div>
              <div className="h-44 w-full relative flex items-center justify-center pt-2">
                {trendData.length > 0 && trendData.some(d => d.total > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trendData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }} barSize={32}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#64748b" opacity={0.15} />
                      <XAxis 
                        dataKey="month" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
                        dy={5}
                      />
                      <RechartsTooltip
                        cursor={{ fill: '#64748b', opacity: 0.1 }}
                        formatter={(val, name, props) => [
                          `${val}% (${props.payload.completed}/${props.payload.total})`,
                          'نسبة الإنجاز'
                        ]}
                        contentStyle={{
                          backgroundColor: '#18181b',
                          borderColor: '#3f3f46',
                          borderRadius: '0.75rem',
                          color: '#fff',
                          fontSize: '11px',
                          direction: 'rtl'
                        }}
                      />
                      <Bar 
                        dataKey="rate" 
                        fill="#4f46e5" 
                        radius={[6, 6, 0, 0]}
                        animationDuration={1500}
                      >
                        {trendData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.rate > 80 ? '#10b981' : entry.rate < 40 ? '#f43f5e' : '#4f46e5'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-xs text-slate-400 font-medium">لا توجد مهام سابقة كافية</div>
                )}
              </div>
            </div>

            {/* Contract Dates & Automated Days Counter */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 text-xs flex flex-col justify-between gap-1.5 print-break-inside-avoid data-stat-card">
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-muted)] font-medium">تاريخ التعاقد:</span>
                <span className="font-bold text-[var(--text)]">
                  {client.contractDate ? formatDateArabic(client.contractDate) : 'غير محدد'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-muted)] font-medium">تاريخ بداية العمل:</span>
                <span className="font-bold text-[var(--text)]">
                  {formatDateArabic(client.startDate)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-muted)] font-medium">تاريخ النهاية:</span>
                <span className="font-bold text-[var(--text)]">
                  {formatDateArabic(client.endDate)}
                </span>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                <span className="text-[var(--text-muted)] font-medium">عد الأيام المتبقية للعقد:</span>
                <span className={`font-extrabold px-2.5 py-1 rounded-md text-xs ${
                  contractDaysDiff < 0
                    ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                    : contractDaysDiff <= 7
                    ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                    : 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-900 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                }`}>
                  {contractDaysDiff < 0
                    ? `انتهى العقد من ${Math.abs(contractDaysDiff)} يوم`
                    : `متبقي ${contractDaysDiff} يوم`}
                </span>
              </div>
              
              {client.lastUpdated && (
                <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                  <span className="text-[var(--text-muted)] font-medium">آخر تحديث:</span>
                  <span className="font-bold text-slate-500 flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    {new Date(client.lastUpdated).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>

      {/* Main Section Selector Tabs */}
      <div className="flex items-center gap-2 bg-slate-200/70 dark:bg-slate-800/80 p-1.5 rounded-2xl flex-wrap sm:flex-nowrap print:hidden">
        <button
          onClick={() => setActiveSubTab('tasks')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 min-w-[140px] ${
            activeSubTab === 'tasks'
              ? 'bg-[var(--surface)] text-[var(--text)] shadow-xs'
              : 'text-[var(--text-muted)] hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>جدول مراحل وتاسكات العقد ({client.tasks.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('activations')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 min-w-[140px] ${
            activeSubTab === 'activations'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-[var(--text-muted)] hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          <span>سجل التفعيل اليومي ({client.dailyActivations?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('timeline')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 min-w-[140px] ${
            activeSubTab === 'timeline'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-[var(--text-muted)] hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <History className="w-4 h-4 text-purple-300" />
          <span>الجدول الزمني (Timeline)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('activities')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 min-w-[140px] ${
            activeSubTab === 'activities'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-[var(--text-muted)] hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <Info className="w-4 h-4 text-emerald-300" />
          <span>سجل النشاطات (Activity Log)</span>
        </button>
        <button
          onClick={() => setActiveSubTab('notes')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 min-w-[140px] ${
            activeSubTab === 'notes'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-[var(--text-muted)] hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <StickyNote className="w-4 h-4 text-amber-200" />
          <span>مذكرات العميل</span>
        </button>
      </div>

      {activeSubTab === 'notes' ? (
        <ClientNotesSection 
          client={client}
          onUpdateClient={onUpdateClient}
          isReadingMode={isReadingMode}
        />
      ) : activeSubTab === 'activities' ? (
        <ClientActivitiesSection client={client} />
      ) : activeSubTab === 'timeline' ? (
        <ClientTimelineSection client={client} />
      ) : activeSubTab === 'activations' ? (
        <DailyActivationSection
          client={client}
          onDeleteActivation={onDeleteActivation}
          onOpenAddActivation={onOpenAddActivation}
          isReadingMode={isReadingMode}
        />
      ) : (
        <div className="space-y-6">
          {/* Task Tracker List */}
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-xs p-5">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-[var(--border)]">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 flex-wrap">
              <span>جدول تتبع رحلة العميل (Client Journey Tracker)</span>
              <span className="text-xs text-[var(--text-muted)] font-normal">
                (حساب التأخير والأيام تلقائياً)
              </span>
              {!isReadingMode && (
                <span className="text-[10px] bg-[var(--surface-hover)] text-[var(--text-muted)] font-bold px-2 py-0.5 rounded-md border border-[var(--border)] flex items-center gap-1 print:hidden">
                  <GripVertical className="w-3 h-3 text-slate-400" />
                  سحب وإفلات لترتيب أولوية التاسكات
                </span>
              )}
            </h2>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 px-3 py-1.5 rounded-xl border border-[var(--border)] shadow-xs transition-all shrink-0"
              title="طباعة تقرير المهام (A4)"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              طباعة
            </button>
            <button
              onClick={handleExportTasksPDF}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 px-3 py-1.5 rounded-xl border border-[var(--border)] shadow-xs transition-all shrink-0"
              title="تصدير جدول المهام كملف PDF"
            >
              <Download className="w-3.5 h-3.5" />
              تصدير PDF
            </button>
            {!isReadingMode && (
              <>
                <button
                  onClick={handleSyncClientTasksMatrix}
                  className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 transition-all shrink-0 cursor-pointer shadow-xs"
                  title="تطبيق وجدولة مصفوفة المهام المحدثة وفق تاريخ بداية العمل مع الحفاظ التام على المهام المكتملة"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  تحديث مصفوفة المهام
                </button>
                <button
                  onClick={() => onOpenAddTask(client.id)}
                  className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 transition-all shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  إضافة تاسك لهذه المرحلة
                </button>
                {client.tasks && client.tasks.length > 0 && (
                  <button
                    onClick={handleClearAllTasks}
                    className="flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/50 transition-all shrink-0"
                    title="حذف جميع مهام هذا العميل نهائياً"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    حذف كل التاسكات
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Task Status Filter Bar (All / In Progress / Completed Archive / Delayed) */}
        <div className="flex flex-wrap items-center gap-2 mb-3 bg-slate-100/80 dark:bg-slate-800/60 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 print:hidden">
          <button
            type="button"
            onClick={() => setTaskStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              taskStatusFilter === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>جميع المهام</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
              taskStatusFilter === 'all' ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white' : 'bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}>
              {taskCounts.all}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTaskStatusFilter('in_progress')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              taskStatusFilter === 'in_progress'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>قيد التنفيذ (المتبقية)</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
              taskStatusFilter === 'in_progress' ? 'bg-indigo-700 text-white' : 'bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}>
              {taskCounts.inProgress}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTaskStatusFilter('completed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              taskStatusFilter === 'completed'
                ? 'bg-emerald-600 text-white shadow-xs font-black'
                : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/50 border border-emerald-200/60 dark:border-emerald-800/40'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>المهام المكتملة (أرشيف الإنجاز)</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-black ${
              taskStatusFilter === 'completed' ? 'bg-emerald-700 text-white' : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300'
            }`}>
              {taskCounts.completed}
            </span>
          </button>

          {taskCounts.delayed > 0 && (
            <button
              type="button"
              onClick={() => setTaskStatusFilter('delayed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                taskStatusFilter === 'delayed'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 hover:bg-rose-100/60 dark:hover:bg-rose-900/50 border border-rose-200/60 dark:border-rose-800/40'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>المتأخرة</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-black ${
                taskStatusFilter === 'delayed' ? 'bg-rose-700 text-white' : 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300'
              }`}>
                {taskCounts.delayed}
              </span>
            </button>
          )}
        </div>

        {/* Completed Tasks Archive Banner */}
        {taskStatusFilter === 'completed' && (
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-3.5 mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-emerald-800 dark:text-emerald-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="font-bold">
                أرشيف المهام المكتملة: تم إنجاز {taskCounts.completed} مهمة بنجاح من أصل {taskCounts.all} ({stats.progressPercent}%)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setTaskStatusFilter('all')}
              className="text-[11px] underline font-bold hover:text-emerald-950 dark:hover:text-emerald-100 self-end sm:self-auto cursor-pointer"
            >
              عرض جميع المهام (إلغاء الفلتر)
            </button>
          </div>
        )}

        {/* Category Filters Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4 scrollbar-thin print:hidden">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              selectedCategory === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-[var(--text-muted)] hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <span>جميع المراحل والمهام</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              selectedCategory === 'all' ? 'bg-indigo-700 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}>
              {clientTasks.length}
            </span>
          </button>

          {CATEGORIES_INFO.map(cat => {
            const catCount = clientTasks.filter(t => t.category === cat.id).length;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-[var(--text-muted)] hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <span>{cat.nameAr}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-indigo-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                  {catCount}
                </span>
              </button>
            );
          })}
        </div>

        {/* Print-Only Subheader */}
        <div className="hidden print:flex items-center justify-between text-xs font-bold text-slate-800 py-1.5 mb-3 border-b border-slate-300">
          <span>قائمة المهام ({filteredTasks.length} مهمة)</span>
          <span>مكتملة: {stats.completedTasks} | متأخرة: {stats.delayedTasks} | نسبة الإنجاز: {stats.progressPercent}%</span>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-[var(--border)]">
            {taskStatusFilter === 'completed' ? (
              <>
                <CheckCircle2 className="w-8 h-8 text-emerald-500/60 dark:text-emerald-400/60 mx-auto mb-2" />
                <h3 className="text-xs font-bold text-[var(--text)]">لا توجد مهام مكتملة في هذا القسم حالياً</h3>
                <p className="text-[11px] text-[var(--text-muted)] mt-1">عند اكتمال أي مهمة، سيتم إدراجها تلقائياً هنا في أرشيف الإنجاز</p>
                <button
                  type="button"
                  onClick={() => { setTaskStatusFilter('all'); setSelectedCategory('all'); }}
                  className="mt-3 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  عرض جميع مهام العميل
                </button>
              </>
            ) : taskStatusFilter === 'delayed' ? (
              <>
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-400">لا توجد أي مهام متأخرة!</h3>
                <p className="text-[11px] text-[var(--text-muted)] mt-1">سير العمل متوافق مع الجدول الزمني</p>
              </>
            ) : (
              <>
                <Activity className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto mb-2" />
                <h3 className="text-xs font-bold text-[var(--text)]">لا توجد مهام مطابقة حالياً</h3>
                <p className="text-[11px] text-[var(--text-muted)] mt-1">يمكنك إضافة تاسك جديد بنقرة واحدة</p>
                <button
                  onClick={() => onOpenAddTask(client.id)}
                  className="mt-3 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  إضافة تاسك جديد
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map(task => {
              const timeStatus = getTaskTimeStatus(task, progressRefDate);
              const categoryObj = CATEGORIES_INFO.find(c => c.id === task.category);
              const isBeingDragged = draggedTaskId === task.id;
              const isDragOver = dragOverTaskId === task.id;

              let monthIndex = task.monthIndex;
              let displayTitle = task.title || '';
              if (!monthIndex && task.taskNumber) {
                const match = task.taskNumber.match(/-M(\d+)$/);
                if (match) monthIndex = parseInt(match[1], 10);
              }
              if (!monthIndex && displayTitle) {
                const titleMatch = displayTitle.match(/\(الشهر (\d+)\)$/);
                if (titleMatch) monthIndex = parseInt(titleMatch[1], 10);
              }
              if (monthIndex && displayTitle) {
                displayTitle = displayTitle.replace(/\s*\(الشهر \d+\)$/, '');
              }
              const monthColorClass = monthIndex ? MONTH_COLORS[(monthIndex - 1) % MONTH_COLORS.length] : '';
              const monthCardColorClass = monthIndex ? MONTH_CARD_COLORS[(monthIndex - 1) % MONTH_CARD_COLORS.length] : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800';

              return (
                <div
                  key={task.id}
                  draggable={!isReadingMode}
                  onDragStart={(e) => {
                    setDraggedTaskId(task.id);
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', task.id);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    if (dragOverTaskId !== task.id) {
                      setDragOverTaskId(task.id);
                    }
                  }}
                  onDragLeave={(e) => {
                    if (dragOverTaskId === task.id) {
                      setDragOverTaskId(null);
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (draggedTaskId && draggedTaskId !== task.id) {
                      handleReorderTasks(draggedTaskId, task.id);
                    }
                    setDraggedTaskId(null);
                    setDragOverTaskId(null);
                  }}
                  onDragEnd={() => {
                    setDraggedTaskId(null);
                    setDragOverTaskId(null);
                  }}
                  className={`group relative p-4 pr-5 rounded-2xl border transition-all duration-300 overflow-hidden shadow-sm hover:shadow-md print-break-inside-avoid data-task-card ${monthCardColorClass} ${
                    isBeingDragged
                      ? 'opacity-40 scale-[0.99] border-dashed !border-indigo-500 !bg-indigo-50/50 dark:!bg-indigo-950/50'
                      : isDragOver
                      ? 'ring-2 ring-indigo-500 !border-indigo-500 !bg-indigo-50/50 dark:!bg-indigo-950/50 scale-[1.01]'
                      : task.completed
                      ? 'opacity-60 !border-emerald-300 dark:!border-emerald-800'
                      : timeStatus.type === 'overdue'
                      ? 'ring-1 ring-rose-400 !border-rose-400 dark:!border-rose-700'
                      : timeStatus.type === 'due_today' || timeStatus.type === 'due_soon'
                      ? 'ring-1 ring-amber-400 !border-amber-400 dark:!border-amber-700'
                      : 'hover:border-indigo-300 dark:hover:border-indigo-700'
                  }`}
                >
                  {/* Status Accent Line */}
                  <div className={`absolute top-0 right-0 bottom-0 w-1.5 transition-colors ${
                    task.completed ? 'bg-emerald-500' 
                    : timeStatus.type === 'overdue' ? 'bg-rose-500' 
                    : timeStatus.type === 'due_today' || timeStatus.type === 'due_soon' ? 'bg-amber-400' 
                    : 'bg-transparent group-hover:bg-slate-300 dark:group-hover:bg-slate-700'
                  }`} />
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 relative z-10">
                    
                    {/* Checkbox & Task Info */}
                    <div className="flex items-start gap-2.5">
                      
                      {/* Drag Grip Handle */}
                      {!isReadingMode && (
                        <div 
                          className="p-1 mt-0.5 cursor-grab active:cursor-grabbing text-slate-300 hover:text-indigo-600 dark:text-slate-600 dark:hover:text-indigo-400 transition-colors shrink-0 print:hidden"
                          title="اسحب لترتيب الأولوية"
                        >
                          <GripVertical className="w-4 h-4" />
                        </div>
                      )}

                      {/* Checkbox (read-only in reading mode, as the reading-mode banner promises) */}
                      <button
                        onClick={() => handleToggleTask(task.id)}
                        disabled={isReadingMode}
                        className={`mt-0.5 p-1 rounded-full border-2 transition-all shrink-0 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 ${
                          task.completed
                            ? 'bg-emerald-500 border-emerald-500 text-white scale-110 shadow-sm'
                            : timeStatus.type === 'overdue'
                            ? 'bg-white dark:bg-slate-900 border-rose-300 dark:border-rose-700 hover:border-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/50 text-transparent'
                            : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 text-transparent'
                        }`}
                        title={task.completed ? 'تعيين كغير مكتمل' : 'تعيين كمكتمل'}
                      >
                        <CheckCircle2 className="w-4 h-4" strokeWidth={3} />
                      </button>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] uppercase tracking-wider font-bold font-mono px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                            {task.taskNumber || 'TSK'}
                          </span>
                          
                          {categoryObj && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                              task.completed 
                                ? 'bg-emerald-100/50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-300' 
                                : categoryObj.color
                            }`}>
                              {categoryObj.nameAr}
                            </span>
                          )}

                          {monthIndex ? (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                              task.completed 
                                ? 'bg-slate-100/50 border-slate-200 text-slate-500 dark:bg-slate-800/30 dark:border-slate-700 dark:text-slate-400' 
                                : monthColorClass
                            }`}>
                              الشهر {monthIndex}
                            </span>
                          ) : null}

                          {/* Day Counter & Status Badge */}
                          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                            task.completed ? 'bg-emerald-100/50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-300' : timeStatus.badgeClass
                          }`}>
                            {task.completed ? 'مكتملة' : timeStatus.label}
                          </span>
                        </div>

                        <h3 className={`text-sm font-bold ${task.completed ? 'line-through text-[var(--text-muted)]' : 'text-slate-900 dark:text-slate-100'}`}>
                          {displayTitle}
                        </h3>

                        {/* Task Notes */}
                        {editingTaskId === task.id ? (
                          <div className="mt-2 flex items-center gap-2">
                            <input
                              type="text"
                              value={taskNotes || ''}
                              onChange={(e) => setTaskNotes(e.target.value)}
                              placeholder="أدخل ملاحظات للتاسك..."
                              className="text-xs px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-0 focus:bg-slate-100 dark:focus:bg-slate-800 w-full transition-colors"
                            />
                            <button
                              onClick={() => handleSaveNotes(task.id)}
                              className="text-xs font-bold bg-indigo-600 text-white px-3 py-1.5 rounded-lg shrink-0"
                            >
                              حفظ
                            </button>
                            <button
                              onClick={() => setEditingTaskId(null)}
                              className="text-xs text-[var(--text-muted)] px-2 py-1.5"
                            >
                              إلغاء
                            </button>
                          </div>
                        ) : (
                          task.notes && (
                            <p className="text-xs text-[var(--text-muted)] font-medium flex items-center gap-1.5 mt-1">
                              <Info className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                              <span>{task.notes}</span>
                            </p>
                          )
                        )}
                      </div>

                    </div>

                    {/* Dates & Actions */}
                    <div className="flex items-center justify-between md:justify-end gap-3 text-xs pt-2 md:pt-0 border-t md:border-t-0 border-[var(--border)] flex-wrap">
                      
                      {/* Due Date (Editable) */}
                      <div className="text-right sm:text-right">
                        <div className="text-[var(--text-muted)] text-[10px] font-medium mb-1">تاريخ التسليم المحدد</div>
                        <div className="relative flex items-center bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 px-2.5 py-1 rounded-xl hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all shadow-[0_2px_10px_rgb(0,0,0,0.02)] group">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 transition-colors shrink-0 absolute right-2.5 pointer-events-none print:hidden" />
                          <span className="hidden print:inline font-bold text-xs text-slate-900 pr-1">
                            {task.dueDate ? formatDateArabic(task.dueDate) : 'غير محدد'}
                          </span>
                          <input
                            type="date"
                            value={task.dueDate || ''}
                            disabled={isReadingMode}
                            onChange={(e) => handleUpdateDueDate(task.id, e.target.value)}
                            className="bg-transparent border-0 p-0 pl-1 pr-6 text-xs font-bold text-[var(--text)] focus:ring-0 focus:border-transparent cursor-pointer w-full text-left print:hidden"
                            title="تحديد أو تغيير تاريخ التسليم المحدد"
                          />
                        </div>
                      </div>

                      {/* Completion Date (Editable) */}
                      <div className="text-right sm:text-right">
                        <div className="text-[var(--text-muted)] text-[10px] font-medium mb-1">تاريخ الإنجاز (تم في)</div>
                        {task.completed ? (
                          <div className="relative flex items-center bg-emerald-500/10 dark:bg-emerald-500/20 backdrop-blur-md border border-emerald-500/20 dark:border-emerald-500/30 px-2.5 py-1 rounded-xl transition-all shadow-[0_2px_10px_rgb(16,185,129,0.05)] group">
                            <CalendarCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 absolute right-2.5 pointer-events-none print:hidden" />
                            <span className="hidden print:inline font-bold text-xs text-emerald-800 pr-1">
                              {task.completedAt ? formatDateArabic(task.completedAt) : 'مكتمل'}
                            </span>
                            <input
                              type="date"
                              value={task.completedAt || getTodayStr()}
                              disabled={isReadingMode}
                              onChange={(e) => handleUpdateCompletedAt(task.id, e.target.value)}
                              className="bg-transparent border-0 p-0 pl-1 pr-6 text-xs font-bold text-emerald-800 dark:text-emerald-300 focus:ring-0 focus:border-transparent cursor-pointer w-full text-left print:hidden"
                              title="اضغط لتغيير تاريخ الإنجاز"
                            />
                          </div>
                        ) : (
                          <div className="relative flex items-center bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 px-2.5 py-1 rounded-xl transition-all shadow-[0_2px_10px_rgb(0,0,0,0.02)] group">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-500 transition-colors shrink-0 absolute right-2.5 pointer-events-none print:hidden" />
                            <span className="hidden print:inline font-medium text-xs text-slate-500 pr-1">
                              قيد الانتظار
                            </span>
                            <input
                              type="date"
                              value={''}
                              disabled={isReadingMode}
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleUpdateCompletedAt(task.id, e.target.value);
                                }
                              }}
                              className="bg-transparent border-0 p-0 pl-1 pr-6 text-xs font-medium text-[var(--text-muted)] focus:ring-0 focus:border-transparent cursor-pointer w-full text-left print:hidden"
                              title="تحديد تاريخ الإنجاز وتعليمه كمكتمل"
                            />
                          </div>
                        )}
                      </div>

                      {!isReadingMode && (
                        <div className="flex items-center gap-1 print:hidden">
                          <button
                            onClick={() => {
                              setEditingTaskId(task.id);
                              setTaskNotes(task.notes || '');
                            }}
                            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title="تعديل ملاحظة التاسك"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition-colors"
                            title="حذف التاسك"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                    </div>

                  </div>
                  
                  {!isReadingMode && onUpdateTask && (
                    <div className="print:hidden">
                      <TaskComments 
                        task={task} 
                        onUpdateTask={(changes) => onUpdateTask(client.id, changes)} 
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>
      </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModalConfig.isOpen}
        onClose={() => setConfirmModalConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModalConfig.onConfirm}
        title={confirmModalConfig.title}
        message={confirmModalConfig.message}
        confirmText={confirmModalConfig.confirmText}
        variant={confirmModalConfig.variant}
      />

    </div>
  );
};
