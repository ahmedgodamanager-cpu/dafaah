import { Client, TaskItem } from '../types';
import { formatDateArabic, formatDateToYYYYMMDD, getDaysDifference, hasValidDueDate, toLocalDateStr } from './dateUtils';

/** Most tasks listed per section (a longer message is hard to read on a phone). */
const MAX_ITEMS = 12;

const cleanTitle = (title: string) => (title || '').replace(/\s*\(الشهر\s*\d+\)\s*$/, '').trim();

const moreLine = (n: number) => {
  if (n <= 0) return [];
  if (n === 1) return ['• ومهمة أخرى'];
  if (n === 2) return ['• ومهمتان أخريان'];
  return [`• و${n} ${n <= 10 ? 'مهام أخرى' : 'مهمة أخرى'}`];
};

export interface WeeklySummary {
  from: string;
  to: string;
  done: TaskItem[];
  upcoming: TaskItem[];
  text: string;
}

/**
 * The weekly WhatsApp update for a client: what was completed in the last 7 days and what is due in
 * the next 7 days, plus the overall progress. Late tasks are not listed (the account manager can
 * add a line about them by hand before sending).
 */
export function buildWeeklySummary(client: Client, refDate: Date = new Date()): WeeklySummary {
  const today = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate(), 12);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 6);
  const from = formatDateToYYYYMMDD(weekAgo);
  const to = formatDateToYYYYMMDD(today);

  const tasks = (client.tasks || []).filter(t => t && t.title);

  const done = tasks
    .filter(t => {
      if (!t.completed) return false;
      const on = toLocalDateStr(t.completedAt);
      return !!on && on >= from && on <= to;
    })
    .sort((a, b) => toLocalDateStr(a.completedAt).localeCompare(toLocalDateStr(b.completedAt)));

  const upcoming = tasks
    .filter(t => {
      if (t.completed || !hasValidDueDate(t)) return false;
      const days = getDaysDifference(t.dueDate, today);
      return days >= 0 && days <= 7;
    })
    .sort((a, b) => getDaysDifference(a.dueDate, today) - getDaysDifference(b.dueDate, today));

  const total = tasks.length;
  const completedCount = tasks.filter(t => t.completed).length;
  const percent = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  const lines: string[] = [
    `مرحباً ${client.clientName} 👋`,
    `ملخص متابعة الأسبوع (من ${formatDateArabic(from)} إلى ${formatDateArabic(to)}):`,
    '',
    '✅ تم إنجازه هذا الأسبوع:',
    ...(done.length > 0
      ? [...done.slice(0, MAX_ITEMS).map(t => `• ${cleanTitle(t.title)}`), ...moreLine(done.length - MAX_ITEMS)]
      : ['• لا توجد مهام منجزة هذا الأسبوع']),
    '',
    '📅 المخطط للأسبوع القادم:',
    ...(upcoming.length > 0
      ? [
          ...upcoming.slice(0, MAX_ITEMS).map(t => `• ${cleanTitle(t.title)} (${formatDateArabic(t.dueDate)})`),
          ...moreLine(upcoming.length - MAX_ITEMS),
        ]
      : ['• لا توجد مهام مستحقة خلال الأسبوع القادم']),
    '',
    `📊 نسبة الإنجاز الكلية: ${percent}% (${completedCount} من ${total} مهمة)`,
    '',
    'لأي استفسار نحن في الخدمة دائماً.',
  ];

  return { from, to, done, upcoming, text: lines.join('\n') };
}
