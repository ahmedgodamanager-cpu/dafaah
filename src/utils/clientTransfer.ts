import { collection, doc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Moves a client to another employee — ONE implementation for the Users page and the
 * Operations page. They used to differ: one updated only `createdBy`, so the client card kept
 * showing the previous account manager. Everything is written in one atomic batch
 * (owner fields + notification + activity log entry).
 */
export async function transferClientToUser(params: {
  clientId: string;
  clientName: string;
  targetUserId: string;
  targetUserName: string;
  performedBy: string;
}) {
  const { clientId, clientName, targetUserId, targetUserName, performedBy } = params;
  const now = new Date().toISOString();
  const batch = writeBatch(db);

  batch.update(doc(db, 'clients', clientId), {
    createdBy: targetUserId,
    ownerName: targetUserName,
    assignedTo: targetUserName,
    assignedToName: targetUserName,
    accountManager: targetUserName,
    lastUpdated: now,
  });

  batch.set(doc(collection(db, 'notifications')), {
    userId: targetUserId,
    title: 'تم نقل عميل جديد إليك',
    message: `تم نقل العميل "${clientName}" إلى عهدتك من قبل ${performedBy}.`,
    isRead: false,
    createdAt: now,
    type: 'transfer',
    linkToClientId: clientId,
  });

  const activityId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  batch.set(doc(db, 'clients', clientId, 'activities', activityId), {
    id: activityId,
    action: 'نقل العميل',
    details: `تم نقل العميل إلى ${targetUserName}`,
    createdAt: now,
    performedBy,
  });

  await batch.commit();
}
