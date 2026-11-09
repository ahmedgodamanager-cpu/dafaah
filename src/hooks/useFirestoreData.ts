import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  query,
  where,
  Unsubscribe,
  getDocs,
  updateDoc,
  setDoc,
  deleteDoc,
  writeBatch,
  deleteField,
  arrayUnion,
  DocumentReference,
} from 'firebase/firestore';
import { db } from '../firebase';
import { Client, TaskItem, DailyActivation, AppNotification, ConnectionStatus, ClientActivity } from '../types';
import { useAuth } from '../context/AuthContext';
import { handleFirestoreError, OperationType, notifyWriteError, isPermissionError } from '../utils/firebaseUtils';
import { INITIAL_CLIENTS, syncClientTasksWithNewMatrix } from '../data/initialClients';
import { evaluateClientCaseStatus, addBusinessDays, getTodayStr, toLocalDateStr, isPlausibleDateStr } from '../utils/dateUtils';
import { isUserSuspended, isManagerUser } from '../utils/userStatusUtils';
import {
  normalizeClientDoc,
  normalizeTask,
  resolveClientTasks,
  RawTaskDoc,
  isIncompleteTaskDoc,
  isGarbageTask,
  sortTasksByDueDate,
} from '../utils/taskStore';
import { toast } from 'react-hot-toast';
import { CLIENTS_CACHE_KEY, LEGACY_CACHE_KEYS } from '../utils/clientsCache';
import { addCalendarDays, getHoldPause, shiftOpenTasks } from '../utils/holdUtils';
import { buildPortalSnapshot, getPortalUrl, newPortalToken } from '../utils/portalUtils';
import { signOutState } from '../utils/sessionState';
import { logError } from '../utils/errorLog';

/*
 * Data layer of the CRM.
 *
 * Rules that keep the screens and the database from contradicting each other:
 *  - Tasks are stored ONLY in `clients/{id}/tasks` (see utils/taskStore.ts for legacy data).
 *  - `updateClient` saves client fields only. Task changes go through the task functions.
 *  - Every user action is ONE batched write (data + `lastUpdated` + one activity log entry).
 *  - Nothing ever writes to a client document with `setDoc(..., { merge: true })`: that call
 *    re-created clients that had just been deleted ("zombie" clients that crashed the dashboard).
 *  - Failed saves are reported to the user instead of being silently swallowed.
 *  - A client with a public portal link (`portalToken`) has a copy of what the portal shows in
 *    `portals/{token}`; it is rewritten shortly after every successful change of that client.
 *  - Firestore keeps a copy of the data in this browser (see firebase.ts), so the first snapshot of a
 *    listener can be that copy, possibly a few days old. The page waits for the server's answer
 *    before it stops loading, and changes are only built on data the server has confirmed in this
 *    session (`clientsSyncedRef`, `Sources.synced`).
 */

const FLUSH_DELAY_MS = 150;
const CACHE_WRITE_DELAY_MS = 1000;
const BATCH_LIMIT = 450;
/** Tasks per batch when several are completed at once (task + log entry each, within BATCH_LIMIT). */
const BULK_COMPLETE_CHUNK = 200;
const INITIAL_TASKS_TIMEOUT_MS = 5000;
const SLOW_WRITE_NOTICE_MS = 8000;
/** Changes are collected for this long before the client's portal copy is rewritten. */
const PORTAL_REFRESH_DELAY_MS = 1000;

type ClientsMap = Record<string, Client>;
interface Store {
  owner: string | null;
  map: ClientsMap;
}

interface Sources {
  /** Client documents as last received from Firestore (used to undo a rejected save). */
  docs: Record<string, Client>;
  sub: Record<string, RawTaskDoc[] | undefined>;
  embedded: Record<string, any[]>;
  materialized: Record<string, boolean>;
  storedStatus: Record<string, string | undefined>;
  activations: Record<string, DailyActivation[] | undefined>;
  /** Task lists the server has confirmed in this session (not only the copy kept in this browser). */
  synced: Record<string, boolean>;
}

type WriteOp =
  | { kind: 'set'; ref: DocumentReference; data: Record<string, any> }
  | { kind: 'update'; ref: DocumentReference; data: Record<string, any> }
  | { kind: 'delete'; ref: DocumentReference };

interface LogEntry {
  action: string;
  details: string;
  /** The task the entry is about (lets the recovery tool match it without guessing from the title). */
  taskId?: string;
}

const freshSources = (): Sources => ({ docs: {}, sub: {}, embedded: {}, materialized: {}, storedStatus: {}, activations: {}, synced: {} });

const nowIso = () => new Date().toISOString();
const newActivityId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const clientRef = (clientId: string) => doc(db, 'clients', clientId);
const taskRef = (clientId: string, taskId: string) => doc(db, 'clients', clientId, 'tasks', taskId);
const portalRef = (token: string) => doc(db, 'portals', token);
/** Every portal link a client has (normally one; two staff creating the first link at once can make two). */
const portalTokensOf = (client: Client | undefined): string[] =>
  client ? [...new Set([client.portalToken, ...(client.portalTokens || [])].filter((t): t is string => !!t))] : [];
/** `clients/{id}` or `clients/{id}/tasks/{taskId}`: the data the portal shows. */
const PORTAL_SOURCE_PATH = /^clients\/([^/]+)(?:\/tasks\/[^/]+)?$/;

const loadCache = (): Store => {
  try {
    LEGACY_CACHE_KEYS.forEach(k => localStorage.removeItem(k));
    const raw = localStorage.getItem(CLIENTS_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.uid === 'string' && parsed.clients && typeof parsed.clients === 'object') {
        return { owner: parsed.uid, map: parsed.clients };
      }
    }
  } catch {}
  return { owner: null, map: {} };
};

/** Firestore-ready copy of a task (no undefined values). */
const serializeTask = (task: TaskItem): Record<string, any> => {
  const out: Record<string, any> = {};
  Object.entries(task).forEach(([key, value]) => {
    if (value !== undefined) out[key] = value;
  });
  out.id = task.id;
  return out;
};

