const fs = require('fs');
let content = fs.readFileSync('src/components/AppExperience.tsx', 'utf8');

content = content.replace(
  "...(props.userRole === 'admin' ? [{ id: \"sla\" as const, label: \"أداء الـ SLA\", icon: Gauge }] : [])",
  "...((props.userRole === 'admin' || props.userRole === 'manager') ? [{ id: \"sla\" as const, label: \"أداء الـ SLA\", icon: Gauge }] : [])"
);

fs.writeFileSync('src/components/AppExperience.tsx', content);
