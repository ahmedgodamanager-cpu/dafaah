const fs = require('fs');
let content = fs.readFileSync('src/components/StatsOverview.tsx', 'utf8');

if (!content.includes('WorkloadDashboardView')) {
  content = content.replace(
    "import { SectionTasksModal } from './SectionTasksModal';", 
    "import { SectionTasksModal } from './SectionTasksModal';\nimport { WorkloadDashboardView } from './WorkloadDashboardView';"
  );

  const lastDivIndex = content.lastIndexOf('</div>');
  if (lastDivIndex !== -1) {
    content = content.slice(0, lastDivIndex) + `\n      <WorkloadDashboardView clients={clients} />\n` + content.slice(lastDivIndex);
    fs.writeFileSync('src/components/StatsOverview.tsx', content);
    console.log("WorkloadDashboardView added to StatsOverview.");
  } else {
    console.log("Could not find the last div.");
  }
} else {
  console.log("Already added.");
}
