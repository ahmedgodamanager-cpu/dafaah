import { Client, CategoryInfo, TaskCategory, TaskItem } from '../types';
import { addBusinessDays, addMonthsKeepingDay, formatSequentialReports, formatDateToYYYYMMDD, getThursdaysOfContractMonth, parseDate, toWorkingDay } from '../utils/dateUtils';
import { isMatrixTaskNumber, taskKey } from '../utils/taskKeys';
import { addCalendarDays, shiftOpenTasks } from '../utils/holdUtils';

export { generateWeeklyReports, generateClientTasks, getThursdayOfWeek, getArabicOrdinal, formatSequentialReports, processAndSortClientTasks, formatDateToYYYYMMDD, parseDate } from '../utils/dateUtils';

export const CATEGORIES_INFO: CategoryInfo[] = [
  { id: 'account_management', nameAr: 'قسم الأكونت مانجمنت', iconName: 'Users', description: 'إدارة الحسابات، الصلاحيات، والتواصل مع العملاء', color: 'bg-slate-50 border-slate-200 text-slate-700' },
  { id: 'seo', nameAr: 'قسم السيو', iconName: 'Search', description: 'تحسين محركات البحث والموقع الإلكتروني', color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
  { id: 'media_buying', nameAr: 'قسم الميديا باينج', iconName: 'TrendingUp', description: 'إدارة وتتبع الحملات الإعلانية الممولة', color: 'bg-purple-50 border-purple-200 text-purple-700' },
  { id: 'social_media', nameAr: 'قسم السوشيال ميديا', iconName: 'Smartphone', description: 'صناعة المحتوى، التصميم، الموشن، وإدارة المنصات', color: 'bg-indigo-50 border-indigo-200 text-indigo-700' }
];

// ==========================================
// مصفوفة المهام الأساسية لعملاء الـ Full Package
// ==========================================
export const fullPackageCoreTasks: Array<{
  id: string;
  department: "Account Management" | "SEO" | "Media Buying" | "Social Media";
  week: number;
  title: string;
  isOneTime: boolean;
}> = [
  // ==========================================
  // 🥇 الجولة الأولى (الأسبوع الأول: التأسيس والتخطيط)
  // ==========================================
  { id: "W1-ACC-01", department: "Account Management", week: 1, title: "البريف", isOneTime: true },
  { id: "W1-SEO-01", department: "SEO", week: 1, title: "أكسيس الموقع / المتجر الإلكتروني", isOneTime: true },
  { id: "W1-SEO-02", department: "SEO", week: 1, title: "خطة الـ SEO", isOneTime: true },
  { id: "W1-MED-01", department: "Media Buying", week: 1, title: "أكسيس منصات الحملات الإعلانية", isOneTime: true },
  { id: "W1-MED-02", department: "Media Buying", week: 1, title: "استراتيجية الحملات الإعلانية", isOneTime: true },
  { id: "W1-MED-03", department: "Media Buying", week: 1, title: "الماركتينج بلان", isOneTime: true },
  { id: "W1-SOC-01", department: "Social Media", week: 1, title: "استلام حسابات التواصل الاجتماعي", isOneTime: true },
  { id: "W1-SOC-02", department: "Social Media", week: 1, title: "كتابة استراتيجي السوشيال ميديا", isOneTime: true },
  { id: "W1-SEO-03", department: "SEO", week: 1, title: "كتابة الكلمات المفتاحية للمنتجات", isOneTime: false },
  { id: "W1-ACC-02", department: "Account Management", week: 1, title: "التقرير الأسبوعي", isOneTime: false },

  // ==========================================
  // 🥈 الجولة الثانية (الأسبوع الثاني: الخطط والمحتوى)
  // ==========================================
  { id: "W2-SEO-01", department: "SEO", week: 2, title: "تصميم الـ UI", isOneTime: true },
  { id: "W2-SEO-02", department: "SEO", week: 2, title: "تطبيق الـ UI", isOneTime: true },
  { id: "W2-MED-01", department: "Media Buying", week: 2, title: "ربط التراكينج (Tracking Setup)", isOneTime: true },
  { id: "W2-SEO-03", department: "SEO", week: 2, title: "كتابة محتوى المنتجات", isOneTime: false },
  ...Array.from({ length: 10 }).map((_, i) => ({ id: `W2-SEO-04-${i + 1}`, department: "SEO" as const, week: 2, title: `كتابة المقال ${i + 1}`, isOneTime: false })),
  { id: "W2-SOC-01", department: "Social Media", week: 2, title: "كتابة بلان تصاميم السوشيال ميديا", isOneTime: false },
  { id: "W2-SOC-02", department: "Social Media", week: 2, title: "كتابة بلان الفيديوهات الخاصة بالسوشيال ميديا", isOneTime: false },
  { id: "W2-MED-02", department: "Media Buying", week: 2, title: "بلان تصاميم الحملات الإعلانية", isOneTime: false },
  { id: "W2-MED-03", department: "Media Buying", week: 2, title: "بلان فيديوهات الحملات الإعلانية", isOneTime: false },
  { id: "W2-ACC-01", department: "Account Management", week: 2, title: "اعتماد العميل لبلان تصاميم السوشيال ميديا", isOneTime: false },
  { id: "W2-ACC-02", department: "Account Management", week: 2, title: "اعتماد العميل لبلان فيديوهات الحملات الإعلانية", isOneTime: false },
  { id: "W2-ACC-03", department: "Account Management", week: 2, title: "اعتماد العميل لبلان تصاميم الحملات الإعلانية", isOneTime: false },
  { id: "W2-ACC-04", department: "Account Management", week: 2, title: "اعتماد العميل لبلان فيديوهات السوشيال ميديا", isOneTime: false },
  { id: "W2-ACC-05", department: "Account Management", week: 2, title: "التقرير الأسبوعي", isOneTime: false },

  // ==========================================
  // 🥉 الجولة الثالثة (الأسبوع الثالث: التنفيذ والاعتماد)
  // ==========================================
  // يتم حساب مواعيد الاستلام التالية برمجياً بإضافة 3 أو 5 أيام عمل من وقت اعتماد البلان
  { id: "W3-SOC-01", department: "Social Media", week: 3, title: "استلام تصاميم السوشيال ميديا", isOneTime: false },
  { id: "W3-MED-01", department: "Media Buying", week: 3, title: "استلام تصاميم الحملات الإعلانية", isOneTime: false },
  { id: "W3-SOC-02", department: "Social Media", week: 3, title: "استلام فيديوهات السوشيال ميديا", isOneTime: false },
  { id: "W3-MED-02", department: "Media Buying", week: 3, title: "استلام فيديوهات الحملات الإعلانية", isOneTime: false },
  
  { id: "W3-ACC-01", department: "Account Management", week: 3, title: "اعتماد العميل تصاميم السوشيال ميديا", isOneTime: false },
  { id: "W3-ACC-02", department: "Account Management", week: 3, title: "اعتماد العميل فيديوهات الحملات الإعلانية", isOneTime: false },
  { id: "W3-ACC-03", department: "Account Management", week: 3, title: "اعتماد العميل تصاميم الحملات الإعلانية", isOneTime: false },
  { id: "W3-ACC-04", department: "Account Management", week: 3, title: "اعتماد العميل فيديوهات السوشيال ميديا", isOneTime: false },
  { id: "W3-SEO-01", department: "SEO", week: 3, title: "التحسينات الداخلية On-Page على الصفحات والأقسام", isOneTime: false },
  ...Array.from({ length: 5 }).map((_, i) => ({ id: `W3-SEO-02-${i + 1}`, department: "SEO" as const, week: 3, title: `نشر المقال ${i + 1}`, isOneTime: false })),
  { id: "W3-ACC-05", department: "Account Management", week: 3, title: "التقرير الأسبوعي", isOneTime: false },

  // ==========================================
  // 🏅 الجولة الرابعة (الأسبوع الرابع: الإطلاق والنشر)
  // ==========================================
  { id: "W4-MED-01", department: "Media Buying", week: 4, title: "إطلاق الحملات الإعلانية", isOneTime: false },
  { id: "W4-SOC-01", department: "Social Media", week: 4, title: "جدولة نشر التصاميم", isOneTime: false },
  { id: "W4-SOC-02", department: "Social Media", week: 4, title: "جدولة نشر الفيديوهات", isOneTime: false },
  { id: "W4-SEO-02", department: "SEO", week: 4, title: "تحديث ملف robots.txt وفحص السرعة", isOneTime: false },
  ...Array.from({ length: 5 }).map((_, i) => ({ id: `W4-SEO-01-${i + 6}`, department: "SEO" as const, week: 4, title: `نشر المقال ${i + 6}`, isOneTime: false })),
  { id: "W4-ACC-01", department: "Account Management", week: 4, title: "التقرير الأسبوعي", isOneTime: false },
  { id: "M-ACC-01", department: "Account Management", week: 4, title: "التقرير الشهري الشامل", isOneTime: false },
];

export const coreTasks = fullPackageCoreTasks;

// ==========================================
// 1. مصفوفة مهام عقد الميديا (بدون قسم الـ SEO)
// ==========================================
export const mediaPackageCoreTasks: Array<{
  id: string;
  department: "Account Management" | "SEO" | "Media Buying" | "Social Media";
  week: number;
  title: string;
  isOneTime: boolean;
}> = [
  // ==========================================
  // 🥇 الجولة الأولى (الأسبوع الأول: التأسيس والتخطيط)
  // ==========================================
  { id: "W1-ACC-01", department: "Account Management", week: 1, title: "البريف", isOneTime: true },
  { id: "W1-MED-01", department: "Media Buying", week: 1, title: "أكسيس منصات الحملات الإعلانية", isOneTime: true },
  { id: "W1-MED-02", department: "Media Buying", week: 1, title: "استراتيجية الحملات الإعلانية", isOneTime: true },
  { id: "W1-MED-03", department: "Media Buying", week: 1, title: "الماركتينج بلان", isOneTime: true },
  { id: "W1-SOC-01", department: "Social Media", week: 1, title: "استلام حسابات التواصل الاجتماعي", isOneTime: true },
  { id: "W1-SOC-02", department: "Social Media", week: 1, title: "كتابة استراتيجي السوشيال ميديا", isOneTime: true },
  { id: "W1-ACC-02", department: "Account Management", week: 1, title: "التقرير الأسبوعي", isOneTime: false },

  // ==========================================
  // 🥈 الجولة الثانية (الأسبوع الثاني: الخطط)
  // ==========================================
  { id: "W2-MED-01", department: "Media Buying", week: 2, title: "ربط التراكينج (Tracking Setup)", isOneTime: true },
  { id: "W2-SOC-01", department: "Social Media", week: 2, title: "كتابة بلان تصاميم السوشيال ميديا", isOneTime: false },
  { id: "W2-SOC-02", department: "Social Media", week: 2, title: "كتابة بلان الفيديوهات الخاصة بالسوشيال ميديا", isOneTime: false },
  { id: "W2-MED-02", department: "Media Buying", week: 2, title: "بلان تصاميم الحملات الإعلانية", isOneTime: false },
  { id: "W2-MED-03", department: "Media Buying", week: 2, title: "بلان فيديوهات الحملات الإعلانية", isOneTime: false },
  { id: "W2-ACC-01", department: "Account Management", week: 2, title: "اعتماد العميل لبلان تصاميم السوشيال ميديا", isOneTime: false },
  { id: "W2-ACC-02", department: "Account Management", week: 2, title: "اعتماد العميل لبلان فيديوهات الحملات الإعلانية", isOneTime: false },
  { id: "W2-ACC-03", department: "Account Management", week: 2, title: "اعتماد العميل لبلان تصاميم الحملات الإعلانية", isOneTime: false },
  { id: "W2-ACC-04", department: "Account Management", week: 2, title: "اعتماد العميل لبلان فيديوهات السوشيال ميديا", isOneTime: false },
  { id: "W2-ACC-05", department: "Account Management", week: 2, title: "التقرير الأسبوعي", isOneTime: false },

  // ==========================================
  // 🥉 الجولة الثالثة (الأسبوع الثالث: التنفيذ والاعتماد)
  // ==========================================
  { id: "W3-SOC-01", department: "Social Media", week: 3, title: "استلام تصاميم السوشيال ميديا", isOneTime: false },
  { id: "W3-MED-01", department: "Media Buying", week: 3, title: "استلام تصاميم الحملات الإعلانية", isOneTime: false },
  { id: "W3-SOC-02", department: "Social Media", week: 3, title: "استلام فيديوهات السوشيال ميديا", isOneTime: false },
  { id: "W3-MED-02", department: "Media Buying", week: 3, title: "استلام فيديوهات الحملات الإعلانية", isOneTime: false },
  { id: "W3-ACC-01", department: "Account Management", week: 3, title: "اعتماد العميل تصاميم السوشيال ميديا", isOneTime: false },
  { id: "W3-ACC-02", department: "Account Management", week: 3, title: "اعتماد العميل فيديوهات الحملات الإعلانية", isOneTime: false },
  { id: "W3-ACC-03", department: "Account Management", week: 3, title: "اعتماد العميل تصاميم الحملات الإعلانية", isOneTime: false },
  { id: "W3-ACC-04", department: "Account Management", week: 3, title: "اعتماد العميل فيديوهات السوشيال ميديا", isOneTime: false },
  { id: "W3-ACC-05", department: "Account Management", week: 3, title: "التقرير الأسبوعي", isOneTime: false },

  // ==========================================
  // 🏅 الجولة الرابعة (الأسبوع الرابع: الإطلاق والنشر)
  // ==========================================
  { id: "W4-MED-01", department: "Media Buying", week: 4, title: "إطلاق الحملات الإعلانية", isOneTime: false },
  { id: "W4-SOC-01", department: "Social Media", week: 4, title: "جدولة نشر التصاميم", isOneTime: false },
  { id: "W4-SOC-02", department: "Social Media", week: 4, title: "جدولة نشر الفيديوهات", isOneTime: false },
  { id: "W4-ACC-01", department: "Account Management", week: 4, title: "التقرير الأسبوعي", isOneTime: false },
  { id: "M-ACC-01", department: "Account Management", week: 4, title: "التقرير الشهري الشامل", isOneTime: false },
];

// ==========================================
// 2. مصفوفة الشهور المتكررة للباقة الاقتصادية (Recurring Economic Tasks)
// ==========================================
export const recurringEconomicTasks: Array<{
  id: string;
  department: "Account Management" | "SEO" | "Media Buying" | "Social Media";
  week: number;
  title: string;
  isOneTime: boolean;
}> = [
  // ==========================================
  // 🥇 الجولة الأولى (تقارير فقط - التأسيس انتهى)
  // ==========================================
  { id: "W1-ACC-02", department: "Account Management", week: 1, title: "التقرير الأسبوعي", isOneTime: false },

  // ==========================================
  // 🥈 الجولة الثانية (الخطط الدورية)
  // ==========================================
  { id: "W2-SOC-01", department: "Social Media", week: 2, title: "كتابة بلان تصاميم السوشيال ميديا", isOneTime: false },
  { id: "W2-SOC-02", department: "Social Media", week: 2, title: "كتابة بلان الفيديوهات الخاصة بالسوشيال ميديا", isOneTime: false },
  { id: "W2-MED-02", department: "Media Buying", week: 2, title: "بلان تصاميم الحملات الإعلانية", isOneTime: false },
  { id: "W2-MED-03", department: "Media Buying", week: 2, title: "بلان فيديوهات الحملات الإعلانية", isOneTime: false },
  { id: "W2-ACC-01", department: "Account Management", week: 2, title: "اعتماد العميل لبلان تصاميم السوشيال ميديا", isOneTime: false },
  { id: "W2-ACC-02", department: "Account Management", week: 2, title: "اعتماد العميل لبلان فيديوهات الحملات الإعلانية", isOneTime: false },
  { id: "W2-ACC-03", department: "Account Management", week: 2, title: "اعتماد العميل لبلان تصاميم الحملات الإعلانية", isOneTime: false },
  { id: "W2-ACC-04", department: "Account Management", week: 2, title: "اعتماد العميل لبلان فيديوهات السوشيال ميديا", isOneTime: false },
  { id: "W2-ACC-05", department: "Account Management", week: 2, title: "التقرير الأسبوعي", isOneTime: false },

  // ==========================================
  // 🥉 الجولة الثالثة (التنفيذ والاعتماد الدوري)
  // ==========================================
  { id: "W3-SOC-01", department: "Social Media", week: 3, title: "استلام تصاميم السوشيال ميديا", isOneTime: false },
  { id: "W3-MED-01", department: "Media Buying", week: 3, title: "استلام تصاميم الحملات الإعلانية", isOneTime: false },
  { id: "W3-SOC-02", department: "Social Media", week: 3, title: "استلام فيديوهات السوشيال ميديا", isOneTime: false },
  { id: "W3-MED-02", department: "Media Buying", week: 3, title: "استلام فيديوهات الحملات الإعلانية", isOneTime: false },
  { id: "W3-ACC-01", department: "Account Management", week: 3, title: "اعتماد العميل تصاميم السوشيال ميديا", isOneTime: false },
  { id: "W3-ACC-02", department: "Account Management", week: 3, title: "اعتماد العميل فيديوهات الحملات الإعلانية", isOneTime: false },
  { id: "W3-ACC-03", department: "Account Management", week: 3, title: "اعتماد العميل تصاميم الحملات الإعلانية", isOneTime: false },
  { id: "W3-ACC-04", department: "Account Management", week: 3, title: "اعتماد العميل فيديوهات السوشيال ميديا", isOneTime: false },
  { id: "W3-ACC-05", department: "Account Management", week: 3, title: "التقرير الأسبوعي", isOneTime: false },

  // ==========================================
  // 🏅 الجولة الرابعة (الإطلاق والنشر الدوري)
  // ==========================================
  { id: "W4-MED-01", department: "Media Buying", week: 4, title: "إطلاق الحملات الإعلانية", isOneTime: false },
  { id: "W4-SOC-01", department: "Social Media", week: 4, title: "جدولة نشر التصاميم", isOneTime: false },
  { id: "W4-SOC-02", department: "Social Media", week: 4, title: "جدولة نشر الفيديوهات", isOneTime: false },
  { id: "W4-ACC-01", department: "Account Management", week: 4, title: "التقرير الأسبوعي", isOneTime: false },
  { id: "M-ACC-01", department: "Account Management", week: 4, title: "التقرير الشهري الشامل", isOneTime: false },
];

const departmentToCategory: Record<string, TaskCategory> = {
  "Account Management": "account_management",
  "SEO": "seo",
  "Media Buying": "media_buying",
  "Social Media": "social_media"
};

export const STANDARD_CORE_TASKS: Array<{ taskNumber: string; title: string; category: TaskCategory, week: number, oneTimeOnly?: boolean }> = fullPackageCoreTasks.map(t => ({
  taskNumber: t.id,
  title: t.title,
  category: departmentToCategory[t.department] || 'account_management',
  week: t.week,
  oneTimeOnly: t.isOneTime
}));

export const OBSOLETE_TASKS_TO_REMOVE = [
  'نشر المحتوى المجدول ومتابعة التفاعل',
  'تحليل الأداء ورفع التوصيات اللازمة',
  'المتابعة الدورية للحملات وتحليل مؤشرات الأداء',
  'تنفيذ اختبارات وإجراءات التحسين لرفع الكفاءة وفق البيانات المتاحة',
  'متابعة مستمرة: رفع وتحسين بيانات المنتجات (بحد أقصى 50)',
  'متابعة مستمرة: كتابة ونشر وتنسيق SEO للمقالات (بحد أقصى 10)',
  'متابعة مستمرة: تحديث ملف robots.txt وفحص السرعة',
  'متابعة مستمرة: إعداد وتصميم (9 إلى 15) منشور ثابت',
  'متابعة مستمرة: إنتاج (3 إلى 5) فيديوهات/موشن',
  'ملاحظة: أعمال الروابط الخارجية (Backlinks) تبدأ من الشهر الثاني/الثالث'
];

export function isObsoleteTask(task: TaskItem): boolean {
  if (!task) return false;
  const title = (task.title || '').trim();

  for (const removedTitle of OBSOLETE_TASKS_TO_REMOVE) {
    if (title === removedTitle || title.startsWith(removedTitle)) {
      return true;
    }
  }

  if (task.taskNumber) {
    const num = task.taskNumber.trim().toUpperCase();
    if (
      num.startsWith('M-SEO-01') ||
      num.startsWith('M-SEO-02') ||
      num.startsWith('M-SEO-03') ||
      num.startsWith('M-SOC-01') ||
      num.startsWith('M-SOC-02') ||
      num.startsWith('M-SEO-04')
    ) {
      return true;
    }
  }

  return false;
}

/** أ / إ / آ → ا, so title checks do not depend on how the hamza was typed. */
const normalizeAlef = (text: string) => text.replace(/[أإآ]/g, 'ا');

/** Account tasks about paid campaigns (only for contracts that include media buying). */
const isCampaignTitle = (title: string) => {
  const t = normalizeAlef(title);
  return t.includes('الحملات') || t.includes('اعلاني');
};

/**
 * Titles these two tasks had before they were corrected. Task ids are numbered by position, and
 * saved task documents are matched to the matrix by id, so the numbering below still uses the old
 * titles: the tasks that stay keep the ids they always had.
 */
const PREVIOUS_TITLES: Record<string, string> = {
  'W2-ACC-04': 'اعتماد العميل لبلان الفيديوهات للحملات الإعلانية',
  'W3-ACC-04': 'اعتماد العميل الفيديوهات للحملات الإعلانية',
};

export function createDefaultCoreTasks(
  clientId: string,
  startDate: string,
  endDate?: string,
  contractType: string = 'فل باكدج',
  durationMonths: number = 1,
  economyFullPackageMonths: number = 0,
  economyMediaMonths: number = 0
): TaskItem[] {
  // Guard against clients saved without a start date or contract (avoids a crash on `.trim()`).
  startDate = startDate || '';
  contractType = contractType || 'فل باكدج';

  const getAllowedCategories = (contract: string): TaskCategory[] => {
    const c = contract.toLowerCase();
    
    // فل باكدج -> All Categories
    if (c.includes('فل باكدج') || c.includes('full package')) {
      return ['account_management', 'seo', 'media_buying', 'social_media'];
    }
    
    // سوشيال ميديا فقط -> Account + Social Media
    if (c.includes('سوشيال ميديا') && !c.includes('ميديا (')) {
      return ['account_management', 'social_media'];
    }
    
    // باقات الميديا بكل أنواعها (حملات، برودكشن، الخ) -> Account + Social Media + Media Buying (بدون سيو)
    if (c.includes('ميديا') || c.includes('media') || c.includes('فيديوهات')) {
      return ['account_management', 'media_buying', 'social_media'];
    }
    
    // انشاء -> Account + SEO
    if (c.includes('انشاء') || c.includes('seo')) {
      return ['account_management', 'seo'];
    }
    
    // براندينج / الاقتصادية -> Account + Social Media
    if (c.includes('براندينج') || c.includes('الاقتصادية')) {
      return ['account_management', 'social_media'];
    }
    
    // Default to everything
    return ['account_management', 'seo', 'media_buying', 'social_media'];
  };

  const getFilteredTasksForContract = (contract: string) => {
    const allowedCategories = getAllowedCategories(contract);
    const accountTaskFits = (title: string, checkCampaigns: boolean) => {
      // Compare without hamza: the titles say "الإعلانية", so the old check for "اعلانية" never
      // matched and contracts without campaigns still got the campaign approval tasks.
      if (checkCampaigns && !allowedCategories.includes('media_buying') && isCampaignTitle(title)) return false;
      if (!allowedCategories.includes('social_media') && title.includes('سوشيال')) return false;
      if (!allowedCategories.includes('seo') && (title.includes('الموقع') || title.includes('SEO') || title.includes('seo'))) return false;
      return true;
    };
    // Numbered over the list as it was before the campaign check worked (and with the old titles),
    // so removing the campaign tasks does not give the remaining tasks new ids.
    return STANDARD_CORE_TASKS
      .filter(t => allowedCategories.includes(t.category) &&
        (t.category !== 'account_management' || accountTaskFits(PREVIOUS_TITLES[t.taskNumber] || t.title, false)))
      .map((t, i) => ({ ...t, idIndex: i }))
      .filter(t => t.category !== 'account_management' || accountTaskFits(t.title, true));
  };

  const allTasks: TaskItem[] = [];
  
  let safeDuration = Math.max(1, durationMonths);
  if (contractType === 'الاقتصادية' && (economyFullPackageMonths > 0 || economyMediaMonths > 0)) {
    safeDuration = economyFullPackageMonths + economyMediaMonths;
  }

  // A report covers its own week: from that Sunday, or from the first working day if that is later.
  const firstWorkingDay = formatDateToYYYYMMDD(toWorkingDay(parseDate(startDate) || new Date()));
  const reportStart = (due: string) => {
    const sunday = addCalendarDays(due, -4);
    return sunday < firstWorkingDay ? firstWorkingDay : sunday;
  };

  for (let month = 0; month < safeDuration; month++) {
    let currentMonthContract = contractType;
    if (contractType === 'الاقتصادية') {
      if (month < economyFullPackageMonths) {
        currentMonthContract = 'فل باكدج';
      } else {
        currentMonthContract = 'ميديا ( حملات اعلانية + سوشيال )';
      }
    }
    
    // idIndex: position used in the task id when it differs from the position in this list.
    let filteredTasks: Array<{ taskNumber: string; title: string; category: TaskCategory; week: number; oneTimeOnly?: boolean; idIndex?: number }> = [];

    const isEconomy = contractType === 'الاقتصادية';
    // "سوشيال ميديا" alone is account + social only (see getAllowedCategories). It used to be taken
    // as a media package, so social-only clients got the paid-campaign tasks too.
    const isSocialOnly = contractType.includes('سوشيال ميديا') && !contractType.includes('ميديا (');
    const isMediaOnly = !isEconomy && !isSocialOnly && (
      contractType.includes('ميديا') || 
      contractType.toLowerCase().includes('media') || 
      contractType.includes('فيديوهات')
    ) && !contractType.includes('فل باكدج') && !contractType.toLowerCase().includes('full package');

    if (isEconomy) {
      if (month < economyFullPackageMonths) {
        filteredTasks = fullPackageCoreTasks.map(t => ({
          taskNumber: t.id,
          title: t.title,
          category: departmentToCategory[t.department] || 'account_management',
          week: t.week,
          oneTimeOnly: t.isOneTime
        }));
      } else {
        filteredTasks = recurringEconomicTasks.map(t => ({
          taskNumber: t.id,
          title: t.title,
          category: departmentToCategory[t.department] || 'account_management',
          week: t.week,
          oneTimeOnly: t.isOneTime
        }));
      }
    } else if (isSocialOnly) {
      // The media package without the paid-campaign work, numbered as before (ids are by position).
      filteredTasks = mediaPackageCoreTasks
        .map((t, i) => ({
          taskNumber: t.id,
          title: t.title,
          category: departmentToCategory[t.department] || 'account_management',
          week: t.week,
          oneTimeOnly: t.isOneTime,
          idIndex: i,
        }))
        .filter(t => t.category === 'social_media' || (t.category === 'account_management' && !isCampaignTitle(t.title)));
    } else if (isMediaOnly) {
      filteredTasks = mediaPackageCoreTasks.map(t => ({
        taskNumber: t.id,
        title: t.title,
        category: departmentToCategory[t.department] || 'account_management',
        week: t.week,
        oneTimeOnly: t.isOneTime
      }));
    } else {
      filteredTasks = getFilteredTasksForContract(currentMonthContract);
    }

    // Each contract month starts on the contract's day of the month. Friday and Saturday are days
    // off, so a month that would start on one of them starts on the following Sunday.
    const monthStartDate = formatDateToYYYYMMDD(toWorkingDay(addMonthsKeepingDay(parseDate(startDate) || new Date(), month)));
    const monthThursdays = getThursdaysOfContractMonth(startDate, month, safeDuration);

    // Week boundaries calculated with addBusinessDays
    const d1 = 5;
    const d2 = 10;
    const d3 = 15;
    const d4 = 20;

    const w1Start: string = monthStartDate;
    const w1Due: string = addBusinessDays(w1Start, d1);

    const w2Start: string = addBusinessDays(monthStartDate, d1);
    const w2Due: string = addBusinessDays(monthStartDate, d2);

    const w3Start: string = addBusinessDays(monthStartDate, d2);
    const w3Due: string = addBusinessDays(monthStartDate, d3);

    const w4Start: string = addBusinessDays(monthStartDate, d3);
    const w4Due: string = addBusinessDays(monthStartDate, d4);

    // Week 2 Plan approval due dates (basis for SLA)
    const w2PlanApprovalDue: string = addBusinessDays(w2Start, 3);

    // Week 3 Handover dates based on SLA:
    // مهام "استلام التصاميم" (سواء للسوشيال ميديا أو الحملات) يُحسب تاريخ استحقاقها بإضافة 3 أيام عمل من تاريخ إنجاز مهمة "اعتماد البلان" الخاصة بها.
    const w3DesignDeliveryDue: string = addBusinessDays(w2PlanApprovalDue, 3);
    // مهام "استلام الفيديوهات" (سواء للسوشيال ميديا أو الحملات) يُحسب تاريخ استحقاقها بإضافة 5 أيام عمل من تاريخ إنجاز مهمة "اعتماد البلان" الخاصة بها.
    const w3VideoDeliveryDue: string = addBusinessDays(w2PlanApprovalDue, 5);

    // Week 3 Client Deliverable Approval due dates (2 business days after delivery)
    const w3DesignClientApprovalDue: string = addBusinessDays(w3DesignDeliveryDue, 2);
    const w3VideoClientApprovalDue: string = addBusinessDays(w3VideoDeliveryDue, 2);

    // Generate tasks for this month
    filteredTasks.forEach((t, idx) => {
      // Skip one-time tasks if it's not the first month
      if (t.oneTimeOnly && month > 0) return;

      let taskStart: string = w1Start;
      let dueDate: string = w1Due;

      if (t.week === 1) {
        taskStart = w1Start;
        dueDate = w1Due;
        if (t.taskNumber === 'W1-ACC-01') {
          // البريف: تسليم بعد يوم عمل من تاريخ بداية العمل
          dueDate = addBusinessDays(w1Start, 1);
        } else {
          // مهام التأسيس للأسبوع الأول
          dueDate = addBusinessDays(w1Start, 4);
        }
      } else if (t.week === 2) {
        taskStart = w2Start;
        dueDate = w2Due;
        if (t.title.includes('اعتماد العميل لبلان')) {
          taskStart = addBusinessDays(w2Start, 2);
          dueDate = w2PlanApprovalDue;
        } else if (t.title.includes('بلان')) {
          dueDate = addBusinessDays(w2Start, 2);
        }
      } else if (t.week === 3) {
        taskStart = w3Start;
        dueDate = w3Due;

        // SLA Handover logic:
        if (t.title.includes('استلام تصاميم')) {
          // 3 business days from plan approval
          taskStart = w2PlanApprovalDue;
          dueDate = w3DesignDeliveryDue;
        } else if (t.title.includes('استلام فيديوهات')) {
          // 5 business days from plan approval
          taskStart = w2PlanApprovalDue;
          dueDate = w3VideoDeliveryDue;
        } else if (t.title.includes('اعتماد العميل تصاميم')) {
          taskStart = w3DesignDeliveryDue;
          dueDate = w3DesignClientApprovalDue;
        } else if (t.title.includes('اعتماد العميل فيديوهات') || t.title.includes('اعتماد العميل الفيديوهات')) {
          taskStart = w3VideoDeliveryDue;
          dueDate = w3VideoClientApprovalDue;
        }
      } else if (t.week === 4) {
        taskStart = w4Start;
        dueDate = w4Due;
        if (t.title === 'إطلاق الحملات الإعلانية') {
          taskStart = w3VideoClientApprovalDue;
          dueDate = addBusinessDays(taskStart, 1);
        } else if (t.title === 'جدولة نشر التصاميم') {
          taskStart = w3DesignClientApprovalDue;
          dueDate = addBusinessDays(taskStart, 2);
        } else if (t.title === 'جدولة نشر الفيديوهات') {
          taskStart = w3VideoClientApprovalDue;
          dueDate = addBusinessDays(taskStart, 2);
        }
      }

      // Reports go out on Thursdays: the weekly ones on this month's Thursdays in order, the
      // monthly one on its last Thursday.
      if (t.title === 'التقرير الأسبوعي' || t.title === 'التقرير الشهري الشامل') {
        dueDate = t.title === 'التقرير الأسبوعي' ? monthThursdays[t.week - 1] : monthThursdays[monthThursdays.length - 1];
        taskStart = reportStart(dueDate);
      }

      const isMultipleMonths = safeDuration > 1;
      const isWeeklyReport = t.title === 'التقرير الأسبوعي';
      const titleSuffix = (isMultipleMonths && !isWeeklyReport) ? ` (الشهر ${month + 1})` : '';
      
      allTasks.push({
        id: `t-${clientId}-m${month}-${(t.idIndex ?? idx) + 1}`,
        taskNumber: `${t.taskNumber}-M${month+1}`,
        title: `${t.title}${titleSuffix}`,
        category: t.category,
        startDate: taskStart,
        dueDate: dueDate,
        completed: false,
        monthIndex: month + 1
      });
    });

    // The matrix lists four weekly reports a month, but some contract months have a fifth Thursday.
    if (filteredTasks.some(t => t.title === 'التقرير الأسبوعي')) {
      monthThursdays.slice(4).forEach((due, i) => {
        allTasks.push({
          id: `t-${clientId}-m${month}-weekly-report-${i + 5}`,
          taskNumber: `W${i + 5}-ACC-01-M${month + 1}`,
          title: 'التقرير الأسبوعي',
          category: 'account_management',
          startDate: reportStart(due),
          dueDate: due,
          completed: false,
          monthIndex: month + 1
        });
      });
    }
  }

  const formattedTasks = formatSequentialReports(allTasks);
  const dueTime = (t: TaskItem) => (parseDate(t.dueDate)?.getTime() ?? Number.MAX_SAFE_INTEGER);
  return formattedTasks.sort((a, b) => dueTime(a) - dueTime(b));
}

/**
 * Re-schedules a client's tasks with the current task matrix.
 *
 * Keeps (as the confirmation dialogs promise) every completed task, and also keeps what the
 * team typed on open tasks (notes, link, assignee, comments, order) and any custom task that
 * was added by hand. The old version silently dropped custom tasks and all notes/assignees
 * on open tasks every time the matrix was re-applied.
 */
export function syncClientTasksWithNewMatrix(client: Client): TaskItem[] {
  const generatedTasks = createDefaultCoreTasks(
    client.id,
    client.startDate,
    client.endDate,
    client.contract || 'فل باكدج',
    client.durationMonths || 1,
    client.economyFullPackageMonths || 0,
    client.economyMediaMonths || 0
  );

  const existingTasks = (client.tasks || []).filter(t => t && typeof t === 'object');
  if (existingTasks.length === 0) {
    return shiftOpenTasks(generatedTasks, Number(client.accumulatedHoldBusinessDays) || 0);
  }

  // Index existing tasks. When two copies of the same task exist, prefer the completed one.
  const byNumber = new Map<string, TaskItem>();
  const byId = new Map<string, TaskItem>();
  const byTitle = new Map<string, TaskItem>();
  const remember = (map: Map<string, TaskItem>, key: string | undefined, t: TaskItem) => {
    if (!key) return;
    const prev = map.get(key);
    if (!prev || (!prev.completed && t.completed)) map.set(key, t);
  };
  existingTasks.forEach(t => {
    remember(byNumber, (t.taskNumber || '').trim(), t);
    remember(byId, t.id, t);
    remember(byTitle, (t.title || '').trim(), t);
  });

  const usedIds = new Set<string>();
  const merged = generatedTasks.map(g => {
    const byIdCandidate = byId.get(g.id);
    // Matrix ids are index based, so after a contract change the same id can point to a
    // different task. Only trust an id match when the task number / title agree.
    const safeIdCandidate = byIdCandidate && (
      !byIdCandidate.taskNumber ||
      byIdCandidate.taskNumber === g.taskNumber ||
      (byIdCandidate.title || '').trim() === g.title.trim()
    ) ? byIdCandidate : undefined;

    const matched = [byNumber.get(g.taskNumber), safeIdCandidate, byTitle.get(g.title.trim())]
      .find(c => c && !usedIds.has(c.id));
    if (!matched) return g;
    usedIds.add(matched.id);

    const kept: Partial<TaskItem> = {};
    if (matched.notes !== undefined) kept.notes = matched.notes;
    if (matched.link !== undefined) kept.link = matched.link;
    if (matched.assignedTo !== undefined) kept.assignedTo = matched.assignedTo;
    if (matched.comments !== undefined) kept.comments = matched.comments;
    if (matched.order !== undefined) kept.order = matched.order;
    if (matched.createdBy !== undefined) kept.createdBy = matched.createdBy;

    if (matched.completed) {
      return {
        ...g,
        ...kept,
        completed: true,
        completedAt: matched.completedAt || g.dueDate,
      };
    }
    return { ...g, ...kept };
  });

  // The matrix dates do not know about holds: open matrix tasks move by the working days the client
  // spent on hold (as they did when it resumed), otherwise every re-sync undid that move.
  const shiftedMerged = shiftOpenTasks(merged, Number(client.accumulatedHoldBusinessDays) || 0);

  // Keep tasks that are not part of the new matrix but must not be lost.
  const generatedNumbers = new Set(generatedTasks.map(t => t.taskNumber));
  const mergedKeys = new Set(merged.map(taskKey));
  const mergedTitles = new Set(merged.map(t => t.title.trim()));
  const leftovers = existingTasks.filter(t => {
    if (usedIds.has(t.id)) return false;
    if (mergedKeys.has(taskKey(t)) || mergedTitles.has((t.title || '').trim())) return false; // duplicate copy
    if (!t.completed && isObsoleteTask(t)) return false;
    if (!isMatrixTaskNumber(t.taskNumber)) return true;            // custom task added by the team
    return t.completed && !generatedNumbers.has(t.taskNumber);       // completed work that left the matrix
  });

  // Matrix ids are index based (`t-<client>-m<month>-<n>`), so after a contract change a kept task
  // can carry the same id as a NEW matrix task. Two tasks with one id meant one of them was dropped
  // when saving (and its document overwritten), so a kept task whose id is taken gets a new,
  // stable id (the same one on every re-sync).
  const takenIds = new Set(merged.map(t => t.id));
  const safeLeftovers = leftovers.map(t => {
    if (!takenIds.has(t.id)) {
      takenIds.add(t.id);
      return t;
    }
    let n = 1;
    let id = `${t.id}-kept`;
    while (takenIds.has(id)) id = `${t.id}-kept${++n}`;
    takenIds.add(id);
    return { ...t, id };
  });

  const dueTime = (t: TaskItem) => (parseDate(t.dueDate)?.getTime() ?? Number.MAX_SAFE_INTEGER);
  return [...shiftedMerged, ...safeLeftovers].sort((a, b) => dueTime(a) - dueTime(b));
}

export const COMPANY_OPTIONS = [
  'AL - Ahly',
  'SYT',
  'Herak'
] as const;

export const DRIVE_LINKS = {
  MAIN: 'https://drive.google.com/drive/folders/1SSvYU_96whB2JDDocMYL0jVWR_QUrw5V?usp=drive_link',
  FOLDER_2025: 'https://drive.google.com/drive/folders/1SSvYU_96whB2JDDocMYL0jVWR_QUrw5V?usp=drive_link',
  FOLDER_2026: 'https://drive.google.com/drive/folders/1SSvYU_96whB2JDDocMYL0jVWR_QUrw5V?usp=drive_link',
};

const RAW_INITIAL_CLIENTS: Client[] = [
  {
    id: 'cli-1',
    code: 'SCHTE4134',
    clientName: 'فوزي - عبد الله',
    clientNumber: '56 580 9017',
    groupName: 'جروب فوزي - SCHTE4134',
    contract: 'FULL BACKAGE',
    companyName: 'AL - Ahly',
    influencer: 'عمر الملحم',
    accountManager: 'أحمد جودة',
    assignedTo: 'أحمد جودة',
    startDate: '2026-07-01',
    durationMonths: 2,
    endDate: '2026-09-01',
    caseStatus: 'نشط',
    briefLink: 'https://docs.google.com/document/d/sample-brief-1',
    whatsappGroupLink: 'https://chat.whatsapp.com/sampleGroup1',
    notes: 'عميل حزمة كاملة - يتطلب تسليم تقارير أسبوعية عن الإعلانات',
    isVip: true,
    createdAt: '2026-07-01',
    dailyActivations: [],
    tasks: []
  },
  {
    id: 'cli-2',
    code: 'Simav-S6',
    clientName: 'سيمـاف - Simav',
    clientNumber: '50 379 9504',
    groupName: 'Simav - S6 Group',
    contract: 'FULL + MEDIA',
    companyName: 'SYT',
    influencer: 'سارة الوابل',
    accountManager: 'سارة خالد',
    assignedTo: 'سارة خالد',
    startDate: '2026-06-15',
    durationMonths: 3,
    endDate: '2026-09-15',
    caseStatus: 'نشط',
    briefLink: 'https://docs.google.com/document/d/sample-brief-simav',
    whatsappGroupLink: 'https://chat.whatsapp.com/sampleSimavGroup',
    notes: 'متجر عطور وساعات - الحملات الإعلانية على سناب شات وتيك توك',
    createdAt: '2026-06-15',
    dailyActivations: [],
    tasks: []
  },
  {
    id: 'cli-3',
    code: 'HS4',
    clientName: 'نادي رفحاء - Rafha Club',
    clientNumber: '50 726 6675',
    groupName: 'Rafha Club - HS4',
    contract: 'FULL BACKAGE',
    companyName: 'Herak',
    influencer: '-',
    accountManager: 'محمد القحطاني',
    assignedTo: 'محمد القحطاني',
    startDate: '2026-07-19',
    durationMonths: 3,
    endDate: '2026-10-19',
    caseStatus: 'نشط',
    briefLink: 'https://docs.google.com/document/d/rafha-brief',
    whatsappGroupLink: 'https://chat.whatsapp.com/rafhaGroup',
    notes: 'نادي رياضي ثفافي - التغطيات والمحتوى الرياضي اليومي',
    createdAt: '2026-07-19',
    dailyActivations: [],
    tasks: []
  },
  {
    id: 'cli-4',
    code: 'SCHTE5379',
    clientName: 'لامينتا - LA MENTA',
    clientNumber: '55 699 0143',
    groupName: 'LA MENTA - SCHTE5379',
    contract: 'MEDIA',
    companyName: 'SYT',
    influencer: 'ريما العلي',
    accountManager: 'نورة السالم',
    assignedTo: 'نورة السالم',
    startDate: '2026-07-10',
    durationMonths: 1,
    endDate: '2026-08-10',
    caseStatus: 'نشط',
    briefLink: 'https://docs.google.com/document/d/lamenta-brief',
    whatsappGroupLink: 'https://chat.whatsapp.com/lamentaGroup',
    notes: 'كافيه ومطعم راقي - حملة إعلانات ممولة على انستقرام وسناب',
    createdAt: '2026-07-10',
    dailyActivations: [],
    tasks: []
  },
  {
    id: 'cli-5',
    code: 'ACHTE3465',
    clientName: 'أ. عبد الله سالم',
    clientNumber: '56 110 6661',
    groupName: 'أ. عبد الله سالم - ACHTE3465',
    contract: 'FULL BACKAGE',
    companyName: 'AL - Ahly',
    influencer: '-',
    accountManager: 'فهد العتيبي',
    assignedTo: 'فهد العتيبي',
    startDate: '2026-07-19',
    durationMonths: 3,
    endDate: '2026-10-19',
    caseStatus: 'نشط',
    briefLink: 'https://docs.google.com/document/d/salem-brief',
    whatsappGroupLink: 'https://chat.whatsapp.com/salemGroup',
    notes: 'تسويق شخصي واستشارات أعمال',
    createdAt: '2026-07-19',
    dailyActivations: [],
    tasks: []
  },
  {
    id: 'cli-6',
    code: 'SCHTE3240',
    clientName: 'أبرار - ABRAR',
    clientNumber: '54 008 0078',
    groupName: 'SCHTE3240 - ABRAR',
    contract: 'FULL BACKAGE',
    companyName: 'Herak',
    influencer: '-',
    accountManager: 'أحمد جودة',
    assignedTo: 'أحمد جودة',
    startDate: '2026-05-01',
    durationMonths: 6,
    endDate: '2026-11-01',
    caseStatus: 'hold',
    briefLink: '',
    whatsappGroupLink: '',
    notes: 'العقد موقوف مؤقتاً بناءً على طلب العميل بسبب التجديدات',
    createdAt: '2026-05-01',
    dailyActivations: [],
    tasks: []
  }
];

export const INITIAL_CLIENTS: Client[] = RAW_INITIAL_CLIENTS.map(c => ({
  ...c,
  tasks: syncClientTasksWithNewMatrix(c)
}));
