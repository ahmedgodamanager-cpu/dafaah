const fs = require('fs');
console.log(fs.readFileSync('src/components/DepartmentTasksModal.tsx', 'utf8').substring(0, 1500));
