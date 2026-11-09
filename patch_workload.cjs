const fs = require('fs');
let content = fs.readFileSync('src/components/WorkloadDashboardView.tsx', 'utf8');

content = content.replace(
  "const isClientCreator = profile?.role === 'admin' || client.createdBy === profile?.name || client.createdBy === profile?.email;",
  "const isClientCreator = profile?.role === 'admin' || profile?.role === 'manager' || client.createdBy === profile?.name || client.createdBy === profile?.email;"
);

content = content.replace(
  "{profile?.role === 'admin' ? 'مراقبة حِمل الفريق (Workload)' : 'حِمل العمل الخاص بك (Your Workload)'}",
  "{(profile?.role === 'admin' || profile?.role === 'manager') ? 'مراقبة حِمل الفريق (Workload)' : 'حِمل العمل الخاص بك (Your Workload)'}"
);

content = content.replace(
  "{profile?.role === 'admin' ",
  "{(profile?.role === 'admin' || profile?.role === 'manager') "
);

fs.writeFileSync('src/components/WorkloadDashboardView.tsx', content);
