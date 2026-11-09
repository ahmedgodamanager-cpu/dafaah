import React, { useState, useEffect, useMemo, useCallback, Suspense, lazy } from 'react';
import { Client, TaskItem, FilterState, TaskAlert, DailyActivation, DashboardConfig } from './types';
import { generateAlertsForClients, calculateClientProgress, getDaysDifference, getRemainingContractDays, addBusinessDays } from './utils/dateUtils';
import { Toaster, toast } from 'react-hot-toast';
import { AppHeader, AppPageTransition } from './components/AppExperience';
import { StatsOverview } from './components/StatsOverview';
import { ClientCard } from './components/ClientCard';
import { ClientListTable } from './components/ClientListTable';
import { ClientDetailPage } from './components/ClientDetailPage';
import { AlertsDrawer } from './components/AlertsDrawer';
import { ClientFormModal } from './components/ClientFormModal';
import { AddTaskModal } from './components/AddTaskModal';
import { AddActivationModal } from './components/AddActivationModal';
import { TaskAlertModal } from './components/TaskAlertModal';
import { TasksListModal } from './components/TasksListModal';
import { Clock, AlertTriangle } from 'lucide-react';
import { DashboardCustomizerModal } from './components/DashboardCustomizerModal';
import { Users, Building2, ChevronUp, ChevronDown, Database, LayoutGrid, List, Archive, ChevronLeft, Home, RotateCcw, ShieldAlert, FileText } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { Login } from './components/Login';
import { SuspendedUserScreen } from './components/SuspendedUserScreen';
import { isUserSuspended } from './utils/userStatusUtils';
import { useFirestoreData } from './hooks/useFirestoreData';
import { PortalLinkProvider } from './context/PortalLinkContext';
import type { EscalationRecipient } from './utils/escalationUtils';
import { portalDocToClient } from './utils/portalUtils';
import { useSlaNotifications } from './utils/notificationUtils';
import { ConfirmationModal } from './components/ConfirmationModal';
import { checkClientDuplication } from './utils/clientValidation';
import { collection, onSnapshot, query, getDocs, updateDoc, doc, getDoc, where, writeBatch } from 'firebase/firestore';
import { db, waitForSavesToFinish } from './firebase';
import { ClientPortalView } from './components/ClientPortalView';
import { recoverCompletedTasksFromActivities, recoverCompletedTasksFromLogs, EmergencyRecoveryReport } from './utils/emergencyRecovery';
import { EmergencyRecoveryModal } from './components/EmergencyRecoveryModal';
import { EscalationModal } from './components/EscalationModal';
import { ExecutiveReportModal } from './components/ExecutiveReportModal';
import { Footer } from './components/Footer';

// استيراد الصفحات والتبويبات بشكل كسول (Lazy Loading & Code Splitting)
const OperationsTab = lazy(() => import('./components/OperationsTab'));
const ArchiveTab = lazy(() => import('./components/ArchiveTab'));
const GlobalActivationsView = lazy(() => import('./components/GlobalActivationsView').then(m => ({ default: m.GlobalActivationsView })));
const MonthlyReportsView = lazy(() => import('./components/MonthlyReportsView').then(m => ({ default: m.MonthlyReportsView })));
const UsersView = lazy(() => import('./components/UsersView').then(m => ({ default: m.UsersView })));
const WorkloadDashboardView = lazy(() => import('./components/WorkloadDashboardView').then(m => ({ default: m.WorkloadDashboardView })));
const CalendarView = lazy(() => import('./components/CalendarView').then(m => ({ default: m.CalendarView })));
const FocusView = lazy(() => import('./components/FocusView').then(m => ({ default: m.FocusView })));
const SlaDashboardView = lazy(() => import('./components/SlaDashboardView').then(m => ({ default: m.SlaDashboardView })));

interface CompanyAccordionSectionProps {
  company: string;
  companyClients: Client[];
  isCollapsed: boolean;
  onToggle: (company: string) => void;
  dashboardConfig: DashboardConfig;
  usersMap?: Record<string, string>;
  onSelectClient: (id: string) => void;
  onEditClient: (client: Client) => void;
  onDeleteClient: (id: string) => void;
  onArchiveToggle: (client: Client) => void;
  onAddTask: (id: string) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, id: string) => void;
  draggedClientId: string | null;
  dragOverClientId: string | null;
}