const stableStringify = (value: any): string => {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .filter(k => value[k] !== undefined)
      .sort()
      .map(k => `${JSON.stringify(k)}:${stableStringify(value[k])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
};

const sameTask = (a: TaskItem, b: TaskItem) => stableStringify(serializeTask(a)) === stableStringify(serializeTask(b));

/** Automatic SLA: approving a plan moves the matching delivery task's due date. */
const SLA_RULES: Array<{ match: string[]; target: string; days: number }> = [
  { match: ['اعتماد العميل لبلان تصاميم السوشيال ميديا'], target: 'استلام تصاميم السوشيال ميديا', days: 3 },
  { match: ['اعتماد العميل لبلان تصاميم الحملات الإعلانية', 'اعتماد العميل لبلان تصاميم الحملات'], target: 'استلام تصاميم الحملات الإعلانية', days: 3 },
  { match: ['اعتماد العميل لبلان فيديوهات الحملات الإعلانية', 'اعتماد العميل لبلان فيديوهات الحملات'], target: 'استلام فيديوهات الحملات الإعلانية', days: 5 },
  // "اعتماد العميل لبلان الفيديوهات للحملات الإعلانية" is the old (wrong) name of the social videos plan approval;
  // tasks created before the rename still carry it.
  { match: ['اعتماد العميل لبلان فيديوهات السوشيال ميديا', 'اعتماد العميل لبلان الفيديوهات للحملات الإعلانية', 'بلان الفيديوهات الخاصة بالسوشيال ميديا'], target: 'استلام فيديوهات السوشيال ميديا', days: 5 },
];

const isBriefTask = (title: string) => title.includes('بريف') || title.toLowerCase().includes('brief');

export const useFirestoreData = () => {
  const { user, profile } = useAuth();
  const uid = user?.uid ?? null;
  const suspended = isUserSuspended(profile, user);
  const canSeeAll = isManagerUser(user, profile);

  const actorNameRef = useRef('مستخدم');
  actorNameRef.current =
    (profile?.name && profile.name !== 'مستخدم' && profile.name !== 'موظف أكونت مانجمنت' ? profile.name : '') ||
    user?.displayName ||
    user?.email ||
    'مستخدم';

  const [store, setStore] = useState<Store>(loadCache);
  /** Always holds the newest data, including updates not yet flushed to React. */
  const storeRef = useRef<Store>(store);
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cacheTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sourcesRef = useRef<Sources>(freshSources());
  const writeQueueRef = useRef<Record<string, Promise<unknown>>>({});
  const pendingDeletesRef = useRef<Set<string>>(new Set());
  const pendingWritesRef = useRef(0);
  const portalTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  /** Token minted in this tab and not saved yet (so a second click does not make another one). */
  const pendingPortalTokensRef = useRef<Record<string, string>>({});
  /** The client list has come from the server in this session (not only from this browser's copy). */
  const clientsSyncedRef = useRef(false);

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  /**
   * The server has confirmed the client list and every task list. `loading` can end earlier (after
   * INITIAL_TASKS_TIMEOUT_MS) with only the copy kept in this browser on screen; reminders and
   * pop-ups about late tasks wait for this instead.
   */
  const [dataSynced, setDataSynced] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'online'
  );

  // ───────────────────────────── local state helpers ─────────────────────────────

  const flushNow = useCallback(() => {
    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }
    setStore(storeRef.current);
  }, []);

  /** Applies a change immediately to the ref and to React state at most every 150 ms. */
  const applyUpdate = useCallback((updater: (map: ClientsMap) => ClientsMap) => {
    const current = storeRef.current;
    const nextMap = updater(current.map);
    if (nextMap === current.map) return;
    storeRef.current = { owner: current.owner, map: nextMap };
    if (!flushTimerRef.current) {
      flushTimerRef.current = setTimeout(() => {
        flushTimerRef.current = null;
        setStore(storeRef.current);
      }, FLUSH_DELAY_MS);
    }
  }, []);

  const resetStore = useCallback((owner: string | null, map: ClientsMap) => {
    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }
    storeRef.current = { owner, map };
    setStore(storeRef.current);
  }, []);

  /** Rebuilds one client's task list from what Firestore actually holds. */
  const recomputeClient = useCallback((clientId: string) => {
    applyUpdate(map => {
      const current = map[clientId];
      if (!current) return map;
      const src = sourcesRef.current;
      const tasks = resolveClientTasks({
        client: current,
        subDocs: src.sub[clientId],
        embedded: src.embedded[clientId],
        materialized: src.materialized[clientId],
        previousTasks: current.tasks,
      });
      const next: Client = { ...current, tasks };
      next.caseStatus = evaluateClientCaseStatus({ ...next, caseStatus: (src.storedStatus[clientId] as any) || next.caseStatus });
      return { ...map, [clientId]: next };
    });
  }, [applyUpdate]);

  const replaceClientTasks = useCallback((clientId: string, tasks: TaskItem[], extra?: Partial<Client>) => {
    applyUpdate(map => {
      const current = map[clientId];
      if (!current) return map;
      const visible = tasks.length > 0 ? sortTasksByDueDate(tasks) : syncClientTasksWithNewMatrix({ ...current, tasks: [] });
      const next: Client = { ...current, ...extra, tasks: visible };
      next.caseStatus = evaluateClientCaseStatus({ ...next, caseStatus: (sourcesRef.current.storedStatus[clientId] as any) || next.caseStatus });
      return { ...map, [clientId]: next };
    });
  }, [applyUpdate]);

  /**
   * Makes sure a client's task documents have really been read before a change is built on its
   * list. Until the first snapshot arrives (slow network, more than 5 s) — or when the listener
   * failed — the screen shows the offline copy or the default matrix, and a full-list save built
   * from that overwrote the real tasks and deleted the ones not on screen.
   */
  const ensureTasksLoaded = useCallback(async (clientId: string) => {
    // The client document feeds the task list too (old embedded tasks, contract, start date), so it
    // must also be the server's, not only the copy kept in this browser.
    if (!clientsSyncedRef.current) throw new Error('clients-not-loaded');
    const src = sourcesRef.current;
    if (src.sub[clientId] !== undefined && src.synced[clientId]) return;
    // Not loaded yet, or only this browser's (possibly old) copy so far: ask the server.
    const snap = await getDocs(collection(db, 'clients', clientId, 'tasks'));
    if (snap.metadata?.fromCache) {
      // Offline: this is not the real list, so do not build on it.
      throw new Error('tasks-not-loaded');
    }
    if (!sourcesRef.current.synced[clientId]) {
      sourcesRef.current.sub[clientId] = snap.docs.map(d => ({ ...d.data(), id: d.id }));
      sourcesRef.current.synced[clientId] = true;
    }
    recomputeClient(clientId);
  }, [recomputeClient]);

  /**
   * Rewrites the client's public portal copy (`portals/{token}`) from the current data. Best effort:
   * if it fails the portal is only a little behind; the team's own save is never blocked by it.
   */
  const refreshPortal = useCallback(async (clientId: string) => {
    if (portalTokensOf(storeRef.current.map[clientId]).length === 0) return;
    try {
      await ensureTasksLoaded(clientId);
      const current = storeRef.current.map[clientId];
      const tokens = portalTokensOf(current);
      if (!current || tokens.length === 0) return;
      const snapshot = buildPortalSnapshot(current);
      await Promise.all(tokens.map(token => setDoc(portalRef(token), snapshot)));
    } catch (err) {
      console.warn(`Client portal copy not updated (clients/${clientId})`, err);
    }
  }, [ensureTasksLoaded]);

  const schedulePortalRefresh = useCallback((clientId: string) => {
    if (portalTokensOf(storeRef.current.map[clientId]).length === 0) return;
    const timers = portalTimersRef.current;
    if (timers[clientId]) clearTimeout(timers[clientId]);
    timers[clientId] = setTimeout(() => {
      delete timers[clientId];
      void refreshPortal(clientId);
    }, PORTAL_REFRESH_DELAY_MS);
  }, [refreshPortal]);

  /** Writes the waiting portal refreshes now (before signing out / leaving the page). */
  const flushPortalRefreshes = useCallback(async () => {
    const timers = portalTimersRef.current;
    const ids = Object.keys(timers);
    ids.forEach(id => {
      clearTimeout(timers[id]);
      delete timers[id];
    });
    await Promise.all(ids.map(id => refreshPortal(id)));
  }, [refreshPortal]);

  // ───────────────────────────── cache, timers, unload guard ─────────────────────────────

  useEffect(() => {
    if (!store.owner || store.owner !== uid) {
      // Signed out / another account: cancel a save scheduled for the previous session, otherwise it
      // wrote the previous user's clients back to this browser right after logout removed them.
      if (cacheTimerRef.current) {
        clearTimeout(cacheTimerRef.current);
        cacheTimerRef.current = null;
      }
      if (!store.owner) {
        try {
          localStorage.removeItem(CLIENTS_CACHE_KEY);
        } catch {
          // storage blocked: nothing to remove
        }
      }
      return;
    }
    if (cacheTimerRef.current) clearTimeout(cacheTimerRef.current);
    cacheTimerRef.current = setTimeout(() => {
      cacheTimerRef.current = null;
      if (storeRef.current.owner !== store.owner) return; // session changed meanwhile
      try {
        if (Object.keys(store.map).length === 0) {
          localStorage.removeItem(CLIENTS_CACHE_KEY);
        } else {
          // Logos are left out: browser storage is small, and they arrive with the server's data.
          const clients: ClientsMap = {};
          Object.entries(store.map).forEach(([id, c]) => {
            const { logoUrl: _logo, ...rest } = c;
            clients[id] = rest as Client;
          });
          localStorage.setItem(CLIENTS_CACHE_KEY, JSON.stringify({ uid: store.owner, savedAt: Date.now(), clients }));
        }
      } catch {
        // Storage full or blocked: the app keeps working from Firestore.
      }
    }, CACHE_WRITE_DELAY_MS);
  }, [store, uid]);

  useEffect(() => {
    const beforeUnload = (e: BeforeUnloadEvent) => {
      // Signing out reloads the page on purpose (after waiting for the saves): no "leave page?" question.
      if (signOutState.inProgress) return;
      // A waiting portal refresh counts too: closing now would leave the client's portal behind.
      if (pendingWritesRef.current > 0 || Object.keys(portalTimersRef.current).length > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    const pageHide = () => {
      void flushPortalRefreshes();
    };
    window.addEventListener('beforeunload', beforeUnload);
    window.addEventListener('pagehide', pageHide);
    return () => {
      window.removeEventListener('beforeunload', beforeUnload);
      window.removeEventListener('pagehide', pageHide);
      if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
      if (cacheTimerRef.current) clearTimeout(cacheTimerRef.current);
      Object.values(portalTimersRef.current).forEach(clearTimeout);
    };
  }, [flushPortalRefreshes]);

  useEffect(() => {
    let syncingTimer: ReturnType<typeof setTimeout> | null = null;
    const handleOnline = () => {
      setConnectionStatus('syncing');
      if (syncingTimer) clearTimeout(syncingTimer);
      syncingTimer = setTimeout(() => setConnectionStatus('online'), 800);
    };
    const handleOffline = () => setConnectionStatus('offline');
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      if (syncingTimer) clearTimeout(syncingTimer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ───────────────────────────── realtime listeners ─────────────────────────────

  useEffect(() => {
    if (!uid || suspended) {
      // Signed out or not allowed: drop everything that belongs to the previous session.
      resetStore(null, {});
      sourcesRef.current = freshSources();
      setNotifications([]);
      setLoading(false);
      setDataSynced(false);
      return;
    }

    let active = true;
    if (storeRef.current.owner !== uid) {
      resetStore(uid, {});
    }
    sourcesRef.current = freshSources();
    clientsSyncedRef.current = false;
    setLoading(true);
    setDataSynced(false);
    setError(null);

    const subUnsubs: Record<string, Unsubscribe[]> = {};
    /** Clients whose task list has not come from the server yet. */
    const awaitingTasks = new Set<string>();
    let firstSnapshotDone = false;
    let loadingDone = false;
    let loadingTimer: ReturnType<typeof setTimeout> | null = null;

    const finishLoading = () => {
      if (!active || loadingDone) return;
      loadingDone = true;
      if (loadingTimer) {
        clearTimeout(loadingTimer);
        loadingTimer = null;
      }
      flushNow();
      setLoading(false);
    };
    // Loading ends when the server has answered for the client list and every task list (the copy
    // kept in this browser alone is not enough), or after INITIAL_TASKS_TIMEOUT_MS.
    let syncedReported = false;
    const maybeFinishLoading = () => {
      // Once only: it is called on every client-list snapshot, and its immediate redraw showed a
      // half-applied save (the client already marked as migrated, its task list not yet arrived:
      // for a moment the first tick on an old client showed none of its tasks as completed).
      if (syncedReported) return;
      if (firstSnapshotDone && clientsSyncedRef.current && awaitingTasks.size === 0) {
        if (!active) return;
        syncedReported = true;
        // The confirmed data reaches the screen in the same render as dataSynced (updates are
        // otherwise batched for up to FLUSH_DELAY_MS).
        flushNow();
        setDataSynced(true);
        finishLoading();
      }
    };

    const detach = (clientId: string) => {
      (subUnsubs[clientId] || []).forEach(u => u());
      delete subUnsubs[clientId];
      const src = sourcesRef.current;
      delete src.docs[clientId];
      delete src.sub[clientId];
      delete src.embedded[clientId];
      delete src.materialized[clientId];
      delete src.storedStatus[clientId];
      delete src.activations[clientId];
      delete src.synced[clientId];
      if (awaitingTasks.delete(clientId)) maybeFinishLoading();
    };

    const attachSubListeners = (clientId: string) => {
      if (subUnsubs[clientId]) return;
      awaitingTasks.add(clientId);

      let seenTasks = false;
      const tasksUnsub = onSnapshot(
        collection(db, 'clients', clientId, 'tasks'),
        // Metadata changes too: that is how the server's confirmation of the browser's copy arrives.
        { includeMetadataChanges: true },
        snap => {
          if (!active) return;
          const src = sourcesRef.current;
          const fromServer = !snap.metadata.fromCache;
          const confirmsNow = fromServer && !src.synced[clientId];
          // Only the metadata changed (e.g. a save was acknowledged): nothing to redraw.
          if (seenTasks && !confirmsNow && snap.docChanges().length === 0) return;
          seenTasks = true;
          src.sub[clientId] = snap.docs.map(d => ({ ...d.data(), id: d.id }));
          if (fromServer) src.synced[clientId] = true;
          recomputeClient(clientId);
          if (fromServer && awaitingTasks.delete(clientId)) maybeFinishLoading();
        },
        err => {
          handleFirestoreError(err, OperationType.LIST, `clients/${clientId}/tasks`);
          if (awaitingTasks.delete(clientId)) maybeFinishLoading();
        }
      );

      const activationsUnsub = onSnapshot(
        collection(db, 'clients', clientId, 'dailyActivations'),
        snap => {
          if (!active) return;
          const acts = snap.docs.map(d => ({ ...(d.data() as DailyActivation), id: d.id }));
          sourcesRef.current.activations[clientId] = acts;
          applyUpdate(map => (map[clientId] ? { ...map, [clientId]: { ...map[clientId], dailyActivations: acts } } : map));
        },
        err => handleFirestoreError(err, OperationType.LIST, `clients/${clientId}/dailyActivations`)
      );

      // The activity log is NOT loaded here any more: it grows with every action and was read
      // in full for every client on every page load. It is loaded per client by useClientActivities.
      subUnsubs[clientId] = [tasksUnsub, activationsUnsub];
    };

    const clientsQuery = canSeeAll
      ? query(collection(db, 'clients'))
      : query(collection(db, 'clients'), where('createdBy', '==', uid));

    const unsubClients = onSnapshot(
      clientsQuery,
      { includeMetadataChanges: true },
      snapshot => {
        if (!active) return;
        const fromServer = !snapshot.metadata.fromCache;
        const changes = firstSnapshotDone ? snapshot.docChanges() : null;
        if (changes && changes.length === 0) {
          // Only the metadata changed: the server confirmed the copy kept in this browser, or a save
          // was acknowledged. Nothing to redraw.
          if (fromServer && !clientsSyncedRef.current) {
            clientsSyncedRef.current = true;
            maybeFinishLoading();
          }
          return;
        }
        if (fromServer) clientsSyncedRef.current = true;
        const src = sourcesRef.current;
        const presentIds = new Set<string>();
        snapshot.docs.forEach(d => {
          if (!pendingDeletesRef.current.has(d.id)) presentIds.add(d.id);
        });

        // The first snapshot is compared in full: the cached list may contain clients that were
        // deleted while this device was away (they used to stay on screen forever).
        const docsToProcess = !changes
          ? snapshot.docs
          : changes.filter(c => c.type !== 'removed').map(c => c.doc);

        const changed: Array<{ id: string; client: Client | null }> = [];
        docsToProcess.forEach(d => {
          if (!presentIds.has(d.id)) return;
          const raw = d.data();
          src.embedded[d.id] = Array.isArray(raw.tasks) ? raw.tasks : [];
          src.materialized[d.id] = raw.tasksMaterialized === true;
          src.storedStatus[d.id] = raw.caseStatus;
          const client = normalizeClientDoc(raw, d.id);
          if (!client) presentIds.delete(d.id); // document without client data: ignore it
          else src.docs[d.id] = client;
          changed.push({ id: d.id, client });
        });

        Object.keys(subUnsubs).forEach(id => {
          if (!presentIds.has(id)) detach(id);
        });

        applyUpdate(map => {
          const next: ClientsMap = {};
          Object.keys(map).forEach(id => {
            if (presentIds.has(id)) next[id] = map[id];
          });
          changed.forEach(({ id, client }) => {
            if (!client) return;
            const prev = map[id];
            const merged: Client = {
              ...client,
              dailyActivations: src.activations[id] ?? prev?.dailyActivations ?? [],
              activities: [],
            };
            merged.tasks = resolveClientTasks({
              client: merged,
              subDocs: src.sub[id],
              embedded: src.embedded[id],
              materialized: src.materialized[id],
              previousTasks: prev?.tasks,
            });
            merged.caseStatus = evaluateClientCaseStatus(merged);
            next[id] = merged;
          });
          return next;
        });

        changed.forEach(({ id, client }) => {
          if (client) attachSubListeners(id);
        });

        setConnectionStatus(typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'online');

        if (!firstSnapshotDone) {
          firstSnapshotDone = true;
          loadingTimer = setTimeout(finishLoading, INITIAL_TASKS_TIMEOUT_MS);
        }
        maybeFinishLoading();
      },
      err => {
        if (!active) return;
        handleFirestoreError(err, OperationType.LIST, 'clients');
        setError(err.message);
        if (isPermissionError(err)) {
          // Refused by the security rules, not a connection problem: say so. The page used to stay
          // empty without any explanation, and showed "offline" although the connection was fine.
          toast.error('قاعدة البيانات رفضت عرض العملاء لهذا الحساب (صلاحيات). اطلب من مدير النظام مراجعة صلاحية حسابك.', {
            id: 'clients-permission-denied',
            duration: 15000,
          });
        } else {
          setConnectionStatus('offline');
        }
        finishLoading();
      }
    );

    const notifQ = query(collection(db, 'notifications'), where('userId', '==', uid));
    // New notifications pop up only once the list has come from the server: the ones that arrived
    // while this device was away are listed, not announced one by one.
    let notifSynced = false;
    const unsubscribeNotifications = onSnapshot(
      notifQ,
      { includeMetadataChanges: true },
      snapshot => {
        if (!active) return;
        const changes = snapshot.docChanges();
        if (notifSynced) {
          if (changes.length === 0) return; // only the metadata changed
          changes.forEach(change => {
            if (change.type !== 'added') return;
            const notif = change.doc.data() as AppNotification;
            if (!notif.isRead) {
              toast(`${notif.title}\n${notif.message}`, {
                icon: '🔔',
                style: { borderRadius: '10px', background: '#fff', color: '#333', direction: 'rtl' },
              });
            }
          });
        }
        if (!snapshot.metadata.fromCache) notifSynced = true;
        const notifs = snapshot.docs.map(d => ({ ...(d.data() as AppNotification), id: d.id }));
        notifs.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        setNotifications(notifs);
      },
      err => handleFirestoreError(err, OperationType.LIST, 'notifications')
    );

    return () => {
      active = false;
      if (loadingTimer) clearTimeout(loadingTimer);
      unsubClients();
      unsubscribeNotifications();
      Object.keys(subUnsubs).forEach(id => (subUnsubs[id] || []).forEach(u => u()));
    };
  }, [uid, suspended, canSeeAll, applyUpdate, resetStore, flushNow, recomputeClient]);

  const clients: Client[] = useMemo(
    () => (store.owner && store.owner === uid ? Object.values(store.map) : []),
    [store, uid]
  );

  // ───────────────────────────── write helpers ─────────────────────────────

  /** Commits operations in batches; warns the user when the server does not confirm in time. */
  const commitOps = useCallback(async (ops: WriteOp[]) => {
    if (ops.length === 0) return;
    pendingWritesRef.current++;
    const slowTimer = setTimeout(() => {
      toast.loading('جاري حفظ التعديلات على السيرفر... لا تغلق الصفحة حتى يكتمل الحفظ', { id: 'pending-writes' });
    }, SLOW_WRITE_NOTICE_MS);
    try {
      for (let i = 0; i < ops.length; i += BATCH_LIMIT) {
        const batch = writeBatch(db);
        ops.slice(i, i + BATCH_LIMIT).forEach(op => {
          if (op.kind === 'set') batch.set(op.ref, op.data);
          else if (op.kind === 'update') batch.update(op.ref, op.data);
          else batch.delete(op.ref);
        });
        await batch.commit();
      }
    } finally {
      clearTimeout(slowTimer);
      pendingWritesRef.current--;
      if (pendingWritesRef.current === 0) toast.dismiss('pending-writes');
    }
    // Saved: bring the public portal copy of the changed clients up to date.
    if (!ops.some(op => op.ref.path.startsWith('portals/'))) {
      const changed = new Set<string>();
      ops.forEach(op => {
        const match = PORTAL_SOURCE_PATH.exec(op.ref.path);
        if (match) changed.add(match[1]);
      });
      changed.forEach(schedulePortalRefresh);
    }
  }, [schedulePortalRefresh]);

  const activityOp = useCallback((clientId: string, log: LogEntry): WriteOp => {
    const id = newActivityId();
    return {
      kind: 'set',
      ref: doc(db, 'clients', clientId, 'activities', id),
      data: {
        id,
        action: log.action,
        details: log.details,
        ...(log.taskId ? { taskId: log.taskId } : {}),
        createdAt: nowIso(),
        performedBy: actorNameRef.current,
      },
    };
  }, []);

  /** Runs jobs for the same client one after another (prevents two full-list saves from racing). */
  const enqueue = useCallback(<T,>(clientId: string, job: () => Promise<T>): Promise<T> => {
    const previous = writeQueueRef.current[clientId] || Promise.resolve();
    const run = previous.catch(() => undefined).then(job);
    const tail = run.catch(() => undefined);
    writeQueueRef.current[clientId] = tail;
    tail.then(() => {
      if (writeQueueRef.current[clientId] === tail) delete writeQueueRef.current[clientId];
    });
    return run;
  }, []);

  /** True when every task on screen already exists as a document (single-document writes are safe). */
  const isFullyPersisted = useCallback((clientId: string): boolean => {
    const src = sourcesRef.current;
    const client = storeRef.current.map[clientId];
    const sub = src.sub[clientId];
    if (!client || sub === undefined || !src.synced[clientId]) return false;
    if (!src.materialized[clientId]) return false;
    if ((src.embedded[clientId] || []).length > 0) return false;
    if (writeQueueRef.current[clientId]) return false;
    const subIds = new Set(sub.map(r => r.id));
    return client.tasks.every(t => subIds.has(t.id));
  }, []);

  /**
   * Saves a complete task list for a client: creates/updates changed tasks, deletes removed ones,
   * marks the client as migrated and removes the legacy embedded `tasks` array — in one batch.
   * `clientFields` are written to the client document in that same batch.
   */
  const persistTaskList = useCallback(async (clientId: string, desired: TaskItem[], log?: LogEntry | LogEntry[], clientFields?: Record<string, any>) => {
    if (!clientsSyncedRef.current) throw new Error('clients-not-loaded');
    const client = storeRef.current.map[clientId];
    if (!client) return;
    const src = sourcesRef.current;

    let sub = src.sub[clientId];
    if (sub === undefined || !src.synced[clientId]) {
      // The deletions below are worked out from this list, so it must be the server's.
      const snap = await getDocs(collection(db, 'clients', clientId, 'tasks'));
      if (snap.metadata?.fromCache) throw new Error('tasks-not-loaded');
      sub = snap.docs.map(d => ({ ...d.data(), id: d.id }));
    }
    const subById = new Map(sub.map(r => [r.id, r]));

    const seen = new Set<string>();
    const finalTasks = desired
      .map((t, i) => normalizeTask(t, t?.id || `t-${clientId}-${Date.now()}-${i}`))
      .filter(t => !isGarbageTask(t))
      .filter(t => (seen.has(t.id) ? false : (seen.add(t.id), true)));

    const ops: WriteOp[] = [];
    finalTasks.forEach(t => {
      const raw = subById.get(t.id);
      if (!raw || isIncompleteTaskDoc(raw) || !sameTask(normalizeTask(raw, raw.id), t)) {
        ops.push({ kind: 'set', ref: taskRef(clientId, t.id), data: serializeTask(t) });
      }
    });
    sub.forEach(raw => {
      if (!seen.has(raw.id)) ops.push({ kind: 'delete', ref: taskRef(clientId, raw.id) });
    });

    const lastUpdated = nowIso();
    // Client document last: if an earlier batch fails, the client is not marked as migrated.
    ops.push({ kind: 'update', ref: clientRef(clientId), data: { ...(clientFields || {}), lastUpdated, tasksMaterialized: true, tasks: deleteField() } });
    (Array.isArray(log) ? log : log ? [log] : []).forEach(entry => ops.push(activityOp(clientId, entry)));

    replaceClientTasks(clientId, finalTasks, { lastUpdated });
    await commitOps(ops);
  }, [activityOp, commitOps, replaceClientTasks]);

  /** Puts a client's fields back to the last version received from Firestore. */
  const revertClientFields = useCallback((clientId: string) => {
    applyUpdate(map => {
      const current = map[clientId];
      const stored = sourcesRef.current.docs[clientId];
      if (!current || !stored) return map;
      const next: Client = { ...stored, tasks: current.tasks, dailyActivations: current.dailyActivations, activities: [] };
      next.caseStatus = evaluateClientCaseStatus(next);
      return { ...map, [clientId]: next };
    });
  }, [applyUpdate]);

  const onWriteFailure = useCallback((err: unknown, path: string, clientId?: string) => {
    handleFirestoreError(err, OperationType.WRITE, path);
    notifyWriteError(err);
    if (clientId) recomputeClient(clientId); // show what is really stored again
  }, [recomputeClient]);

  /** Creates or replaces one task (the whole task document is written, so cleared fields are removed). */
  const writeSingleTask = useCallback(async (clientId: string, task: TaskItem, log: LogEntry): Promise<boolean> => {
    applyUpdate(map => {
      const client = map[clientId];
      if (!client) return map;
      const exists = client.tasks.some(t => t.id === task.id);
      const tasks = exists ? client.tasks.map(t => (t.id === task.id ? task : t)) : [...client.tasks, task];
      const next: Client = { ...client, tasks: sortTasksByDueDate(tasks), lastUpdated: nowIso() };
      next.caseStatus = evaluateClientCaseStatus({ ...next, caseStatus: (sourcesRef.current.storedStatus[clientId] as any) || next.caseStatus });
      return { ...map, [clientId]: next };
    });

    try {
      if (isFullyPersisted(clientId)) {
        await commitOps([
          { kind: 'set', ref: taskRef(clientId, task.id), data: serializeTask(task) },
          { kind: 'update', ref: clientRef(clientId), data: { lastUpdated: nowIso() } },
          activityOp(clientId, log),
        ]);
      } else {
        await enqueue(clientId, async () => {
          await ensureTasksLoaded(clientId);
          const base = storeRef.current.map[clientId]?.tasks || [];
          const exists = base.some(t => t.id === task.id);
          const list = exists ? base.map(t => (t.id === task.id ? task : t)) : [...base, task];
          await persistTaskList(clientId, list, log);
        });
      }
      return true;
    } catch (err) {
      onWriteFailure(err, `clients/${clientId}/tasks/${task.id}`, clientId);
      return false;
    }
  }, [applyUpdate, isFullyPersisted, commitOps, activityOp, enqueue, ensureTasksLoaded, persistTaskList, onWriteFailure]);

  /** Follow-up automation after a task is completed (brief → active client, plan approval → SLA dates). */
  const runTaskSideEffects = useCallback(async (clientId: string, task: TaskItem, previous?: TaskItem) => {
    const justCompleted = task.completed && !previous?.completed;
    if (!justCompleted) return;
    const title = task.title || '';

    if (isBriefTask(title) && sourcesRef.current.storedStatus[clientId] === 'جديد') {
      try {
        await commitOps([
          { kind: 'update', ref: clientRef(clientId), data: { caseStatus: 'نشط', lastUpdated: nowIso() } },
          activityOp(clientId, { action: 'تحديث تلقائي', details: 'تم تحويل حالة العميل إلى نشط تلقائياً بعد استكمال البريف' }),
        ]);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `clients/${clientId}`);
      }
    }

    const rule = SLA_RULES.find(r => r.match.some(m => title.includes(m)));
    if (!rule) return;
    const client = storeRef.current.map[clientId];
    const downstream = client?.tasks.find(t =>
      !t.completed &&
      (t.title || '').includes(rule.target) &&
      // Same contract month as the approved plan (multi-month contracts repeat these tasks).
      (task.monthIndex === undefined || t.monthIndex === undefined || t.monthIndex === task.monthIndex)
    );
    if (!downstream) return;

    const completedOn = toLocalDateStr(task.completedAt);
    const compDate = isPlausibleDateStr(completedOn) ? completedOn : getTodayStr();
    const newDueDate = addBusinessDays(compDate, rule.days);
    if (downstream.dueDate === newDueDate && downstream.startDate === compDate) return;

    await writeSingleTask(clientId, { ...downstream, dueDate: newDueDate, startDate: compDate }, {
      action: 'تحديث SLA تلقائي',
      details: `تم تحديث موعد استحقاق (${downstream.title}) إلى ${newDueDate} بإضافة ${rule.days} أيام عمل بناءً على إنجاز مهمة الاعتماد في ${compDate}`,
    });
  }, [commitOps, activityOp, writeSingleTask]);

  // ───────────────────────────── public API ─────────────────────────────

  /**
   * Saves client fields only. Tasks, activations and the activity log are never written from here.
   * Callers should pass only the fields they change (plus `id`); a full client object is accepted,
   * but every field in it is written.
   */
  const updateClient = useCallback(async (updatedClient: Partial<Client> & { id: string }): Promise<boolean> => {
    if (!uid || !updatedClient?.id) return false;
    if (!clientsSyncedRef.current) {
      // Only this browser's (possibly old) copy so far: hold rules, archiving and re-scheduling are
      // worked out from the stored fields, so wait for the server.
      notifyWriteError(new Error('clients-not-loaded'));
      return false;
    }
    const clientId = updatedClient.id;
    const latest = storeRef.current.map[clientId];
    const {
      tasks: _tasks,
      dailyActivations: _acts,
      activities: _logs,
      tasksMaterialized: _marker,
      id: _id,
      ...rest
    } = updatedClient as Client & Record<string, any>;
    const fields: Record<string, any> = { ...rest, lastUpdated: nowIso() };

    // Auto-archive only when the client has JUST become completed or lost. The old code forced
    // isArchived back to true on every save, so restoring a client from the archive was impossible.
    const storedStatus = sourcesRef.current.storedStatus[clientId] ?? latest?.caseStatus;
    if ((fields.caseStatus === 'مكتمل' && storedStatus !== 'مكتمل') || (fields.isLost === true && latest?.isLost !== true)) {
      fields.isArchived = true;
    }

    const scheduleKeys = ['startDate', 'contract', 'durationMonths', 'economyFullPackageMonths', 'economyMediaMonths'];
    const scheduleChanged = !!latest && scheduleKeys.some(
      key => fields[key] !== undefined && String(fields[key]) !== String((latest as any)[key] ?? '')
    );

    // Leaving "hold": the pause must not eat into the contract or make every open task overdue at
    // once. The end date moves by the length of the pause and the open tasks by the working days
    // lost. (Closing a held contract as completed / lost only clears the hold date.)
    // A renewal starts a new term: the old term's pause is not carried into it.
    let resumeShift: { calendarDays: number; businessDays: number; from: string; to: string } | null = null;
    const isRenewal = fields.renewalCount !== undefined && Number(fields.renewalCount) !== Number(latest?.renewalCount || 0);
    if (fields.caseStatus !== undefined && fields.caseStatus !== 'hold' && storedStatus === 'hold') {
      const holdStart = latest?.holdStartDate;
      fields.holdStartDate = undefined;
      if (holdStart && fields.caseStatus !== 'مكتمل' && fields.isLost !== true && !isRenewal) {
        const today = getTodayStr();
        const pause = getHoldPause(holdStart, today);
        if (pause.calendarDays > 0) {
          const baseEnd = fields.endDate ?? latest?.endDate;
          if (baseEnd) fields.endDate = addCalendarDays(baseEnd, pause.calendarDays);
          fields.accumulatedHoldDays = (Number(latest?.accumulatedHoldDays) || 0) + pause.calendarDays;
          fields.accumulatedHoldBusinessDays = (Number(latest?.accumulatedHoldBusinessDays) || 0) + pause.businessDays;
          resumeShift = { ...pause, from: holdStart, to: today };
        }
      }
    } else if (fields.caseStatus === 'hold' && storedStatus !== 'hold' && !fields.holdStartDate) {
      fields.holdStartDate = getTodayStr();
    }

    // An explicit `undefined` means "clear this field" (e.g. holdStartDate when leaving hold).
    const writeData: Record<string, any> = {};
    Object.entries(fields).forEach(([key, value]) => {
      writeData[key] = value === undefined ? deleteField() : value;
    });

    applyUpdate(map => {
      const current = map[clientId];
      if (!current) return map;
      const next = { ...current, ...fields } as Client;
      next.caseStatus = evaluateClientCaseStatus(next);
      return { ...map, [clientId]: next };
    });

    const resumeLog: LogEntry | null = resumeShift && {
      action: 'استئناف العمل بعد التوقف',
      details: `تم استئناف العمل بعد توقف ${resumeShift.calendarDays} يوم (من ${resumeShift.from} إلى ${resumeShift.to}): تم مد تاريخ نهاية العقد ${resumeShift.calendarDays} يوم وتأجيل مواعيد المهام غير المنجزة ${resumeShift.businessDays} يوم عمل`,
    };

    if (resumeShift && !scheduleChanged) {
      // Resuming: the client fields and the moved task dates are saved in ONE batch. If that fails the
      // client is still on hold (nothing half-saved), so saving again simply retries.
      const businessDays = resumeShift.businessDays;
      try {
        await enqueue(clientId, async () => {
          await ensureTasksLoaded(clientId);
          const current = storeRef.current.map[clientId];
          if (!current) return;
          await persistTaskList(clientId, shiftOpenTasks(current.tasks, businessDays), resumeLog!, writeData);
        });
        return true;
      } catch (err) {
        onWriteFailure(err, `clients/${clientId}`, clientId);
        revertClientFields(clientId);
        return false;
      }
    }

    try {
      await commitOps([
        { kind: 'update', ref: clientRef(clientId), data: writeData },
        activityOp(clientId, resumeLog || { action: 'تعديل بيانات العميل', details: 'تم تحديث بيانات العميل' }),
      ]);
    } catch (err) {
      onWriteFailure(err, `clients/${clientId}`);
      revertClientFields(clientId);
      return false;
    }

    if (scheduleChanged) {
      // Contract, start date or duration changed: re-schedule the tasks from the newest data. The new
      // matrix dates include every hold pause (accumulatedHoldBusinessDays), this one too.
      try {
        await enqueue(clientId, async () => {
          await ensureTasksLoaded(clientId);
          const current = storeRef.current.map[clientId];
          if (!current) return;
          await persistTaskList(clientId, syncClientTasksWithNewMatrix(current), {
            action: 'إعادة جدولة المهام',
            details: 'تم تحديث جدولة المهام بعد تعديل بيانات العقد مع الحفاظ على المهام المنجزة',
          });
        });
      } catch (err) {
        onWriteFailure(err, `clients/${clientId}/tasks`, clientId);
        return false;
      }
    }
    return true;
  }, [uid, applyUpdate, commitOps, activityOp, onWriteFailure, revertClientFields, enqueue, ensureTasksLoaded, persistTaskList]);

  const addClient = useCallback(async (newClient: Client): Promise<boolean> => {
    if (!uid || !newClient?.id) return false;
    const clientId = newClient.id;
    const { tasks = [], dailyActivations: _acts, activities: _logs, tasksMaterialized: _marker, ...rest } =
      newClient as Client & Record<string, any>;

    const seen = new Set<string>();
    const taskList = (tasks as TaskItem[])
      .map((t, i) => normalizeTask(t, t?.id || `t-${clientId}-${i + 1}`))
      .filter(t => !isGarbageTask(t))
      .filter(t => (seen.has(t.id) ? false : (seen.add(t.id), true)));

    const core: Record<string, any> = { ...rest, id: clientId, lastUpdated: nowIso() };
    if (taskList.length > 0) core.tasksMaterialized = true;
    Object.keys(core).forEach(k => core[k] === undefined && delete core[k]);

    const normalized = normalizeClientDoc(core, clientId);
    if (normalized) {
      applyUpdate(map => {
        const client: Client = { ...normalized, dailyActivations: [], activities: [] };
        client.tasks = taskList.length > 0 ? sortTasksByDueDate(taskList) : syncClientTasksWithNewMatrix({ ...client, tasks: [] });
        client.caseStatus = evaluateClientCaseStatus(client);
        return { ...map, [clientId]: client };
      });
    }

    // Tasks first, client document last: if a batch fails half way, no half-saved client appears.
    const ops: WriteOp[] = [
      ...taskList.map(t => ({ kind: 'set' as const, ref: taskRef(clientId, t.id), data: serializeTask(t) })),
      { kind: 'set', ref: clientRef(clientId), data: core },
      activityOp(clientId, { action: 'إضافة العميل', details: 'تم إنشاء ملف العميل' }),
    ];

    try {
      await commitOps(ops);
      return true;
    } catch (err) {
      onWriteFailure(err, `clients/${clientId}`);
      applyUpdate(map => {
        if (!map[clientId]) return map;
        const next = { ...map };
        delete next[clientId];
        return next;
      });
      return false;
    }
  }, [uid, applyUpdate, commitOps, activityOp, onWriteFailure]);

  const addTask = useCallback(async (clientId: string, newTask: TaskItem): Promise<boolean> => {
    if (!uid) return false;
    try {
      await ensureTasksLoaded(clientId);
    } catch (err) {
      onWriteFailure(err, `clients/${clientId}/tasks`, clientId);
      return false;
    }
    const task = normalizeTask({ ...newTask, createdBy: newTask.createdBy || uid }, newTask.id || `t-${Date.now()}`);
    return writeSingleTask(clientId, task, { action: 'إضافة مهمة جديدة', details: `تمت إضافة مهمة: ${task.title}` });
  }, [uid, ensureTasksLoaded, onWriteFailure, writeSingleTask]);

  /**
   * Updates one task. Accepts a full task or a partial one ({ id, ...changes }); missing fields are
   * taken from the current task, so a partial update can no longer wipe a task's title and dates.
   */
  const updateTask = useCallback(async (clientId: string, updatedTask: Partial<TaskItem> & { id: string }): Promise<boolean> => {
    if (!uid || !updatedTask?.id) return false;
    try {
      // Build on the REAL stored task, not on an offline copy shown while loading.
      await ensureTasksLoaded(clientId);
    } catch (err) {
      onWriteFailure(err, `clients/${clientId}/tasks/${updatedTask.id}`, clientId);
      return false;
    }
    const previous = storeRef.current.map[clientId]?.tasks.find(t => t.id === updatedTask.id);
    // Never store half-typed or impossible dates (e.g. year 0002 from a date input). Only the dates
    // this call changes are checked: screens that send the whole task carry its old values along, and
    // an old bad date (e.g. 1902 from the old SLA bug) must not block ticking or commenting on it.
    for (const key of ['dueDate', 'startDate', 'completedAt'] as const) {
      const value = (updatedTask as any)[key];
      if (typeof value !== 'string' || !value || value === (previous as any)?.[key]) continue;
      if (!isPlausibleDateStr(toLocalDateStr(value))) {
        toast.error('التاريخ غير صحيح: اكتب اليوم والشهر والسنة كاملين ثم حاول مرة أخرى.', { id: 'bad-task-date' });
        return false;
      }
    }
    const merged = normalizeTask({ ...(previous || {}), ...updatedTask }, updatedTask.id);
    // Comments are only ever added in the UI, so merge both lists: two people commenting at the
    // same moment no longer lose one of the comments.
    if (Array.isArray(updatedTask.comments) && previous?.comments?.length) {
      const byId = new Map<string, any>();
      [...previous.comments, ...updatedTask.comments].forEach(c => c && byId.set(c.id, c));
      merged.comments = [...byId.values()].sort((a, b) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')));
    }
    if (merged.completed) {
      const completedOn = toLocalDateStr(merged.completedAt);
      if (completedOn) merged.completedAt = completedOn;
      // "Today" only when the task is being completed now. An old completed task without a
      // recorded date keeps it unknown — stamping today on any edit (a comment, a note) made it
      // look completed late in the SLA reports.
      else if (!previous?.completed) merged.completedAt = getTodayStr();
      else delete merged.completedAt;
    } else {
      delete merged.completedAt;
    }
    if (isGarbageTask(merged)) return false;

    const statusChanged = !previous || previous.completed !== merged.completed;
    const log: LogEntry = statusChanged
      ? { action: 'تحديث حالة المهمة', details: `تم تحديث المهمة: ${merged.title} - ${merged.completed ? 'مكتملة' : 'قيد التنفيذ'}` }
      : { action: 'تعديل مهمة', details: `تم تعديل بيانات المهمة: ${merged.title}` };

    const ok = await writeSingleTask(clientId, merged, log);
    if (ok) await runTaskSideEffects(clientId, merged, previous);
    return ok;
  }, [uid, ensureTasksLoaded, onWriteFailure, writeSingleTask, runTaskSideEffects]);

  const deleteTask = useCallback(async (clientId: string, taskId: string): Promise<boolean> => {
    if (!uid) return false;
    try {
      await ensureTasksLoaded(clientId);
    } catch (err) {
      onWriteFailure(err, `clients/${clientId}/tasks/${taskId}`, clientId);
      return false;
    }
    const client = storeRef.current.map[clientId];
    const task = client?.tasks.find(t => t.id === taskId);
    const log: LogEntry = { action: 'حذف مهمة', details: `تم حذف المهمة: ${task?.title || taskId}` };

    try {
      if (isFullyPersisted(clientId)) {
        replaceClientTasks(clientId, (client?.tasks || []).filter(t => t.id !== taskId), { lastUpdated: nowIso() });
        await commitOps([
          { kind: 'delete', ref: taskRef(clientId, taskId) },
          { kind: 'update', ref: clientRef(clientId), data: { lastUpdated: nowIso() } },
          activityOp(clientId, log),
        ]);
      } else {
        await enqueue(clientId, () =>
          persistTaskList(clientId, (storeRef.current.map[clientId]?.tasks || []).filter(t => t.id !== taskId), log)
        );
      }
      return true;
    } catch (err) {
      onWriteFailure(err, `clients/${clientId}/tasks/${taskId}`, clientId);
      return false;
    }
  }, [uid, ensureTasksLoaded, isFullyPersisted, replaceClientTasks, commitOps, activityOp, enqueue, persistTaskList, onWriteFailure]);

  /**
   * Marks several tasks of one client as completed on the same date, in ONE save. The activity log
   * gets the same entry per task as ticking them one by one (so the log and the recovery tool read
   * them the same way), and the follow-up automation (brief → active client, plan approval →
   * delivery dates) runs for each task afterwards.
   */
  const completeTasks = useCallback(async (clientId: string, taskIds: string[], completedOn?: string): Promise<boolean> => {
    if (!uid || taskIds.length === 0) return false;
    const date = completedOn && isPlausibleDateStr(completedOn) ? completedOn : getTodayStr();
    try {
      await ensureTasksLoaded(clientId);
    } catch (err) {
      onWriteFailure(err, `clients/${clientId}/tasks`, clientId);
      return false;
    }
    const client = storeRef.current.map[clientId];
    if (!client) return false;
    const wanted = new Set(taskIds);
    const previous = client.tasks.filter(t => wanted.has(t.id) && !t.completed);
    if (previous.length === 0) return true;
    const done = previous.map(t => normalizeTask({ ...t, completed: true, completedAt: date }, t.id));
    const doneById = new Map(done.map(t => [t.id, t]));
    const logs: LogEntry[] = done.map(t => ({
      action: 'تحديث حالة المهمة',
      details: `تم تحديث المهمة: ${t.title} - مكتملة`,
      taskId: t.id,
    }));
    const withDone = (tasks: TaskItem[]) => tasks.map(t => doneById.get(t.id) || t);

    // Each task is two writes (task + log entry) and a batch holds at most BATCH_LIMIT writes, so a
    // very long selection is saved in parts of BULK_COMPLETE_CHUNK tasks (each part all-or-nothing).
    const saved: TaskItem[] = [];
    let failure: unknown = null;
    try {
      if (isFullyPersisted(clientId)) {
        replaceClientTasks(clientId, withDone(client.tasks), { lastUpdated: nowIso() });
        for (let i = 0; i < done.length; i += BULK_COMPLETE_CHUNK) {
          const part = done.slice(i, i + BULK_COMPLETE_CHUNK);
          await commitOps([
            ...part.map(t => ({ kind: 'set' as const, ref: taskRef(clientId, t.id), data: serializeTask(t) })),
            { kind: 'update', ref: clientRef(clientId), data: { lastUpdated: nowIso() } },
            ...part.map(t => activityOp(clientId, logs.find(entry => entry.taskId === t.id)!)),
          ]);
          saved.push(...part);
        }
      } else {
        // Not every task has its own document yet: the whole list is saved (one batch for up to
        // BATCH_LIMIT tasks), and the log entries right after it, so a long selection never splits
        // the task save itself.
        await enqueue(clientId, () => persistTaskList(clientId, withDone(storeRef.current.map[clientId]?.tasks || [])));
        saved.push(...done);
        try {
          await commitOps(logs.map(entry => activityOp(clientId, entry)));
        } catch (err) {
          // The tasks are saved; only their log entries are missing.
          handleFirestoreError(err, OperationType.WRITE, `clients/${clientId}/activities`);
        }
      }
    } catch (err) {
      failure = err;
    }
    if (failure) {
      if (saved.length === 0) {
        onWriteFailure(failure, `clients/${clientId}/tasks`, clientId);
        return false;
      }
      // Some parts were saved: show what is really stored and say how many.
      handleFirestoreError(failure, OperationType.WRITE, `clients/${clientId}/tasks`);
      recomputeClient(clientId);
      toast.error(`تم حفظ ${saved.length} من ${done.length} مهمة فقط، ولم يتم حفظ الباقي. حاول مرة أخرى.`, { id: 'bulk-complete-partial' });
    }

    // One after another: each step reads the newest dates (two approvals can move tasks of the same month).
    for (const task of saved) {
      const before = previous.find(t => t.id === task.id);
      try {
        await runTaskSideEffects(clientId, task, before);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `clients/${clientId}/tasks/${task.id}`);
      }
    }
    return !failure;
  }, [uid, ensureTasksLoaded, onWriteFailure, isFullyPersisted, replaceClientTasks, commitOps, activityOp, enqueue, persistTaskList, runTaskSideEffects, recomputeClient]);

  /** Saves a new manual order for a client's tasks (only the `order` field is written). */
  const reorderTasks = useCallback(async (clientId: string, orderedTaskIds: string[]): Promise<boolean> => {
    if (!uid) return false;
    try {
      await ensureTasksLoaded(clientId);
    } catch (err) {
      onWriteFailure(err, `clients/${clientId}/tasks`, clientId);
      return false;
    }
    const client = storeRef.current.map[clientId];
    if (!client) return false;
    const position = new Map(orderedTaskIds.map((id, index) => [id, index]));
    const withOrder = (tasks: TaskItem[]) => tasks.map(t => (position.has(t.id) ? { ...t, order: position.get(t.id)! } : t));
    const changed = withOrder(client.tasks).filter(t => client.tasks.find(o => o.id === t.id)?.order !== t.order);
    if (changed.length === 0) return true;
    const log: LogEntry = { action: 'إعادة ترتيب المهام', details: 'تم تغيير ترتيب مهام العميل' };

    try {
      if (isFullyPersisted(clientId)) {
        replaceClientTasks(clientId, withOrder(client.tasks), { lastUpdated: nowIso() });
        await commitOps([
          ...changed.map(t => ({ kind: 'update' as const, ref: taskRef(clientId, t.id), data: { order: t.order } })),
          { kind: 'update', ref: clientRef(clientId), data: { lastUpdated: nowIso() } },
          activityOp(clientId, log),
        ]);
      } else {
        await enqueue(clientId, () => persistTaskList(clientId, withOrder(storeRef.current.map[clientId]?.tasks || []), log));
      }
      return true;
    } catch (err) {
      onWriteFailure(err, `clients/${clientId}/tasks`, clientId);
      return false;
    }
  }, [uid, ensureTasksLoaded, isFullyPersisted, replaceClientTasks, commitOps, activityOp, enqueue, persistTaskList, onWriteFailure]);

  /** Deletes every task of one client (the default task matrix is shown again, as before). */
  const clearClientTasks = useCallback(async (clientId: string): Promise<boolean> => {
    if (!uid) return false;
    try {
      await enqueue(clientId, () => persistTaskList(clientId, [], { action: 'حذف جميع المهام', details: 'تم حذف جميع مهام العميل' }));
      return true;
    } catch (err) {
      onWriteFailure(err, `clients/${clientId}/tasks`, clientId);
      return false;
    }
  }, [uid, enqueue, persistTaskList, onWriteFailure]);

  const saveActivation = useCallback(async (clientId: string, activation: DailyActivation): Promise<boolean> => {
    if (!uid) return false;
    const act: DailyActivation = { ...activation, date: activation.date || getTodayStr() };

    applyUpdate(map => {
      const client = map[clientId];
      if (!client) return map;
      const list = [...(client.dailyActivations || [])];
      const index = list.findIndex(a => a.id === act.id);
      if (index >= 0) list[index] = act;
      else list.unshift(act);
      return { ...map, [clientId]: { ...client, dailyActivations: list } };
    });

    const data: Record<string, any> = {};
    Object.entries(act).forEach(([k, v]) => {
      if (v !== undefined) data[k] = v;
    });

    try {
      await commitOps([
        { kind: 'set', ref: doc(db, 'clients', clientId, 'dailyActivations', act.id), data },
        { kind: 'update', ref: clientRef(clientId), data: { lastUpdated: nowIso() } },
        activityOp(clientId, { action: 'إضافة/تحديث تفعيل يومي', details: `تم تسجيل تفعيل يومي: ${act.title}` }),
      ]);
      return true;
    } catch (err) {
      onWriteFailure(err, `clients/${clientId}/dailyActivations/${act.id}`);
      applyUpdate(map => {
        const client = map[clientId];
        const stored = sourcesRef.current.activations[clientId];
        if (!client || !stored) return map;
        return { ...map, [clientId]: { ...client, dailyActivations: stored } };
      });
      return false;
    }
  }, [uid, applyUpdate, commitOps, activityOp, onWriteFailure]);

  const deleteActivation = useCallback(async (clientId: string, activationId: string): Promise<boolean> => {
    if (!uid) return false;
    const activation = storeRef.current.map[clientId]?.dailyActivations?.find(a => a.id === activationId);
    applyUpdate(map => {
      const client = map[clientId];
      if (!client) return map;
      return { ...map, [clientId]: { ...client, dailyActivations: (client.dailyActivations || []).filter(a => a.id !== activationId) } };
    });

    try {
      await commitOps([
        { kind: 'delete', ref: doc(db, 'clients', clientId, 'dailyActivations', activationId) },
        { kind: 'update', ref: clientRef(clientId), data: { lastUpdated: nowIso() } },
        activityOp(clientId, { action: 'حذف تفعيل يومي', details: `تم حذف التفعيل اليومي: ${activation?.title || activationId}` }),
      ]);
      return true;
    } catch (err) {
      onWriteFailure(err, `clients/${clientId}/dailyActivations/${activationId}`);
      applyUpdate(map => {
        const client = map[clientId];
        const stored = sourcesRef.current.activations[clientId];
        if (!client || !stored) return map;
        return { ...map, [clientId]: { ...client, dailyActivations: stored } };
      });
      return false;
    }
  }, [uid, applyUpdate, commitOps, activityOp, onWriteFailure]);

  const deleteClient = useCallback(async (clientId: string): Promise<boolean> => {
    if (!uid) return false;
    if (!clientsSyncedRef.current) {
      // The portal links to remove come from the client document: it must be the server's.
      notifyWriteError(new Error('clients-not-loaded'));
      return false;
    }
    const before = storeRef.current.map[clientId];
    pendingDeletesRef.current.add(clientId);
    applyUpdate(map => {
      if (!map[clientId]) return map;
      const next = { ...map };
      delete next[clientId];
      return next;
    });

    try {
      const [tasksSnap, activationsSnap, activitiesSnap] = await Promise.all([
        getDocs(collection(db, 'clients', clientId, 'tasks')),
        getDocs(collection(db, 'clients', clientId, 'dailyActivations')),
        getDocs(collection(db, 'clients', clientId, 'activities')),
      ]);
      const ops: WriteOp[] = [
        ...tasksSnap.docs.map(d => ({ kind: 'delete' as const, ref: d.ref })),
        ...activationsSnap.docs.map(d => ({ kind: 'delete' as const, ref: d.ref })),
        ...activitiesSnap.docs.map(d => ({ kind: 'delete' as const, ref: d.ref })),
        // The client document goes last so a half-finished delete never leaves an invisible client.
        { kind: 'delete', ref: clientRef(clientId) },
      ];
      await commitOps(ops);
      // The portal page of a deleted client must stop working too (separately: a failure here must
      // not undo the delete).
      portalTokensOf(before).forEach(token => {
        deleteDoc(portalRef(token)).catch(err => console.warn(`Portal copy of a deleted client not removed (portals/${token})`, err));
      });
      return true;
    } catch (err) {
      onWriteFailure(err, `clients/${clientId}`);
      if (before) {
        applyUpdate(map => (map[clientId] ? map : { ...map, [clientId]: before }));
      }
      return false;
    } finally {
      pendingDeletesRef.current.delete(clientId);
    }
  }, [uid, applyUpdate, commitOps, onWriteFailure]);

  /** Loads the demo clients (admins only — it writes into the shared production database). */
  const seedInitialData = useCallback(async () => {
    if (!uid) return;
    const stamp = Date.now().toString().slice(-6);
    let added = 0;
    for (const sample of INITIAL_CLIENTS) {
      const newClientId = `${sample.id}-${uid.substring(0, 5)}-${stamp}`;
      // Re-generate the tasks with the new id so task ids match their client (no shared objects).
      const tasks = syncClientTasksWithNewMatrix({ ...sample, id: newClientId, tasks: [] }).map(t => ({ ...t, createdBy: uid }));
      const ok = await addClient({
        ...sample,
        id: newClientId,
        tasks,
        dailyActivations: [],
        createdBy: uid,
        createdAt: nowIso(),
      });
      if (ok) added++;
    }
    if (added > 0) toast.success(`تم تحميل ${added} عميل تجريبي بنجاح`);
  }, [uid, addClient]);

  const deleteAllClientsTasks = useCallback(async () => {
    if (!uid) return;
    let failed = 0;
    for (const clientId of Object.keys(storeRef.current.map)) {
      try {
        await enqueue(clientId, () => persistTaskList(clientId, [], { action: 'حذف جميع المهام', details: 'تم حذف جميع مهام العميل' }));
      } catch (err) {
        failed++;
        handleFirestoreError(err, OperationType.DELETE, `clients/${clientId}/tasks`);
      }
    }
    if (failed > 0) toast.error(`تعذّر حذف مهام ${failed} عميل`);
    else toast.success('تم حذف جميع المهام من ملفات العملاء بنجاح');
  }, [uid, enqueue, persistTaskList]);

  /** Re-applies the task matrix to every loaded client (completed / custom tasks are kept). */
  const syncAllClientsTasksMatrix = useCallback(async (): Promise<{ success: boolean; count: number }> => {
    if (!uid) return { success: false, count: 0 };
    if (!clientsSyncedRef.current) {
      notifyWriteError(new Error('clients-not-loaded'));
      return { success: false, count: 0 };
    }
    let count = 0;
    let failed = 0;
    for (const clientId of Object.keys(storeRef.current.map)) {
      try {
        await enqueue(clientId, async () => {
          await ensureTasksLoaded(clientId);
          const current = storeRef.current.map[clientId];
          if (!current) return;
          await persistTaskList(clientId, syncClientTasksWithNewMatrix(current), {
            action: 'تحديث مصفوفة المهام',
            details: 'تمت إعادة جدولة المهام وفق المصفوفة المحدثة مع الحفاظ على المهام المنجزة',
          });
        });
        count++;
      } catch (err) {
        failed++;
        handleFirestoreError(err, OperationType.UPDATE, `clients/${clientId}/tasks`);
      }
    }
    if (failed > 0) toast.error(`تعذّر تحديث مهام ${failed} عميل، يرجى المحاولة مرة أخرى`);
    return { success: failed === 0, count };
  }, [uid, enqueue, ensureTasksLoaded, persistTaskList]);

  const syncSingleClientTasks = useCallback(async (clientId: string): Promise<boolean> => {
    if (!uid) return false;
    if (!clientsSyncedRef.current) {
      notifyWriteError(new Error('clients-not-loaded'));
      return false;
    }
    try {
      await enqueue(clientId, async () => {
        await ensureTasksLoaded(clientId);
        const current = storeRef.current.map[clientId];
        if (!current) return;
        await persistTaskList(clientId, syncClientTasksWithNewMatrix(current), {
          action: 'تحديث مصفوفة المهام',
          details: 'تمت إعادة جدولة مهام العميل وفق المصفوفة المحدثة مع الحفاظ على المهام المنجزة',
        });
      });
      return true;
    } catch (err) {
      onWriteFailure(err, `clients/${clientId}/tasks`, clientId);
      return false;
    }
  }, [uid, enqueue, ensureTasksLoaded, persistTaskList, onWriteFailure]);

  /**
   * The public portal link of a client. The first time, a random token is made and the portal
   * copy is saved together with the token (one batch). The link is returned straight away so the
   * caller can copy it inside the click (browsers allow clipboard writes only there).
   */
  const getPortalLink = useCallback((clientId: string): string | null => {
    const client = storeRef.current.map[clientId];
    if (!uid || !client) {
      // Not expected from a client's page: the reason is shown and kept in the error log
      // (it used to fail with the same vague message whatever the cause).
      logError('portal', new Error(`portal link: ${!uid ? 'not signed in' : `client ${clientId} is not in the loaded list`}`));
      toast.error(
        !uid
          ? 'انتهت جلسة الدخول، سجّل الدخول مرة أخرى ثم انسخ الرابط.'
          : 'بيانات هذا العميل لم تُحمّل في الصفحة. حدّث الصفحة ثم انسخ الرابط مرة أخرى.',
        { id: 'portal-link-error' }
      );
      return null;
    }
    if (client.portalToken) {
      schedulePortalRefresh(clientId);
      return getPortalUrl(client.portalToken);
    }
    const pending = pendingPortalTokensRef.current[clientId];
    if (pending) return getPortalUrl(pending);
    if (!clientsSyncedRef.current) {
      // A colleague may already have made this client's link: wait for the server's client list.
      logError('portal', new Error('portal link: the client list has not come from the server yet'));
      notifyWriteError(new Error('clients-not-loaded'));
      return null;
    }

    const token = newPortalToken();
    pendingPortalTokensRef.current[clientId] = token;
    applyUpdate(map => (map[clientId] ? { ...map, [clientId]: { ...map[clientId], portalToken: token } } : map));
    enqueue(clientId, async () => {
      await ensureTasksLoaded(clientId);
      const current = storeRef.current.map[clientId];
      if (!current) return;
      await commitOps([
        { kind: 'set', ref: portalRef(token), data: buildPortalSnapshot(current) },
        // portalTokens keeps every link of the client (arrayUnion cannot lose one when two staff
        // members create a link at the same moment), so all of them are refreshed and deleted.
        { kind: 'update', ref: clientRef(clientId), data: { portalToken: token, portalTokens: arrayUnion(token) } },
      ]);
    }).then(() => {
      if (pendingPortalTokensRef.current[clientId] === token) delete pendingPortalTokensRef.current[clientId];
    }, err => {
      if (pendingPortalTokensRef.current[clientId] === token) delete pendingPortalTokensRef.current[clientId];
      handleFirestoreError(err, OperationType.WRITE, `portals/${token}`);
      toast.error(
        isPermissionError(err)
          ? 'تعذّر تجهيز رابط بوابة العميل لأن قاعدة البيانات رفضت الحفظ (غالباً قواعد Firestore الجديدة لم تُنشر بعد)، لذلك الرابط المنسوخ لن يعمل.'
          : 'تعذّر تجهيز رابط بوابة العميل، لذلك الرابط المنسوخ لن يعمل. حاول مرة أخرى.',
        { id: 'portal-link-error', duration: 7000 }
      );
      applyUpdate(map => (map[clientId]?.portalToken === token
        ? { ...map, [clientId]: { ...map[clientId], portalToken: undefined } }
        : map));
    });
    return getPortalUrl(token);
  }, [uid, applyUpdate, enqueue, ensureTasksLoaded, commitOps, schedulePortalRefresh]);

  const markNotificationAsRead = useCallback(async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), { isRead: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `notifications/${notificationId}`);
    }
  }, []);

  /**
   * Marks several notifications as read in one request (a write batch per 450) instead of one
   * request each: one round trip and one screen update. Firestore still counts one write per
   * notification. Returns false when they could not all be saved.
   */
  const markNotificationsAsRead = useCallback(async (notificationIds: string[]): Promise<boolean> => {
    const ids = [...new Set(notificationIds.filter(Boolean))];
    for (let i = 0; i < ids.length; i += BATCH_LIMIT) {
      const chunk = ids.slice(i, i + BATCH_LIMIT);
      const batch = writeBatch(db);
      chunk.forEach(id => batch.update(doc(db, 'notifications', id), { isRead: true }));
      try {
        await batch.commit();
      } catch (err) {
        // A notification deleted meanwhile fails the whole batch: save the others one by one.
        if ((err as { code?: string })?.code === 'not-found') {
          const results = await Promise.allSettled(chunk.map(id => updateDoc(doc(db, 'notifications', id), { isRead: true })));
          if (results.every(r => r.status === 'fulfilled' || (r.reason as { code?: string })?.code === 'not-found')) continue;
        }
        handleFirestoreError(err, OperationType.UPDATE, 'notifications');
        return false;
      }
    }
    return true;
  }, []);

  return {
    clients,
    notifications,
    markNotificationAsRead,
    markNotificationsAsRead,
    loading,
    dataSynced,
    error,
    updateClient,
    addClient,
    addTask,
    updateTask,
    completeTasks,
    deleteTask,
    reorderTasks,
    clearClientTasks,
    saveActivation,
    deleteActivation,
    deleteClient,
    seedInitialData,
    deleteAllClientsTasks,
    syncAllClientsTasksMatrix,
    syncSingleClientTasks,
    getPortalLink,
    flushPortalRefreshes,
    schedulePortalRefresh,
    connectionStatus,
  };
};

/**
 * Activity log of ONE client, loaded only while that client is open
 * (previously the full log of every client was downloaded on every page load).
 */
export function useClientActivities(clientId: string | null | undefined) {
  const [activities, setActivities] = useState<ClientActivity[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!clientId) {
      setActivities([]);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    const unsub = onSnapshot(
      collection(db, 'clients', clientId, 'activities'),
      snap => {
        if (!active) return;
        setActivities(snap.docs.map(d => ({ ...(d.data() as ClientActivity), id: d.id })));
        setLoading(false);
      },
      err => {
        handleFirestoreError(err, OperationType.LIST, `clients/${clientId}/activities`);
        if (active) setLoading(false);
      }
    );
    return () => {
      active = false;
      unsub();
    };
  }, [clientId]);

  return { activities, loading };
}
