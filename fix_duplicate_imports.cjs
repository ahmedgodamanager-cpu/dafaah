const fs = require('fs');

function fixDuplicates(file) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Since we did `content.replace(/import { (.*?) } from 'lucide-react';/, "import { $1, Users, Search, TrendingUp, Smartphone, Clock, AlertTriangle } from 'lucide-react';");`
  // if AlertTriangle or Clock was already in $1, they are duplicated.
  
  // Instead of complex regex, let's just parse the import block and set it.
  content = content.replace(/import { (.*?) } from 'lucide-react';/, (match, p1) => {
    const items = p1.split(',').map(s => s.trim()).filter(Boolean);
    const unique = [...new Set(items)];
    return `import { ${unique.join(', ')} } from 'lucide-react';`;
  });
  
  fs.writeFileSync(file, content);
}

fixDuplicates('src/components/DelayedTasksModal.tsx');
fixDuplicates('src/components/UpcomingTasksModal.tsx');
fixDuplicates('src/components/SectionTasksModal.tsx');
fixDuplicates('src/components/DepartmentTasksModal.tsx');

