import { Client, TaskItem } from '../types';
import { syncClientTasksWithNewMatrix } from '../data/initialClients';
import { parseDate } from './dateUtils';
import { isMatrixTaskNumber, taskKey } from './taskKeys';

export { isMatrixTaskNumber, taskKey } from './taskKeys';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  Where do a client's tasks live?
 * ─────────────────────────────────────────────────────────────────────────────
 * Older versions of the app saved tasks in TWO places at once:
 *   1. the `clients/{id}/tasks` subcollection (one document per task), and
 *   2. an embedded `tasks` array inside the client document.
 * Different screens wrote to different places, and the listeners showed whichever
 * snapshot arrived last. That is why completed tasks "un-completed" themselves,
 * tasks vanished after one was ticked, and re-scheduling did not survive a refresh.
 *
 * From now on the SUBCOLLECTION is the only source of truth. A client document that
 * carries `tasksMaterialized: true` has a complete task list in the subcollection.
 * Older ("legacy") clients are resolved with the rules below, which reproduce what the
 * old app showed after a page refresh while repairing the known damage, and they are
 * written to the subcollection in full the first time any of their tasks is changed.
 */

export type RawTaskDoc = Record<string, any> & { id: string };

const asString = (v: unknown): string =>
  typeof v === 'string' ? v : v === null || v === undefined ? '' : String(v);

/** Removes undefined / null / empty-string values so they do not hide real values when merging. */
export function definedOnly<T extends Record<string, any>>(obj: T): Partial<T> {
  const out: Record<string, any> = {};
  Object.keys(obj || {}).forEach(key => {
    const value = (obj as any)[key];
    if (value !== undefined && value !== null && value !== '') out[key] = value;
  });
  return out as Partial<T>;
}

/** Makes a task safe to render: every required field exists and has the right type. */
export function normalizeTask(raw: any, fallbackId: string): TaskItem {
  const data = raw && typeof raw === 'object' ? raw : {};
  const task: TaskItem = {
    ...data,
    id: asString(data.id) || fallbackId,
    taskNumber: asString(data.taskNumber),
    title: asString(data.title),
    category: data.category || 'account_management',
    startDate: asString(data.startDate),
    dueDate: asString(data.dueDate),
    completed: data.completed === true,
  };
  if (data.comments !== undefined && !Array.isArray(data.comments)) {
    task.comments = [];
  }
  return task;
}

/** A task document with neither a title nor a due date is debris left by old partial writes. */
export function isGarbageTask(task: { title?: string; dueDate?: string }): boolean {
  return !asString(task.title).trim() && !asString(task.dueDate).trim();
}

/** A raw task document that is missing core fields (written by an old partial `merge` update). */
export function isIncompleteTaskDoc(raw: Record<string, any> | undefined): boolean {
  if (!raw) return true;
  return !raw.title || !raw.dueDate || typeof raw.completed !== 'boolean';
}

/**
 * Normalizes a client document. Returns null for "zombie" documents that only contain
 * bookkeeping fields (e.g. `lastUpdated` written to an already-deleted client).
 */
export function normalizeClientDoc(raw: any, id: string): Client | null {
  if (!raw || typeof raw !== 'object') return null;
  const clientName = asString(raw.clientName);
  const code = asString(raw.code);
  if (!clientName.trim() && !code.trim()) return null;

  const duration = Number(raw.durationMonths);
  return {
    ...raw,
    id,
    code,
    clientName,
    clientNumber: asString(raw.clientNumber),
    groupName: asString(raw.groupName),
    contract: asString(raw.contract),
    startDate: asString(raw.startDate),
    endDate: asString(raw.endDate),
    durationMonths: Number.isFinite(duration) && duration > 0 ? duration : 1,
    caseStatus: raw.caseStatus || 'جديد',
    createdAt: asString(raw.createdAt),
    tasks: [],
    dailyActivations: [],
    activities: [],
  } as Client;
}

const dueTime = (t: TaskItem): number => {
  const d = parseDate(t.dueDate);
  return d ? d.getTime() : Number.MAX_SAFE_INTEGER;
};

/** Stable default order: by due date, then by task number / title. */
export function sortTasksByDueDate(tasks: TaskItem[]): TaskItem[] {
  return [...tasks].sort((a, b) => {
    const diff = dueTime(a) - dueTime(b);
    if (diff !== 0) return diff;
    // numeric: "W4-SEO-01-6" comes before "W4-SEO-01-10".
    return (a.taskNumber || a.title || a.id).localeCompare(b.taskNumber || b.title || b.id, undefined, { numeric: true });
  });
}

export interface ResolveTasksInput {
  /** Normalized client (its schedule fields are used to build the default task matrix). */
  client: Client;
  /** Raw documents of `clients/{id}/tasks` (with `id` = document id). `undefined` = not loaded yet. */
  subDocs?: RawTaskDoc[];
  /** Raw embedded `tasks` array stored on the client document by old app versions. */
  embedded?: any[];
  /** `tasksMaterialized` marker of the client document. */
  materialized?: boolean;
  /** Tasks currently on screen (used only while the subcollection is still loading). */
  previousTasks?: TaskItem[];
}

/**
 * Old embedded arrays sometimes hold the same id twice. The same task saved twice keeps its
 * completed copy; a DIFFERENT task that reused the id keeps its data under a new id (otherwise
 * one of them would be dropped when the list is saved).
 */
