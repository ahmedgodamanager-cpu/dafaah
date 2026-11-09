const fs = require('fs');
const files = [
  'src/components/AddActivationModal.tsx',
  'src/components/DelayedTasksModal.tsx',
  'src/components/DepartmentTasksModal.tsx',
  'src/components/SectionTasksModal.tsx',
  'src/components/UpcomingTasksModal.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/return \(\s*<div className="fixed/g, 'return createPortal(\n    <div className="fixed');
  fs.writeFileSync(file, content);
});
