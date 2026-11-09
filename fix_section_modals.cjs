const fs = require('fs');

function fixSection(file) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Imports
  if (!content.includes('Users,')) {
    content = content.replace(/import { (.*?) } from 'lucide-react';/, "import { $1, Users, Search, TrendingUp, Smartphone, Circle } from 'lucide-react';");
  }
  
  // Icon rendering
  const replacement = `
                        {catInfo.iconName === 'Users' ? <Users className="w-5 h-5" /> : 
                         catInfo.iconName === 'Search' ? <Search className="w-5 h-5" /> : 
                         catInfo.iconName === 'TrendingUp' ? <TrendingUp className="w-5 h-5" /> : 
                         catInfo.iconName === 'Smartphone' ? <Smartphone className="w-5 h-5" /> : 
                         <Circle className="w-5 h-5" />}
  `;
  content = content.replace(/\{catInfo\.icon\}/g, replacement);
  content = content.replace(/\$\{catInfo\.bg\} \$\{catInfo\.color\}/g, "${catInfo.color}");

  fs.writeFileSync(file, content);
}

fixSection('src/components/SectionTasksModal.tsx');
fixSection('src/components/DepartmentTasksModal.tsx');

