const fs = require('fs');
let code = fs.readFileSync('src/hooks/useFirestoreData.ts', 'utf8');

const oldLogic = `      // Auto-activate client if the brief task is completed
      if (updatedTask.completed && updatedTask.category === 'account_management' && (updatedTask.title.includes('بريف') || updatedTask.title.toLowerCase().includes('brief'))) {
        const client = clients.find(c => c.id === clientId);
        if (client && client.caseStatus === 'جديد') {
          const updatedClient = { ...client, caseStatus: 'نشط' as const };
          await updateClient(updatedClient);
          await logActivity(clientId, 'تحديث تلقائي', 'تم تحويل حالة العميل إلى نشط تلقائياً بعد استكمال بريف الأكونت مانجمنت', updatedTask.createdBy);
        }
      }`;

const newLogic = `      // Auto-activate client if the brief task is completed
      if (updatedTask.completed && (updatedTask.title.includes('بريف') || updatedTask.title.toLowerCase().includes('brief'))) {
        const client = clients.find(c => c.id === clientId);
        if (client && client.caseStatus === 'جديد') {
          const updatedClient = { ...client, caseStatus: 'نشط' };
          await updateClient(updatedClient);
          await logActivity(clientId, 'تحديث تلقائي', 'تم تحويل حالة العميل إلى نشط تلقائياً بعد استكمال البريف', updatedTask.createdBy);
        }
      }`;

if (code.includes(oldLogic)) {
    code = code.replace(oldLogic, newLogic);
    fs.writeFileSync('src/hooks/useFirestoreData.ts', code);
    console.log("Success");
} else {
    console.log("Could not find block in useFirestoreData.ts");
}
