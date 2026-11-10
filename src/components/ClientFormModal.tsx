import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, PlusCircle, Users, Calendar, Phone, Link2, FileText, CheckSquare, Building2, Folder, ExternalLink, Crown } from 'lucide-react';
import { Client, TaskItem, CompanyType } from '../types';
import { createDefaultCoreTasks, COMPANY_OPTIONS, DRIVE_LINKS } from '../data/initialClients';
import { parseDate, formatDateToYYYYMMDD, getTodayStr } from '../utils/dateUtils';
import { useAuth } from '../context/AuthContext';
import { checkClientDuplication } from '../utils/clientValidation';
import { isAdminUser } from '../utils/userStatusUtils';
import { transferClientToUser } from '../utils/clientTransfer';
import { notifyWriteError } from '../utils/firebaseUtils';
import type { EscalationRecipient } from '../utils/escalationUtils';
import { toast } from 'react-hot-toast';

/** Waits for a save, but at most `ms`: a slow/offline save keeps going in the background. */
const settleWithin = <T,>(promise: Promise<T>, ms: number): Promise<T | 'pending'> =>
  Promise.race([promise, new Promise<'pending'>(resolve => setTimeout(() => resolve('pending'), ms))]);

interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddClient: (newClient: Client) => void | Promise<unknown>;
  clients: Client[];
  clientToEdit?: Client | null;
  /** Receives only the fields shown in the form (plus `id`). Resolving to `false` = not saved. */
  onEditClient?: (changes: Partial<Client> & { id: string }) => void | Promise<unknown>;
  usersMap?: Record<string, string>;
  /** System users (for choosing a new owner when editing). */
  staffOptions?: EscalationRecipient[];
}

const THEME_COLORS = [
  { name: 'افتراضي', value: 'slate', hex: '#64748b' },
  { name: 'أحمر', value: 'rose', hex: '#f43f5e' },
  { name: 'برتقالي', value: 'orange', hex: '#f97316' },
  { name: 'أصفر', value: 'amber', hex: '#f59e0b' },
  { name: 'أخضر', value: 'emerald', hex: '#10b981' },
  { name: 'أزرق', value: 'blue', hex: '#3b82f6' },
  { name: 'نيلي', value: 'indigo', hex: '#6366f1' },
  { name: 'بنفسجي', value: 'violet', hex: '#8b5cf6' },
  { name: 'وردي', value: 'pink', hex: '#ec4899' },
];

