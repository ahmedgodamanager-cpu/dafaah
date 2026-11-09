import { collection, getDocsFromServer } from 'firebase/firestore';
import type { QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { isPermissionError } from './firebaseUtils';

/**
 * Full backup of the CRM data as one JSON file (admins only): every client document with its
 * tasks, daily activations and activity log, plus the users and the notifications. The data is
 * read straight from the server (never from the screen or from the copy kept in the browser), so
 * the file is exactly what is stored; without a connection it fails instead of being incomplete.
 */

export interface BackupProgress {
  done: number;
  total: number;
}

export interface ClientBackup {
  id: string;
  data: Record<string, unknown>;
  tasks: Array<Record<string, unknown>>;
  dailyActivations: Array<Record<string, unknown>>;
  activities: Array<Record<string, unknown>>;
}

export interface FullBackup {
  app: 'Account CRM';
  version: 1;
  exportedAt: string;
  exportedBy: string;
  counts: { clients: number; tasks: number; dailyActivations: number; activities: number; users: number; notifications: number };
  users: Array<Record<string, unknown>>;
  notifications: Array<Record<string, unknown>>;
  clients: ClientBackup[];
}

/** Clients read at the same time (gentle on the connection and on the database). */
const PARALLEL_CLIENTS = 4;

const rows = (docs: QueryDocumentSnapshot[]) => docs.map(d => ({ id: d.id, ...(d.data() as Record<string, unknown>) }));

export async function buildFullBackup(exportedBy: string, onProgress?: (progress: BackupProgress) => void): Promise<FullBackup> {
  const [clientsSnap, usersSnap] = await Promise.all([
    getDocsFromServer(collection(db, 'clients')),
    getDocsFromServer(collection(db, 'users')),
  ]);

  let notifications: Array<Record<string, unknown>> = [];
  try {
    notifications = rows((await getDocsFromServer(collection(db, 'notifications'))).docs);
  } catch (err) {
    // Not allowed for this account: the backup is still useful without them. Any other error
    // (e.g. the connection dropped) fails the backup instead of leaving them out silently.
    if (!isPermissionError(err)) throw err;
    console.warn('Backup: notifications skipped', err);
  }

  const clientDocs = clientsSnap.docs;
  const total = clientDocs.length;
  const clients: ClientBackup[] = [];
  let next = 0;
  let done = 0;
  // After one read fails the backup is abandoned: the other readers stop and report nothing more.
  let failed = false;
  onProgress?.({ done, total });

  const worker = async () => {
    while (!failed && next < clientDocs.length) {
      const clientDoc = clientDocs[next++];
      const id = clientDoc.id;
      let tasks, dailyActivations, activities;
      try {
        [tasks, dailyActivations, activities] = await Promise.all([
          getDocsFromServer(collection(db, 'clients', id, 'tasks')),
          getDocsFromServer(collection(db, 'clients', id, 'dailyActivations')),
          getDocsFromServer(collection(db, 'clients', id, 'activities')),
        ]);
      } catch (err) {
        failed = true;
        throw err;
      }
      if (failed) return;
      clients.push({
        id,
        data: clientDoc.data() as Record<string, unknown>,
        tasks: rows(tasks.docs),
        dailyActivations: rows(dailyActivations.docs),
        activities: rows(activities.docs),
      });
      done++;
      if (!failed) onProgress?.({ done, total });
    }
  };
  await Promise.all(Array.from({ length: Math.min(PARALLEL_CLIENTS, total) }, worker));
  clients.sort((a, b) => a.id.localeCompare(b.id));

  const users = rows(usersSnap.docs);
  return {
    app: 'Account CRM',
    version: 1,
    exportedAt: new Date().toISOString(),
    exportedBy,
    counts: {
      clients: clients.length,
      tasks: clients.reduce((sum, c) => sum + c.tasks.length, 0),
      dailyActivations: clients.reduce((sum, c) => sum + c.dailyActivations.length, 0),
      activities: clients.reduce((sum, c) => sum + c.activities.length, 0),
      users: users.length,
      notifications: notifications.length,
    },
    users,
    notifications,
    clients,
  };
}

/** Saves the backup as a .json file on this computer. */
export function downloadJsonFile(data: unknown, fileName: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
