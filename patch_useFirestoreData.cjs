const fs = require('fs');
let code = fs.readFileSync('src/hooks/useFirestoreData.ts', 'utf8');

const oldClientMerge = `          } else {
            const clientData = change.doc.data() as Client;
            clientData.caseStatus = evaluateClientCaseStatus(clientData);
            
            // Merge existing tasks and activations if available
            next[clientId] = {
              ...clientData,
              id: clientId,
              tasks: next[clientId]?.tasks || [],
              dailyActivations: next[clientId]?.dailyActivations || [],
              activities: next[clientId]?.activities || []
            };`;

const newClientMerge = `          } else {
            const clientData = change.doc.data() as Client;
            
            // Merge existing tasks and activations if available
            const mergedClient = {
              ...clientData,
              id: clientId,
              tasks: next[clientId]?.tasks || [],
              dailyActivations: next[clientId]?.dailyActivations || [],
              activities: next[clientId]?.activities || []
            };
            
            mergedClient.caseStatus = evaluateClientCaseStatus(mergedClient);
            next[clientId] = mergedClient;`;

code = code.replace(oldClientMerge, newClientMerge);

const oldTaskUnsub = `            if (change.type === 'added') {
              subUnsubs.current[clientId] = [];
              
              const taskUnsub = onSnapshot(collection(db, 'clients', clientId, 'tasks'), (tasksSnap) => {
                const tasks = tasksSnap.docs.map(t => t.data() as TaskItem);
                batchUpdateClientsMap(curr => {
                  if (!curr[clientId]) return curr;
                  return {
                    ...curr,
                    [clientId]: { ...curr[clientId], tasks }
                  };
                });
              }, (err) => console.error("Tasks error", err));`;

const newTaskUnsub = `            if (change.type === 'added') {
              subUnsubs.current[clientId] = [];
              
              const taskUnsub = onSnapshot(collection(db, 'clients', clientId, 'tasks'), (tasksSnap) => {
                const tasks = tasksSnap.docs.map(t => t.data() as TaskItem);
                batchUpdateClientsMap(curr => {
                  if (!curr[clientId]) return curr;
                  const mergedClient = { ...curr[clientId], tasks };
                  mergedClient.caseStatus = evaluateClientCaseStatus(mergedClient);
                  return {
                    ...curr,
                    [clientId]: mergedClient
                  };
                });
              }, (err) => console.error("Tasks error", err));`;

code = code.replace(oldTaskUnsub, newTaskUnsub);

fs.writeFileSync('src/hooks/useFirestoreData.ts', code);
console.log("Success");
