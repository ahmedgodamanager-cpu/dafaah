import { TaskItem, Client, TaskAlert, AlertSeverity, TaskCategory } from '../types';

/**
 * Formats a Date object to YYYY-MM-DD using local calendar values (immune to UTC offset shifts).
 */
export function formatDateToYYYYMMDD(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Today's date as YYYY-MM-DD in the user's LOCAL calendar.
 * Use this instead of `new Date().toISOString().split('T')[0]`, which returns the UTC date
 * and is one day behind between 00:00 and 03:00 in Riyadh / Cairo (UTC+3).
 */
export function getTodayStr(): string {
  return formatDateToYYYYMMDD(new Date());
}

/**
 * Converts an ISO timestamp / Date / YYYY-MM-DD string into a local YYYY-MM-DD date.
 * Returns '' when the value cannot be parsed.
 */
export function toLocalDateStr(value: string | Date | null | undefined): string {
  if (!value) return '';
  if (value instanceof Date) return isNaN(value.getTime()) ? '' : formatDateToYYYYMMDD(value);
  const trimmed = String(value).trim();
  // Plain dates are already calendar dates: keep them as they are.
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const d = new Date(trimmed);
  return isNaN(d.getTime()) ? '' : formatDateToYYYYMMDD(d);
}

/**
 * Normalizes date input to standard JS Date set at noon local time (avoids midnight rollover bugs).
 */
export function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const trimmed = dateStr.trim();
  
  // Full ISO timestamps (e.g. a legacy completedAt "2026-10-11T22:30:00.000Z") describe a moment,
  // so use the LOCAL calendar day of that moment. Cutting the text at "T" gives the UTC day,
  // which is one day early for anything done between midnight and 3am in UTC+3.
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(trimmed)) {
    const moment = new Date(trimmed);
    if (!isNaN(moment.getTime())) {
      return new Date(moment.getFullYear(), moment.getMonth(), moment.getDate(), 12, 0, 0);
    }
  }

  // Handle YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const parts = trimmed.split('T')[0].split('-').map(Number);
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
    }
  }

  // Handle DD / MM / YYYY or YYYY / MM / DD
  if (trimmed.includes('/')) {
    const parts = trimmed.split('/').map(p => parseInt(p.trim()));
    if (parts.length === 3 && !parts.some(isNaN)) {
      if (String(parts[0]).length === 4) {
        // YYYY / MM / DD
        return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
      } else {
        // DD / MM / YYYY
        return new Date(parts[2], parts[1] - 1, parts[0], 12, 0, 0);
      }
    }
  }

  const parsed = new Date(trimmed);
  return isNaN(parsed.getTime()) ? null : new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 12, 0, 0);
}

/**
 * Adds business days to a given date, skipping Fridays (5) and Saturdays (6).
 * Strictly increments days into the future without timezone degradation.
 */
export function addBusinessDays(startDate: Date, daysToAdd: number): Date;
export function addBusinessDays(startDate: string, daysToAdd: number): string;
export function addBusinessDays(startDate: Date | string, daysToAdd: number): Date | string {
  const isString = typeof startDate === 'string';
  const currentDate = isString 
    ? (parseDate(startDate) || new Date()) 
    : new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 12, 0, 0);
  
  let addedDays = 0;
  while (addedDays < daysToAdd) {
    currentDate.setDate(currentDate.getDate() + 1);
    // 0 = الأحد, 1 = الإثنين, ..., 4 = الخميس, 5 = الجمعة, 6 = السبت
    if (currentDate.getDay() !== 5 && currentDate.getDay() !== 6) {
      addedDays++;
    }
  }
  
  if (isString) {
    return formatDateToYYYYMMDD(currentDate);
  }

  return currentDate;
}

