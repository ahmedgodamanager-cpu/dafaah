const fs = require('fs');
let code = fs.readFileSync('src/hooks/useFirestoreData.ts', 'utf8');

const badLogic = `        setClientsMap((curr) => {
          let next = curr;
          pendingUpdatesRef.current.forEach(fn => {
            next = fn(next);
          });
          pendingUpdatesRef.current = [];
          return next;
        });`;

const goodLogic = `        const updatesToApply = [...pendingUpdatesRef.current];
        pendingUpdatesRef.current = [];
        setClientsMap((curr) => {
          let next = curr;
          updatesToApply.forEach(fn => {
            next = fn(next);
          });
          return next;
        });`;

code = code.replace(badLogic, goodLogic);
fs.writeFileSync('src/hooks/useFirestoreData.ts', code);
