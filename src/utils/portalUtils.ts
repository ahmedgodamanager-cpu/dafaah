import { Client, TaskItem } from '../types';

/**
 * Public client portal.
 *
 * The portal used to open the client document itself (`?view=portal&clientId=<id>`), so anyone with
 * the link — or a guessed id (`cli-<creation time>`) — could read every field of the client. Now each
 * client gets a random token, and `portals/{token}` holds ONLY what the portal page shows. Staff keep
 * that copy up to date (see useFirestoreData), and firestore.rules lets anyone read one portal
 * document but never list them or read client documents.
 */

export interface PortalTask {
  id: string;
  taskNumber: string;
  title: string;
  category: TaskItem['category'];
  dueDate: string;
  completed: boolean;
  completedAt?: string;
  notes?: string;
  monthIndex?: number;
}

export interface PortalDoc {
  clientName: string;
  companyName: string;
  contract: string;
  startDate: string;
  durationMonths: number;
  tasks: PortalTask[];
  /** When the client's data last changed (shown on the portal as "آخر تحديث"). */
  lastUpdated?: string;
  /** The client's logo (the small picture saved with the client, see utils/logoImage.ts). */
  logoUrl?: string;
  updatedAt: string;
}

/**
 * Largest portal copy that still carries the logo, in bytes. A Firestore document holds at most
 * 1 MiB: a client with a very long task list keeps a portal that updates, just without the logo.
 */
const MAX_PORTAL_BYTES_WITH_LOGO = 900_000;

/** Only a picture (data:image/… or https://…) is used as a logo. */
const logoOrNothing = (value: unknown): string | undefined =>
  typeof value === 'string' && /^(data:image\/|https:\/\/)/.test(value) ? value : undefined;

/** 32 random hex characters (128 bits): a portal link cannot be guessed. */
export function newPortalToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * The origin to put in shared links. Development domains (ais-dev-) are turned into the public
 * preview domain (ais-pre-), so clients never get a Google Cloud Run 403 page.
 */
function getPublicOrigin(): string {
  let origin = window.location.origin;
  if (origin.includes('ais-dev-')) {
    origin = origin.replace('ais-dev-', 'ais-pre-');
  }
  return origin;
}

/** The link to send to the client. */
export function getPortalUrl(token: string): string {
  if (!token) return '';
  const url = new URL(getPublicOrigin());
  url.searchParams.set('view', 'portal');
  url.searchParams.set('token', token.trim());
  return url.toString();
}

const withoutUndefined = <T extends Record<string, any>>(obj: T): T => {
  const out: Record<string, any> = {};
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined) out[k] = v;
  });
  return out as T;
};

/** The portal copy of a client: only what the portal page shows. */
export function buildPortalSnapshot(client: Client): PortalDoc {
  const snapshot: PortalDoc = {
    clientName: client.clientName || '',
    companyName: String(client.companyName || ''),
    contract: client.contract || '',
    startDate: client.startDate || '',
    durationMonths: Number(client.durationMonths) || 1,
    tasks: (client.tasks || [])
      .filter(t => t && typeof t === 'object' && t.id)
      .map(t => withoutUndefined<PortalTask>({
        id: t.id,
        taskNumber: t.taskNumber || '',
        title: t.title || '',
        category: t.category,
        dueDate: t.dueDate || '',
        completed: !!t.completed,
        completedAt: t.completedAt || undefined,
        notes: t.notes || undefined,
        monthIndex: typeof t.monthIndex === 'number' ? t.monthIndex : undefined,
      })),
    ...(client.lastUpdated ? { lastUpdated: client.lastUpdated } : {}),
    updatedAt: new Date().toISOString(),
  };
  const logo = logoOrNothing(client.logoUrl);
  if (logo && new TextEncoder().encode(JSON.stringify(snapshot)).length + logo.length <= MAX_PORTAL_BYTES_WITH_LOGO) {
    snapshot.logoUrl = logo;
  }
  return snapshot;
}

const text = (value: unknown): string => (typeof value === 'string' ? value : value == null ? '' : String(value));

/** Turns a portal document into the shape the portal page renders. */
export function portalDocToClient(token: string, data: any): Client {
  const tasks: TaskItem[] = Array.isArray(data?.tasks)
    ? data.tasks
        .filter((t: any) => t && typeof t === 'object' && t.id)
        .map((t: any) => ({
          id: text(t.id),
          taskNumber: text(t.taskNumber),
          title: text(t.title),
          category: t.category || 'account_management',
          startDate: '',
          dueDate: text(t.dueDate),
          completed: t.completed === true,
          completedAt: t.completedAt ? text(t.completedAt) : undefined,
          notes: t.notes ? text(t.notes) : undefined,
          monthIndex: typeof t.monthIndex === 'number' ? t.monthIndex : undefined,
        }))
    : [];
  const duration = Number(data?.durationMonths);
  return {
    // The real client id is never part of the portal.
    id: '',
    portalToken: token,
    code: '',
    clientName: text(data?.clientName),
    clientNumber: '',
    groupName: '',
    companyName: text(data?.companyName),
    contract: text(data?.contract),
    startDate: text(data?.startDate),
    durationMonths: Number.isFinite(duration) && duration > 0 ? duration : 1,
    endDate: '',
    caseStatus: 'نشط',
    createdAt: '',
    // Older portal copies have no lastUpdated: the time the copy was written is close enough.
    lastUpdated: text(data?.lastUpdated) || text(data?.updatedAt) || undefined,
    logoUrl: logoOrNothing(data?.logoUrl),
    tasks,
  };
}
