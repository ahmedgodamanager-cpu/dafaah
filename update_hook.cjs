const fs = require('fs');
let content = fs.readFileSync('src/hooks/useFirestoreData.ts', 'utf8');

const oldFn = `  const updateClient = async (updatedClient: Client) => {
    if (!user) return;
    try {
      const { tasks, dailyActivations, activities, ...clientCore } = updatedClient;
      clientCore.lastUpdated = new Date().toISOString();
      await setDoc(doc(db, 'clients', updatedClient.id), clientCore, { merge: true });
      await logActivity(updatedClient.id, 'تعديل بيانات العميل', 'تم تحديث البيانات الأساسية للعميل', updatedClient.createdBy);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, \`clients/\${updatedClient.id}\`);
    }
  };`;

const newFn = `  const updateClient = async (updatedClient: Client) => {
    if (!user) return;
    try {
      // Auto-archive if completed or lost
      if (updatedClient.caseStatus === 'مكتمل' || updatedClient.isLost) {
        updatedClient.isArchived = true;
      }
      
      const { tasks, dailyActivations, activities, ...clientCore } = updatedClient;
      clientCore.lastUpdated = new Date().toISOString();
      await setDoc(doc(db, 'clients', updatedClient.id), clientCore, { merge: true });
      await logActivity(updatedClient.id, 'تعديل بيانات العميل', 'تم تحديث البيانات الأساسية للعميل', updatedClient.createdBy);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, \`clients/\${updatedClient.id}\`);
    }
  };`;

content = content.replace(oldFn, newFn);
fs.writeFileSync('src/hooks/useFirestoreData.ts', content);
