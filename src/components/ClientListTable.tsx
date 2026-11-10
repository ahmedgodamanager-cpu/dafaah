import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Client, DashboardConfig } from '../types';
import { CheckSquare, Clock, Trash2, Archive, ArchiveRestore, Edit3, ArrowRightLeft, MoreVertical, Eye, MessageSquare, Key } from 'lucide-react';
import { getDaysDifference, getRemainingContractDays, getWhatsAppLink, formatDateArabic } from '../utils/dateUtils';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { ClientCredentialsModal } from './ClientCredentialsModal';

interface ClientListTableProps {
  clients: Client[];
  onSelect: (id: string) => void;
  onEdit: (client: Client) => void;
  onDelete?: (id: string) => void;
  onArchiveToggle?: (client: Client) => void;
  onAddTask: (id: string) => void;
  onUpdateClient?: (client: Partial<Client> & { id: string }) => Promise<boolean>;
  config: DashboardConfig;
  usersMap?: Record<string, string>;
}

const getStatusBadge = (status: string) => {
  const norm = (status || '').trim().toLowerCase();
  switch (norm) {
    case 'نشط':
    case 'active':
      return 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30';
    case 'hold':
      return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30';
    case 'جديد':
    case 'new':
      return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
    case 'مكتمل':
    case 'completed':
      return 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30';
    case 'مؤجل':
      return 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30';
    default:
      return 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30';
  }
};

const getContractBadge = (contract: string | undefined) => {
  if (!contract) return null;
  const lower = contract.toLowerCase();
  if (lower.includes('فل') || lower.includes('full')) {
    return 'bg-purple-500/15 text-purple-600 dark:text-purple-300 border-purple-500/30';
  }
  if (lower.includes('ميديا') || lower.includes('media')) {
    return 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 border-cyan-500/30';
  }
  if (lower.includes('سوشيال') || lower.includes('social')) {
    return 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border-indigo-500/30';
  }
  return 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30';
};

interface ClientTableRowProps {
  client: Client;
  onSelect: (id: string) => void;
  onToggleDropdown: (client: Client, e: React.MouseEvent<HTMLButtonElement>) => void;
  isMenuOpen: boolean;
  usersMap?: Record<string, string>;
}

