import React, { useMemo, useCallback } from 'react';
import { 
  Folder, 
  MessageSquare, 
  Clock, 
  PlusCircle, 
  Edit3, 
  ArrowRightLeft, 
  CalendarDays, 
  Trash2, 
  Archive, 
  ArchiveRestore,
  Link as LinkIcon
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Client, DashboardConfig } from '../types';
import { getWhatsAppLink, getDaysDifference, getRemainingContractDays, formatDateArabic } from '../utils/dateUtils';
import { usePortalLink } from '../context/PortalLinkContext';
import { VipBadge } from './VipBadge';
import { useAuth } from '../context/AuthContext';

export interface ClientCardProps {
  client: Client;
  currentUserRole?: string;
  usersMap?: Record<string, string>;
  onSelect: (clientId: string) => void;
  /** Leave out to hide the edit button (e.g. on the Users page). */
  onEdit?: (client: Client) => void;
  onDelete?: (clientId: string) => void;
  onArchiveToggle?: (client: Client) => void;
  onAddTask?: (clientId: string) => void;
  onTransfer?: (clientId: string) => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onClientDragStart?: (e: React.DragEvent, clientId: string) => void;
  onClientDragOver?: (e: React.DragEvent, clientId: string) => void;
  onClientDragEnd?: (e: React.DragEvent) => void;
  onClientDrop?: (e: React.DragEvent, clientId: string) => void;
  isDragging?: boolean;
  isDragOver?: boolean;
  dashboardConfig?: DashboardConfig;
}

