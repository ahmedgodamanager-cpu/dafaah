const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/onEdit=\{\(cli\) => setEditingClient\(cli\)\}/g, "onEdit={handleEditClient}");

fs.writeFileSync('src/App.tsx', content);
