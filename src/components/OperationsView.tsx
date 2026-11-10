import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Client } from '../types';
import { Building2, Download, Printer, FileDown , Search, ExternalLink, MessageSquare, Briefcase, Calendar as CalendarIcon, Clock, Link as LinkIcon, FileText, ArrowLeft, Phone, User as UserIcon, ArrowRightLeft, Loader2, X, Copy, Check, Eye } from 'lucide-react';
import { formatDateArabic } from '../utils/dateUtils';
import { englishFontFace } from '../utils/fonts';
import { useAuth } from '../context/AuthContext';
import { collection, query, getDocs, doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export interface OperationsViewProps {
  clients: Client[];
  onSelectClient: (clientId: string) => void;
}

export function OperationsView({ clients, onSelectClient }: OperationsViewProps) {
  const { user } = useAuth();
  const isAdmin = user?.email === 'ahmedgoda.manager@gmail.com';
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [systemUsers, setSystemUsers] = useState<{id: string, name: string, email: string}[]>([]);
  const tableRef = useRef<HTMLTableElement>(null);

  // Transfer State
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [clientToTransfer, setClientToTransfer] = useState<Client | null>(null);
  const [transferTargetUserId, setTransferTargetUserId] = useState<string>('');
  const [isTransferring, setIsTransferring] = useState(false);

  // Note Modal State
  const [selectedNoteModal, setSelectedNoteModal] = useState<{ clientName: string; notes: string } | null>(null);
  const [copiedNote, setCopiedNote] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      if (isAdmin) {
        try {
          const q = query(collection(db, 'users'));
          const snapshot = await getDocs(q);
          const names: Record<string, string> = {};
          const usersList: {id: string, name: string, email: string}[] = [];
          snapshot.docs.forEach(doc => {
            const data = doc.data();
            names[doc.id] = data.name || data.email;
            usersList.push({ id: doc.id, name: data.name || '', email: data.email || '' });
          });
          setUserNames(names);
          setSystemUsers(usersList);
        } catch (err) {
          console.error("Error fetching users", err);
        }
      }
    };
    fetchUsers();
  }, [isAdmin]);

  const handleTransferClient = async () => {
    if (!clientToTransfer || !transferTargetUserId) return;
    setIsTransferring(true);
    try {
      const targetUser = systemUsers.find(u => u.id === transferTargetUserId);
      const targetName = targetUser?.name || userNames[transferTargetUserId] || '';
      const clientRef = doc(db, 'clients', clientToTransfer.id);
      await updateDoc(clientRef, {
        createdBy: transferTargetUserId,
        ...(targetName ? { ownerName: targetName } : {})
      });
      
      const currentUserName = user?.displayName || user?.email?.split('@')[0] || 'الإدارة';
      
      const notifId = 'notif-' + Date.now().toString();
      const notifRef = doc(db, 'notifications', notifId);
      await setDoc(notifRef, {
        userId: transferTargetUserId,
        title: 'تم نقل عميل جديد إليك',
        message: `تم نقل العميل "${clientToTransfer.clientName}" إلى عهدتك من قبل ${currentUserName}.`,
        isRead: false,
        createdAt: new Date().toISOString(),
        type: 'transfer',
        linkToClientId: clientToTransfer.id
      });

      setTransferModalOpen(false);
      setClientToTransfer(null);
      setTransferTargetUserId('');
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء نقل العميل');
    } finally {
      setIsTransferring(false);
    }
  };

  const filteredClients = clients.filter(client => 
    client.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (client.groupName && client.groupName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const groupedClients = useMemo<Record<string, Client[]>>(() => {
    if (!isAdmin) return { 'all': filteredClients };
    
    const groups: Record<string, Client[]> = {};
    filteredClients.forEach(c => {
      const userId = c.createdBy || 'unassigned';
      if (!groups[userId]) groups[userId] = [];
      groups[userId].push(c);
    });
    return groups;
  }, [filteredClients, isAdmin]);

  const exportToPDF = () => {
    if (!tableRef.current) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('الرجاء السماح بفتح النوافذ المنبثقة (Pop-ups) لطباعة التقرير.');
      return;
    }

    // clone the table to strip buttons/icons we don't want in the pdf if needed
    // or just print it as is with basic styles
    const tableHtml = tableRef.current.outerHTML;
    const currentDate = formatDateArabic(new Date().toISOString());

    const printStyles = `
      <style>
        ${englishFontFace()}
        :root {
          --text: #0f172a;
          --bg: #ffffff;
        }
        body {
          font-family: 'Roken', system-ui, -apple-system, sans-serif;
          padding: 20px; 
          direction: rtl; 
          background: white; 
          color: black;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 10px;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          font-size: 11px; 
        }
        th, td { 
          border: 1px solid #cbd5e1; 
          padding: 8px 6px; 
          text-align: right; 
        }
        th { 
          background-color: #f1f5f9; 
          font-weight: bold; 
          color: #334155; 
        }
        td { color: #475569; }
        
        /* Utility classes replacement */
        .flex { display: flex; }
        .flex-col { flex-direction: column; }
        .items-center { align-items: center; }
        .gap-1 { gap: 0.25rem; }
        .gap-2 { gap: 0.5rem; }
        .font-bold { font-weight: bold; }
        .text-xs { font-size: 0.75rem; }
        .text-sm { font-size: 0.875rem; }
        
        svg { display: none; } /* Hide icons for cleaner print */
        
        /* Status Badges */
        .rounded-full { border-radius: 9999px; }
        .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
        .py-1\\.5 { padding-top: 0.375rem; padding-bottom: 0.375rem; }
        .inline-flex { display: inline-flex; }
        .whitespace-nowrap { white-space: nowrap; }

        @media print {
          @page { size: landscape; margin: 1cm; }
          body { padding: 0; }
          button { display: none; }
        }
      </style>
    `;

    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>تقرير العمليات</title>
          ${printStyles}
        </head>
        <body>
          <div class="header">
            <h2 style="margin: 0; font-size: 18px;">تقرير العمليات الشامل</h2>
            <p style="margin: 0; font-size: 14px; color: #64748b;">التاريخ: ${currentDate}</p>
          </div>
          ${tableHtml}
          <script>
            window.onload = () => {
              document.fonts.ready.then(() => {
                window.print();
                setTimeout(() => { window.close(); }, 500);
              });
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const exportToCSV = () => {
    const headers = ['الكود', 'العميل', 'المجموعة', 'رقم الهاتف', 'البريد الإلكتروني', 'المؤثر', 'العقد', 'مدة العقد', 'تاريخ البداية', 'تاريخ النهاية', 'الحالة', 'المنصات', 'الملاحظات'];
    if (isAdmin) headers.splice(3, 0, 'الموظف المسؤول');
    
    const csvData = filteredClients.map(c => {
      const row = [
        c.code,
        c.clientName,
        c.groupName || '',
        c.clientNumber || '',
        '',
        c.influencer || '',
        c.contract || '',
        c.durationMonths || '',
        c.startDate || '',
        c.endDate || '',
        c.caseStatus || '',
        '',
        (c.notes || '').replace(/\n/g, ' ')
      ];
      if (isAdmin) {
        row.splice(3, 0, c.createdBy && userNames[c.createdBy] ? userNames[c.createdBy] : 'غير محدد');
      }
      return row;
    });
    
    const csvContent = '\uFEFF' + [headers, ...csvData].map(e => e.map(item => `"${String(item).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `operations_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
      case 'قيد المراجعة':
        return 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30';
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

  const getTimelineProgress = (startDate?: string, endDate?: string) => {
    if (!endDate) {
      return { hasDates: false, endDateFormatted: '-', remainingDays: 0, percent: 0, isExpired: false };
    }
    const end = new Date(endDate).getTime();
    const start = startDate ? new Date(startDate).getTime() : 0;
    const now = Date.now();
    
    if (isNaN(end)) {
      return { hasDates: false, endDateFormatted: endDate, remainingDays: 0, percent: 0, isExpired: false };
    }

    const remainingDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    const isExpired = remainingDays < 0;
    
    let percent = 0;
    if (start && !isNaN(start) && end > start) {
      percent = Math.min(100, Math.max(0, Math.round(((now - start) / (end - start)) * 100)));
    } else {
      percent = isExpired ? 100 : (remainingDays <= 7 ? 85 : 50);
    }

    return {
      hasDates: true,
      endDateFormatted: formatDateArabic(endDate),
      remainingDays,
      percent,
      isExpired
    };
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Sticky Top Bar: Search and Actions */}
      <div className="sticky top-0 sm:top-2 z-30 bg-white/95 dark:bg-[#09090B]/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 dark:border-[#27272A] shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all">
        <div className="flex flex-col">
          <h2 className="text-2xl font-black text-slate-900 dark:text-[#FAFAFA] flex items-center gap-2">
            <Building2 className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            <span>العمليات</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-[#A1A1AA] mt-1 font-medium">متابعة تفاصيل جميع العملاء والمشاريع</p>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
          <div className="relative flex-grow sm:flex-grow-0 sm:w-80 shrink-0">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery || ''}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث بالاسم، الكود..."
              className="w-full bg-slate-50 dark:bg-[#18181B] text-slate-900 dark:text-[#FAFAFA] border-2 border-slate-200 dark:border-[#27272A] rounded-2xl pr-11 pl-4 py-2 font-bold focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-xs"
            />
          </div>
          <button
            onClick={exportToCSV}
            className="flex shrink-0 items-center justify-center gap-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20 px-4 py-2.5 rounded-2xl font-bold transition-colors border border-indigo-200 dark:border-indigo-500/20 whitespace-nowrap cursor-pointer"
            title="تصدير إلى CSV"
          >
            <FileDown className="w-5 h-5" />
            <span className="hidden sm:inline">CSV</span>
          </button>
          <button
            onClick={exportToPDF}
            disabled={isExportingPDF}
            className={`flex shrink-0 items-center justify-center gap-2 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 px-4 py-2.5 rounded-2xl font-bold transition-colors border border-slate-200 dark:border-slate-700 whitespace-nowrap cursor-pointer ${isExportingPDF ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="تصدير كملف PDF"
          >
            {isExportingPDF ? (
               <div className="w-5 h-5 border-2 border-slate-700 dark:border-slate-300 border-t-transparent rounded-full animate-spin"></div>
            ) : (
               <Printer className="w-5 h-5" />
            )}
            <span className="hidden sm:inline">{isExportingPDF ? 'جاري التحميل...' : 'PDF'}</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#18181B] rounded-2xl border border-slate-200/80 dark:border-[#27272A] shadow-xs overflow-hidden">
        <div className="overflow-x-auto max-h-[75vh] overflow-y-auto overscroll-contain custom-scrollbar">
          <table ref={tableRef} className="w-full min-w-max text-sm text-right whitespace-nowrap border-collapse">
            <thead className="sticky top-0 z-20 bg-slate-100/95 dark:bg-[#18181B]/95 backdrop-blur-md text-slate-600 dark:text-[#A1A1AA] font-semibold text-sm border-b border-slate-200 dark:border-[#27272A] shadow-[0_2px_4px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
              <tr>
                <th scope="col" className="sticky top-0 right-0 z-30 px-6 py-4 bg-slate-100/95 dark:bg-[#18181B]/95 backdrop-blur-md text-slate-800 dark:text-[#FAFAFA] font-semibold shadow-[-4px_2px_10px_-2px_rgba(0,0,0,0.08)] dark:shadow-[-4px_2px_10px_-2px_rgba(0,0,0,0.3)]">العميل</th>
                <th scope="col" className="sticky top-0 z-20 px-6 py-4 text-center bg-slate-100/95 dark:bg-[#18181B]/95 backdrop-blur-md shadow-[0_2px_4px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.3)]">الإجراءات</th>
                <th scope="col" className="sticky top-0 z-20 px-6 py-4 bg-slate-100/95 dark:bg-[#18181B]/95 backdrop-blur-md shadow-[0_2px_4px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.3)]">التواصل</th>
                <th scope="col" className="sticky top-0 z-20 px-6 py-4 bg-slate-100/95 dark:bg-[#18181B]/95 backdrop-blur-md shadow-[0_2px_4px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.3)]">العقد والمؤثر</th>
                <th scope="col" className="sticky top-0 z-20 px-6 py-4 bg-slate-100/95 dark:bg-[#18181B]/95 backdrop-blur-md shadow-[0_2px_4px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.3)]">الجدول الزمني</th>
                <th scope="col" className="sticky top-0 z-20 px-6 py-4 bg-slate-100/95 dark:bg-[#18181B]/95 backdrop-blur-md shadow-[0_2px_4px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.3)]">الحالة</th>
                <th scope="col" className="sticky top-0 z-20 px-6 py-4 text-center bg-slate-100/95 dark:bg-[#18181B]/95 backdrop-blur-md shadow-[0_2px_4px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.3)]">الروابط</th>
                <th scope="col" className="sticky top-0 z-20 px-6 py-4 max-w-[220px] bg-slate-100/95 dark:bg-[#18181B]/95 backdrop-blur-md shadow-[0_2px_4px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.3)]">ملاحظات</th>
              </tr>
            </thead>
            {filteredClients.length === 0 ? (
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                      <Briefcase className="w-14 h-14 mb-3 opacity-20" />
                      <p className="text-base font-bold text-slate-600 dark:text-slate-300">لا يوجد بيانات مطابقة للبحث</p>
                      <p className="text-xs mt-1">جرب كلمات بحث مختلفة</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            ) : (
              Object.entries(groupedClients).map(([userId, userClients]) => {
                const clients = userClients as Client[];
                return (
                <tbody key={userId} className="divide-y divide-slate-100 dark:divide-slate-800/60 border-b border-slate-200 dark:border-[#27272A] last:border-0">
                  {isAdmin && (
                    <tr className="bg-indigo-50/40 dark:bg-[#27272A]/70 border-y border-indigo-100 dark:border-[#27272A] relative z-10">
                      <td colSpan={8} className="px-6 py-3.5 text-right">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-indigo-500/15 dark:bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-700 dark:text-indigo-300 shadow-xs shrink-0">
                              <UserIcon className="w-4 h-4" />
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm sm:text-base font-black text-slate-900 dark:text-[#FAFAFA] tracking-wide">
                                {userId === 'all' ? 'جميع العملاء' : (userId === 'unassigned' ? 'عملاء بدون تعيين' : (userNames[userId] || 'مدير الحساب'))}
                              </span>
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-500/20 text-indigo-800 dark:text-indigo-200 border border-indigo-500/30">
                                مدير الحساب
                              </span>
                            </div>
                          </div>
                          {userId !== 'all' && (
                            <span className="bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full text-xs font-black border border-indigo-500/30">
                              {clients.length} عميل
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                  {clients.map((client) => {
                    const timeline = getTimelineProgress(client.startDate, client.endDate);
                    const contractBadgeClass = getContractBadge(client.contract);

                    return (
                    <tr 
                      key={client.id}
                      className="transition-colors duration-200 hover:bg-slate-50/90 dark:hover:bg-[#27272A]/60 group"
                    >
                      <td className="px-6 py-4 sticky right-0 z-10 bg-white group-hover:bg-slate-50/90 dark:bg-[#18181B] dark:group-hover:bg-[#27272A]/80 shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.06)] dark:shadow-none transition-colors duration-200">
                        <div className="flex flex-col gap-1">
                          <button
                            type="button"
                            onClick={() => onSelectClient(client.id)}
                            className="font-bold text-base text-slate-900 dark:text-white text-right hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                          >
                            {client.clientName}
                          </button>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-mono font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px] tracking-wider">{client.code}</span>
                            {client.groupName && (
                              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                                {client.groupName}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => onSelectClient(client.id)}
                            className="px-3 py-1.5 min-h-[32px] inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all whitespace-nowrap cursor-pointer"
                            title="عرض تفاصيل العميل"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>عرض التفاصيل</span>
                          </button>

                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => {
                                setClientToTransfer(client);
                                setTransferTargetUserId('');
                                setTransferModalOpen(true);
                              }}
                              className="w-8 h-8 flex items-center justify-center rounded-xl bg-indigo-50/80 hover:bg-indigo-100 dark:bg-[#27272A] dark:hover:bg-[#3F3F46] text-indigo-600 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-500/30 transition-all active:scale-95 shadow-xs cursor-pointer"
                              title="نقل العميل لمستخدم آخر"
                              aria-label="نقل العميل"
                            >
                              <ArrowRightLeft className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {client.clientNumber ? (
                          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300" dir="ltr">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-mono text-sm">{client.clientNumber}</span>
                          </div>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">-</span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5 items-start">
                          {client.contract ? (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${contractBadgeClass || 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30'}`}>
                              {client.contract}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">-</span>
                          )}
                          {client.influencer && (
                            <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400/60"></span>
                              {client.influencer}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5 min-w-[150px]">
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              النهاية: <span className="font-semibold text-slate-800 dark:text-slate-200">{timeline.endDateFormatted}</span>
                            </span>
                            {timeline.hasDates && (
                              <span className={`text-[10px] font-bold ${timeline.isExpired ? 'text-rose-500 dark:text-rose-400' : timeline.remainingDays <= 7 ? 'text-amber-500 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                {timeline.isExpired ? 'انتهى' : `${timeline.remainingDays} يوم`}
                              </span>
                            )}
                          </div>
                          {timeline.hasDates && (
                            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-300 ${timeline.isExpired ? 'bg-rose-500' : timeline.percent > 85 ? 'bg-amber-500' : 'bg-indigo-500'}`}
                                style={{ width: `${timeline.percent}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${getStatusBadge(client.caseStatus)}`}>
                          {client.caseStatus || '-'}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {client.briefLink ? (
                            <a 
                              href={client.briefLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              title="Brief Link"
                              className="w-8 h-8 flex items-center justify-center rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500 dark:hover:text-white transition-all shadow-2xs"
                            >
                              <LinkIcon className="w-3.5 h-3.5" />
                            </a>
                          ) : (
                            <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-50 text-slate-300 dark:bg-slate-800/40 dark:text-slate-600">
                              <LinkIcon className="w-3.5 h-3.5" />
                            </div>
                          )}
                          {client.whatsappGroupLink ? (
                            <a 
                              href={client.whatsappGroupLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              title="WhatsApp Group"
                              className="w-8 h-8 flex items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-500 hover:text-white dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500 dark:hover:text-white transition-all shadow-2xs"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </a>
                          ) : (
                            <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-50 text-slate-300 dark:bg-slate-800/40 dark:text-slate-600">
                              <MessageSquare className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {client.notes ? (
                          <div 
                            onClick={() => setSelectedNoteModal({ clientName: client.clientName, notes: client.notes || '' })}
                            className="group/note relative flex items-center gap-1.5 max-w-[200px] cursor-pointer"
                            title={client.notes}
                          >
                            <FileText className="w-3.5 h-3.5 text-slate-400 group-hover/note:text-indigo-500 shrink-0 transition-colors" />
                            <span className="text-xs text-slate-600 dark:text-slate-300 truncate hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                              {client.notes}
                            </span>
                            {/* Styled Tooltip on hover */}
                            <div className="pointer-events-none absolute bottom-full right-0 mb-2 hidden group-hover/note:block z-50 w-64 p-2.5 bg-slate-900 dark:bg-[#18181B] text-white text-xs rounded-xl shadow-xl border border-slate-700 dark:border-[#27272A] leading-relaxed break-words whitespace-normal animate-in fade-in zoom-in-95 duration-150">
                              <p className="font-semibold text-indigo-400 mb-1 text-[11px]">الملاحظات:</p>
                              <p className="text-slate-200 dark:text-slate-200 text-xs">{client.notes}</p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600 text-xs">-</span>
                        )}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
                );
              })
            )}
          </table>
        </div>
      </div>
      
      {/* Transfer Modal */}
      {transferModalOpen && clientToTransfer && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-[var(--surface)] w-full max-w-md rounded-2xl shadow-xl border border-[var(--border)] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-[var(--border)] bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
              <h3 className="font-bold text-lg text-[var(--text)] flex items-center gap-2">
                <span>نقل العميل:</span>
                <span className="text-indigo-600 dark:text-indigo-400">
                  {clientToTransfer.clientName}
                </span>
              </h3>
              <button 
                onClick={() => setTransferModalOpen(false)}
                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                سيتم نقل جميع بيانات هذا العميل والمشاريع المرتبطة به إلى المستخدم الجديد المختار.
              </p>
              
              <div>
                <label className="block text-sm font-bold text-[var(--text)] mb-1.5">المستخدم الجديد</label>
                <select
                  value={transferTargetUserId || ''}
                  onChange={(e) => setTransferTargetUserId(e.target.value)}
                  className="w-full bg-[var(--input-bg)] text-[var(--text)] border border-[var(--border)] rounded-xl px-4 py-2.5 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">اختر المستخدم...</option>
                  {systemUsers.filter(u => u.id !== clientToTransfer.createdBy).map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="p-4 border-t border-[var(--border)] bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-end gap-2">
              <button
                onClick={() => setTransferModalOpen(false)}
                disabled={isTransferring}
                className="px-4 py-2 text-sm font-bold text-[var(--text)] bg-white dark:bg-slate-800 border border-[var(--border)] rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleTransferClient}
                disabled={!transferTargetUserId || isTransferring}
                className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isTransferring ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    جاري النقل...
                  </>
                ) : (
                  'تأكيد النقل'
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Client Note Modal */}
      {selectedNoteModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-[var(--surface)] w-full max-w-lg rounded-2xl shadow-2xl border border-[var(--border)] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 sm:p-5 border-b border-[var(--border)] bg-slate-50/70 dark:bg-[#18181B] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/15 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[var(--text)]">ملاحظات العميل</h3>
                  <p className="text-xs text-[var(--text-muted)] font-medium">{selectedNoteModal.clientName}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedNoteModal(null)}
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 space-y-3">
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl max-h-[320px] overflow-y-auto">
                <p className="text-sm text-[var(--text)] whitespace-pre-wrap leading-relaxed">
                  {selectedNoteModal.notes}
                </p>
              </div>
            </div>
            
            <div className="p-4 border-t border-[var(--border)] bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(selectedNoteModal.notes);
                  setCopiedNote(true);
                  setTimeout(() => setCopiedNote(false), 2000);
                }}
                className="px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-all active:scale-95 shadow-xs"
              >
                {copiedNote ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>تم النسخ!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>نسخ النص</span>
                  </>
                )}
              </button>
              
              <button
                onClick={() => setSelectedNoteModal(null)}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-xs"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
