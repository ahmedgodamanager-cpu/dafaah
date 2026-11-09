const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  "await updateClient(client.id, { isArchived: !client.isArchived });",
  "await updateClient({ ...client, isArchived: !client.isArchived });"
);

fs.writeFileSync('src/App.tsx', content);