function dedupeIds(tasks: TaskItem[]): TaskItem[] {
  const indexById = new Map<string, number>();
  const out: TaskItem[] = [];
  tasks.forEach(t => {
    const at = indexById.get(t.id);
    if (at === undefined) {
      indexById.set(t.id, out.length);
      out.push(t);
      return;
    }
    const other = out[at];
    if (taskKey(other) === taskKey(t)) {
      if (!other.completed && t.completed) out[at] = t;
      return;
    }
    let n = 1;
    let id = `${t.id}-dup`;
    while (indexById.has(id)) id = `${t.id}-dup${++n}`;
    indexById.set(id, out.length);
    out.push({ ...t, id });
  });
  return out;
}

/**
 * Returns the one task list that every screen should show for a client.
 */
export function resolveClientTasks({ client, subDocs, embedded, materialized, previousTasks }: ResolveTasksInput): TaskItem[] {
  const embeddedTasks = dedupeIds(
    (Array.isArray(embedded) ? embedded : [])
      .filter(t => t && typeof t === 'object')
      .map((t, i) => normalizeTask(t, `${client.id}-legacy-${i}`))
      .filter(t => !isGarbageTask(t))
  );

  let matrixCache: TaskItem[] | null = null;
  const defaultMatrix = (): TaskItem[] => {
    if (!matrixCache) {
      matrixCache = syncClientTasksWithNewMatrix({ ...client, tasks: [] });
    }
    return matrixCache;
  };

  // 1. Subcollection not loaded yet: keep what is on screen to avoid flicker.
  if (subDocs === undefined) {
    if (previousTasks && previousTasks.length > 0) return previousTasks;
    if (!materialized && embeddedTasks.length > 0) return sortTasksByDueDate(embeddedTasks);
    return defaultMatrix();
  }

  // 2. Fully migrated client: the subcollection is the complete truth.
  if (materialized) {
    const tasks = subDocs.map(raw => normalizeTask(raw, raw.id)).filter(t => !isGarbageTask(t));
    // An emptied task list falls back to the default matrix (same behaviour as before).
    return tasks.length > 0 ? sortTasksByDueDate(tasks) : defaultMatrix();
  }

  // 3. Legacy client without task documents: embedded array, otherwise the default matrix.
  if (subDocs.length === 0) {
    return embeddedTasks.length > 0 ? sortTasksByDueDate(embeddedTasks) : defaultMatrix();
  }

  // 4. Legacy client with task documents.
  const baseTasks = embeddedTasks.length > 0 ? embeddedTasks : defaultMatrix();
  const baseById = new Map(baseTasks.map(t => [t.id, t]));
  const baseByKey = new Map(baseTasks.map(t => [taskKey(t), t]));

  // Repair documents that were created by partial writes (e.g. only `{ id, order }`).
  const subTasks = subDocs
    .map(raw => {
      if (isIncompleteTaskDoc(raw)) {
        const source = baseById.get(raw.id);
        if (source) return normalizeTask({ ...source, ...definedOnly(raw) }, raw.id);
      }
      return normalizeTask(raw, raw.id);
    })
    .filter(t => !isGarbageTask(t));

  // Which base task does each document stand for? Same id first — but only when the document is
  // the same task (same number or title), because a matrix id is a position and can point to another
  // task after a contract or matrix change — then same number + title, then same task number (a
  // renamed matrix task). Repaired partial documents carry the base task's own number and title.
  const matchedBaseIds = new Map<string, TaskItem>();
  const unmatchedById: TaskItem[] = [];
  subTasks.forEach(t => {
    const base = baseById.get(t.id);
    const sameTask = !!base && (
      (!!t.taskNumber && t.taskNumber === base.taskNumber) ||
      (!!t.title && t.title.trim() === (base.title || '').trim())
    );
    if (base && sameTask && !matchedBaseIds.has(base.id)) matchedBaseIds.set(base.id, t);
    else unmatchedById.push(t);
  });
  const baseByNumber = new Map<string, TaskItem>();
  baseTasks.forEach(b => {
    const num = (b.taskNumber || '').trim();
    if (num && !baseByNumber.has(num)) baseByNumber.set(num, b);
  });
  const unmatched: TaskItem[] = [];
  unmatchedById.forEach(t => {
    const byKey = baseByKey.get(taskKey(t));
    const byNumber = isMatrixTaskNumber(t.taskNumber) ? baseByNumber.get((t.taskNumber || '').trim()) : undefined;
    const base = [byKey, byNumber].find(b => b && !matchedBaseIds.has(b.id));
    if (base) matchedBaseIds.set(base.id, t);
    else unmatched.push(t);
  });

  // An embedded array is real saved data and the first save removes it, so none of it may be
  // dropped: the documents are applied on top of it and documents that match nothing are added.
  // (Choosing "documents only" when there were many of them deleted every task that had no
  // document of its own — e.g. after many ticks, or ticks plus hand-added tasks.)
  if (embeddedTasks.length > 0) {
    const merged = baseTasks.map(base => matchedBaseIds.get(base.id) || base);
    return sortTasksByDueDate([...merged, ...unmatched]);
  }

  // No embedded array: the base is the generated default matrix (nothing saved).
  // Known old bug: ticking one task of a client whose tasks were never saved wrote only that
  // single task, so the client "lost" all the others. When the documents are a small subset
  // of the matrix, they are overrides of it — show the full list with them applied. Otherwise the
  // documents are the client's own saved list (e.g. written when the client was created).
  const isSparseOverride =
    subTasks.length <= baseTasks.length / 2 && matchedBaseIds.size >= subTasks.length / 2;

  if (!isSparseOverride) {
    return sortTasksByDueDate(subTasks);
  }

  const merged = baseTasks.map(base => matchedBaseIds.get(base.id) || base);
  return sortTasksByDueDate([...merged, ...unmatched]);
}