const CompanyAccordionSection = React.memo<CompanyAccordionSectionProps>(({
  company,
  companyClients,
  isCollapsed,
  onToggle,
  dashboardConfig,
  usersMap,
  onSelectClient,
  onEditClient,
  onDeleteClient,
  onArchiveToggle,
  onAddTask,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
  draggedClientId,
  dragOverClientId,
}) => {
  const handleToggleClick = useCallback(() => {
    onToggle(company);
  }, [onToggle, company]);

  return (
    <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden shadow-xs print:overflow-visible print:bg-white print:border-gray-300 print:shadow-none print:mb-6 print:break-inside-auto">
      <button
        onClick={handleToggleClick}
        className="w-full flex items-center justify-between py-2.5 sm:py-2 px-3 sm:px-4 bg-[var(--surface-hover)]/80 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-right touch-manipulation min-h-[48px] print:bg-gray-100 print:border-b print:border-gray-300"
      >
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          {company === 'AL - Ahly' ? (
            <div className="flex items-center justify-center w-[36px] h-[48px] rounded-lg bg-white dark:bg-transparent overflow-hidden border border-slate-200 dark:border-transparent dark:shadow-none shadow-sm shrink-0">
              <img src="https://i.ibb.co/d0KGfwr0/Chat-GPT-Image-Aug-8-2026-05-18-21-PM.png" alt="AL - Ahly" className="dark:hidden w-full h-full object-contain scale-90" />
              <img src="https://i.ibb.co/RGwxNcLQ/image.png" alt="AL - Ahly" className="hidden dark:block w-full h-full object-contain scale-90" />
            </div>
          ) : company === 'Herak' ? (
            <div className="flex items-center justify-center w-[36px] h-[48px] rounded-lg bg-white dark:bg-transparent overflow-hidden border border-slate-200 dark:border-transparent dark:shadow-none shadow-sm shrink-0">
              <img src="https://i.ibb.co/8nZzHJfw/image.png" alt="Herak" className="dark:hidden w-full h-full object-contain scale-90" />
              <img src="https://i.ibb.co/39625k7S/image.png" alt="Herak" className="hidden dark:block w-full h-full object-contain scale-90" />
            </div>
          ) : company === 'SYT' ? (
            <div className="flex items-center justify-center w-[36px] h-[48px] rounded-lg bg-white dark:bg-transparent overflow-hidden border border-slate-200 dark:border-transparent dark:shadow-none shadow-sm shrink-0">
              <img src="https://i.ibb.co/SDtvxvbQ/image.png" alt="SYT" className="dark:hidden w-full h-full object-contain scale-90" />
              <img src="https://i.ibb.co/d0j14h76/image.png" alt="SYT" className="hidden dark:block w-full h-full object-contain scale-90" />
            </div>
          ) : (
            <div className="flex items-center justify-center w-[36px] h-[48px] rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-[0_2px_8px_rgb(0,0,0,0.04)] dark:shadow-[0_2px_8px_rgb(0,0,0,0.1)] shrink-0">
              <Building2 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            </div>
          )}
          <h3 className="font-bold text-[var(--text)] text-sm sm:text-base truncate print:text-black">{company}</h3>
          <span className="bg-white dark:bg-slate-800 text-[var(--text-muted)] text-[11px] sm:text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full font-bold border border-[var(--border)] shrink-0 print:bg-white print:border-gray-300 print:text-black">
            {companyClients.length} عميل
          </span>
        </div>
        {!isCollapsed ? <ChevronUp className="w-5 h-5 text-slate-400 shrink-0 print:hidden" /> : <ChevronDown className="w-5 h-5 text-slate-400 shrink-0 print:hidden" />}
      </button>
      
      {!isCollapsed && (
        <div className="p-2 sm:p-4 md:p-6 border-t border-[var(--border)] bg-slate-50/30 dark:bg-slate-900/30 print:p-2 print:bg-white print:border-none print:overflow-visible">
          {dashboardConfig.viewMode === 'table' ? (
            <div className="w-full">
              <ClientListTable
                clients={companyClients}
                onSelect={onSelectClient}
                onEdit={onEditClient}
                onDelete={onDeleteClient}
                onArchiveToggle={onArchiveToggle}
                onAddTask={onAddTask}
                config={dashboardConfig}
                usersMap={usersMap}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 print:grid print:grid-cols-2 print:gap-4 print:w-full">
              {companyClients.map(client => (
                <ClientCard
                  key={client.id}
                  client={client}
                  onSelect={onSelectClient}
                  onEdit={onEditClient}
                  onDelete={onDeleteClient}
                  onArchiveToggle={onArchiveToggle}
                  onAddTask={onAddTask}
                  draggable={dashboardConfig.enableDragAndDrop}
                  onClientDragStart={onDragStart}
                  onClientDragOver={onDragOver}
                  onClientDragEnd={onDragEnd}
                  onClientDrop={onDrop}
                  isDragging={draggedClientId === client.id}
                  isDragOver={dragOverClientId === client.id}
                  dashboardConfig={dashboardConfig}
                  usersMap={usersMap}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});
CompanyAccordionSection.displayName = 'CompanyAccordionSection';

export default function App() {
  const { user, profile, loading: authLoading, logout } = useAuth();
  const { 
    clients, 
    notifications, 
    markNotificationAsRead, 
    loading: dataLoading, 
    updateClient, 
    addClient, 
    addTask, 
    updateTask, 
    deleteTask, 
    saveActivation, 
    deleteActivation, 
    deleteClient, 
    seedInitialData,
    syncAllClientsTasksMatrix,
    syncSingleClientTasks,
    reorderTasks,
    clearClientTasks,
    getPortalLink,
    flushPortalRefreshes,
    schedulePortalRefresh,
    dataSynced,
    connectionStatus 
  } = useFirestoreData();
  
  const isActiveStaff = !!user && !isUserSuspended(profile, user);
  // Client portal links (نسخ رابط العميل) and the shared pages come from useFirestoreData above.

  // Client portal opened from a shared link: ?view=portal&token=<32 characters>
  const [sharedPortalToken] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('view') === 'portal' ? (params.get('token') || '').trim() : '';
    return /^[0-9a-f]{32}$/i.test(token) ? token : null;
  });
  const [sharedPortalClient, setSharedPortalClient] = useState<Client | null>(null);
  const [sharedPortalError, setSharedPortalError] = useState<string | null>(null);
  useEffect(() => {
    if (!sharedPortalToken) return;
    return onSnapshot(
      doc(db, 'portals', sharedPortalToken),
      snap => {
        if (snap.exists()) {
          setSharedPortalClient(portalDocToClient(sharedPortalToken, snap.data()));
          setSharedPortalError(null);
        } else {
          setSharedPortalClient(null);
          setSharedPortalError('عفواً، رابط البوابة غير صحيح أو لم يعد متاحاً');
        }
      },
      () => setSharedPortalError('عفواً، حدث خطأ أثناء تحميل بيانات العميل أو الرابط غير صحيح')
    );
  }, [sharedPortalToken]);
  
  // Executive Report & Escalation Modal States
  const [isEscalationOpen, setIsEscalationOpen] = useState<boolean>(false);
  const [isExecutiveReportOpen, setIsExecutiveReportOpen] = useState<boolean>(false);
  const [isSyncTasksConfirmOpen, setIsSyncTasksConfirmOpen] = useState<boolean>(false);
  
  // Register background notifications for SLA delays
  // dataSynced: only after the server's data arrived (not an old copy kept in the browser).
  useSlaNotifications(clients, isActiveStaff && dataSynced);

  const DARK_MODE_KEY = 'client_followup_dark_mode';

  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(DARK_MODE_KEY);
      if (saved !== null) {
        return JSON.parse(saved);
      }
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch (e) {
      return false;
    }
  });

  // Removed all automatic task resets and self-healing migrations to protect completed tasks and prevent data loss

  // System users mapping from Firestore users collection
  const [systemUsers, setSystemUsers] = useState<Record<string, string>>({});
  const [teamMembers, setTeamMembers] = useState<EscalationRecipient[]>([]);

  // Subscribe only once the user is signed in and active. This listener used to start on the
  // login screen, got rejected (not signed in yet) and was never retried, so the names map
  // stayed empty until a full page reload.
  useEffect(() => {
    if (!isActiveStaff) {
      setSystemUsers({});
      setTeamMembers([]);
      return;
    }
    const unsub = onSnapshot(query(collection(db, 'users')), (snapshot) => {
      const map: Record<string, string> = {};
      const members: EscalationRecipient[] = [];
      snapshot.forEach(docSnap => {
        const d = docSnap.data();
        if (d.name) {
          map[docSnap.id] = d.name;
        }
        let role = String(d.role || '').toLowerCase();
        if (role === 'manager' || role === 'account_manager') role = 'account_manager_head';
        const isActive = !(
          ['pending', 'suspended', 'disabled', 'stopped'].includes(role) ||
          ['pending', 'suspended', 'disabled', 'inactive'].includes(String(d.status || '').toLowerCase()) ||
          d.isSuspended === true || d.disabled === true || d.isActive === false
        );
        members.push({ id: docSnap.id, name: d.name || d.email || '', role, isActive });
      });
      setSystemUsers(map);
      setTeamMembers(members);
    }, (err) => {
      console.error('Error fetching system users in App', err);
    });
    return () => unsub();
  }, [isActiveStaff]);

  // Reading mode state
  const [isReadingMode, setIsReadingMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('crm_reading_mode');
      return saved !== null ? JSON.parse(saved) : false;
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('crm_reading_mode', JSON.stringify(isReadingMode));
    } catch (e) {}
  }, [isReadingMode]);

  // Sync dark mode class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try {
      localStorage.setItem(DARK_MODE_KEY, JSON.stringify(isDarkMode));
    } catch (e) {}
  }, [isDarkMode]);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => !prev);
  }, []);

  // UI state
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'dashboard' | 'operations' | 'reports' | 'archive' | 'activations' | 'users' | 'workload' | 'calendar' | 'focus' | 'sla' | 'portal'>('dashboard');
  const [portalClientId, setPortalClientId] = useState<string | null>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('view') === 'portal') {
        return params.get('clientId');
      }
    } catch {}
    return null;
  });
  const [standalonePortalClient, setStandalonePortalClient] = useState<Client | null>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const cId = params.get('clientId');
      if (params.get('view') === 'portal' && cId) {
        const cached = sessionStorage.getItem('portal_client_' + cId.trim());
        if (cached) {
          return JSON.parse(cached);
        }
      }
    } catch {}
    return null;
  });
  const [portalLoading, setPortalLoading] = useState<boolean>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const cId = params.get('clientId');
      if (params.get('view') === 'portal' && cId) {
        const cached = sessionStorage.getItem('portal_client_' + cId.trim());
        return !cached;
      }
    } catch {}
    return false;
  });
  const [portalError, setPortalError] = useState<string | null>(null);
  const hasFetchedPortalRef = React.useRef<string | null>(null);
  const [focusInitialFilter, setFocusInitialFilter] = useState<'all' | 'overdue' | 'today' | 'soon'>('all');
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterState, setFilterState] = useState<FilterState>({
    search: '',
    company: '',
    contract: '',
    status: '',
    delayFilter: 'all'
  });

  // Customizer Configuration State
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [dashboardConfig, setDashboardConfig] = useState<DashboardConfig>(() => {
    try {
      const saved = localStorage.getItem('crm_dashboard_config');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      showStatsCards: true,
      showFilterBar: true,
      enableTaskAlerts: true,
      enableDragAndDrop: false,
      visibleDepartments: ['Account Management', 'SEO', 'Media Buying', 'Social Media'],
      viewMode: 'grid'
    };
  });

  const handleUpdateDashboardConfig = useCallback((newConfig: Partial<DashboardConfig>) => {
    setDashboardConfig(prev => {
      const updated = { ...prev, ...newConfig };
      try {
        localStorage.setItem('crm_dashboard_config', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  }, []);

  // Custom drag ordering state
  const [customClientOrder, setCustomClientOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('crm_client_order');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const [draggedClientId, setDraggedClientId] = useState<string | null>(null);
  const [dragOverClientId, setDragOverClientId] = useState<string | null>(null);

  const handleResetCardOrder = useCallback(() => {
    setCustomClientOrder([]);
    try {
      localStorage.removeItem('crm_client_order');
    } catch (e) {}
  }, []);

  // Expanded/collapsed state for companies
  const [expandedCompanies, setExpandedCompanies] = useState<Record<string, boolean>>({});

  const toggleCompanySection = useCallback((company: string) => {
    setExpandedCompanies(prev => ({
      ...prev,
      [company]: !prev[company]
    }));
  }, []);

  // Modal visibility states
  const userDismissedAlertModalRef = React.useRef(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [showTaskAlertModal, setShowTaskAlertModal] = useState(false);
  const [isUpcomingModalOpen, setIsUpcomingModalOpen] = useState(false);
  const [isDelayedModalOpen, setIsDelayedModalOpen] = useState(false);
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [addTaskClientId, setAddTaskClientId] = useState<string>('');
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Daily Activation modal state
  const [isAddActivationOpen, setIsAddActivationOpen] = useState(false);
  const [activationClientId, setActivationClientId] = useState<string>('');
  const [activationClientLocked, setActivationClientLocked] = useState(false);
  const [editingActivation, setEditingActivation] = useState<DailyActivation | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Clear any previous sessionStorage/localStorage restrictions
  useEffect(() => {
    try {
      sessionStorage.removeItem('crm_has_seen_task_alerts');
      localStorage.removeItem('crm_has_seen_task_alerts');
    } catch {
      // ignore
    }
  }, []);

  const activeClientsList = useMemo(() => {
    return clients.filter(c => !c.isArchived && c.caseStatus !== 'مكتمل' && !c.isLost);
  }, [clients]);

  // Compute Alerts across all clients
  const alerts = useMemo(() => {
    return generateAlertsForClients(activeClientsList);
  }, [activeClientsList]);

  // Support URL parameters on initial load (?view=portal&clientId=XXX, ?view=focus&filter=overdue, etc.)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get('view');
      const filterParam = params.get('filter');
      const clientIdParam = params.get('clientId');

      if (viewParam === 'portal' && clientIdParam) {
        setActiveView('portal');
        setPortalClientId(clientIdParam);
      } else if (viewParam === 'focus' || filterParam === 'overdue' || filterParam === 'today') {
        setActiveView('focus');
        if (filterParam === 'overdue' || filterParam === 'today' || filterParam === 'soon') {
          setFocusInitialFilter(filterParam as any);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Fetch portal client data when requested via URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view');
    const rawCId = portalClientId || params.get('clientId');
    const cId = rawCId ? rawCId.trim() : null;

    if ((view === 'portal' || activeView === 'portal') && cId) {
      // 1. Check if client is already in the loaded clients list (by id or by code)
      const existing = clients.find(c => 
        c.id === cId || 
        (c.code && c.code.toLowerCase() === cId.toLowerCase())
      );
      if (existing) {
        setStandalonePortalClient(existing);
        try {
          sessionStorage.setItem('portal_client_' + cId, JSON.stringify(existing));
        } catch {}
        setPortalError(null);
        setPortalLoading(false);
        return;
      }

      // 2. If already loaded in standalonePortalClient, avoid refetching
      if (standalonePortalClient && (standalonePortalClient.id === cId || standalonePortalClient.code?.toLowerCase() === cId.toLowerCase())) {
        setPortalLoading(false);
        return;
      }

      // 3. Avoid duplicate concurrent fetches for the same ID
      if (hasFetchedPortalRef.current === cId) {
        return;
      }
      hasFetchedPortalRef.current = cId;

      // 4. Otherwise fetch client and tasks directly from Firestore with 6-second safety timeout
      const fetchClientDirectly = async () => {
        setPortalLoading(true);
        setPortalError(null);

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('REQUEST_TIMEOUT')), 6000)
        );

        const fetchWork = async () => {
          let clientData: Client | null = null;
          let actualClientId = cId;

          // A. Try fetching by document ID
          const clientRef = doc(db, 'clients', cId);
          const clientSnap = await getDoc(clientRef);
          
          if (clientSnap.exists()) {
            clientData = { id: clientSnap.id, ...clientSnap.data() } as Client;
            actualClientId = clientSnap.id;
          } else {
            // B. If not found by document ID, search by 'code' field
            const codeQuery = query(collection(db, 'clients'), where('code', '==', cId));
            const codeSnap = await getDocs(codeQuery);
            if (!codeSnap.empty) {
              const matchedDoc = codeSnap.docs[0];
              clientData = { id: matchedDoc.id, ...matchedDoc.data() } as Client;
              actualClientId = matchedDoc.id;
            } else {
              // C. Case-insensitive search across all clients in Firestore
              const allSnap = await getDocs(collection(db, 'clients'));
              const foundDoc = allSnap.docs.find(d => {
                const dData = d.data();
                return d.id.toLowerCase() === cId.toLowerCase() || 
                       (dData.code && dData.code.toLowerCase() === cId.toLowerCase());
              });
              if (foundDoc) {
                clientData = { id: foundDoc.id, ...foundDoc.data() } as Client;
                actualClientId = foundDoc.id;
              }
            }
          }

          if (clientData) {
            // Fetch tasks for the matched client
            const tasksSnap = await getDocs(collection(db, 'clients', actualClientId, 'tasks'));
            const tasksList: TaskItem[] = [];
            tasksSnap.forEach(tDoc => {
              tasksList.push({ id: tDoc.id, ...tDoc.data() } as TaskItem);
            });
            clientData.tasks = tasksList;
            setStandalonePortalClient(clientData);
            try {
              sessionStorage.setItem('portal_client_' + cId, JSON.stringify(clientData));
            } catch {}
            setPortalError(null);
          } else {
            console.warn(`Portal client not found for id/code: ${cId}`);
            setPortalError('عفواً، بيانات العميل غير متوفرة أو الرابط غير صحيح');
            setStandalonePortalClient(null);
          }
        };

        try {
          await Promise.race([fetchWork(), timeoutPromise]);
        } catch (err: any) {
          console.error('Error fetching portal client from Firestore:', err);
          if (err?.message === 'REQUEST_TIMEOUT') {
            setPortalError('استغرق جلب بيانات العميل وقتاً أطول من المتوقع. يرجى إعادة المحاولة.');
          } else {
            setPortalError('عفواً، حدث خطأ أثناء تحميل بيانات العميل أو الرابط غير صحيح');
          }
          // If we had cached data in sessionStorage, restore it!
          try {
            const cached = sessionStorage.getItem('portal_client_' + cId);
            if (cached) {
              setStandalonePortalClient(JSON.parse(cached));
              setPortalError(null);
            } else {
              setStandalonePortalClient(null);
            }
          } catch {}
        } finally {
          setPortalLoading(false);
        }
      };

      fetchClientDirectly();
    }
  }, [portalClientId, activeView, clients, standalonePortalClient]);

  useEffect(() => {
    if (dashboardConfig.enableTaskAlerts && !dataLoading && clients.length > 0 && !userDismissedAlertModalRef.current) {
      const overdueCount = alerts.filter(a => a.alertType === 'overdue').length;
      const dueTodayCount = alerts.filter(a => a.alertType === 'due_today').length;
      
      if (overdueCount > 0 || dueTodayCount > 0) {
        setShowTaskAlertModal(true);
      }
    }
  }, [dataLoading, clients.length, dashboardConfig.enableTaskAlerts, alerts]);

  // Find currently selected client object
  const selectedClient = useMemo(() => {
    if (!selectedClientId) return null;
    return clients.find(c => c.id === selectedClientId) || null;
  }, [clients, selectedClientId]);

  // Filter clients for dashboard
  const filteredClients = useMemo(() => {
    const filteredList = clients.filter(client => {
      // Archive filter
      if (activeView === 'archive') {
        if (!client.isArchived && client.caseStatus !== 'مكتمل' && !client.isLost) return false;
      } else {
        if (client.isArchived || client.caseStatus === 'مكتمل' || client.isLost) return false;
      }

      // Search text match
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchesSearch = 
          client.clientName.toLowerCase().includes(q) ||
          (client.companyName && client.companyName.toLowerCase().includes(q)) ||
          client.code.toLowerCase().includes(q) ||
          client.clientNumber.includes(q) ||
          client.groupName.toLowerCase().includes(q) ||
          (client.contract && client.contract.toLowerCase().includes(q));

        if (!matchesSearch) return false;
      }

      // Company filter
      if (filterState.company && client.companyName !== filterState.company) {
        return false;
      }

      // Contract filter
      if (filterState.contract && client.contract !== filterState.contract) {
        return false;
      }

      // Status filter
      if (filterState.status && client.caseStatus !== filterState.status) {
        return false;
      }

      // Delay / Milestone filter
      if (filterState.delayFilter && filterState.delayFilter !== 'all') {
        const stats = calculateClientProgress(client);
        if (filterState.delayFilter === 'delayed_only' && stats.delayedTasks === 0) {
          return false;
        }
        if (filterState.delayFilter === 'upcoming_only' && stats.dueSoonTasks === 0) {
          return false;
        }
        if (filterState.delayFilter === 'completed_only' && (stats.progressPercent < 100 || !client.tasks || client.tasks.length === 0)) {
          return false;
        }
      }

      // Assigned Employee filter
      if (filterState.assignedEmployee) {
        const emp = filterState.assignedEmployee;
        const matchesClient = client.assignedToName === emp || client.accountManager === emp;
        const matchesTasks = (client.tasks || []).some(t => t.assignedTo === emp);
        if (!matchesClient && !matchesTasks) {
          return false;
        }
      }

      return true;
    });

    if (customClientOrder.length > 0 && activeView !== 'archive') {
      return filteredList.sort((a, b) => {
        const indexA = customClientOrder.indexOf(a.id);
        const indexB = customClientOrder.indexOf(b.id);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;

        const aExpired = getRemainingContractDays(a) < 0 || a.isLost;
        const bExpired = getRemainingContractDays(b) < 0 || b.isLost;
        
        if (aExpired && !bExpired) return 1;
        if (!aExpired && bExpired) return -1;

        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
    }

    return filteredList.sort((a, b) => {
      const aExpired = getRemainingContractDays(a) < 0 || a.isLost;
      const bExpired = getRemainingContractDays(b) < 0 || b.isLost;
      
      if (aExpired && !bExpired) return 1;
      if (!aExpired && bExpired) return -1;
      
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
  }, [clients, searchQuery, filterState, customClientOrder, activeView]);

  // Memoized company groups
  const companyGroups = useMemo(() => {
    const companies = Array.from(new Set<string>(filteredClients.map(c => c.companyName || 'بدون شركة'))).sort((a: string, b: string) => {
      if (a === 'بدون شركة') return 1;
      if (b === 'بدون شركة') return -1;
      return a.localeCompare(b);
    });

    return companies.map(company => ({
      company,
      clients: filteredClients.filter(c => (c.companyName || 'بدون شركة') === company)
    }));
  }, [filteredClients]);

  // Memoized handlers using useCallback
  const handleSelectClient = useCallback((id: string) => {
    setSelectedClientId(id);
  }, []);

  const handleBackFromDetail = useCallback(() => {
    setSelectedClientId(null);
  }, []);

  const handleSetClientToDelete = useCallback((id: string) => {
    setClientToDelete(id);
  }, []);

  const handleCloseDeleteConfirm = useCallback(() => {
    setClientToDelete(null);
  }, []);

  const handleConfirmDeleteClient = useCallback(async () => {
    if (clientToDelete) {
      await deleteClient(clientToDelete);
      setClientToDelete(null);
    }
  }, [clientToDelete, deleteClient]);

  const handleToggleReadingMode = useCallback(() => {
    setIsReadingMode(prev => !prev);
  }, []);

  const handleOpenAddTask = useCallback((id: string) => {
    setAddTaskClientId(id);
    setIsAddTaskOpen(true);
  }, []);

  const handleCloseAddTask = useCallback(() => {
    setIsAddTaskOpen(false);
  }, []);

  const handleEditClient = useCallback((client: Client) => {
    setEditingClient(client);
  }, []);

  const handleCloseEditClient = useCallback(() => {
    setEditingClient(null);
  }, []);

  const handleArchiveToggle = useCallback(async (client: Client) => {
    // A client is "in the archive" when it is archived, completed or lost (same rule as the views).
    const isInArchive = !!client.isArchived || client.caseStatus === 'مكتمل' || !!client.isLost;
    // Restoring must also clear the completed / lost state, otherwise the client stays in the
    // archive while the app says it was restored.
    // Only the archive-related fields are sent (a full copy would overwrite a colleague's recent edits).
    const ok = await updateClient(
      isInArchive
        ? { id: client.id, isArchived: false, isLost: false, ...(client.caseStatus === 'مكتمل' ? { caseStatus: 'نشط' as const } : {}) }
        : { id: client.id, isArchived: true }
    );
    if (ok) {
      toast.success(isInArchive ? 'تم استعادة العميل بنجاح' : 'تم أرشفة العميل بنجاح');
    }
  }, [updateClient]);

  // Receives only the fields that changed (plus id). Returns false when the save failed, so the
  // screens do not say "saved".
  const handleUpdateClient = useCallback(async (changes: Partial<Client> & { id: string }) => {
    return updateClient(changes);
  }, [updateClient]);

  const handleAddTask = useCallback(async (clientId: string, newTask: TaskItem) => {
    await addTask(clientId, {
      ...newTask,
      createdBy: user!.uid
    });
  }, [addTask, user]);

  const handleOpenAddActivation = useCallback((clientId?: string, activation?: DailyActivation) => {
    // From a client's page the client is fixed. From the header / Activations page the open client
    // (if any) is only suggested and the user can change it. It used to default to clients[0], so
    // activations added from there could go to the first client by mistake.
    setActivationClientId(clientId || selectedClientId || '');
    setActivationClientLocked(!!clientId);
    setEditingActivation(activation || null);
    setIsAddActivationOpen(true);
  }, [selectedClientId]);

  // Sign out after the last changes reached the server and the clients' shared pages.
  const handleLogout = useCallback(async () => {
    const slow = setTimeout(() => toast.loading('جاري حفظ آخر التعديلات قبل تسجيل الخروج...', { id: 'signing-out' }), 800);
    try {
      await waitForSavesToFinish(8000);
      await Promise.race([flushPortalRefreshes(), new Promise(resolve => setTimeout(resolve, 3000))]);
    } catch {}
    clearTimeout(slow);
    await logout();
    toast.dismiss('signing-out');
  }, [flushPortalRefreshes, logout]);

  const handleCloseAddActivation = useCallback(() => {
    setIsAddActivationOpen(false);
    setEditingActivation(null);
  }, []);

  // Emergency Recovery State & Handlers
  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryReport, setRecoveryReport] = useState<EmergencyRecoveryReport | null>(null);

  const handleStartEmergencyRecovery = useCallback(async () => {
    setIsRecovering(true);
    try {
      const report = await recoverCompletedTasksFromActivities();
      setRecoveryReport(report);
      // The recovery writes to the database directly: update the shared pages of those clients
      // once the restored tasks have reached this page.
      const recoveredIds = [...new Set((report.restoredDetails || []).map(d => d.clientId))];
      if (recoveredIds.length > 0) setTimeout(() => recoveredIds.forEach(schedulePortalRefresh), 2000);
      if (report.success) {
        if (report.tasksRestored > 0) {
          toast.success(`تم استرجاع ${report.tasksRestored} مهمة مكتملة بنجاح من سجل النشاطات!`);
        } else {
          toast('تم فحص السجلات: لم يتم العثور على مهام مفقودة لاسترجاعها', { icon: 'ℹ️' });
        }
      } else {
        toast.error('حدث خطأ أثناء فحص السجلات: ' + (report.error || ''));
      }
    } catch (err: any) {
      console.error('Recovery error:', err);
      toast.error('حدث خطأ غير متوقع أثناء استرجاع المهام');
    } finally {
      setIsRecovering(false);
    }
  }, [schedulePortalRefresh]);

  const handleOpenRecoveryModal = useCallback(() => {
    setRecoveryReport(null);
    setIsRecoveryModalOpen(true);
  }, []);

  const handleCloseRecoveryModal = useCallback(() => {
    setIsRecoveryModalOpen(false);
  }, []);

  const handleSaveActivation = useCallback(async (targetClientId: string, activationOrList: DailyActivation | DailyActivation[]) => {
    const items = Array.isArray(activationOrList) ? activationOrList : [activationOrList];
    for (const item of items) {
      await saveActivation(targetClientId, {
        ...item,
        createdBy: item.createdBy || user?.displayName || user?.email || 'مستخدم غير محدد',
        createdAt: item.createdAt || new Date().toISOString()
      });
    }
  }, [saveActivation, user]);

  const handleBackToDashboard = useCallback(() => {
    setFocusInitialFilter('all');
    setPortalClientId(null);
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.get('view') === 'portal') {
        url.searchParams.delete('view');
        url.searchParams.delete('clientId');
        window.history.pushState({}, '', url.toString());
      }
    } catch {}
    setActiveView('dashboard');
  }, []);

  const handleDeleteActivationCallback = useCallback(async (cId: string, actId: string) => {
    try {
      await deleteActivation(cId, actId);
    } catch (e) {
      console.error(e);
    }
  }, [deleteActivation]);

  const handleCompleteTaskCallback = useCallback(async (clientId: string, task: Partial<TaskItem> & { id: string }) => {
    return updateTask(clientId, task);
  }, [updateTask]);

  const handleStatsFilterChange = useCallback((newF: Partial<FilterState>) => {
    setFilterState(prev => ({ ...prev, ...newF }));
  }, []);

  const handleOpenCustomizer = useCallback(() => {
    setIsCustomizerOpen(true);
  }, []);

  const handleCloseCustomizer = useCallback(() => {
    setIsCustomizerOpen(false);
  }, []);

  const handleOpenUpcomingTasksModal = useCallback(() => {
    setIsUpcomingModalOpen(true);
  }, []);

  const handleCloseUpcomingTasksModal = useCallback(() => {
    setIsUpcomingModalOpen(false);
  }, []);

  const handleOpenDelayedTasksModal = useCallback(() => {
    setIsDelayedModalOpen(true);
  }, []);

  const handleCloseDelayedTasksModal = useCallback(() => {
    setIsDelayedModalOpen(false);
  }, []);

  const handleCloseTaskAlertModal = useCallback(() => {
    userDismissedAlertModalRef.current = true;
    setShowTaskAlertModal(false);
  }, []);

  const handleNavigateToOverdueTasks = useCallback(() => {
    userDismissedAlertModalRef.current = true;
    setShowTaskAlertModal(false);
    setSelectedClientId(null);
    setFocusInitialFilter('overdue');
    setActiveView('focus');
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('view', 'focus');
      url.searchParams.set('filter', 'overdue');
      window.history.pushState({}, '', url.toString());
    } catch {
      // ignore
    }
  }, []);

  const handleNavigateToTodayTasks = useCallback(() => {
    userDismissedAlertModalRef.current = true;
    setShowTaskAlertModal(false);
    setSelectedClientId(null);
    setFocusInitialFilter('today');
    setActiveView('focus');
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('view', 'focus');
      url.searchParams.set('filter', 'today');
      window.history.pushState({}, '', url.toString());
    } catch {
      // ignore
    }
  }, []);

  const handleOpenAlertsDrawer = useCallback(() => {
    setIsAlertsOpen(true);
  }, []);

  const handleCloseAlertsDrawer = useCallback(() => {
    setIsAlertsOpen(false);
  }, []);

  const handleOpenAddClient = useCallback(() => {
    setIsAddClientOpen(true);
  }, []);

  const handleCloseAddClient = useCallback(() => {
    setIsAddClientOpen(false);
  }, []);

  const handleAddClient = useCallback(async (newClient: Client) => {
    const validation = checkClientDuplication(newClient, clients);

    if (validation.isDuplicate && validation.errorMessage) {
      alert(validation.errorMessage);
      return false;
    }

    const creatorStaff = newClient.ownerName || newClient.assignedTo || profile?.name || user?.displayName || user?.email || 'موظف أكونت مانجمنت';
    return addClient({
      ...newClient,
      ownerName: creatorStaff,
      assignedTo: creatorStaff,
      assignedToName: newClient.assignedToName || creatorStaff,
      createdBy: user?.uid || newClient.createdBy,
      createdAt: new Date().toISOString()
    });
  }, [addClient, user, profile, clients]);

  const handleResetData = useCallback(() => {
    setIsResetConfirmOpen(true);
  }, []);

  const handleCloseResetConfirm = useCallback(() => {
    setIsResetConfirmOpen(false);
  }, []);

  const handleViewChange = useCallback((view: any) => {
    if (view !== 'focus') {
      setFocusInitialFilter('all');
    }
    if (view !== 'portal') {
      setPortalClientId(null);
      try {
        const url = new URL(window.location.href);
        if (url.searchParams.get('view') === 'portal') {
          url.searchParams.delete('view');
          url.searchParams.delete('clientId');
          window.history.pushState({}, '', url.toString());
        }
      } catch {}
    }
    setActiveView(view);
  }, []);

  const handleOpenAddActivationHeader = useCallback(() => {
    handleOpenAddActivation();
  }, [handleOpenAddActivation]);

  const handleSetGridViewMode = useCallback(() => {
    setDashboardConfig(prev => ({ ...prev, viewMode: 'grid' }));
  }, []);

  const handleSetTableViewMode = useCallback(() => {
    setDashboardConfig(prev => ({ ...prev, viewMode: 'table' }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setFilterState({ search: '', company: '', contract: '', status: '', delayFilter: 'all' });
  }, []);

  const handleBulkArchive = useCallback(async () => {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const oneMonthAgoStr = oneMonthAgo.toISOString().split('T')[0];
    
    const clientsToArchive = clients.filter(c => !c.isArchived && c.endDate && c.endDate < oneMonthAgoStr);
    
    if (clientsToArchive.length === 0) {
      toast.success('لا يوجد عملاء انتهت عقودهم منذ أكثر من شهر.');
      return;
    }
    
    if (!window.confirm(`هل أنت متأكد من أرشفة عدد ${clientsToArchive.length} من العملاء؟`)) return;
    
    try {
      let failed = 0;
      for (const c of clientsToArchive) {
        const ok = await updateClient({ id: c.id, isArchived: true });
        if (!ok) failed++;
      }
      if (failed > 0) {
        toast.error(`تعذّرت أرشفة ${failed} من ${clientsToArchive.length} عميل، حاول مرة أخرى.`);
        return;
      }
      toast.success(`تمت الأرشفة بنجاح.`);
    } catch(err) {
      toast.error('حدث خطأ أثناء الأرشفة');
    }
  }, [clients, updateClient]);

  // Drag and drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, id: string) => {
    setDraggedClientId(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverClientId(prev => (prev !== id ? id : prev));
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedClientId(null);
    setDragOverClientId(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = draggedClientId || e.dataTransfer.getData('text/plain');
    if (!sourceId || sourceId === targetId) {
      setDraggedClientId(null);
      setDragOverClientId(null);
      return;
    }

    const currentIds = filteredClients.map(c => c.id);
    const sourceIndex = currentIds.indexOf(sourceId);
    const targetIndex = currentIds.indexOf(targetId);

    if (sourceIndex !== -1 && targetIndex !== -1) {
      const newOrder = [...currentIds];
      const [moved] = newOrder.splice(sourceIndex, 1);
      newOrder.splice(targetIndex, 0, moved);

      setCustomClientOrder(newOrder);
      try {
        localStorage.setItem('crm_client_order', JSON.stringify(newOrder));
      } catch (err) {}
    }

    setDraggedClientId(null);
    setDragOverClientId(null);
  }, [draggedClientId, filteredClients]);

  // CSV Export
  const handleExportCSV = useCallback(() => {
    const headers = ['الكود', 'اسم العميل', 'رقم الجوال', 'نوع العقد', 'الحالة', 'تاريخ البداية', 'تاريخ النهاية', 'إجمالي التاسكات', 'المكتمل', 'المتأخر'];
    
    const rows = clients.map(c => {
      const stats = calculateClientProgress(c);
      return [
        `"${c.code}"`,
        `"${c.clientName}"`,
        `"${c.clientNumber}"`,
        `"${c.contract}"`,
        `"${c.caseStatus}"`,
        `"${c.startDate}"`,
        `"${c.endDate}"`,
        stats.totalTasks,
        stats.completedTasks,
        stats.delayedTasks
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `تقرير_متابعة_العملاء_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [clients]);

  const handleImportCSV = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (event) => {
        const text = event.target?.result as string;
        if (!text) return;
        
        let cleanText = text;
        if (cleanText.charCodeAt(0) === 0xFEFF) {
          cleanText = cleanText.substring(1);
        }
        
        const lines = cleanText.split('\n').filter(line => line.trim() !== '');
        if (lines.length <= 1) {
          alert('الملف فارغ أو لا يحتوي على بيانات صحيحة');
          return;
        }
        
        let importedCount = 0;
        for (let i = 1; i < lines.length; i++) {
          const row = lines[i].split(',').map(item => item.replace(/(^"|"$)/g, '').trim());
          if (row.length < 2) continue;
          
          const newClient: Client = {
            id: 'cli_' + Date.now() + '_' + i,
            code: row[0] || `C${Date.now()}`,
            clientName: row[1] || 'عميل جديد',
            clientNumber: row[2] || '',
            groupName: row[1] || '',
            contract: row[3] || 'فل باكدج',
            caseStatus: (row[4] as any) || 'جديد',
            startDate: row[5] || new Date().toISOString().split('T')[0],
            endDate: row[6] || new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split('T')[0],
            durationMonths: 3,
            tasks: [],
            createdAt: new Date().toISOString(),
            createdBy: user?.uid || 'local'
          };
          
          await addClient(newClient);
          importedCount++;
        }
        
        alert(`تم استيراد ${importedCount} عميل بنجاح`);
      };
      reader.readAsText(file);
    };
    input.click();
  }, [addClient, user]);

  const upcomingDisplayTasks = useMemo(() => {
    return alerts.filter(a => a.alertType === 'due_soon').map(a => ({
      id: a.id,
      taskTitle: a.taskTitle,
      category: a.category,
      clientName: a.clientName,
      clientId: a.clientId,
      dueDate: a.dueDate,
      daysDiff: a.daysDiff
    }));
  }, [alerts]);

  const delayedDisplayTasks = useMemo(() => {
    return alerts.filter(a => a.alertType === 'overdue').map(a => ({
      id: a.id,
      taskTitle: a.taskTitle,
      category: a.category,
      clientName: a.clientName,
      clientId: a.clientId,
      dueDate: a.dueDate,
      daysDiff: a.daysDiff
    }));
  }, [alerts]);

  const overdueAlertsCount = useMemo(() => alerts.filter(a => a.alertType === 'overdue').length, [alerts]);
  const dueTodayAlertsCount = useMemo(() => alerts.filter(a => a.alertType === 'due_today').length, [alerts]);

  const renderBreadcrumbs = () => {
    const breadcrumbs = [
      { label: 'الرئيسية', onClick: () => { handleBackFromDetail(); handleBackToDashboard(); }, isLast: !selectedClient && activeView === 'dashboard' }
    ];

    if (selectedClient) {
      if (activeView === 'archive') {
        breadcrumbs.push({ label: 'أرشيف العملاء', onClick: handleBackFromDetail, isLast: false });
      }
      breadcrumbs.push({ label: selectedClient.clientName, onClick: undefined, isLast: true });
    } else if (activeView === 'activations') {
      breadcrumbs.push({ label: 'المتابعة والتفعيلات اليومية', onClick: undefined, isLast: true });
    } else if (activeView === 'reports') {
      breadcrumbs.push({ label: 'التقارير والإحصائيات الشهرية', onClick: undefined, isLast: true });
    } else if (activeView === 'calendar') {
      breadcrumbs.push({ label: 'تقويم وتسليمات المهام', onClick: undefined, isLast: true });
    } else if (activeView === 'focus') {
      breadcrumbs.push({ label: 'نمط التركيز اليومي', onClick: undefined, isLast: true });
    } else if (activeView === 'users') {
      breadcrumbs.push({ label: 'المستخدمين', onClick: undefined, isLast: true });
    } else if (activeView === 'operations') {
      breadcrumbs.push({ label: 'الأوبريشن (العمليات)', onClick: undefined, isLast: true });
    } else if (activeView === 'workload') {
      breadcrumbs.push({ label: 'مراقبة حِمل الفريق (Workload)', onClick: undefined, isLast: true });
    } else if (activeView === 'archive') {
      breadcrumbs.push({ label: 'أرشيف العملاء', onClick: undefined, isLast: true });
    } else if (activeView === 'sla') {
      breadcrumbs.push({ label: 'مؤشرات الأداء والـ SLA', onClick: undefined, isLast: true });
    } else if (activeView === 'portal') {
      breadcrumbs.push({ label: 'بوابة العميل (Client Portal)', onClick: undefined, isLast: true });
    }

    return (
      <nav className="flex items-center text-sm text-[var(--text-muted)] mb-6 bg-[var(--surface)] px-4 py-3 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs print:hidden" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2 w-full">
          {breadcrumbs.map((item, index) => (
            <li key={index} className="flex items-center">
              {index > 0 && <ChevronLeft className="w-4 h-4 mx-2 text-[var(--text-muted)] shrink-0" />}
              {item.isLast ? (
                <span className="font-semibold text-indigo-600 dark:text-indigo-400 truncate max-w-[200px] sm:max-w-md" aria-current="page" title={item.label}>
                  {item.label}
                </span>
              ) : (
                <button
                  onClick={item.onClick}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium flex items-center gap-1.5 shrink-0"
                  title={item.label}
                >
                  {index === 0 && <Home className="w-4 h-4 shrink-0" />}
                  <span>{item.label}</span>
                </button>
              )}
            </li>
          ))}
        </ol>
      </nav>
    );
  };

  if (sharedPortalToken) {
    if (!sharedPortalClient && !sharedPortalError) {
      return (
        <div className="min-h-screen flex items-center justify-center" dir="rtl">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
      );
    }
    return <ClientPortalView client={sharedPortalClient} errorMessage={sharedPortalError} isStaffLoggedIn={false} />;
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    const params = new URLSearchParams(window.location.search);
    const isPortalUrl = (params.get('view') === 'portal' || activeView === 'portal') && (portalClientId || params.get('clientId'));
    if (isPortalUrl) {
      if (portalLoading) {
        return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0B0F19] gap-4">
            <div className="flex items-center">
              <img src="/logo-light.png" alt="دفة - DEFFA CRM" className="block dark:hidden h-14 w-auto object-contain drop-shadow-sm" />
              <img src="/logo-dark.png" alt="دفة - DEFFA CRM" className="hidden dark:block h-14 w-auto object-contain drop-shadow-sm" />
            </div>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#593BFE]"></div>
            <span className="text-xs font-bold text-slate-500">جاري فتح بوابة العميل...</span>
          </div>
        );
      }
      const clientForPortal = standalonePortalClient || (portalClientId ? clients.find(c => c.id === portalClientId || c.code === portalClientId) : null);
      if (clientForPortal) {
        return <ClientPortalView client={clientForPortal} isStaffLoggedIn={false} />;
      }
      // If client not found or error occurred, render friendly error screen
      return (
        <ClientPortalView 
          client={null} 
          errorMessage={portalError || 'عفواً، بيانات العميل غير متوفرة أو الرابط غير صحيح'} 
          isStaffLoggedIn={false} 
        />
      );
    }
    return <Login />;
  }

  // ACCESS GATE: Strict verification of user status immediately after profile loads
  // Prevent suspended, disabled, or pending accounts from accessing the dashboard view
  if (isUserSuspended(profile, user)) {
    return (
      <SuspendedUserScreen 
        user={user} 
        profile={profile} 
        onLogout={logout} 
      />
    );
  }

  return (
    <PortalLinkProvider value={getPortalLink}>
      <div className="min-h-screen bg-[var(--bg)] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200 print:min-h-0 print:h-auto print:overflow-visible print:bg-white print:text-black flex flex-col">
      <Toaster position="top-left" reverseOrder={false} toastOptions={{ style: { direction: 'rtl' } }} />
      {/* App Top Navigation Bar */}
      <AppHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        alerts={alerts}
        notifications={notifications}
        onOpenAlerts={handleOpenAlertsDrawer}
        onOpenAddClient={handleOpenAddClient}
        onOpenAddActivation={handleOpenAddActivationHeader}
        onResetData={handleResetData}
        onExportCSV={handleExportCSV}
        onImportCSV={handleImportCSV}
        selectedClientId={selectedClientId}
        onBackToDashboard={handleBackFromDetail}
        activeView={activeView}
        onViewChange={handleViewChange}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
        isReadingMode={isReadingMode}
        onToggleReadingMode={handleToggleReadingMode}
        onLogout={handleLogout}
        userRole={profile?.role}
        onEmergencyRecovery={handleOpenRecoveryModal}
        connectionStatus={connectionStatus}
        onOpenEscalation={() => setIsEscalationOpen(true)}
        onOpenExecutiveReport={() => setIsExecutiveReportOpen(true)}
        onSyncTasksMatrix={(profile?.role === 'admin' || profile?.role === 'account_manager_head' || profile?.role === 'manager') ? () => setIsSyncTasksConfirmOpen(true) : undefined}
      />

      {/* Main Page Body Container */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 print:w-full print:max-w-none print:p-0 print:m-0 print:overflow-visible flex-1 w-full">
        
        {renderBreadcrumbs()}

        <AppPageTransition viewKey={selectedClient ? `client-${selectedClient.id}` : activeView}>
        {dataLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <Suspense fallback={
            <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="text-sm font-bold text-[var(--text-muted)] animate-pulse">جاري التحميل...</span>
            </div>
          }>
            {selectedClient ? (
              <ClientDetailPage
                client={selectedClient}
                onBack={handleBackFromDetail}
                onUpdateClient={handleUpdateClient}
                onUpdateTask={updateTask}
                onDeleteTask={deleteTask}
                onReorderTasks={reorderTasks}
                onSyncClientTasks={syncSingleClientTasks}
                onClearClientTasks={profile?.role === 'admin' ? clearClientTasks : undefined}
                onDeleteActivation={handleDeleteActivationCallback}
                onDeleteClient={deleteClient}
                onOpenAddTask={handleOpenAddTask}
                onOpenEditClient={handleEditClient}
                onOpenAddActivation={handleOpenAddActivation}
                isReadingMode={isReadingMode}
                onToggleReadingMode={handleToggleReadingMode}
                dashboardConfig={dashboardConfig}
              />
            ) : activeView === 'operations' ? (
              <OperationsTab 
                clients={activeClientsList}
                onSelectClient={handleSelectClient}
              />
            ) : activeView === 'archive' ? (
              <ArchiveTab
                clients={clients}
                searchQuery={searchQuery}
                filterState={filterState}
                onSelectClient={handleSelectClient}
                onEditClient={handleEditClient}
                onDeleteClient={handleSetClientToDelete}
                onArchiveToggle={handleArchiveToggle}
                onAddTask={handleOpenAddTask}
                dashboardConfig={dashboardConfig}
                setDashboardConfig={setDashboardConfig}
                usersMap={systemUsers}
              />
            ) : activeView === 'activations' ? (
              <GlobalActivationsView
                clients={activeClientsList}
                onOpenAddActivation={handleOpenAddActivation}
                onSelectClient={handleSelectClient}
                onBackToDashboard={handleBackToDashboard}
                onDeleteActivation={handleDeleteActivationCallback}
              />
            ) : activeView === 'focus' ? (
              <FocusView
                clients={activeClientsList}
                onSelectClient={handleSelectClient}
                onCompleteTask={handleCompleteTaskCallback}
                initialFilter={focusInitialFilter}
              />
            ) : activeView === 'reports' ? (
              <MonthlyReportsView
                clients={activeClientsList}
                onSelectClient={handleSelectClient}
              />
            ) : activeView === 'calendar' ? (
              <CalendarView 
                clients={activeClientsList}
                onSelectClient={handleSelectClient}
              />
            ) : activeView === 'users' ? (
              <UsersView 
                clients={activeClientsList}
                onSelectClient={handleSelectClient}
              />
            ) : activeView === 'workload' ? (
              <WorkloadDashboardView 
                clients={activeClientsList}
                onSelectClient={handleSelectClient}
              />
            ) : activeView === 'sla' && (profile?.role === 'admin' || profile?.role === 'account_manager_head' || profile?.role === 'manager') ? (
              <SlaDashboardView
                clients={activeClientsList}
                onSelectClient={handleSelectClient}
              />
            ) : activeView === 'portal' ? (
              portalLoading ? (
                <div className="p-16 text-center flex flex-col items-center justify-center gap-3">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#593BFE]"></div>
                  <span className="text-xs font-bold text-slate-500">جاري فتح بوابة العميل...</span>
                </div>
              ) : (
                <ClientPortalView
                  client={(portalClientId ? clients.find(c => c.id === portalClientId || c.code === portalClientId) : null) || standalonePortalClient}
                  errorMessage={portalError || (!((portalClientId ? clients.find(c => c.id === portalClientId || c.code === portalClientId) : null) || standalonePortalClient) ? 'عفواً، بيانات العميل غير متوفرة أو الرابط غير صحيح' : null)}
                  onBackToApp={handleBackToDashboard}
                  isStaffLoggedIn={true}
                />
              )
            ) : (
          <div>
            {!isReadingMode && (
              <StatsOverview
                clients={activeClientsList}
                filterState={filterState}
                onFilterChange={handleStatsFilterChange}
                config={dashboardConfig}
                onOpenCustomizer={handleOpenCustomizer}
                onOpenUpcomingTasks={handleOpenUpcomingTasksModal}
                onOpenDelayedTasks={handleOpenDelayedTasksModal}
                onSelectClient={handleSelectClient}
              />
            )}

            <div className="space-y-6 mt-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>قائمة العملاء</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-[var(--text)] font-bold">
                    {filteredClients.length}
                  </span>
                </h2>

                <div className="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-4 w-full sm:w-auto print:hidden">
                  {(profile?.role === 'admin' || profile?.role === 'account_manager_head' || profile?.role === 'manager') && (
                    <button
                      onClick={() => setIsEscalationOpen(true)}
                      className="text-xs font-bold bg-rose-500/10 text-rose-700 hover:bg-rose-500/20 dark:bg-rose-500/20 dark:text-rose-300 dark:hover:bg-rose-500/30 border border-rose-300/60 dark:border-rose-700/60 px-3 py-2 sm:py-1.5 rounded-xl flex items-center gap-1.5 transition-all min-h-[38px] active:scale-95 shadow-xs"
                      title="نظام وتنبيهات التصعيد الآلي للمهام المتأخرة"
                    >
                      <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                      <span>مركز التصعيد الآلي</span>
                    </button>
                  )}
                  {(profile?.role === 'admin' || profile?.role === 'manager') && (
                    <button
                      onClick={handleBulkArchive}
                      className="text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 px-3 py-2 sm:py-1.5 rounded-xl flex items-center gap-1.5 transition-all min-h-[38px] active:scale-95 shadow-xs"
                    >
                      <Archive className="w-4 h-4 text-slate-500" />
                      <span>أرشفة القديم (&gt; شهر)</span>
                    </button>
                  )}
                  {dashboardConfig.enableDragAndDrop && (
                    <span className="text-[11px] font-medium text-[var(--text-muted)] hidden md:inline-block">
                      💡 يمكنك سحب البطاقات وتغيير ترتيبها مباشرة
                    </span>
                  )}
                  <div className="flex items-center bg-slate-200/60 dark:bg-slate-800 p-1 rounded-xl border border-slate-300/40 dark:border-slate-700/50">
                    <button
                      onClick={handleSetGridViewMode}
                      className={`p-2 sm:p-1.5 rounded-lg transition-all min-w-[36px] min-h-[36px] flex items-center justify-center ${(!dashboardConfig.viewMode || dashboardConfig.viewMode === 'grid') ? 'bg-white dark:bg-slate-700 shadow-xs text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                      title="عرض البطاقات"
                      aria-label="عرض البطاقات"
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleSetTableViewMode}
                      className={`p-2 sm:p-1.5 rounded-lg transition-all min-w-[36px] min-h-[36px] flex items-center justify-center ${dashboardConfig.viewMode === 'table' ? 'bg-white dark:bg-slate-700 shadow-xs text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                      title="عرض الجدول/القائمة"
                      aria-label="عرض الجدول/القائمة"
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {clients.length === 0 ? (
                <div className="text-center py-16 bg-[var(--surface)] rounded-2xl border border-dashed border-[var(--border)] p-8 shadow-xs">
                  <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Database className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-[var(--text)]">مرحباً بك في المنصة</h3>
                  <p className="text-sm text-[var(--text-muted)] mt-2 max-w-sm mx-auto">
                    يبدو أن حسابك لا يحتوي على أي بيانات. يمكنك البدء بإضافة عميل جديد أو تحميل بيانات افتراضية نموذجية لتجربة المنصة.
                  </p>
                  <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                    <button
                      onClick={handleOpenAddClient}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-colors shadow-sm"
                    >
                      إضافة عميل جديد
                    </button>
                    <button
                      onClick={seedInitialData}
                      className="px-5 py-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700 shadow-sm"
                    >
                      تحميل بيانات تجريبية
                    </button>
                  </div>
                </div>
              ) : filteredClients.length === 0 ? (
                <div className="text-center py-16 bg-[var(--surface)] rounded-2xl border border-dashed border-[var(--border)] p-8 shadow-xs">
                  <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-[var(--text)]">لم يتم العثور على عملاء</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm mx-auto">
                    جرب تغيير كلمات البحث أو مسح تصفية الفلاتر لإظهار كافة العملاء، أو قم بإضافة عميل جديد.
                  </p>
                  <button
                    onClick={handleClearFilters}
                    className="mt-4 px-4 py-2 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold text-xs rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/80 transition-colors"
                  >
                    إلغاء التصفية وإظهار الجميع
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {companyGroups.map(({ company, clients: companyClients }) => (
                    <CompanyAccordionSection
                      key={company}
                      company={company}
                      companyClients={companyClients}
                      isCollapsed={expandedCompanies[company] === true}
                      onToggle={toggleCompanySection}
                      dashboardConfig={dashboardConfig}
                      usersMap={systemUsers}
                      onSelectClient={handleSelectClient}
                      onEditClient={handleEditClient}
                      onDeleteClient={handleSetClientToDelete}
                      onArchiveToggle={handleArchiveToggle}
                      onAddTask={handleOpenAddTask}
                      onDragStart={handleDragStart}
                      onDragOver={handleDragOver}
                      onDragEnd={handleDragEnd}
                      onDrop={handleDrop}
                      draggedClientId={draggedClientId}
                      dragOverClientId={dragOverClientId}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        </Suspense>
        )}
        </AppPageTransition>

      </main>

      {/* App Footer */}
      <Footer />

      {/* Modals & Drawers */}
      <DashboardCustomizerModal
        isOpen={isCustomizerOpen}
        onClose={handleCloseCustomizer}
        config={dashboardConfig}
        onUpdateConfig={handleUpdateDashboardConfig}
        onResetCardOrder={handleResetCardOrder}
        clients={activeClientsList}
      />
      <TaskAlertModal
        isOpen={showTaskAlertModal}
        onClose={handleCloseTaskAlertModal}
        overdueCount={overdueAlertsCount}
        dueTodayCount={dueTodayAlertsCount}
        onNavigateToOverdue={handleNavigateToOverdueTasks}
        onNavigateToToday={handleNavigateToTodayTasks}
      />
      <AlertsDrawer
        isOpen={isAlertsOpen}
        onClose={handleCloseAlertsDrawer}
        alerts={alerts}
        notifications={notifications}
        markNotificationAsRead={markNotificationAsRead}
        onSelectClient={handleSelectClient}
      />
      
      <TasksListModal
        isOpen={isUpcomingModalOpen}
        onClose={handleCloseUpcomingTasksModal}
        title="المهام القريبة"
        description="مهام يتبقى على تسليمها 3 أيام أو أقل"
        headerIcon={<Clock className="w-5 h-5" />}
        headerIconBgClass="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/50"
        tasks={upcomingDisplayTasks}
        onSelectClient={handleSelectClient}
      />

      <TasksListModal
        isOpen={isDelayedModalOpen}
        onClose={handleCloseDelayedTasksModal}
        title="المهام المتأخرة"
        description="مهام تجاوزت تاريخ الاستحقاق وتتطلب متابعة فورية"
        headerIcon={<AlertTriangle className="w-5 h-5" />}
        headerIconBgClass="bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/50"
        tasks={delayedDisplayTasks}
        onSelectClient={handleSelectClient}
      />

      <ClientFormModal
        isOpen={isAddClientOpen}
        onClose={handleCloseAddClient}
        onAddClient={handleAddClient}
        clients={activeClientsList}
        usersMap={systemUsers}
      />

      <AddTaskModal
        isOpen={isAddTaskOpen}
        onClose={handleCloseAddTask}
        clientId={addTaskClientId}
        onAddTask={handleAddTask}
      />

      <ClientFormModal
        isOpen={!!editingClient}
        onClose={handleCloseEditClient}
        clientToEdit={editingClient}
        onEditClient={handleUpdateClient}
        staffOptions={teamMembers}
        onAddClient={handleAddClient} 
        clients={activeClientsList} 
        usersMap={systemUsers}
      />

      <AddActivationModal
        isOpen={isAddActivationOpen}
        onClose={handleCloseAddActivation}
        clients={activeClientsList}
        initialClientId={activationClientId}
        lockClient={activationClientLocked}
        initialActivation={editingActivation}
        onSaveActivation={handleSaveActivation}
      />

      <ConfirmationModal
        isOpen={isResetConfirmOpen}
        onClose={handleCloseResetConfirm}
        onConfirm={seedInitialData}
        title="إعادة تحميل البيانات النموذجية"
        message="هل ترغب في تهيئة واستعادة البيانات الافتراضية في قاعدة البيانات؟"
        confirmText="استعادة البيانات"
        variant="warning"
      />

      <ConfirmationModal
        isOpen={isSyncTasksConfirmOpen}
        onClose={() => setIsSyncTasksConfirmOpen(false)}
        onConfirm={async () => {
          setIsSyncTasksConfirmOpen(false);
          const res = await syncAllClientsTasksMatrix();
          if (res.success) {
            toast.success(`تم تحديث وجدولة مهام ${res.count} عميل حالي بنجاح`);
          }
        }}
        title="تحديث مصفوفة مهام العملاء الحاليين"
        message="هل ترغب في تحديث وجدولة كافة مهام جميع العملاء الحاليين طبقاً لمصفوفة المهام المحدثة (البريف، السيو، الميديا، السوشيال، والتقارير الأسبوعية) وتواريخ البداية وقواعد الـ SLA؟ سيتم الحفاظ التام على أي مهام مكتملة مسبقاً."
        confirmText="تحديث وجدولة كافة المهام"
        variant="primary"
      />

      <ConfirmationModal
        isOpen={!!clientToDelete}
        onClose={handleCloseDeleteConfirm}
        onConfirm={handleConfirmDeleteClient}
        title="حذف العميل نهائياً"
        message="هل أنت متأكد من حذف هذا العميل وجميع المهام والبيانات الخاصة به؟ لا يمكن التراجع عن هذه الخطوة."
        confirmText="حذف العميل"
        variant="danger"
      />

      <EmergencyRecoveryModal
        isOpen={isRecoveryModalOpen}
        onClose={handleCloseRecoveryModal}
        onStartRecovery={handleStartEmergencyRecovery}
        isRecovering={isRecovering}
        report={recoveryReport}
      />

      <EscalationModal
        isOpen={isEscalationOpen}
        onClose={() => setIsEscalationOpen(false)}
        clients={clients}
        onSelectClient={handleSelectClient}
        currentUserId={user?.uid}
        currentUserName={profile?.name}
        recipients={teamMembers}
      />

      <ExecutiveReportModal
        isOpen={isExecutiveReportOpen}
        onClose={() => setIsExecutiveReportOpen(false)}
        clients={clients}
      />
    </div>
    </PortalLinkProvider>
  );
}
