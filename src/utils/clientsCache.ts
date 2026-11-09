/**
 * Offline cache of the clients list (shown instantly on the next visit while Firestore loads).
 * Kept in its own module so both AuthContext (clears it on logout) and the data hook can use it
 * without importing each other.
 */
export const CLIENTS_CACHE_KEY = 'crm_offline_clients_cache_v3';

// The old cache had no owner, so another account on the same browser could see it.
export const LEGACY_CACHE_KEYS = ['crm_offline_clients_cache_v2'];

/** Removes the offline cache (called on logout so the next account on this browser starts clean). */
export function clearClientsCache() {
  try {
    localStorage.removeItem(CLIENTS_CACHE_KEY);
    LEGACY_CACHE_KEYS.forEach(k => localStorage.removeItem(k));
  } catch {}
}
