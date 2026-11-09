const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  "return generateAlertsForClients(clients);\n  }, [clients]);",
  "return generateAlertsForClients(activeClientsList);\n  }, [activeClientsList]);"
);

fs.writeFileSync('src/App.tsx', content);