const ClientTableRow = React.memo<ClientTableRowProps>(({
  client,
  onSelect,
  onToggleDropdown,
  isMenuOpen,
  usersMap,
}) => {
  // Memoize task progress percentage and remaining tasks based strictly on client.tasks
  const { completedTasks, totalTasks, remainingTasks, progressPercent } = useMemo(() => {
    const tasks = client.tasks || [];
    const total = tasks.length;
    let completed = 0;
    for (let i = 0; i < total; i++) {
      if (tasks[i].completed) completed++;
    }
    return {
      completedTasks: completed,
      totalTasks: total,
      remainingTasks: total - completed,
      progressPercent: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  }, [client.tasks]);

  const contractDaysDiff = useMemo(() => {
    return getRemainingContractDays(client);
  }, [client.endDate, client.startDate, client.durationMonths, client.caseStatus, client.isLost]);

  const isExpired = contractDaysDiff < 0 || client.isLost;
  const statusBadgeClass = useMemo(() => getStatusBadge(client.caseStatus), [client.caseStatus]);
  const contractBadgeClass = useMemo(() => getContractBadge(client.contract), [client.contract]);

  const elapsedContractDaysSinceStart = useMemo(() => {
    return client.startDate ? -getDaysDifference(client.startDate) : -1;
  }, [client.startDate]);

  const isFirst30Days = elapsedContractDaysSinceStart >= 0 && elapsedContractDaysSinceStart <= 30;

  const { profile } = useAuth();
  const canShowAssigned = profile?.role === 'admin' || profile?.role === 'account_manager_head';
  const assignedName = useMemo(() => {
    if (client.createdBy && usersMap && usersMap[client.createdBy]) {
      return usersMap[client.createdBy];
    }
    if (client.ownerName && client.ownerName.trim() !== '') {
      return client.ownerName.trim();
    }
    if (client.assignedToName && client.assignedToName.trim() !== '') {
      return client.assignedToName.trim();
    }
    if (client.assignedTo && client.assignedTo.trim() !== '') {
      if (usersMap && usersMap[client.assignedTo]) {
        return usersMap[client.assignedTo];
      }
      return client.assignedTo.trim();
    }
    if (client.accountManager && client.accountManager.trim() !== '') {
      return client.accountManager.trim();
    }
    if (client.createdBy && client.createdBy.trim() !== '') {
      return client.createdBy.trim();
    }
    return 'غير محدد';
  }, [client.ownerName, client.assignedToName, client.assignedTo, client.accountManager, client.createdBy, usersMap]);

  const handleSelectClient = useCallback(() => {
    onSelect(client.id);
  }, [onSelect, client.id]);

  const handleDropdownClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    onToggleDropdown(client, e);
  }, [onToggleDropdown, client]);

  return (
    <tr className="hover:bg-slate-50/90 dark:hover:bg-[#27272A]/60 transition-colors duration-200 group">
      <td className="py-4 px-6">
        <div className="flex flex-col gap-1 items-start">
          <button 
            type="button"
            className="font-bold text-[var(--text)] text-right hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
            onClick={handleSelectClient}
          >
            {client.clientName}
          </button>
          {isFirst30Days && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 shadow-xs">
              ⭐ الشهر الأول (30 يوم)
            </span>
          )}
        </div>
        {client.groupName && (
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate max-w-[180px]">
            {client.groupName}
          </div>
        )}
        <div className="text-xs text-[var(--text-muted)] flex items-center gap-1.5 mt-1 flex-wrap">
          <span className="font-mono text-[10px]">{client.code}</span>
          {canShowAssigned && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/25">
              <span>👤</span>
              <span className="font-normal text-indigo-300">المسؤول:</span>
              <span>{assignedName}</span>
            </span>
          )}
        </div>
      </td>
      <td className="py-4 px-6 whitespace-nowrap">
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${statusBadgeClass}`}>
          {client.caseStatus}
        </span>
      </td>
      <td className="py-4 px-6 whitespace-nowrap">
        {client.contract ? (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${contractBadgeClass || 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30'}`}>
            {client.contract}
          </span>
        ) : (
          <span className="text-slate-400 text-xs">-</span>
        )}
      </td>
      <td className="py-4 px-6 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[var(--text)] font-mono">{completedTasks} / {totalTasks}</span>
          <div className="flex-1 max-w-[80px] h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-[11px] text-[var(--text-muted)] font-mono">({remainingTasks} متبقي)</span>
        </div>
      </td>
      <td className="py-4 px-6 whitespace-nowrap">
        <div className="flex items-center gap-1.5">
          <Clock className={`w-3.5 h-3.5 ${isExpired ? 'text-red-500' : 'text-slate-400'}`} />
          <span className={`text-xs font-bold ${isExpired ? 'text-red-500' : contractDaysDiff <= 7 ? 'text-amber-500' : 'text-[var(--text-muted)]'}`}>
            {isExpired ? 'انتهى' : `متبقي ${contractDaysDiff} يوم`}
          </span>
        </div>
      </td>
      <td className="py-4 px-6 text-center whitespace-nowrap">
        <div className="flex justify-center items-center gap-2">
          <button 
            type="button"
            onClick={handleSelectClient}
            className="px-3 py-1.5 min-h-[32px] inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all whitespace-nowrap cursor-pointer"
            title="عرض تفاصيل العميل"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>عرض التفاصيل</span>
          </button>

          <button 
            type="button"
            onClick={handleDropdownClick}
            className={`w-8 h-8 inline-flex items-center justify-center rounded-xl transition-all active:scale-95 shadow-xs cursor-pointer border ${
              isMenuOpen 
                ? 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700' 
                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-700'
            }`}
            title="خيارات إضافية (تعديل، أرشفة، حذف)"
            aria-label="خيارات إضافية"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
});
ClientTableRow.displayName = 'ClientTableRow';

