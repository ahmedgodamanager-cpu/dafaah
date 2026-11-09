import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { auth, db, clearLocalDataCache, waitForSavesToFinish } from '../firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { isSuperAdminUser } from '../utils/userStatusUtils';
import { clearClientsCache } from '../utils/clientsCache';
import { signOutState, tellOtherTabsToReload, reloadWhenAnotherTabSignsOut, reloadForSignOut } from '../utils/sessionState';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  logout: () => Promise<void>;
  currentUserDisplayName: string;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  logout: async () => {},
  currentUserDisplayName: '',
});

const PLACEHOLDER_NAMES = ['مستخدم', 'مستخدم جديد', 'موظف أكونت مانجمنت'];

/** Same normalisation everywhere (legacy roles are mapped to the current role name). */
const buildProfile = (id: string, data: any, firebaseUser: User) => {
  let role = data?.role;
  if (role === 'manager' || role === 'account_manager') {
    role = 'account_manager_head';
  }
  const name = data?.name && !PLACEHOLDER_NAMES.includes(data.name)
    ? data.name
    : (firebaseUser.displayName || firebaseUser.email || 'مستخدم');
  return { id, ...data, role, name };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  /** This tab has had a signed-in user (so a later "no user" means a sign-out). */
  const hadUserRef = useRef(false);

  // Another tab of the app signing out deletes the data copy kept in this browser, which stops this
  // tab's database connection too: this tab then starts again.
  useEffect(() => reloadWhenAnotherTabSignsOut(), []);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;
    // Each auth change gets a new generation; async work from an older one is ignored.
    // (Previously a slow profile read could finish after logout / account switch and
    // re-attach the old account's profile.)
    let generation = 0;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      const myGeneration = ++generation;

      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (!firebaseUser) {
        // Signed out in another tab (it deleted the shared data copy, see logout below): start
        // again, otherwise this tab's stopped database connection would hang the next sign-in.
        // (Offline the other tab keeps the copy and nothing has to restart.)
        if (hadUserRef.current && !signOutState.inProgress && (typeof navigator === 'undefined' || navigator.onLine !== false)) {
          reloadForSignOut();
          return;
        }
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      hadUserRef.current = true;
      // Keep the loading screen up until the profile is known, so a freshly signed-in user
      // never flashes the "account suspended" screen while the profile is still loading.
      setLoading(true);
      setUser(firebaseUser);

      const userDocRef = doc(db, 'users', firebaseUser.uid);
      try {
        const docSnap = await getDoc(userDocRef);
        if (myGeneration !== generation) return;

        if (docSnap.exists()) {
          setProfile(buildProfile(docSnap.id, docSnap.data(), firebaseUser));
        } else {
          // The profile is created in ONE place only (Login.tsx used to create it too, and the two
          // writes overwrote each other). New accounts wait for an admin to activate them.
          const isSuperAdmin = isSuperAdminUser(firebaseUser);
          const newProfile = {
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || firebaseUser.email || 'مستخدم',
            role: isSuperAdmin ? 'admin' : 'pending',
            status: isSuperAdmin ? 'active' : 'pending',
            isSuspended: !isSuperAdmin,
            createdAt: new Date().toISOString(),
          };
          try {
            await setDoc(userDocRef, newProfile);
          } catch (writeErr) {
            console.error('Could not create user profile:', writeErr);
          }
          if (myGeneration !== generation) return;
          setProfile(buildProfile(firebaseUser.uid, newProfile, firebaseUser));
        }
      } catch (e) {
        console.error('Error loading user profile:', e);
        if (myGeneration !== generation) return;
        setProfile(null);
      }

      // Live listener: activation, suspension or a role change by an admin applies immediately.
      // It is attached even when the first read failed, so the screen recovers on its own.
      unsubscribeProfile = onSnapshot(userDocRef, (snapshot) => {
        if (myGeneration !== generation) return;
        if (snapshot.exists()) {
          setProfile(buildProfile(snapshot.id, snapshot.data(), firebaseUser));
        }
      }, (err) => {
        console.error('Profile real-time listener error:', err);
      });

      setLoading(false);
    });

    return () => {
      generation++;
      unsubscribeAuth();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, []);

  const logout = useCallback(async () => {
    signOutState.inProgress = true;
    // Saves still on their way are sent first: after signing out they would be rejected.
    await waitForSavesToFinish();
    try {
      localStorage.removeItem('crm_add_client_draft');
      localStorage.removeItem('crm_client_order');
      clearClientsCache();
      sessionStorage.clear();
    } catch {
      // storage blocked: nothing to remove
    }
    // The account's data kept in this browser is deleted too, BEFORE signing out: deleting it stops
    // the database connection of this tab and of the app's other open tabs, so every tab reloads
    // afterwards (this one on the sign-in screen). Offline a reload would show the browser's
    // "no internet" page, so the copy is then left for the next sign-out.
    const online = typeof navigator === 'undefined' || navigator.onLine !== false;
    if (online) await clearLocalDataCache();
    try {
      await signOut(auth);
    } catch (e) {
      console.error('Logout error', e);
    }
    if (!online) {
      signOutState.inProgress = false;
      return;
    }
    tellOtherTabsToReload();
    window.location.replace(window.location.pathname);
  }, []);

  const currentUserDisplayName = user?.displayName || (profile?.name && !PLACEHOLDER_NAMES.includes(profile.name) ? profile.name : '') || user?.email || '';

  return (
    <AuthContext.Provider value={{ user, profile, loading, logout, currentUserDisplayName }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
