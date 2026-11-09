const fs = require('fs');
let content = fs.readFileSync('src/components/ClientDetailPage.tsx', 'utf8');

content = content.replace("  StickyNote\n  Download", "  StickyNote,\n  Download");

fs.writeFileSync('src/components/ClientDetailPage.tsx', content);
