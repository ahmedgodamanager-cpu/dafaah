/**
 * The last errors of this browser, kept in localStorage so a problem that blanks or breaks a screen
 * can still be reported after a reload: Tools → "نسخ سجل الأخطاء", or the button on the error card.
 * Nothing leaves the browser by itself; the user copies the text and sends it.
 */

const KEY = 'crm_error_log_v1';
const MAX_ENTRIES = 20;
const MAX_DETAIL = 1500;

export type ErrorKind = 'render' | 'error' | 'promise' | 'firestore' | 'portal';

export interface ErrorLogEntry {
  /** Last time it happened. */
  at: string;
  kind: ErrorKind;
  message: string;
  detail?: string;
  /** The screen it happened on (view only, never a portal link's token). */
  page: string;
  /** How many times it happened (the same error is kept once). */
  count: number;
}

// Browser noise that says nothing about the app.
const IGNORED = [/ResizeObserver loop/i, /^Script error\.?$/i];

const read = (): ErrorLogEntry[] => {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
};

const describe = (error: unknown): { message: string; stack: string } => {
  if (error instanceof Error) {
    // Firebase errors carry their reason in `code` (e.g. permission-denied, resource-exhausted).
    const code = (error as { code?: unknown }).code;
    return { message: `${error.name}${code ? ` (${String(code)})` : ''}: ${error.message}`, stack: error.stack || '' };
  }
  if (error && typeof error === 'object') {
    const e = error as { code?: unknown; message?: unknown };
    if (e.message || e.code) return { message: [e.code, e.message].filter(Boolean).map(String).join(': '), stack: '' };
  }
  return { message: String(error ?? ''), stack: '' };
};

const currentPage = () => {
  try {
    const view = new URLSearchParams(window.location.search).get('view');
    return window.location.pathname + (view ? `?view=${view}` : '');
  } catch {
    return '';
  }
};

export function logError(kind: ErrorKind, error: unknown, detail?: string) {
  try {
    const { message: fullMessage, stack } = describe(error);
    const message = fullMessage.trim().slice(0, 500);
    if (!message || IGNORED.some(r => r.test(message))) return;
    // Errors thrown by browser extensions are not the app's.
    if (/chrome-extension:|moz-extension:/.test(stack)) return;
    const list = read();
    const same = list.findIndex(e => e.kind === kind && e.message === message);
    const previous = same >= 0 ? list.splice(same, 1)[0] : null;
    list.push({
      at: new Date().toISOString(),
      kind,
      message,
      // The first trace of an error is kept (a screen's crash comes with the component trace).
      detail: previous?.detail || [stack, detail].filter(Boolean).join('\n').slice(0, MAX_DETAIL) || undefined,
      page: currentPage(),
      count: (previous?.count || 0) + 1,
    });
    localStorage.setItem(KEY, JSON.stringify(list.slice(-MAX_ENTRIES)));
  } catch {
    // storage blocked or full: nothing to do
  }
}

/** Records uncaught errors and rejected promises from now on (call once, before the app starts). */
export function installErrorLog() {
  if (typeof window === 'undefined') return;
  window.addEventListener('error', event => logError('error', event.error || event.message));
  window.addEventListener('unhandledrejection', event => logError('promise', event.reason));
}

export function hasLoggedErrors(): boolean {
  return read().length > 0;
}

/** The log as text to paste in a message (newest first). */
export function errorLogText(): string {
  const list = read().reverse();
  const head = [
    'Account CRM — سجل الأخطاء',
    `وقت النسخ: ${new Date().toISOString()}`,
    `المتصفح: ${typeof navigator !== 'undefined' ? navigator.userAgent : ''}`,
  ];
  if (list.length === 0) return [...head, '', 'لا توجد أخطاء مسجلة.'].join('\n');
  const body = list.map((e, i) =>
    [`[${i + 1}] ${e.at} · ${e.kind}${e.count > 1 ? ` · ${e.count} مرات` : ''} · ${e.page}`, e.message, e.detail]
      .filter(Boolean)
      .join('\n')
  );
  return [...head, '', ...body].join('\n\n');
}

/** Copies the log; false when the browser refused (the caller then shows the text to copy by hand). */
export async function copyErrorLog(): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(errorLogText());
    return true;
  } catch {
    return false;
  }
}