export const ClientCard: React.FC<ClientCardProps> = React.memo(({
  client,
  currentUserRole,
  onSelect,
  onEdit,
  onDelete,
  onArchiveToggle,
  onAddTask,
  onTransfer,
  draggable = false,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
  onClientDragStart,
  onClientDragOver,
  onClientDragEnd,
  onClientDrop,
  isDragging = false,
  isDragOver = false,
  dashboardConfig,
  usersMap,
}) => {
  const { profile } = useAuth();
  const effectiveRole = currentUserRole || profile?.role;
  const canShowAssignedBadge = effectiveRole === 'admin' || effectiveRole === 'account_manager_head';

  const assignedPersonName = useMemo(() => {
    // 1. If createdBy matches a registered user in usersMap, that is the true owner/creator
    if (client.createdBy && usersMap && usersMap[client.createdBy]) {
      return usersMap[client.createdBy];
    }
    // 2. Explicit owner name
    if (client.ownerName && client.ownerName.trim() !== '') {
      return client.ownerName.trim();
    }
    // 3. Assigned to name
    if (client.assignedToName && client.assignedToName.trim() !== '') {
      return client.assignedToName.trim();
    }
    // 4. Assigned to
    if (client.assignedTo && client.assignedTo.trim() !== '') {
      if (usersMap && usersMap[client.assignedTo]) {
        return usersMap[client.assignedTo];
      }
      return client.assignedTo.trim();
    }
    // 5. Account manager
    if (client.accountManager && client.accountManager.trim() !== '') {
      return client.accountManager.trim();
    }
    // 6. Created by (if already a name instead of an id)
    if (client.createdBy && client.createdBy.trim() !== '') {
      return client.createdBy.trim();
    }
    return 'غير محدد';
  }, [client.ownerName, client.assignedToName, client.assignedTo, client.accountManager, client.createdBy, usersMap]);

  // Memoize client progress percentage, remaining tasks, and task breakdown based strictly on client.tasks
  const stats = useMemo(() => {
    const tasks = client.tasks || [];
    const total = tasks.length;
    if (total === 0) {
      return {
        totalTasks: 0,
        completedTasks: 0,
        remainingTasks: 0,
        delayedTasks: 0,
        dueSoonTasks: 0,
        progressPercent: 0,
      };
    }

    let refDate = new Date();
    if (client.caseStatus === 'hold' && client.holdStartDate) {
      refDate = new Date(client.holdStartDate);
    }

    let completed = 0;
    let delayed = 0;
    let dueSoon = 0;

    for (let i = 0; i < total; i++) {
      const task = tasks[i];
      if (task.completed) {
        completed++;
      } else {
        const daysDiff = getDaysDifference(task.dueDate, refDate);
        if (daysDiff < 0) {
          delayed++;
        } else if (daysDiff <= 3) {
          dueSoon++;
        }
      }
    }

    const remaining = total - completed;
    const progress = Math.round((completed / total) * 100);

    return {
      totalTasks: total,
      completedTasks: completed,
      remainingTasks: remaining,
      delayedTasks: delayed,
      dueSoonTasks: dueSoon,
      progressPercent: progress,
    };
  }, [client.tasks, client.caseStatus, client.holdStartDate]);

  const waLink = useMemo(() => {
    return getWhatsAppLink(client.clientNumber, `مرحباً ${client.clientName}، متابعة بخصوص عقد ${client.contract}`);
  }, [client.clientNumber, client.clientName, client.contract]);

  const contractDaysDiff = useMemo(() => {
    return getRemainingContractDays(client);
  }, [client.endDate, client.startDate, client.durationMonths, client.caseStatus, client.isLost]);

  const isExpired = contractDaysDiff < 0 || client.isLost;
  const isUrgent = !isExpired && contractDaysDiff <= 5;

  const elapsedContractDaysSinceStart = useMemo(() => {
    return client.startDate ? -getDaysDifference(client.startDate) : -1;
  }, [client.startDate]);

  const isFirstMonth = elapsedContractDaysSinceStart >= 0 && elapsedContractDaysSinceStart <= 30;

  // Memoized action handlers
  const handleCardClick = useCallback(() => {
    onSelect(client.id);
  }, [onSelect, client.id]);

  const handleDriveClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!client.driveFolderUrl) e.preventDefault();
  }, [client.driveFolderUrl]);

  const handleWhatsAppClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!client.clientNumber) e.preventDefault();
  }, [client.clientNumber]);

  const handleAddTaskClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onAddTask?.(client.id);
  }, [onAddTask, client.id]);

  const handleTransferClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onTransfer?.(client.id);
  }, [onTransfer, client.id]);

  const handleArchiveToggleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onArchiveToggle?.(client);
  }, [onArchiveToggle, client]);

  const handleEditClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(client);
  }, [onEdit, client]);

  const handleDeleteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(client.id);
  }, [onDelete, client.id]);

  const getPortalLink = usePortalLink();
  const handleCopyPortalLink = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const publicUrl = getPortalLink?.(client.id);
    if (!publicUrl) {
      toast.error('تعذّر تجهيز رابط بوابة العميل');
      return;
    }
    try {
      navigator.clipboard.writeText(publicUrl).then(
        () => toast.success('تم نسخ رابط العميل بنجاح'),
        () => toast.error('حدث خطأ أثناء نسخ الرابط')
      );
    } catch {
      toast.error('حدث خطأ أثناء نسخ الرابط');
    }
  }, [getPortalLink, client.id]);

  // Drag and drop handlers
  const handleDragStartInternal = useCallback((e: React.DragEvent) => {
    if (onClientDragStart) {
      onClientDragStart(e, client.id);
    } else if (onDragStart) {
      onDragStart(e);
    }
  }, [onClientDragStart, onDragStart, client.id]);

  const handleDragOverInternal = useCallback((e: React.DragEvent) => {
    if (onClientDragOver) {
      onClientDragOver(e, client.id);
    } else if (onDragOver) {
      onDragOver(e);
    }
  }, [onClientDragOver, onDragOver, client.id]);

  const handleDragEndInternal = useCallback((e: React.DragEvent) => {
    if (onClientDragEnd) {
      onClientDragEnd(e);
    } else if (onDragEnd) {
      onDragEnd(e);
    }
  }, [onClientDragEnd, onDragEnd]);

  const handleDropInternal = useCallback((e: React.DragEvent) => {
    if (onClientDrop) {
      onClientDrop(e, client.id);
    } else if (onDrop) {
      onDrop(e);
    }
  }, [onClientDrop, onDrop, client.id]);

  return (
    <div 
      draggable={draggable}
      onDragStart={handleDragStartInternal}
      onDragOver={handleDragOverInternal}
      onDragEnd={handleDragEndInternal}
      onDrop={handleDropInternal}
      onClick={handleCardClick}
      data-client-card
      style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
      className={`relative p-5 flex flex-col justify-between overflow-hidden group cursor-pointer transition-all duration-300 ease-out gap-4.5 min-w-[320px]
      bg-[#F8F8F8] dark:bg-[#121212] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm hover:shadow-md
      hover:border-[#593BFE]/40 hover:-translate-y-1
      print:break-inside-avoid print:w-full print:bg-white print:border-gray-300 print:text-black print:shadow-none print:transform-none print:m-0 print:p-4 print:overflow-visible
      ${
        client.isVip
          ? 'ring-1 ring-amber-400/50 border-amber-400/70 shadow-amber-500/10'
          : isDragOver
            ? 'ring-2 ring-[#593BFE] border-[#593BFE] scale-[1.01]'
            : isExpired 
              ? 'border-rose-300 dark:border-rose-900/40 opacity-80' 
              : ''
      } ${
        isDragging ? 'opacity-30 border-dashed border-gray-400 dark:border-gray-700' : ''
      }`}
    >
      {/* Top Header Section */}
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <h3 
                className="flex-1 min-w-0 text-base font-bold text-[#593BFE] hover:text-[#492de0] print:text-black transition-colors leading-snug truncate overflow-hidden text-ellipsis whitespace-nowrap"
                title={client.clientName}
              >
                {client.clientName}
              </h3>
              {client.isVip && <VipBadge size="sm" />}
            </div>

            {/* Sub-label: First Month Badge */}
            {isFirstMonth && (
              <div className="mt-1.5 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-white bg-[#593BFE] shadow-xs print:bg-white print:border print:border-[#593BFE] print:text-[#593BFE] shrink-0 whitespace-nowrap">
                  <img 
                    src="/star-3d.png" 
                    alt="نجمة الشهر الأول" 
                    className="w-3.5 h-3.5 object-contain inline-block drop-shadow-xs select-none" 
                  />
                  <span>الشهر الأول</span>
                </span>
              </div>
            )}

            {/* Group Name Badge - In a separate line below First Month */}
            {client.groupName && (
              <div className="mt-2 flex items-center">
                <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-[#1A1A1A] px-2 py-0.5 rounded-md shrink-0 border border-gray-200 dark:border-gray-700 print:bg-white print:border-gray-300 print:text-black whitespace-nowrap">
                  {client.groupName}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Tags / Data Badges: Code & Contract Type & Company & Assigned */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-medium bg-white dark:bg-[#1A1A1A] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 print:bg-white print:border-gray-300 print:text-black">
            {client.code}
          </span>
          {client.contract && (
            <span 
              className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-white dark:bg-[#1A1A1A] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 print:bg-white print:border-gray-300 print:text-black max-w-[200px] truncate"
              title={client.contract}
            >
              {client.contract}
            </span>
          )}
          {client.companyName && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-white dark:bg-[#1A1A1A] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 print:bg-white print:border-gray-300 print:text-black">
              {client.companyName}
            </span>
          )}
          {canShowAssignedBadge && (
            <span 
              className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-full bg-[#593BFE] text-white shadow-xs print:bg-white print:border-gray-400 print:text-black whitespace-nowrap leading-none"
              title={`الموظف المسؤول: ${assignedPersonName}`}
            >
              <img 
                src="/person-icon.png" 
                alt="الموظف المسؤول" 
                className="w-4 h-4 rounded-full object-contain shrink-0 select-none shadow-2xs brightness-110" 
              />
              <span className="text-xs font-medium text-white print:text-black leading-none tracking-normal">
                {assignedPersonName}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Dates & Duration (Flexbox Row) */}
      <div className="flex items-center justify-between py-2.5 px-3.5 rounded-xl bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-700 print:bg-white print:border-gray-300 print:text-black text-xs shadow-2xs">
        <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 print:text-gray-700">
          <CalendarDays className="w-3.5 h-3.5 text-[#593BFE] print:text-gray-500 shrink-0" />
          <span>البداية:</span>
          <span className="text-gray-800 dark:text-gray-100 print:text-black font-mono font-medium">
            {client.startDate ? formatDateArabic(client.startDate) : 'غير محدد'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 font-mono">
          {isExpired ? (
            <span className="text-red-600 dark:text-rose-400 font-bold bg-red-50 dark:bg-rose-950/40 border border-red-200 dark:border-rose-900/40 print:bg-rose-50 print:border-rose-300 print:text-rose-700 px-2.5 py-0.5 rounded-md text-xs">
              العقد منتهي
            </span>
          ) : (
            <span className={`font-bold px-2.5 py-0.5 rounded-md text-xs border ${
              isUrgent 
                ? 'text-red-500 dark:text-rose-400 bg-red-50 dark:bg-rose-950/40 border-red-200 dark:border-rose-900/40 shadow-2xs print:bg-rose-50 print:border-rose-300 print:text-rose-700' 
                : 'text-gray-800 dark:text-gray-100 bg-gray-50 dark:bg-[#121212] border-gray-200 dark:border-gray-700 print:bg-white print:border-gray-300 print:text-black'
            }`}>
              متبقي {contractDaysDiff} يوم
            </span>
          )}
        </div>
      </div>

      {/* Hero: Tasks Progress Bar */}
      <div className="flex flex-col gap-2 pt-0.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-gray-800 dark:text-gray-100 font-medium">إنجاز المهام</span>
            {stats.delayedTasks > 0 ? (
              <span className="text-red-500 dark:text-rose-400 font-bold print:text-rose-600 text-[11px] font-mono">
                ({stats.delayedTasks} متأخر)
              </span>
            ) : stats.totalTasks > 0 && stats.progressPercent === 100 ? (
              <span className="text-[#593BFE] font-bold print:text-emerald-700 text-[11px]">
                (مكتمل ✨)
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 print:text-gray-700 font-mono text-xs">
            <span className="text-gray-800 dark:text-gray-100 print:text-black font-bold">{stats.completedTasks}/{stats.totalTasks}</span>
            <span className="text-gray-500 dark:text-gray-400 print:text-gray-500">({Math.round(stats.progressPercent)}%)</span>
          </div>
        </div>

        {/* Electric Purple Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-800 print:bg-gray-200 print:border print:border-gray-300 h-2 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              stats.delayedTasks > 0 
                ? 'bg-red-500 dark:bg-rose-500' 
                : 'bg-[#593BFE]'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, stats.progressPercent))}%` }}
          />
        </div>
      </div>

      {/* Action Buttons & Management */}
      <div className="pt-3 border-t border-gray-200 dark:border-gray-800 print:hidden flex items-center justify-between gap-2">
        {/* Quick Action Icons */}
        <div className="flex items-center gap-2">
          <a
            href={client.driveFolderUrl || '#'}
            target={client.driveFolderUrl ? '_blank' : '_self'}
            rel="noopener noreferrer"
            onClick={handleDriveClick}
            className={`p-2 rounded-xl transition-colors ${
              client.driveFolderUrl
                ? 'text-gray-400 hover:text-[#593BFE] hover:bg-purple-50 dark:hover:bg-[#593BFE]/20 border border-gray-200 dark:border-gray-800'
                : 'text-gray-300 dark:text-gray-600 bg-gray-100 dark:bg-[#1A1A1A] cursor-not-allowed border border-gray-200 dark:border-gray-800'
            }`}
            title={client.driveFolderUrl ? 'فتح مجلد الدرايف' : 'لا يوجد رابط درايف'}
          >
            <Folder className="w-4 h-4" />
          </a>

          <a
            href={client.clientNumber ? waLink : '#'}
            target={client.clientNumber ? '_blank' : '_self'}
            rel="noopener noreferrer"
            onClick={handleWhatsAppClick}
            className={`p-2 rounded-xl transition-colors ${
              client.clientNumber
                ? 'text-gray-400 hover:text-[#593BFE] hover:bg-purple-50 dark:hover:bg-[#593BFE]/20 border border-gray-200 dark:border-gray-800'
                : 'text-gray-300 dark:text-gray-600 bg-gray-100 dark:bg-[#1A1A1A] cursor-not-allowed border border-gray-200 dark:border-gray-800'
            }`}
            title="تواصل عبر الواتساب"
          >
            <MessageSquare className="w-4 h-4" />
          </a>

          {/* Copy Client Portal Link Button */}
          <button
            type="button"
            onClick={handleCopyPortalLink}
            className="p-2 text-gray-400 hover:text-[#593BFE] hover:bg-purple-50 dark:hover:bg-[#593BFE]/20 border border-gray-200 dark:border-gray-800 rounded-xl transition-colors cursor-pointer group/portal"
            title="نسخ رابط العميل (بوابة العميل للمشاركة)"
          >
            <LinkIcon className="w-4 h-4 text-slate-400 group-hover/portal:text-[#593BFE] transition-colors" />
          </button>

          {onAddTask && (
            <button
              type="button"
              onClick={handleAddTaskClick}
              className="p-2 text-gray-400 hover:text-[#593BFE] hover:bg-purple-50 dark:hover:bg-[#593BFE]/20 border border-gray-200 dark:border-gray-800 rounded-xl transition-colors cursor-pointer"
              title="إضافة مهمة جديدة"
            >
              <PlusCircle className="w-4 h-4" />
            </button>
          )}

          {onTransfer && (
            <button
              type="button"
              onClick={handleTransferClick}
              className="p-2 text-gray-400 hover:text-[#593BFE] hover:bg-purple-50 dark:hover:bg-[#593BFE]/20 border border-gray-200 dark:border-gray-800 rounded-xl transition-colors cursor-pointer"
              title="نقل العميل لمستخدم آخر"
            >
              <ArrowRightLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Archive / Delete Actions */}
        <div className="flex items-center gap-2">
          {onArchiveToggle && (
            <button
              type="button"
              onClick={handleArchiveToggleClick}
              className="p-2 text-gray-400 hover:text-[#593BFE] hover:bg-purple-50 dark:hover:bg-[#593BFE]/20 border border-transparent hover:border-purple-200 dark:hover:border-[#593BFE]/30 rounded-xl transition-colors cursor-pointer"
              title={client.isArchived ? "استعادة من الأرشيف" : "أرشفة العميل"}
            >
              {client.isArchived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
            </button>
          )}

          {onEdit && (
            <button
              type="button"
              onClick={handleEditClick}
              className="p-2 text-gray-400 hover:text-[#593BFE] hover:bg-purple-50 dark:hover:bg-[#593BFE]/20 border border-transparent hover:border-purple-200 dark:hover:border-[#593BFE]/30 rounded-xl transition-colors cursor-pointer"
              title="تعديل بيانات العميل"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={handleDeleteClick}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 border border-transparent hover:border-red-200 dark:hover:border-red-900/40 rounded-xl transition-colors cursor-pointer"
              title="حذف العميل"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Dedicated Clean Footer: Last Updated */}
      {client.lastUpdated && (
        <div className="border-t border-gray-100 dark:border-gray-800 pt-3 mt-1 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 font-mono">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 shrink-0" />
            <span className="text-gray-400 dark:text-gray-500">آخر تحديث:</span>
          </div>
          <span className="font-medium text-gray-600 dark:text-gray-300">
            {new Date(client.lastUpdated).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      )}
    </div>
  );
});

ClientCard.displayName = 'ClientCard';
export default ClientCard;