// 2. دالة لحساب يوم الخميس الخاص بأسبوع معين بناءً على تاريخ بداية العميل
export const getThursdayOfWeek = (startDate: Date | string, weekNumber: number): Date => {
  const date = typeof startDate === 'string' 
    ? (parseDate(startDate) || new Date()) 
    : new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 12, 0, 0);
  
  const currentDay = date.getDay(); // 0 إلى 6
  
  // حساب عدد الأيام للوصول لأول يوم خميس بعد تاريخ البداية
  // يوم الخميس رقمه 4 في كائن Date
  let daysUntilFirstThursday = (4 - currentDay + 7) % 7;
  
  // إذا كان العميل بدأ الجمعة أو السبت، يتم احتساب الخميس القادم من الأسبوع الجديد
  if (currentDay === 5 || currentDay === 6) {
    daysUntilFirstThursday = (4 - currentDay + 7) % 7 + 7;
  }

  // إضافة الأيام للوصول لخميس الأسبوع الأول، ثم إضافة 7 أيام لكل أسبوع إضافي
  const targetThursday = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
  const additionalWeeksDays = (weekNumber - 1) * 7;
  targetThursday.setDate(date.getDate() + daysUntilFirstThursday + additionalWeeksDays);

  return targetThursday;
};

// 3. دالة الجدولة الرئيسية التي تمر على مصفوفة المهام
export const generateClientTasks = (clientStartDate: string, coreTasks: any[]) => {
  const startDate = parseDate(clientStartDate) || new Date();

  return coreTasks.map(task => {
    let dueDate: Date;

    // التحقق مما إذا كانت المهمة عبارة عن تقرير ليتم تثبيتها يوم الخميس
    if (task.title && (task.title.includes("تقرير") || task.title.includes("التقرير"))) {
      dueDate = getThursdayOfWeek(startDate, task.week || 1);
    } else {
      // لباقي المهام: يتم توزيعها برمجياً (مثلاً: إعطاء يومي عمل لكل مهمة حسب رقمها)
      const estimatedDaysForTask = (task.week || 1) * 2; 
      dueDate = addBusinessDays(startDate, estimatedDaysForTask);
    }

    return {
      ...task,
      dueDate: formatDateToYYYYMMDD(dueDate),
      status: "pending", // متبقية
    };
  });
};

// 1. دالة صغيرة لتحويل الأرقام لأسماء ترتيبية بالعربي
export const getArabicOrdinal = (num: number): string => {
  const ordinals = [
    "", "الأول", "الثاني", "الثالث", "الرابع", "الخامس", "السادس", "السابع", "الثامن", "التاسع", "العاشر",
    "الحادي عشر", "الثاني عشر", "الثالث عشر", "الرابع عشر", "الخامس عشر", "السادس عشر", "السابع عشر", "الثامن عشر", "التاسع عشر", "العشرين",
    "الحادي والعشرين", "الثاني والعشرين", "الثالث والعشرين", "الرابع والعشرين"
  ];
  // لو الرقم أكبر من الأسماء اللي فوق هيكتب (رقم 25) وهكذا
  return ordinals[num] || `رقم ${num}`; 
};

// 2. دالة توليد التقارير المتصلة طول فترة العقد
export const generateWeeklyReports = (clientStartDate: string, clientEndDate: string) => {
  const start = parseDate(clientStartDate) || new Date();
  const end = parseDate(clientEndDate) || new Date();
  const reports = [];

  // تحديد يوم الخميس القادم
  let current = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 12, 0, 0);
  const currentDay = current.getDay(); 
  let daysToFirstThursday = (4 - currentDay + 7) % 7;
  if (currentDay === 5 || currentDay === 6) {
    daysToFirstThursday = (4 - currentDay + 7) % 7 + 7;
  }
  
  current.setDate(current.getDate() + daysToFirstThursday);

  let reportCounter = 1; // العداد هيفضل يكمل ومش هيصفر أبداً

  // طول ما إحنا لسه ما وصلناش لتاريخ نهاية العقد
  while (current <= end) {
    reports.push({
      id: `W${reportCounter}-ACC-REP`,
      department: "Account Management",
      week: reportCounter, // ده ترتيب الأسبوع الفعلي في العقد كله
      title: `التقرير الأسبوعي ${getArabicOrdinal(reportCounter)}`, // هيطلع: التقرير الأسبوعي الأول، الثاني، الخ...
      isOneTime: false,
      dueDate: formatDateToYYYYMMDD(current),
      status: "pending",
    });

    // القفز 7 أيام ليوم الخميس اللي بعده
    current.setDate(current.getDate() + 7);
    reportCounter++;
  }

  return reports; 
};