export const ClientFormModal: React.FC<ClientFormModalProps> = ({
  isOpen,
  onClose,
  onAddClient,
  clients,
  clientToEdit,
  onEditClient,
  usersMap,
  staffOptions = [],
}) => {
  // Local calendar date (the UTC date is a day behind between 00:00 and 03:00 in UTC+3).
  const todayStr = getTodayStr();
  const { user, profile } = useAuth();

  const [code, setCode] = useState(`SCHTE${Math.floor(1000 + Math.random() * 9000)}`);
  const [clientName, setClientName] = useState('');
  const [companyName, setCompanyName] = useState<CompanyType>('رمّاح - Ramah');
  const [clientNumber, setClientNumber] = useState('');
  const [groupName, setGroupName] = useState('');
  const [isVip, setIsVip] = useState(false);
  const [contract, setContract] = useState('فل باكدج');
  const [economyFullPackageMonths, setEconomyFullPackageMonths] = useState(1);
  const [economyMediaMonths, setEconomyMediaMonths] = useState(2);
  const [influencer, setInfluencer] = useState('');
  // Owner when editing = the user id in `createdBy` (that is what decides who sees the client).
  const [ownerUid, setOwnerUid] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [startDate, setStartDate] = useState(todayStr);
  const [contractDate, setContractDate] = useState(todayStr);
  const [durationMonths, setDurationMonths] = useState(3);
  const [caseStatus, setCaseStatus] = useState<'نشط' | 'hold' | 'مكتمل' | 'جديد' | 'قيد المراجعة' | 'مؤجل'>('نشط');
  const [briefLink, setBriefLink] = useState('');
  const [whatsappGroupLink, setWhatsappGroupLink] = useState('');
  const [driveFolderUrl, setDriveFolderUrl] = useState(DRIVE_LINKS.MAIN);
  const [planLinks, setPlanLinks] = useState<{ title: string; url: string }[]>([]);
  const [themeColor, setThemeColor] = useState('slate');
  const [notes, setNotes] = useState('');
  const [autoAddDefaultTasks, setAutoAddDefaultTasks] = useState(true);

  const DRAFT_KEY = 'crm_add_client_draft';

  // Helper to reset form state to pristine defaults
  const resetToDefaults = () => {
    setCode(`SCHTE${Math.floor(1000 + Math.random() * 9000)}`);
    setClientName('');
    setCompanyName('رمّاح - Ramah');
    setClientNumber('');
    setGroupName('');
    setIsVip(false);
    setContract('فل باكدج');
    setEconomyFullPackageMonths(1);
    setEconomyMediaMonths(2);
    setInfluencer('');
    setOwnerUid('');
    setStartDate(todayStr);
    setContractDate(todayStr);
    setDurationMonths(3);
    setCaseStatus('نشط');
    setBriefLink('');
    setWhatsappGroupLink('');
    setDriveFolderUrl(DRIVE_LINKS.MAIN);
    setPlanLinks([]);
    setThemeColor('slate');
    setNotes('');
    setAutoAddDefaultTasks(true);
  };

  // Safe close handler that resets form state to prevent data leakage
  const handleModalClose = () => {
    resetToDefaults();
    onClose();
  };

  // Synchronize form state strictly with clientToEdit when opened, or reset to draft/clean state
  useEffect(() => {
    if (!isOpen) {
      // When modal is closed, reset state immediately to prevent lingering data
      resetToDefaults();
      return;
    }

    if (clientToEdit) {
      // Editing existing client: populate form directly from clientToEdit
      setCode(clientToEdit.code || '');
      setClientName(clientToEdit.clientName || '');
      // Keep the stored company as it is (an empty one is shown as "بدون شركة"). It used to load as
      // 'AL - Ahly', so editing anything else silently moved the client to that company.
      setCompanyName((clientToEdit.companyName || '') as CompanyType);
      setClientNumber(clientToEdit.clientNumber || '');
      setGroupName(clientToEdit.groupName || '');
      setIsVip(!!clientToEdit.isVip);
      setContract(clientToEdit.contract || 'فل باكدج');
      setEconomyFullPackageMonths(clientToEdit.economyFullPackageMonths ?? 1);
      setEconomyMediaMonths(clientToEdit.economyMediaMonths ?? 2);
      setInfluencer(clientToEdit.influencer || '');
      setOwnerUid(clientToEdit.createdBy || '');
      setStartDate(clientToEdit.startDate || todayStr);
      setContractDate(clientToEdit.contractDate || clientToEdit.startDate || todayStr);
      setDurationMonths(clientToEdit.durationMonths || 3);
      setCaseStatus(clientToEdit.caseStatus || 'نشط');
      setBriefLink(clientToEdit.briefLink || '');
      setWhatsappGroupLink(clientToEdit.whatsappGroupLink || '');
      setDriveFolderUrl(clientToEdit.driveFolderUrl || DRIVE_LINKS.MAIN);
      // Copies: the inputs below must not change the client objects the rest of the app shows.
      setPlanLinks((clientToEdit.planLinks || []).map(l => ({ ...l })));
      setThemeColor(clientToEdit.themeColor || 'slate');
      setNotes(clientToEdit.notes || '');
      setAutoAddDefaultTasks(false);
    } else {
      // Adding new client: load from draft if available, otherwise reset
      try {
        const saved = localStorage.getItem(DRAFT_KEY);
        if (saved) {
          const draft = JSON.parse(saved);
          if (draft.code) setCode(draft.code);
          if (draft.clientName) setClientName(draft.clientName);
          if (draft.companyName) setCompanyName(draft.companyName);
          if (draft.clientNumber) setClientNumber(draft.clientNumber);
          if (draft.groupName) setGroupName(draft.groupName);
          if (draft.isVip !== undefined) setIsVip(draft.isVip);
          if (draft.contract) setContract(draft.contract);
          if (draft.economyFullPackageMonths !== undefined) setEconomyFullPackageMonths(draft.economyFullPackageMonths);
          if (draft.economyMediaMonths !== undefined) setEconomyMediaMonths(draft.economyMediaMonths);
          if (draft.influencer) setInfluencer(draft.influencer);
          if (draft.startDate) setStartDate(draft.startDate);
          if (draft.contractDate) setContractDate(draft.contractDate);
          if (draft.durationMonths) setDurationMonths(draft.durationMonths);
          if (draft.caseStatus) setCaseStatus(draft.caseStatus);
          if (draft.briefLink) setBriefLink(draft.briefLink);
          if (draft.whatsappGroupLink) setWhatsappGroupLink(draft.whatsappGroupLink);
          if (draft.driveFolderUrl) setDriveFolderUrl(draft.driveFolderUrl);
          if (draft.planLinks) setPlanLinks(draft.planLinks);
          if (draft.themeColor) setThemeColor(draft.themeColor);
          if (draft.notes) setNotes(draft.notes);
          if (draft.autoAddDefaultTasks !== undefined) setAutoAddDefaultTasks(draft.autoAddDefaultTasks);
        } else {
          resetToDefaults();
        }
      } catch (e) {
        console.error('Failed to parse draft', e);
        resetToDefaults();
      }
    }
  }, [isOpen, clientToEdit]);

  // Save draft on change ONLY when adding a new client (NOT when editing)
  useEffect(() => {
    if (isOpen && !clientToEdit) {
      const draft = {
        code, clientName, companyName, clientNumber, groupName, isVip,
        contract, contractDate, economyFullPackageMonths, economyMediaMonths, influencer, startDate, durationMonths, caseStatus,
        briefLink, whatsappGroupLink, driveFolderUrl, planLinks,
        themeColor, notes, autoAddDefaultTasks
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    }
  }, [isOpen, clientToEdit, code, clientName, companyName, clientNumber, groupName, isVip, contract, contractDate, economyFullPackageMonths, economyMediaMonths, influencer, startDate, durationMonths, caseStatus, briefLink, whatsappGroupLink, driveFolderUrl, planLinks, themeColor, notes, autoAddDefaultTasks]);

  if (!isOpen) return null;

  const canTransferOwner = isAdminUser(user, profile) && staffOptions.length > 0;
  const currentOwnerName = clientToEdit
    ? ((clientToEdit.createdBy && usersMap?.[clientToEdit.createdBy]) ||
        clientToEdit.ownerName || clientToEdit.assignedToName || clientToEdit.assignedTo || clientToEdit.accountManager || 'غير محدد')
    : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    if (!clientName.trim()) {
      alert('الرجاء أدخل اسم العميل');
      return;
    }

    // 1. فحص عدم تكرار العميل (الكود، رقم الاتصال، اسم الجروب)
    // When editing, only values the user actually changed are checked: an old duplicate (e.g. from a
    // CSV import or with an archived record) must not block saving an unrelated field.
    const changedOrNew = (value: string, stored?: string) =>
      !clientToEdit || (value || '').trim().toLowerCase() !== (stored || '').trim().toLowerCase() ? value : '';
    const validation = checkClientDuplication(
      {
        id: clientToEdit?.id,
        code: changedOrNew(code, clientToEdit?.code),
        phone: changedOrNew(clientNumber, clientToEdit?.clientNumber),
        clientNumber: changedOrNew(clientNumber, clientToEdit?.clientNumber),
        groupName: changedOrNew(groupName, clientToEdit?.groupName),
        clientName,
      },
      clients
    );

    if (validation.isDuplicate && validation.errorMessage) {
      alert(validation.errorMessage);
      return;
    }

    // 2. فحص تكرار اسم العميل — among current clients only, as before (a former client who comes
    // back may be added again under the same name). Code / phone / group above are checked against
    // every client, which is what the final check in App already did for new clients.
    const isDuplicateName = !!changedOrNew(clientName, clientToEdit?.clientName) && clients.some(
      client => 
        !client.isArchived && client.caseStatus !== 'مكتمل' && !client.isLost &&
        (client.clientName || '').trim().toLowerCase() === clientName.trim().toLowerCase() &&
        (!clientToEdit || client.id !== clientToEdit.id)
    );

    if (isDuplicateName) {
      alert('عذراً، اسم هذا العميل مسجل بالفعل لعميل آخر.');
      return;
    }

    const effectiveDurationMonths = contract === 'الاقتصادية' ? economyFullPackageMonths + economyMediaMonths : Number(durationMonths);

    // Calculate end date based on duration (and any days the client already
    // spent on hold: those extend the contract, so re-calculating must not take them away again)
    const sDate = parseDate(startDate) || new Date();
    const eDate = new Date(sDate.getFullYear(), sDate.getMonth() + effectiveDurationMonths, sDate.getDate(), 12, 0, 0);
    eDate.setDate(eDate.getDate() + (Number(clientToEdit?.accumulatedHoldDays) || 0));
    const endDateStr = formatDateToYYYYMMDD(eDate);

    const scheduleChanged = !!clientToEdit && (
      startDate !== (clientToEdit.startDate || '') ||
      effectiveDurationMonths !== Number(clientToEdit.durationMonths || 0) ||
      contract !== (clientToEdit.contract || '') ||
      (contract === 'الاقتصادية' && (
        economyFullPackageMonths !== (clientToEdit.economyFullPackageMonths ?? 1) ||
        economyMediaMonths !== (clientToEdit.economyMediaMonths ?? 2)
      ))
    );

    if (clientToEdit && onEditClient) {
      // EDIT MODE: only the fields this form shows are sent — not a copy of the whole client taken
      // when the form was opened (which overwrote anything a colleague changed meanwhile, e.g.
      // archive / lost / renewal flags). When the contract, start date or duration changes, the
      // data layer re-schedules the tasks from the NEWEST task list.
      const updatedClientObj: Partial<Client> & { id: string } = {
        id: clientToEdit.id,
        code: code || clientToEdit.code,
        clientName,
        companyName,
        clientNumber,
        groupName: groupName || `${clientName} - ${code || clientToEdit.code}`,
        contract,
        economyFullPackageMonths: contract === 'الاقتصادية' ? economyFullPackageMonths : undefined,
        economyMediaMonths: contract === 'الاقتصادية' ? economyMediaMonths : undefined,
        influencer,
        contractDate,
        startDate,
        durationMonths: effectiveDurationMonths,
        // The end date is recalculated only when the schedule changed. It used to be recalculated on
        // every save, so fixing a phone number moved a contract's end date.
        ...(scheduleChanged || !clientToEdit.endDate ? { endDate: endDateStr } : {}),
        caseStatus,
        holdStartDate: caseStatus === 'hold' 
          ? (clientToEdit.caseStatus === 'hold' && clientToEdit.holdStartDate ? clientToEdit.holdStartDate : getTodayStr()) 
          : undefined,
        briefLink,
        whatsappGroupLink,
        driveFolderUrl,
        planLinks,
        themeColor,
        notes,
        isVip,
        // Owner fields are NOT written here: a new owner goes through transferClientToUser below
        // (user id + names + notification). The old free-text owner field changed only the name,
        // so the new owner never saw the client and the card kept showing the old one.
      };

      setIsSaving(true);
      const result = await settleWithin(Promise.resolve(onEditClient(updatedClientObj)), 2500);
      if (result === false) {
        // Rejected (the data layer already showed why): keep the form open with what was typed.
        setIsSaving(false);
        return;
      }

      if (canTransferOwner && ownerUid && ownerUid !== (clientToEdit.createdBy || '')) {
        const targetUserName = usersMap?.[ownerUid] || staffOptions.find(s => s.id === ownerUid)?.name || 'موظف';
        try {
          await transferClientToUser({
            clientId: clientToEdit.id,
            clientName: clientName || clientToEdit.clientName,
            targetUserId: ownerUid,
            targetUserName,
            performedBy: profile?.name || user?.displayName || user?.email || 'مستخدم',
          });
          toast.success(`تم نقل العميل إلى ${targetUserName}`);
        } catch (err) {
          console.error('Client transfer failed', err);
          notifyWriteError(err);
        }
      }

      setIsSaving(false);
      onClose();
      return;
    }

    // ADD MODE: Silent automatic registration of the creator as owner
    let defaultTasks: TaskItem[] = [];
    const isFullPkg = contract.toLowerCase().includes('فل باكدج') || 
                      contract.toLowerCase().includes('full package') || 
                      (contract === 'الاقتصادية' && economyFullPackageMonths > 0);

    // One id for the client AND its tasks (two separate Date.now() calls could differ by a
    // millisecond, giving tasks ids that did not belong to their client).
    const newClientId = `cli-${Date.now()}`;
    if (autoAddDefaultTasks || isFullPkg) {
      defaultTasks = createDefaultCoreTasks(newClientId, startDate, endDateStr, contract, effectiveDurationMonths, economyFullPackageMonths, economyMediaMonths);
    }

    // Automatically resolve creator's name without showing input
    const currentUserName = profile?.name || user?.displayName || user?.email || 'موظف أكونت مانجمنت';

    const finalCode = code || `SCHTE${Math.floor(1000 + Math.random() * 9000)}`;
    const newClientObj: Client = {
      id: newClientId,
      code: finalCode,
      clientName,
      companyName,
      clientNumber,
      groupName: groupName || `${clientName} - ${finalCode}`,
      contract,
      economyFullPackageMonths: contract === 'الاقتصادية' ? economyFullPackageMonths : undefined,
      economyMediaMonths: contract === 'الاقتصادية' ? economyMediaMonths : undefined,
      influencer,
      ownerName: currentUserName,
      assignedTo: currentUserName,
      assignedToName: currentUserName,
      contractDate,
      startDate,
      durationMonths: effectiveDurationMonths,
      endDate: endDateStr,
      caseStatus,
      holdStartDate: caseStatus === 'hold' ? getTodayStr() : undefined,
      accumulatedHoldDays: 0,
      briefLink,
      whatsappGroupLink,
      driveFolderUrl,
      planLinks,
      themeColor,
      notes,
      isVip,
      tasks: defaultTasks,
      createdAt: todayStr,
      createdBy: user?.uid
    };

    // Wait for the save (at most a few seconds). If it is rejected the form stays open and the
    // draft is kept; it used to close and delete the draft first, losing everything typed.
    setIsSaving(true);
    const saving = Promise.resolve(onAddClient(newClientObj));
    const result = await settleWithin(saving, 2500);
    setIsSaving(false);
    if (result === false) return;
    if (result === 'pending') {
      saving.then(ok => { if (ok !== false) localStorage.removeItem(DRAFT_KEY); });
    } else {
      localStorage.removeItem(DRAFT_KEY);
    }
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[var(--surface)] rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-[var(--border)] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 border-b border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold">{clientToEdit ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'} للنظام</h2>
          </div>
          <button
            onClick={handleModalClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Code */}
            <div>
              <label className="block font-bold text-[var(--text)] mb-1">كود العميل (Code)</label>
              <input
                type="text"
                required
                value={code || ''}
                onChange={(e) => setCode(e.target.value)}
                placeholder="مثال: SCHTE4134"
                className="w-full px-3 py-2 border border-[var(--border)] bg-white dark:bg-slate-800 text-[var(--text)] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>

            {/* Client Name */}
            <div>
              <label className="block font-bold text-[var(--text)] mb-1">اسم العميل *</label>
              <input
                type="text"
                required
                value={clientName || ''}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="مثال: مطعم سيمـاف / فوزي عبد الله"
                className="w-full px-3 py-2 border border-[var(--border)] bg-white dark:bg-slate-800 text-[var(--text)] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Company Select */}
            <div>
              <label className="block font-bold text-[var(--text)] mb-1">اسم الشركة *</label>
              <div className="relative">
                <select
                  value={companyName || ''}
                  onChange={(e) => setCompanyName(e.target.value as CompanyType)}
                  className="w-full px-3 py-2 border border-[var(--border)] bg-white dark:bg-slate-800 text-[var(--text)] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                >
                  {/* A stored value that is empty or no longer in the list is shown as it is, instead of
                      silently turning into the first company when the form is saved. */}
                  {!companyName && <option value="">بدون شركة</option>}
                  {companyName && !(COMPANY_OPTIONS as readonly string[]).includes(companyName) && (
                    <option value={companyName}>{companyName}</option>
                  )}
                  {COMPANY_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block font-bold text-[var(--text)] mb-1">رقم الجوال</label>
              <input
                type="text"
                value={clientNumber || ''}
                onChange={(e) => setClientNumber(e.target.value)}
                placeholder="مثال: 0501234567"
                className="w-full px-3 py-2 border border-[var(--border)] bg-white dark:bg-slate-800 text-[var(--text)] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dir-ltr"
              />
            </div>

            {/* Group Name */}
            <div>
              <label className="block font-bold text-[var(--text)] mb-1">اسم الجروب (WhatsApp Group)</label>
              <input
                type="text"
                value={groupName || ''}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="مثال: LA MENTA - SCHTE5379"
                className="w-full px-3 py-2 border border-[var(--border)] bg-white dark:bg-slate-800 text-[var(--text)] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Owner (edit only). Choosing another user transfers the client to that account. */}
            {clientToEdit && (
              <div>
                <label className="block font-bold text-[var(--text)] mb-1">الموظف المسؤول (Owner)</label>
                {canTransferOwner ? (
                  <select
                    value={ownerUid}
                    onChange={(e) => setOwnerUid(e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--border)] bg-white dark:bg-slate-800 text-[var(--text)] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {!ownerUid && <option value="">— غير محدد —</option>}
                    {ownerUid && !staffOptions.some(o => o.id === ownerUid && o.isActive !== false) && (
                      <option value={ownerUid}>{currentOwnerName}</option>
                    )}
                    {staffOptions
                      .filter(o => o.isActive !== false)
                      .map(o => (
                        <option key={o.id} value={o.id}>{o.name || o.id}</option>
                      ))}
                  </select>
                ) : (
                  <div className="w-full px-3 py-2 border border-[var(--border)] bg-slate-50 dark:bg-slate-800/60 text-[var(--text)] rounded-xl">
                    {currentOwnerName}
                  </div>
                )}
                <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                  {canTransferOwner
                    ? 'اختيار موظف تاني بينقل العميل لحسابه ويبعتله إشعار.'
                    : 'نقل العميل لموظف آخر من صلاحيات مدير النظام.'}
                </p>
              </div>
            )}

            {/* Contract Type */}
            <div>
              <label className="block font-bold text-[var(--text)] mb-1">نوع العقد (Contract)</label>
              <select
                value={contract || ''}
                onChange={(e) => setContract(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--border)] bg-white dark:bg-slate-800 text-[var(--text)] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="فل باكدج">فل باكدج</option>
                <option value="انشاء">انشاء</option>
                <option value="براندينج">براندينج</option>
                <option value="ميديا ( حملات اعلانية + سوشيال )">ميديا ( حملات اعلانية + سوشيال )</option>
                <option value="ميديا برودكشن ( فيديوهات )">ميديا برودكشن ( فيديوهات )</option>
                <option value="سوشيال ميديا">سوشيال ميديا</option>
                <option value="الاقتصادية">الاقتصادية</option>
              </select>
            </div>



            {/* Case Status */}
            <div>
              <label className="block font-bold text-[var(--text)] mb-1">حالة العقد</label>
              <select
                value={caseStatus || ''}
                onChange={(e) => setCaseStatus(e.target.value as any)}
                className="w-full px-3 py-2 border border-[var(--border)] bg-white dark:bg-slate-800 text-[var(--text)] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="نشط">نشط</option>
                <option value="جديد">جديد</option>
                <option value="hold">موقوف (hold)</option>
                <option value="مكتمل">مكتمل</option>
                <option value="قيد المراجعة">قيد المراجعة</option>
                <option value="مؤجل">مؤجل</option>
              </select>
            </div>

            {/* Contract Date */}
            <div>
              <label className="block font-bold text-[var(--text)] mb-1">تاريخ التعاقد</label>
              <input
                type="date"
                value={contractDate || ''}
                onChange={(e) => setContractDate(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--border)] bg-white dark:bg-slate-800 text-[var(--text)] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Work Start Date */}
            <div>
              <label className="block font-bold text-[var(--text)] mb-1">تاريخ بداية العمل</label>
              <input
                type="date"
                value={startDate || ''}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--border)] bg-white dark:bg-slate-800 text-[var(--text)] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Dynamic Duration Fields based on Contract */}
            {contract === 'الاقتصادية' ? (
              <>
                <div>
                  <label className="block font-bold text-[var(--text)] mb-1">عدد شهور الفل باكدج</label>
                  <input
                    type="number"
                    min="0"
                    value={economyFullPackageMonths}
                    onChange={(e) => setEconomyFullPackageMonths(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-[var(--border)] bg-white dark:bg-slate-800 text-[var(--text)] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[var(--text)] mb-1">عدد شهور الميديا</label>
                  <input
                    type="number"
                    min="0"
                    value={economyMediaMonths}
                    onChange={(e) => setEconomyMediaMonths(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-[var(--border)] bg-white dark:bg-slate-800 text-[var(--text)] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </>
            ) : (
              <div>
                <label className="block font-bold text-[var(--text)] mb-1">مدة العقد (بالأشهر)</label>
                <select
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-[var(--border)] bg-white dark:bg-slate-800 text-[var(--text)] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {/* A duration outside the list (e.g. 4 or 5 months) is shown as it is. */}
                  {![1, 2, 3, 6, 12].includes(Number(durationMonths)) && Number(durationMonths) > 0 && (
                    <option value={Number(durationMonths)}>{Number(durationMonths)} أشهر</option>
                  )}
                  <option value={1}>شهر واحد (1)</option>
                  <option value={2}>شهرين (2)</option>
                  <option value={3}>3 أشهر</option>
                  <option value={6}>6 أشهر</option>
                  <option value={12}>سنة كاملة (12)</option>
                </select>
              </div>
            )}

            {/* WhatsApp Group Link */}
            <div>
              <label className="block font-bold text-[var(--text)] mb-1">رابط جروب الواتساب</label>
              <input
                type="url"
                value={whatsappGroupLink || ''}
                onChange={(e) => setWhatsappGroupLink(e.target.value)}
                placeholder="https://chat.whatsapp.com/..."
                className="w-full px-3 py-2 border border-[var(--border)] bg-white dark:bg-slate-800 text-[var(--text)] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dir-ltr"
              />
            </div>

            {/* Brief Link */}
            <div>
              <label className="block font-bold text-[var(--text)] mb-1">رابط البريف (Brief Link)</label>
              <input
                type="url"
                value={briefLink || ''}
                onChange={(e) => setBriefLink(e.target.value)}
                placeholder="https://docs.google.com/..."
                className="w-full px-3 py-2 border border-[var(--border)] bg-white dark:bg-slate-800 text-[var(--text)] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dir-ltr"
              />
            </div>

            {/* Drive Folder Link */}
            <div className="md:col-span-2">
              <label className="block font-bold text-[var(--text)] mb-1">
                رابط مجلد Google Drive للعميل
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={driveFolderUrl || ''}
                  onChange={(e) => setDriveFolderUrl(e.target.value)}
                  placeholder="https://drive.google.com/drive/folders/..."
                  className="w-full px-3 py-2 border border-[var(--border)] bg-white dark:bg-slate-800 text-[var(--text)] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dir-ltr pl-8"
                />
                <Folder className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            {/* Plan Links */}
            <div className="md:col-span-2 space-y-2 mt-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-[var(--border)]">
              <div className="flex items-center justify-between">
                <label className="block font-bold text-[var(--text)]">روابط الخطط والبلانات</label>
                <button
                  type="button"
                  onClick={() => setPlanLinks([...planLinks, { title: '', url: '' }])}
                  className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>إضافة رابط خطة</span>
                </button>
              </div>
              {planLinks.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)] text-center py-2">لا يوجد روابط خطط مضافة.</p>
              ) : (
                <div className="space-y-2">
                  {planLinks.map((link, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="اسم الخطة (مثال: خطة شهر سبتمبر)"
                        value={link.title || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          setPlanLinks(prev => prev.map((l, i) => (i === index ? { ...l, title: value } : l)));
                        }}
                        className="w-1/3 px-3 py-2 border border-[var(--border)] bg-white dark:bg-slate-800 text-[var(--text)] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <input
                        type="url"
                        placeholder="https://..."
                        value={link.url || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          setPlanLinks(prev => prev.map((l, i) => (i === index ? { ...l, url: value } : l)));
                        }}
                        className="w-2/3 px-3 py-2 border border-[var(--border)] bg-white dark:bg-slate-800 text-[var(--text)] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dir-ltr"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newLinks = [...planLinks];
                          newLinks.splice(index, 1);
                          setPlanLinks(newLinks);
                        }}
                        className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-colors shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Notes */}
          <div>
            <label className="block font-bold text-[var(--text)] mb-1">ملاحظات إضافية</label>
            <textarea
              rows={2}
              value={notes || ''}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="أدخل أي شروط خاصة أو ملاحظات..."
              className="w-full px-3 py-2 border border-[var(--border)] bg-white dark:bg-slate-800 text-[var(--text)] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* VIP & Auto Journey Tasks Checkboxes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-amber-50 dark:bg-amber-950/60 p-3 rounded-xl border border-amber-200 dark:border-amber-800/80 flex items-center gap-2">
              <input
                type="checkbox"
                id="isVipClient"
                checked={isVip}
                onChange={(e) => setIsVip(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded-xs"
              />
              <label htmlFor="isVipClient" className="text-xs font-bold text-amber-900 dark:text-amber-200 cursor-pointer flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>تصنيف العميل كحساب VIP (أولوية قصوى)</span>
              </label>
            </div>

            <div className="bg-indigo-50 dark:bg-indigo-950/60 p-3 rounded-xl border border-indigo-100 dark:border-indigo-800 flex items-center gap-2">
              <input
                type="checkbox"
                id="autoTasks"
                checked={autoAddDefaultTasks}
                onChange={(e) => setAutoAddDefaultTasks(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded-xs"
              />
              <label htmlFor="autoTasks" className="text-xs font-bold text-indigo-900 dark:text-indigo-200 cursor-pointer">
                توليد رحلة تاسكات افتراضية تلقائياً
              </label>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-[var(--border)] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleModalClose}
              className="px-4 py-2 font-bold text-[var(--text-muted)] hover:bg-[var(--surface-hover)] dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-60 disabled:cursor-wait"
            >
              {isSaving ? 'جاري الحفظ...' : clientToEdit ? 'حفظ التعديلات' : 'حفظ العميل'}
            </button>
          </div>

        </form>

      </div>
    </div>
  ,
  document.body
  );
};
