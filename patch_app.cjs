const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  "profile?.role === 'admin'",
  "(profile?.role === 'admin' || profile?.role === 'manager')"
);
// wait, replacing all globally might break or fix what we want.
// Let's do it carefully.
content = content.replace(
  "activeView === 'sla' && profile?.role === 'admin'",
  "activeView === 'sla' && (profile?.role === 'admin' || profile?.role === 'manager')"
);
content = content.replace(
  "profile?.role === 'admin' && activeView !== 'archive'",
  "(profile?.role === 'admin' || profile?.role === 'manager') && activeView !== 'archive'"
);

fs.writeFileSync('src/App.tsx', content);
