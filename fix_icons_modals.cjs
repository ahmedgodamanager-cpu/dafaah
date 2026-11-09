const fs = require('fs');

function fix(file) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Add imports
  if (!content.includes('Users,')) {
    content = content.replace(/import { (.*?) } from 'lucide-react';/, "import { $1, Users, Search, TrendingUp, Smartphone, Clock, AlertTriangle } from 'lucide-react';");
  }
  
  // Replace CategoryIcon
  content = content.replace(/const CategoryIcon = \(CATEGORIES_INFO\.find.*?\|\| (.*?);/, `const catId = alert.category;
                const iconName = CATEGORIES_INFO.find(c => c.id === catId)?.iconName;
                const CategoryIcon = iconName === 'Users' ? Users : iconName === 'Search' ? Search : iconName === 'TrendingUp' ? TrendingUp : iconName === 'Smartphone' ? Smartphone : $1;`);
                
  fs.writeFileSync(file, content);
}

fix('src/components/DelayedTasksModal.tsx');
fix('src/components/UpcomingTasksModal.tsx');
