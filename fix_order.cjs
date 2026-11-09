const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// We need to move activeClientsList and filteredClients before alerts.
const activeClientsStr = "  const activeClientsList = useMemo(() => clients.filter(c => !c.isArchived && c.caseStatus !== 'مكتمل' && !c.isLost), [clients]);";

const alertsBlock = `  // Compute Alerts across all clients
  const alerts = useMemo(() => {
    return generateAlertsForClients(activeClientsList);
  }, [activeClientsList]);`;

content = content.replace(activeClientsStr, "");
content = content.replace(alertsBlock, activeClientsStr + "\\n\\n" + alertsBlock);

fs.writeFileSync('src/App.tsx', content);
