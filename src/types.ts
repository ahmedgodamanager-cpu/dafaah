export type TaskCategory = 
  | 'account_management'
  | 'seo'
  | 'media_buying'
  | 'social_media';

export type CompanyType = 'AL - Ahly' | 'SYT' | 'Herak';

export type CaseStatus = 'نشط' | 'hold' | 'مكتمل' | 'جديد' | 'قيد المراجعة' | 'مؤجل';

export type AlertSeverity = 'critical' | 'warning' | 'info';

export type Role = 'admin' | 'account_manager_head' | 'member' | 'pending';

export type DepartmentType = 
  | 'قسم الأكونت مانجمنت'
  | 'قسم السيو'
  | 'قسم الميديا باينج'
  | 'قسم السوشيال ميديا';

export type SocialPlatform = 
  | 'سناب شات' 
  | 'انستجرام' 
  | 'تيك توك' 
  | 'تويتر / X' 
  | 'فيسبوك' 
  | 'لينكدإن' 
  | 'يوتيوب' 
  | 'موقع إلكتروني / SEO'
  | 'أخرى';

export type ActivationType = 
  | 'ستوري (Story)' 
  | 'بوست (Post)' 
  | 'فيديو / ريلز (Reel)' 
  | 'حملة إعلانية' 
  | 'تغطية ميدانية' 
  | 'تحسين SEO / مقال'
  | 'تقرير يومي' 
  | 'أخرى';

export type ActivationStatus = 
  | 'تم النشر' 
  | 'قيد التنفيذ' 
  | 'بانتظار الاعتماد' 
  | 'مؤجل';

export interface DailyActivation {
  id: string;
  date: string; // YYYY-MM-DD (Defaults automatically to today)
  department: DepartmentType;
  platform?: SocialPlatform;
  activityType?: ActivationType;
  title: string;
  status?: ActivationStatus;
  notes?: string;

  link?: string;
  createdBy?: string;
  createdAt: string;
}

export interface TaskComment {
  id: string;
  text: string;
  createdBy: string;
  createdAt: string;
}

export interface TaskItem {
  id: string;
  taskNumber: string;
  title: string;
  category: TaskCategory;
  startDate: string; // YYYY-MM-DD
  dueDate: string;   // YYYY-MM-DD
  completed: boolean;
  completedAt?: string;
  notes?: string;

  link?: string;
  createdBy?: string;
  assignedTo?: string;
  comments?: TaskComment[];
  order?: number;
  monthIndex?: number;
}

export interface ClientActivity {
  id: string;
  action: string;
  details?: string;
  createdAt: string;
  performedBy?: string;
}

export interface Client {
  id: string;
  code: string;
  clientName: string;
  clientNumber: string;
  groupName: string;
  contract: string;
  contractDate?: string;
  companyName?: CompanyType | string;
  influencer?: string;
  startDate: string;       // YYYY-MM-DD
  durationMonths: number;  // Duration in months
  endDate: string;         // YYYY-MM-DD
  caseStatus: CaseStatus;
  briefLink?: string;
  whatsappGroupLink?: string;
  driveFolderUrl?: string;
  planLinks?: { title: string; url: string }[];
  notes?: string;
  miniBrief?: string;
  isBriefLocked?: boolean;
  lastUpdated?: string;

  themeColor?: string;
  /** The client's logo: a small image saved with the client (data URL, see utils/logoImage.ts). */
  logoUrl?: string;
  tasks: TaskItem[];
  /** true once the full task list lives in the `clients/{id}/tasks` subcollection (see utils/taskStore.ts). */
  tasksMaterialized?: boolean;
  dailyActivations?: DailyActivation[];
  activities?: ClientActivity[];
  economyFullPackageMonths?: number;
  economyMediaMonths?: number;
  isLost?: boolean;
  isArchived?: boolean;
  isVip?: boolean;
  renewalCount?: number;
  holdStartDate?: string;
  /** Calendar days the client was on hold (they extend the contract end date). */
  accumulatedHoldDays?: number;
  /** Working days lost while on hold (open matrix tasks are moved by this much, also on re-sync). */
  accumulatedHoldBusinessDays?: number;
  /** Random id of this client's public portal page (portals/{portalToken}); staff only. */
  portalToken?: string;
  /** Every portal link of this client (all are kept up to date and removed with the client). */
  portalTokens?: string[];
  createdAt: string;
  createdBy?: string;
  assignedTo?: string;
  assignedToName?: string;
  ownerName?: string;
  accountManager?: string;
}

export interface TaskAlert {
  id: string;
  clientId: string;
  clientName: string;
  clientCode: string;
  taskId: string;
  taskTitle: string;
  category: TaskCategory;
  dueDate: string;
  daysDiff: number; // Negative = overdue, 0 = due today, positive = days remaining
  severity: AlertSeverity;
  alertType: 'overdue' | 'due_today' | 'due_soon';
}

export interface FilterState {
  search: string;
  company: string;
  contract: string;
  contractDate?: string;
  status: string;
  delayFilter: 'all' | 'delayed_only' | 'upcoming_only' | 'completed_only';
  assignedEmployee?: string;
}

export type ConnectionStatus = 'online' | 'syncing' | 'offline';

export type EscalationLevel = 1 | 2 | 3;

export interface EscalatedTask {
  id: string;
  taskId: string;
  taskTitle: string;
  taskCategory: TaskCategory;
  dueDate: string;
  daysOverdue: number;
  assignedTo?: string;
  clientId: string;
  clientName: string;
  companyName?: string;
  escalationLevel: EscalationLevel; // 1: Staff, 2: Dept Head, 3: Executive/Critical
  levelLabel: string;
  escalatedToRole: string;
}

export interface DashboardConfig {
  showStatsCards: boolean;
  showFilterBar: boolean;
  enableDragAndDrop: boolean;
  viewMode?: 'grid' | 'table';
  enableTaskAlerts?: boolean;
}

export interface CategoryInfo {
  id: TaskCategory;
  nameAr: string;
  iconName: string;
  description: string;
  color: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  type: 'transfer' | 'system';
  linkToClientId?: string;
}