// 3. دالة تظبيط أسماء التقارير (تُستخدم بعد توليد المهام)
export const formatSequentialReports = <T extends { title?: string }>(allTasks: T[]): T[] => {
  let reportCounter = 1; // العداد هيبدأ من 1 ويكمل للنهاية

  return allTasks.map(task => {
    // الفلتر هنا بيستهدف التقارير الأسبوعية فقط ويرقمها بالتتابع
    if (task.title === "التقرير الأسبوعي") {
      return {
        ...task,
        // بنحط الاسم الجديد، وبعدين الـ ++ بتزود العداد للتقرير اللي بعده
        title: `التقرير الأسبوعي ${getArabicOrdinal(reportCounter++)}` 
      };
    }
    return task;
  });
};

// ==========================================
// 4. الدالة الرئيسية النهائية (توليد، ترقيم، وترتيب زمني)
// ==========================================
export const processAndSortClientTasks = (clientStartDate: string, allMonthsGeneratedTasks: any[]) => {
  const baseStart = clientStartDate.trim().split('T')[0];

  // 1. توليد التواريخ بدقة لكل المهام (تقارير يوم خميس، الباقي أيام عمل)
  const tasksWithDates = allMonthsGeneratedTasks.map(task => {
    let dueDateStr: string;
    
    if (
      task.title === "التقرير الأسبوعي" ||
      (task.title && (task.title.includes("تقرير") || task.title.includes("التقرير")) && !task.title.includes("الشهري"))
    ) {
      dueDateStr = formatDateToYYYYMMDD(getThursdayOfWeek(baseStart, task.week || 1));
    } else {
      const estimatedDaysForTask = (task.week || 1) * 2; 
      dueDateStr = addBusinessDays(baseStart, estimatedDaysForTask);
    }

    return {
      ...task,
      dueDate: dueDateStr,
      status: task.status || "pending",
    };
  });

  // 2. ترقيم التقارير بشكل متصل (الأول، الثاني، الخ)
  const formattedTasks = formatSequentialReports(tasksWithDates);

  // 3. الترتيب الزمني الصارم من الأقدم للأحدث (عشان مفيش تاسك من شهر 1 يجي بعد شهر 2)
  const finalSortedTasks = formattedTasks.sort((a, b) => {
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  return finalSortedTasks;
};

/**
 * Returns the YYYY-MM-DD date of the next Thursday on or after the given start date.
 */
export function getNextThursday(startDateStr: string): string {
  const dt = parseDate(startDateStr) || new Date();
  const current = new Date(dt.getTime());
  while (current.getDay() !== 4) {
    current.setDate(current.getDate() + 1);
  }
  const localDate = new Date(current.getTime() - (current.getTimezoneOffset() * 60000));
  return localDate.toISOString().split('T')[0];
}

/**
 * Calculates remaining days in a client's contract, considering if they are on hold.
 */
export function getRemainingContractDays(client: Client, refDate: Date = new Date()): number {
  let effectiveRefDate = refDate;
  if (client.caseStatus === 'hold' && client.holdStartDate) {
    effectiveRefDate = parseDate(client.holdStartDate) || refDate;
  }
  return getDaysDifference(client.endDate, effectiveRefDate);
}

/**
 * True for a complete, realistic YYYY-MM-DD value. Date inputs fire on every typed digit of the
 * year (0002 → 0020 → 0202 → 2026), so intermediate values must not be saved.
 */
export function isPlausibleDateStr(value: string | null | undefined): boolean {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const year = Number(value.slice(0, 4));
  return year >= 2000 && year <= 2100 && !!parseDate(value);
}

/**
 * True when the task has a due date that can actually be parsed.
 * Tasks without a valid due date must not be counted as "due today" / "overdue".
 */
export function hasValidDueDate(task: { dueDate?: string } | null | undefined): boolean {
  return !!(task && task.dueDate && parseDate(task.dueDate));
}

/**
 * Calculates difference in calendar days between target date and current reference date.
 * Positive = days remaining until due date
 * 0 = due today
 * Negative = overdue days
 */
export function getDaysDifference(targetDateStr: string, refDate: Date = new Date()): number {
  const target = parseDate(targetDateStr);
  if (!target) return 0;

  // Zero out time components for precise date diff
  const t = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const r = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate());

  const diffTime = t.getTime() - r.getTime();
  return Math.round(diffTime / (1000 * 3600 * 24));
}

/**
 * Formats date into readable string in Arabic format (e.g. 2026/02/15)
 */
export function formatDateArabic(dateStr: string): string {
  const d = parseDate(dateStr);
  if (!d) return dateStr || '-';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
}

export type TimeStatusType = 'completed' | 'overdue' | 'due_today' | 'due_soon' | 'on_track';

export interface TaskTimeStatus {
  type: TimeStatusType;
  daysDiff: number;
  label: string;
  badgeClass: string;
}

/**
 * Evaluates the status of a single task based on completion and due date.
 */
export function getTaskTimeStatus(task: TaskItem, refDate: Date = new Date()): TaskTimeStatus {
  if (task.completed) {
    return {
      type: 'completed',
      daysDiff: 0,
      label: 'تم الإنجاز',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    };
  }

  if (!hasValidDueDate(task)) {
    return {
      type: 'on_track',
      daysDiff: 0,
      label: 'بدون موعد',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200'
    };
  }

  const daysDiff = getDaysDifference(task.dueDate, refDate);

  if (daysDiff < 0) {
    const overdueDays = Math.abs(daysDiff);
    return {
      type: 'overdue',
      daysDiff,
      label: `متأخر بـ ${overdueDays} ${overdueDays === 1 ? 'يوم' : overdueDays === 2 ? 'يومين' : 'أيام'}`,
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold animate-pulse'
    };
  } else if (daysDiff === 0) {
    return {
      type: 'due_today',
      daysDiff,
      label: 'ينتهي اليوم!',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 font-bold'
    };
  } else if (daysDiff <= 3) {
    return {
      type: 'due_soon',
      daysDiff,
      label: `متبقي ${daysDiff} ${daysDiff === 1 ? 'يوم' : 'أيام'}`,
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 font-medium'
    };
  } else {
    return {
      type: 'on_track',
      daysDiff,
      label: `متبقي ${daysDiff} يوم`,
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200'
    };
  }
}

/**
 * Calculates statistics for a client (total tasks, % completed, count of delayed tasks, etc.)
 */
export function calculateClientProgress(client: Client, currentRefDate: Date = new Date()) {
  let refDate = currentRefDate;
  if (client.caseStatus === 'hold' && client.holdStartDate) {
    refDate = new Date(client.holdStartDate);
  }

  const tasks = client.tasks || [];
  const totalTasks = tasks.length;
  if (totalTasks === 0) {
    return {
      totalTasks: 0,
      completedTasks: 0,
      delayedTasks: 0,
      dueSoonTasks: 0,
      progressPercent: 0,
      statusLabel: 'لا يوجد تاسكات',
      statusColor: 'text-slate-500'
    };
  }

  let completedTasks = 0;
  let delayedTasks = 0;
  let dueSoonTasks = 0;

  tasks.forEach(task => {
    if (task.completed) {
      completedTasks++;
    } else if (hasValidDueDate(task)) {
      const daysDiff = getDaysDifference(task.dueDate, refDate);
      if (daysDiff < 0) {
        delayedTasks++;
      } else if (daysDiff <= 3) {
        dueSoonTasks++;
      }
    }
  });

  const progressPercent = Math.round((completedTasks / totalTasks) * 100);

  let statusLabel = 'منتظم';
  let statusColor = 'text-emerald-600 bg-emerald-50 border-emerald-200';

  if (delayedTasks > 0) {
    statusLabel = `تأخير في ${delayedTasks} تاسك`;
    statusColor = 'text-rose-600 bg-rose-50 border-rose-200';
  } else if (dueSoonTasks > 0) {
    statusLabel = `${dueSoonTasks} موعد قريب`;
    statusColor = 'text-amber-600 bg-amber-50 border-amber-200';
  } else if (progressPercent === 100) {
    statusLabel = 'مكتمل بالكامل';
    statusColor = 'text-blue-600 bg-blue-50 border-blue-200';
  }

  return {
    totalTasks,
    completedTasks,
    delayedTasks,
    dueSoonTasks,
    progressPercent,
    statusLabel,
    statusColor
  };
}

/**
 * Scans all clients and builds a prioritized list of alerts for overdue or upcoming tasks.
 */
export function generateAlertsForClients(clients: Client[], refDate: Date = new Date()): TaskAlert[] {
  const alerts: TaskAlert[] = [];

  (clients || []).forEach(client => {
    // Skip alerts for clients on hold, completed, or lost
    if (client.caseStatus === 'hold' || client.caseStatus === 'مكتمل' || client.isLost) {
      return;
    }

    (client.tasks || []).forEach(task => {
      if (!task.completed && hasValidDueDate(task)) {
        const daysDiff = getDaysDifference(task.dueDate, refDate);

        if (daysDiff < 0) {
          alerts.push({
            id: `${client.id}-${task.id}-overdue`,
            clientId: client.id,
            clientName: client.clientName,
            clientCode: client.code,
            taskId: task.id,
            taskTitle: task.title,
            category: task.category,
            dueDate: task.dueDate,
            daysDiff,
            severity: 'critical',
            alertType: 'overdue'
          });
        } else if (daysDiff === 0) {
          alerts.push({
            id: `${client.id}-${task.id}-today`,
            clientId: client.id,
            clientName: client.clientName,
            clientCode: client.code,
            taskId: task.id,
            taskTitle: task.title,
            category: task.category,
            dueDate: task.dueDate,
            daysDiff: 0,
            severity: 'warning',
            alertType: 'due_today'
          });
        } else if (daysDiff <= 3) {
          alerts.push({
            id: `${client.id}-${task.id}-soon`,
            clientId: client.id,
            clientName: client.clientName,
            clientCode: client.code,
            taskId: task.id,
            taskTitle: task.title,
            category: task.category,
            dueDate: task.dueDate,
            daysDiff,
            severity: 'info',
            alertType: 'due_soon'
          });
        }
      }
    });
  });

  // Sort by urgency: overdue first (most negative first), then due today, then due soon
  return alerts.sort((a, b) => a.daysDiff - b.daysDiff);
}

/**
 * Helper to get clean WhatsApp web link with phone number
 */
export function getWhatsAppLink(phone: string, text?: string): string {
  if (!phone) return '#';
  // Digits only, without an international "00" prefix.
  const cleanPhone = phone.replace(/\D/g, '').replace(/^00/, '');
  if (!cleanPhone) return '#';
  // Saudi mobiles without the country code: "5XXXXXXXX" or the local form "05XXXXXXXX".
  // (The local form used to become wa.me/05…, which is not a valid WhatsApp number.)
  let fullPhone = cleanPhone;
  if (/^05\d{8}$/.test(cleanPhone)) {
    fullPhone = '966' + cleanPhone.slice(1);
  } else if (cleanPhone.startsWith('5')) {
    fullPhone = '966' + cleanPhone;
  }
  const encodedMsg = text ? `?text=${encodeURIComponent(text)}` : '';
  return `https://wa.me/${fullPhone}${encodedMsg}`;
}

/**
 * Dynamically evaluates if a client should be considered 'جديد' (New) or 'نشط' (Active)
 * based on whether their contract start date is within the last 30 days.
 * Does not override manual statuses like 'hold' or 'مكتمل'.
 */
export function evaluateClientCaseStatus(client: Client, refDate: Date = new Date()): import('../types').CaseStatus {
  if (client.caseStatus !== 'نشط' && client.caseStatus !== 'جديد') {
    return client.caseStatus;
  }
  
  // Check if a brief task is completed
  const tasks = client.tasks || [];
  const isBriefDone = tasks.some(t => {
    if (!t || !t.completed) return false;
    const title = t.title || '';
    return title.includes('بريف') || title.toLowerCase().includes('brief');
  });
  if (isBriefDone) {
    return 'نشط';
  }

  if (!client.startDate) return client.caseStatus;

  if (!parseDate(client.startDate)) return client.caseStatus;

  // Days elapsed since the work start date (both sides compared as calendar dates)
  const diffDays = -getDaysDifference(client.startDate, refDate);

  if (diffDays <= 30) {
    return 'جديد';
  } else {
    return 'نشط';
  }
}
