import { User } from 'firebase/auth';

/**
 * Super Admin email that can never be locked out.
 * Must stay identical to the e-mail used in firestore.rules (isSuperAdmin()).
 */
export const SUPER_ADMIN_EMAIL = 'ahmedgoda.manager@gmail.com';

/**
 * Roles that count as active staff. Must stay identical to isActiveStaff() in firestore.rules,
 * otherwise the UI lets someone in whose every write is rejected by the database (or the opposite).
 */
const ACTIVE_ROLES = [
  'admin',
  'account_manager_head',
  'manager',
  'account_manager',
  'member',
  'user'
];

/** Roles that can see and manage every client (department heads + admins). */
const MANAGER_ROLES = ['admin', 'account_manager_head', 'manager', 'account_manager'];

const normalizeRole = (profile: any): string => String(profile?.role || '').trim().toLowerCase();

export function isSuperAdminUser(user: Pick<User, 'email'> & Partial<Pick<User, 'emailVerified'>> | null | undefined): boolean {
  // Same rule as firestore.rules: the address must be verified (always true for Google sign-in).
  return !!user && user.email === SUPER_ADMIN_EMAIL && user.emailVerified !== false;
}

/** System admin (matches isAdmin() in firestore.rules). */
export function isAdminUser(user: Pick<User, 'email'> | null | undefined, profile: any): boolean {
  if (isSuperAdminUser(user)) return true;
  return normalizeRole(profile) === 'admin';
}

/** Admin or account-management head: can see all clients, SLA and escalation tools. */
export function isManagerUser(user: Pick<User, 'email'> | null | undefined, profile: any): boolean {
  if (isSuperAdminUser(user)) return true;
  return MANAGER_ROLES.includes(normalizeRole(profile));
}

/**
 * Checks if a user is suspended, disabled, pending, or inactive.
 * Thoroughly inspects role, status, accountStatus, userStatus, and boolean flags.
 */
export function isUserSuspended(profile: any, user: User | null): boolean {
  if (!user) return false;

  // Super admin always has access
  if (isSuperAdminUser(user)) return false;

  // If no profile object exists yet, they cannot pass the access gate
  if (!profile) return true;

  const role = normalizeRole(profile);
  const status = String(profile.status || '').trim().toLowerCase();
  const userStatus = String(profile.userStatus || '').trim().toLowerCase();
  const accountStatus = String(profile.accountStatus || '').trim().toLowerCase();

  // Known suspended/disabled/pending values (English and Arabic)
  const suspendedStrings = [
    'pending',
    'suspended',
    'disabled',
    'inactive',
    'stopped',
    'blocked',
    'توقف',
    'إيقاف',
    'معطل',
    'موقوف',
    'قيد الانتظار',
    'معلق',
    'غير نشط'
  ];

  if (suspendedStrings.includes(role)) return true;
  if (suspendedStrings.includes(status)) return true;
  if (suspendedStrings.includes(userStatus)) return true;
  if (suspendedStrings.includes(accountStatus)) return true;

  // Boolean flags
  if (profile.isSuspended === true) return true;
  if (profile.disabled === true) return true;
  if (profile.isActive === false) return true;
  if (profile.active === false) return true;

  // A missing or unrecognized role is not an active staff role in firestore.rules either,
  // so every write would be rejected. Keep the user at the access gate instead.
  if (!ACTIVE_ROLES.includes(role)) {
    return true;
  }

  return false;
}
