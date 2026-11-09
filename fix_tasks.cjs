const fs = require('fs');

function replaceFile(path) {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(/import \{ Client, Task \} from '\.\.\/types';/g, "import { Client, TaskItem } from '../types';");
  content = content.replace(/tasks: Task\[\]/g, "tasks: TaskItem[]");
  content = content.replace(/task: Task/g, "task: TaskItem");
  
  // Fix CATEGORIES_INFO array access
  content = content.replace(/CATEGORIES_INFO\[(.*?)\.category\]\?\.icon/g, "(CATEGORIES_INFO.find(c => c.id === $1.category)?.iconName)");
  content = content.replace(/CATEGORIES_INFO\[(.*?)\.category\]\?\.label/g, "(CATEGORIES_INFO.find(c => c.id === $1.category)?.nameAr)");
  
  // Specific replacements for SectionTasksModal
  content = content.replace(/const catInfo = CATEGORIES_INFO\[item\.task\.category\];/g, "const catInfo = CATEGORIES_INFO.find(c => c.id === item.task.category) || CATEGORIES_INFO[0];");
  content = content.replace(/catInfo\?.bg/g, "catInfo?.color");
  content = content.replace(/<catInfo.icon/g, "/* TODO icon */");
  
  fs.writeFileSync(path, content);
}

['src/components/DepartmentTasksModal.tsx', 'src/components/SectionTasksModal.tsx', 'src/components/DelayedTasksModal.tsx', 'src/components/UpcomingTasksModal.tsx'].forEach(replaceFile);

