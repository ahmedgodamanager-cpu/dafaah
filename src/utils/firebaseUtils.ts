import { toast } from 'react-hot-toast';
import { auth } from '../firebase';
import { logError } from './errorLog';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

const errorText = (error: unknown): string => (error instanceof Error ? error.message : String(error ?? ''));

/** Firestore quota / throttling errors (free-tier daily limits, backoff). */
export function isQuotaError(error: unknown): boolean {
  const errCode = (error as any)?.code || '';
  const errMsg = errorText(error);
  return (
    errCode === 'resource-exhausted' ||
    errMsg.includes('resource-exhausted') ||
    errMsg.includes('Quota') ||
    errMsg.includes('quota') ||
    errMsg.includes('backoff delay') ||
    errMsg.includes('queued writes')
  );
}

/** Rejected by firestore.rules. */
export function isPermissionError(error: unknown): boolean {
  const errCode = (error as any)?.code || '';
  return errCode === 'permission-denied' || errorText(error).includes('Missing or insufficient permissions');
}

/** The document being updated no longer exists (e.g. deleted by another user). */
export function isNotFoundError(error: unknown): boolean {
  const errCode = (error as any)?.code || '';
  return errCode === 'not-found' || errorText(error).includes('No document to update');
}

/**
 * Tells the user that a save did NOT reach the database.
 * Previously these failures were only logged to the console, so the screen kept showing
 * a change that disappeared after a refresh.
 */
export function notifyWriteError(error: unknown) {
  if (isQuotaError(error)) {
    toast('تعذّر الحفظ على السيرفر حالياً بسبب تجاوز حصة قاعدة البيانات. التعديل ظاهر عندك فقط وقد يضيع لو قفلت الصفحة.', {
      id: 'firestore-quota-error',
      icon: '⚠️',
      duration: 7000,
    });
    return;
  }
  if (isPermissionError(error)) {
    toast.error('ليس لديك صلاحية لتنفيذ هذا الإجراء، ولم يتم حفظ التعديل.', { id: 'firestore-permission-error' });
    return;
  }
  if (errorText(error).includes('clients-not-loaded')) {
    toast.error('بيانات العملاء لم تُحمّل من السيرفر بعد (الاتصال ضعيف أو مقطوع)، ولم يتم حفظ التعديل. حاول مرة أخرى بعد قليل.', { id: 'clients-not-loaded' });
    return;
  }
  if (errorText(error).includes('tasks-not-loaded')) {
    toast.error('مهام هذا العميل لم تُحمّل من السيرفر بعد (الاتصال ضعيف أو مقطوع)، ولم يتم حفظ التعديل. حاول مرة أخرى بعد قليل.', { id: 'tasks-not-loaded' });
    return;
  }
  toast.error('تعذّر حفظ التعديل، يرجى المحاولة مرة أخرى.', { id: 'firestore-write-error' });
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  // Kept in the browser's error log (Tools → "نسخ سجل الأخطاء"), quota errors included.
  logError('firestore', error, `${operationType} ${path ?? ''}`);
  if (isQuotaError(error)) {
    console.warn(`[Firestore Quota Throttled] (${operationType} at ${path}): Backend quota reached.`);
    return;
  }

  const errInfo: FirestoreErrorInfo = {
    error: errorText(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}
