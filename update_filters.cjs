const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const oldActive = "const activeClientsList = useMemo(() => clients.filter(c => !c.isArchived), [clients]);";
const newActive = "const activeClientsList = useMemo(() => clients.filter(c => !c.isArchived && c.caseStatus !== 'مكتمل' && !c.isLost), [clients]);";

content = content.replace(oldActive, newActive);

const oldArchiveCheck = `      // Archive filter
      if (activeView === 'archive') {
        if (!client.isArchived) return false;
      } else {
        if (client.isArchived) return false;
      }`;

const newArchiveCheck = `      // Archive filter
      if (activeView === 'archive') {
        if (!client.isArchived && client.caseStatus !== 'مكتمل' && !client.isLost) return false;
      } else {
        if (client.isArchived || client.caseStatus === 'مكتمل' || client.isLost) return false;
      }`;

content = content.replace(oldArchiveCheck, newArchiveCheck);

fs.writeFileSync('src/App.tsx', content);
