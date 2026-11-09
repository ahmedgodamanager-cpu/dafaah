import { TaskItem } from '../types';
import { addBusinessDays, formatDateToYYYYMMDD, getDaysDifference, getNextThursday, parseDate } from './dateUtils';

/**
 * Length of a pause ("hold") that started on `holdStart` and ends on `resumeDay` (YYYY-MM-DD).
 * `businessDays` counts the working days lost (Friday and Saturday are the weekend, like addBusinessDays).
 */
export function getHoldPause(holdStart: string, resumeDay: string): { calendarDays: number; businessDays: number } {
  const start = parseDate(holdStart);
  const end = parseDate(resumeDay);
  if (!start || !end) return { calendarDays: 0, businessDays: 0 };
  const calendarDays = getDaysDifference(resumeDay, start);
  if (calendarDays <= 0) return { calendarDays: 0, businessDays: 0 };

  let businessDays = 0;
  const day = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 12, 0, 0);
  for (let i = 0; i < calendarDays; i++) {
    day.setDate(day.getDate() + 1);
    if (day.getDay() !== 5 && day.getDay() !== 6) businessDays++;
  }
  return { calendarDays, businessDays };
}

/** `dateStr` + `days` calendar days, as YYYY-MM-DD (an unreadable date is returned unchanged). */
export function addCalendarDays(dateStr: string, days: number): string {
  const date = parseDate(dateStr);
  if (!date) return dateStr;
  date.setDate(date.getDate() + days);
  return formatDateToYYYYMMDD(date);
}

const isThursdayReport = (task: TaskItem) => /^التقرير (الأسبوعي|الشهري الشامل)/.test((task.title || '').trim());

/**
 * Moves the dates of the tasks that are still open `businessDays` working days later.
 * Reports are delivered on Thursdays, so a moved report lands on the next Thursday.
 * Completed tasks keep their dates.
 */
export function shiftOpenTasks(tasks: TaskItem[], businessDays: number): TaskItem[] {
  if (businessDays <= 0) return tasks;
  return tasks.map(task => {
    if (!task || task.completed) return task;
    const next: TaskItem = { ...task };
    if (task.dueDate && parseDate(task.dueDate)) {
      const moved = addBusinessDays(task.dueDate, businessDays);
      next.dueDate = isThursdayReport(task) ? getNextThursday(moved) : moved;
    }
    if (task.startDate && parseDate(task.startDate)) next.startDate = addBusinessDays(task.startDate, businessDays);
    return next;
  });
}