export const ClientListTable: React.FC<ClientListTableProps> = React.memo(({ 
  clients, 
  onSelect, 
  onEdit, 
  onDelete, 
  onArchiveToggle, 
  onAddTask, 
  onUpdateClient,
  config,
  usersMap,
}) => {
  const [activeMenu, setActiveMenu] = useState<{
    clientId: string;
    client: Client;
    top: number;
    left: number;
  } | null>(null);
  const [credentialsClient, setCredentialsClient] = useState<Client | null>(null);

  // Close dropdown on outside click, window resize, or table scroll
  useEffect(() => {
    if (!activeMenu) return;
    const handleClose = () => setActiveMenu(null);
    window.addEventListener('click', handleClose);
    window.addEventListener('scroll', handleClose, true);
    window.addEventListener('resize', handleClose);
    return () => {
      window.removeEventListener('click', handleClose);
      window.removeEventListener('scroll', handleClose, true);
      window.removeEventListener('resize', handleClose);
    };
  }, [activeMenu]);

  const toggleDropdown = useCallback((client: Client, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    // Measure the button NOW. React clears `e.currentTarget` as soon as this handler returns, and
    // a state updater may run later (during render, and twice in StrictMode), where reading it
    // crashed the whole page with "Cannot read properties of null".
    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 180;
    let left = rect.right - menuWidth;
    if (left < 10) left = 10;
    if (left + menuWidth > window.innerWidth - 10) {
      left = window.innerWidth - menuWidth - 10;
    }

    let top = rect.bottom + 6;
    if (top + 200 > window.innerHeight) {
      top = rect.top - 180;
    }

    setActiveMenu(prev => (
      prev?.clientId === client.id
        ? null
        : { clientId: client.id, client, top, left }
    ));
  }, []);

  const handleEditClick = useCallback(() => {
    if (!activeMenu) return;
    const c = activeMenu.client;
    setActiveMenu(null);
    onEdit(c);
  }, [activeMenu, onEdit]);

  const handleAddTaskClick = useCallback(() => {
    if (!activeMenu) return;
    const id = activeMenu.client.id;
    setActiveMenu(null);
    onAddTask(id);
  }, [activeMenu, onAddTask]);

  const handleArchiveToggleClick = useCallback(() => {
    if (!activeMenu || !onArchiveToggle) return;
    const c = activeMenu.client;
    setActiveMenu(null);
    onArchiveToggle(c);
  }, [activeMenu, onArchiveToggle]);

  const handleDeleteClick = useCallback(() => {
    if (!activeMenu || !onDelete) return;
    const id = activeMenu.client.id;
    setActiveMenu(null);
    onDelete(id);
  }, [activeMenu, onDelete]);

  const stopMenuPropagation = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-[var(--surface)] shadow-xs">
      {/* Mobile Scroll Indicator Banner */}
      <div className="sm:hidden flex items-center justify-between px-4 py-2.5 bg-indigo-50/70 dark:bg-indigo-950/40 text-[11px] text-indigo-700 dark:text-indigo-300 border-b border-indigo-100 dark:border-indigo-900/50">
        <div className="flex items-center gap-1.5 font-medium">
          <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span>اسحب الجدول أفقياً لرؤية كافة التفاصيل والإجراءات</span>
        </div>
        <span className="font-mono text-[10px] bg-indigo-100/80 dark:bg-indigo-900/60 px-1.5 py-0.5 rounded font-bold">
          {clients.length}
        </span>
      </div>

      <div className="overflow-x-auto max-h-[75vh] overflow-y-auto overscroll-contain custom-scrollbar touch-pan-x scrollbar-thin">
        <table className="w-full text-right border-collapse min-w-[760px]">
          <thead className="sticky top-0 z-20 bg-slate-100/95 dark:bg-[#18181B]/95 backdrop-blur-md shadow-xs transition-shadow">
            <tr className="border-b border-slate-200 dark:border-[#27272A] text-slate-600 dark:text-[#A1A1AA] text-sm font-medium">
              <th className="sticky top-0 z-20 py-3.5 px-6 font-semibold whitespace-nowrap min-w-[200px] bg-slate-100/95 dark:bg-[#18181B]/95 backdrop-blur-md shadow-[0_2px_4px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.25)]">
                اسم العميل / الكود
              </th>
              <th className="sticky top-0 z-20 py-3.5 px-6 font-semibold whitespace-nowrap min-w-[100px] bg-slate-100/95 dark:bg-[#18181B]/95 backdrop-blur-md shadow-[0_2px_4px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.25)]">
                حالة المشروع
              </th>
              <th className="sticky top-0 z-20 py-3.5 px-6 font-semibold whitespace-nowrap min-w-[100px] bg-slate-100/95 dark:bg-[#18181B]/95 backdrop-blur-md shadow-[0_2px_4px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.25)]">
                العقد
              </th>
              <th className="sticky top-0 z-20 py-3.5 px-6 font-semibold whitespace-nowrap min-w-[130px] bg-slate-100/95 dark:bg-[#18181B]/95 backdrop-blur-md shadow-[0_2px_4px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.25)]">
                المهام المنجزة
              </th>
              <th className="sticky top-0 z-20 py-3.5 px-6 font-semibold whitespace-nowrap min-w-[120px] bg-slate-100/95 dark:bg-[#18181B]/95 backdrop-blur-md shadow-[0_2px_4px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.25)]">
                المدة المتبقية
              </th>
              <th className="sticky top-0 z-20 py-3.5 px-6 font-semibold text-center whitespace-nowrap min-w-[160px] bg-slate-100/95 dark:bg-[#18181B]/95 backdrop-blur-md shadow-[0_2px_4px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.25)]">
                الإجراءات
              </th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-slate-100 dark:divide-slate-800/60">
            {clients.map(client => (
              <ClientTableRow
                key={client.id}
                client={client}
                onSelect={onSelect}
                onToggleDropdown={toggleDropdown}
                isMenuOpen={activeMenu?.clientId === client.id}
                usersMap={usersMap}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Floating Kebab Dropdown Menu Portal */}
      {activeMenu && createPortal(
        <div 
          style={{ top: `${activeMenu.top}px`, left: `${activeMenu.left}px` }}
          className="fixed z-[9999] bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-2xl shadow-xl p-1.5 min-w-[185px] text-right font-medium text-xs divide-y divide-slate-100 dark:divide-[#27272A] animate-in fade-in zoom-in-95 duration-100"
          onClick={stopMenuPropagation}
        >
          <div className="p-1 space-y-0.5">
            {/* Edit Option */}
            <button
              type="button"
              onClick={handleEditClick}
              className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#27272A] rounded-xl transition-colors text-right cursor-pointer"
            >
              <Edit3 className="w-4 h-4 text-indigo-500" />
              <span>تعديل بيانات العميل</span>
            </button>

            {/* Add Task Option */}
            <button
              type="button"
              onClick={handleAddTaskClick}
              className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#27272A] rounded-xl transition-colors text-right cursor-pointer"
            >
              <CheckSquare className="w-4 h-4 text-indigo-500" />
              <span>إضافة مهمة جديدة</span>
            </button>

            {/* WhatsApp Overdue Reminder Option */}
            <button
              type="button"
              onClick={() => {
                const c = activeMenu.client;
                if (!c.clientNumber) {
                  toast.error('لا يوجد رقم هاتف مسجل لهذا العميل');
                  return;
                }
                const tasks = c.tasks || [];
                let refDate = new Date();
                if (c.caseStatus === 'hold' && c.holdStartDate) {
                  refDate = new Date(c.holdStartDate);
                }
                const overdueTasks = tasks.filter(t => !t.completed && getDaysDifference(t.dueDate, refDate) < 0);
                const overdueCount = overdueTasks.length;
                let message = '';
                if (overdueCount > 0) {
                  const taskListPreview = overdueTasks
                    .slice(0, 5)
                    .map(t => `• ${t.title}${t.dueDate ? ` (موعد الاستحقاق: ${formatDateArabic(t.dueDate)})` : ''}`)
                    .join('\n');
                  const moreTasksText = overdueTasks.length > 5 ? `\n• و ${overdueTasks.length - 5} مهام أخرى...` : '';
                  message = `السلام عليكم ورحمة الله وبركاته،\nأهلاً بك أستاذ/ة ${c.clientName} 🌸\n\nنود إحاطتكم بخصوص متابعة سير العمل لمشروعكم (${c.companyName || 'رمّاح - Ramah'}):\nيوجد لدينا حالياً (${overdueCount}) ${overdueCount === 1 ? 'مهمة متأخرة تتطلب' : overdueCount === 2 ? 'مهمتان متأخرتان تتطلبان' : 'مهام متأخرة تتطلب'} المتابعة والاعتماد:\n\n${taskListPreview}${moreTasksText}\n\nيرجى التكرم بالاطلاع والمتابعة ليتسنى لفريق العمل مواصلة التنفيذ وفق الجدول المحدد.\n\nشاكرين ومقدرين حسن تعاونكم الدائم 🙏`;
                } else {
                  message = `السلام عليكم ورحمة الله وبركاته،\nأهلاً بك أستاذ/ة ${c.clientName} 🌸\n\nنود إحاطتكم بخصوص متابعة سير العمل لمشروعكم (${c.companyName || 'رمّاح - Ramah'}):\nنحيطكم علماً بأن جميع مهام العمل تسير وفق الجدول الزمني المحدد دون أي تأخير، وفريق العمل مستمر في التنفيذ بأعلى جودة.\n\nشاكرين ومقدرين حسن تعاونكم الدائم 🙏`;
                }
                const url = getWhatsAppLink(c.clientNumber, message);
                window.open(url, '_blank', 'noopener,noreferrer');
                setActiveMenu(null);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-xl transition-colors text-right cursor-pointer font-medium"
            >
              <MessageSquare className="w-4 h-4 text-emerald-500" />
              <span>مراسلة واتساب (حالة المهام)</span>
            </button>

            {/* Social & Salla & Ad Access Credentials Option */}
            <button
              type="button"
              onClick={() => {
                setCredentialsClient(activeMenu.client);
                setActiveMenu(null);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-xl transition-colors text-right cursor-pointer font-medium"
            >
              <Key className="w-4 h-4 text-[#593BFE]" />
              <span>حسابات سلة والسوشيال والأكسيس</span>
            </button>

            {/* Archive / Restore Option */}
            {onArchiveToggle && (
              <button
                type="button"
                onClick={handleArchiveToggleClick}
                className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/90 rounded-xl transition-colors text-right cursor-pointer"
              >
                {activeMenu.client.isArchived ? (
                  <>
                    <ArchiveRestore className="w-4 h-4 text-amber-500" />
                    <span>استعادة من الأرشيف</span>
                  </>
                ) : (
                  <>
                    <Archive className="w-4 h-4 text-amber-500" />
                    <span>أرشفة العميل</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Delete Option */}
          {onDelete && (
            <div className="p-1 pt-1">
              <button
                type="button"
                onClick={handleDeleteClick}
                className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors text-right font-bold cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-rose-500" />
                <span>حذف العميل</span>
              </button>
            </div>
          )}
        </div>,
        document.body
      )}

      {credentialsClient && (
        <ClientCredentialsModal
          isOpen={!!credentialsClient}
          onClose={() => setCredentialsClient(null)}
          client={credentialsClient}
          onSave={async (updated) => {
            if (onUpdateClient) {
              const ok = await onUpdateClient(updated);
              return ok;
            }
            try {
              const ref = doc(db, 'clients', credentialsClient.id);
              await updateDoc(ref, {
                credentials: updated.credentials,
                gmailEmail: updated.gmailEmail || '',
                lastUpdated: new Date().toISOString()
              });
              return true;
            } catch {
              return false;
            }
          }}
        />
      )}
    </div>
  );
});

ClientListTable.displayName = 'ClientListTable';
export default ClientListTable;
