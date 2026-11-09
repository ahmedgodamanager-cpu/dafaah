/**
 * Sign-out coordination between this tab and the app's other open tabs.
 *
 * Signing out deletes the data copy Firestore keeps in this browser (see firebase.ts). Deleting it
 * also stops the database connection of every other open tab of the app, so those tabs must start
 * again: the tab that signs out tells them to reload.
 */

/** True while this tab signs out (the page reloads on purpose; nothing may hold it back). */
export const signOutState = { inProgress: false };

const CHANNEL = 'account-crm-session';

/**
 * Reloads this tab because the account signed out (here or in another tab). Its database
 * connection is stopped by then, so nothing it still waits for can be saved: no "leave page?" question.
 */
export function reloadForSignOut() {
  signOutState.inProgress = true;
  window.location.reload();
}

/** Asks the app's other open tabs to reload. */
export function tellOtherTabsToReload() {
  try {
    const channel = new BroadcastChannel(CHANNEL);
    channel.postMessage('reload');
    channel.close();
  } catch {
    // Old browser without BroadcastChannel: the other tabs reload when they see the sign-out.
  }
}

/** Reloads this tab when another tab of the app signs out. Returns the function that stops listening. */
export function reloadWhenAnotherTabSignsOut(): () => void {
  try {
    const channel = new BroadcastChannel(CHANNEL);
    channel.onmessage = (event) => {
      if (event.data === 'reload' && !signOutState.inProgress) reloadForSignOut();
    };
    return () => channel.close();
  } catch {
    return () => {};
  }
}
