const fs = require('fs');
let content = fs.readFileSync('src/components/AppExperience.tsx', 'utf8');

const strToReplace = '    { id: "workload" as const, label: "حِمل الفريق", icon: Users },';
if (content.includes(strToReplace)) {
  content = content.replace(strToReplace + '\n', '');
  content = content.replace(strToReplace + '\r\n', '');
  content = content.replace(strToReplace, ''); // fallback
  fs.writeFileSync('src/components/AppExperience.tsx', content);
  console.log("Removed workload from navigation.");
} else {
  console.log("Could not find workload in navigation array.");
}
