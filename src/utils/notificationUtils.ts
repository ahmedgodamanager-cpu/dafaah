import { useEffect, useRef } from 'react';
import { Client } from '../types';
import { getDaysDifference, hasValidDueDate } from './dateUtils';

// Helper to check and request permission
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.warn('هذا المتصفح لا يدعم إشعارات سطح المكتب');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

export const sendDesktopNotification = (title: string, options?: NotificationOptions) => {
  if (!('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    const notification = new Notification(title, {
      icon: '/logo-light.png',
      dir: 'rtl',
      ...options
    });

    notification.onclick = function() {
      window.focus();
      this.close();
    };
  }
};

/**
 * Desktop notifications for overdue / due-today tasks.
 * `enabled` must be true only for a signed-in, active staff member: before, this ran on the
 * login screen and on the public client portal, so external clients were asked for
 * notification permission. It also only checked once on mount (often before any data
 * had loaded) and then waited a full hour.
 */
export function useSlaNotifications(clients: Client[], enabled: boolean = true) {
  // Use a ref to avoid triggering the effect too often, we just want to run it periodically
  const clientsRef = useRef(clients);
  const hasCheckedWithDataRef = useRef(false);
  const checkRef = useRef<() => void>(() => {});

  useEffect(() => {
    clientsRef.current = clients;
    // First real check as soon as the data has arrived.
    if (enabled && clients.length > 0 && !hasCheckedWithDataRef.current) {
      hasCheckedWithDataRef.current = true;
      checkRef.current();
    }
  }, [clients, enabled]);

  useEffect(() => {
    if (!enabled) {
      hasCheckedWithDataRef.current = false;
      return;
    }

    // Check permissions first
    requestNotificationPermission().catch(() => false);

    const checkSlaTasks = () => {
      const currentClients = clientsRef.current;
      if (currentClients.length === 0) return;

      // Get already notified tasks from local storage to avoid spam
      let notifiedTasks: string[] = [];
      try {
        notifiedTasks = JSON.parse(localStorage.getItem('sla_notified_tasks') || '[]');
        if (!Array.isArray(notifiedTasks)) notifiedTasks = [];
      } catch (e) {
        notifiedTasks = [];
      }

      let newNotifications = 0;

      currentClients.forEach(client => {
        // Same rule as the in-app alerts: no reminders for archived / completed / lost / on-hold clients.
        if (client.isArchived || client.isLost || client.caseStatus === 'مكتمل' || client.caseStatus === 'hold') return;
        (client.tasks || []).forEach(task => {
          if (task.completed || !hasValidDueDate(task)) return;

          const daysDiff = getDaysDifference(task.dueDate);
          const taskKey = `${client.id}_${task.id}_${daysDiff}`; // Unique key based on day diff

          // If we haven't notified about this specific state yet
          if (!notifiedTasks.includes(taskKey)) {
            // Case 1: Task is overdue
            if (daysDiff < 0) {
              sendDesktopNotification('تنبيه تأخير مهمة ⚠️', {
                body: `العميل: ${client.clientName}\nالمهمة: ${task.title}\nمتأخرة بمقدار ${Math.abs(daysDiff)} يوم!`,
                tag: 'sla_overdue'
              });
              notifiedTasks.push(taskKey);
              newNotifications++;
            } 
            // Case 2: Task is due today
            else if (daysDiff === 0) {
              sendDesktopNotification('مهمة تنتهي اليوم ⏳', {
                body: `العميل: ${client.clientName}\nالمهمة: ${task.title}\nيجب تسليمها اليوم.`,
                tag: 'sla_due_today'
              });
              notifiedTasks.push(taskKey);
              newNotifications++;
            }
          }
        });
      });

      // Keep only recent 1000 records to prevent localstorage bloat
      if (notifiedTasks.length > 1000) {
        notifiedTasks = notifiedTasks.slice(notifiedTasks.length - 1000);
      }

      if (newNotifications > 0) {
        try {
          localStorage.setItem('sla_notified_tasks', JSON.stringify(notifiedTasks));
        } catch (e) {}
      }
    };

    checkRef.current = checkSlaTasks;

    // Run check immediately (if data is already there)
    if (clientsRef.current.length > 0) {
      hasCheckedWithDataRef.current = true;
      checkSlaTasks();
    }

    // Set interval to check every 1 hour (3600000 ms)
    // Even if tab is in background, modern browsers throttle this to 1 min, which is fine for our 1 hour interval
    const intervalId = setInterval(checkSlaTasks, 60 * 60 * 1000);

    return () => {
      clearInterval(intervalId);
      checkRef.current = () => {};
    };
  }, [enabled]);
}
