import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  setLogLevel,
  terminate,
  clearIndexedDbPersistence,
  waitForPendingWrites,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Silence internal Firestore stream error logging (e.g. quota backoff notices).
// App code still reports real errors through utils/firebaseUtils.
try {
  setLogLevel('silent');
} catch (e) {}

const app = initializeApp(firebaseConfig);

/*
 * The data read from the database is kept in this browser (IndexedDB) and shared by the app's open
 * tabs, which also share one connection. Reloading the page or opening another tab then downloads
 * only what changed since (when the app was open less than about 30 minutes before; after that
 * Firestore counts a full read again), instead of every client and every task each time: each
 * document read counts toward the daily Firestore quota.
 * Where the browser does not allow it (private window, blocked storage) Firestore keeps the data in
 * memory, as before. The kept copy is deleted on sign-out (clearLocalDataCache below).
 */
export const db = initializeFirestore(
  app,
  {
    ignoreUndefinedProperties: true,
    experimentalAutoDetectLongPolling: true,
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  },
  firebaseConfig.firestoreDatabaseId
);
export const auth = getAuth(app);

/** Waits (at most `ms`) until the changes made in this tab have reached the server. */
export async function waitForSavesToFinish(ms = 3000): Promise<void> {
  try {
    await Promise.race([waitForPendingWrites(db), new Promise(resolve => setTimeout(resolve, ms))]);
  } catch {
    // nothing pending / not started: nothing to wait for
  }
}

/**
 * Deletes the data kept in this browser (on sign-out, so the next person on this computer cannot
 * find it). Firestore cannot be used afterwards in this tab, and deleting the copy also stops the
 * database connection of the app's other open tabs: the caller reloads this tab and tells the other
 * tabs to reload (utils/sessionState.ts). Gives up after `ms` so signing out never hangs.
 */
export async function clearLocalDataCache(ms = 5000): Promise<void> {
  const work = (async () => {
    await terminate(db);
    await clearIndexedDbPersistence(db);
  })();
  try {
    await Promise.race([
      work,
      new Promise((_, reject) => setTimeout(() => reject(new Error('clearing the browser copy timed out')), ms)),
    ]);
  } catch (err) {
    console.warn('The data kept in this browser was not deleted', err);
  }
}

// Note: the Realtime Database instance that used to be created here was never used anywhere
// in the app (no presence code reads or writes it). It was removed to avoid connecting to a
// database URL that this Firebase project may not have, and to shrink the bundle.
