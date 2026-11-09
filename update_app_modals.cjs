const fs = require('fs');
let appContent = fs.readFileSync('src/App.tsx', 'utf8');

// Replace imports
appContent = appContent.replace("import { UpcomingTasksModal } from './components/UpcomingTasksModal';", "import { TasksListModal, TaskDisplayItem } from './components/TasksListModal';\nimport { Clock, AlertTriangle } from 'lucide-react';");
appContent = appContent.replace("import { DelayedTasksModal } from './components/DelayedTasksModal';\n", "");

// Create converters for alerts -> TaskDisplayItem
// We'll put this right before the return statement of App or we can just map it inline.
const unifiedModals = `
      <TasksListModal
        isOpen={isUpcomingModalOpen}
        onClose={() => setIsUpcomingModalOpen(false)}
        title="المهام القريبة"
        description="مهام يتبقى على تسليمها 3 أيام أو أقل"
        headerIcon={<Clock className="w-5 h-5" />}
        headerIconBgClass="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/50"
        tasks={alerts.filter(a => a.alertType === 'due_soon').map(a => ({
          id: a.id,
          taskTitle: a.taskTitle,
          category: a.category,
          clientName: a.clientName,
          clientId: a.clientId,
          dueDate: a.dueDate,
          daysDiff: a.daysDiff
        }))}
        onSelectClient={(cId) => setSelectedClientId(cId)}
      />

      <TasksListModal
        isOpen={isDelayedModalOpen}
        onClose={() => setIsDelayedModalOpen(false)}
        title="المهام المتأخرة"
        description="مهام تجاوزت تاريخ الاستحقاق وتتطلب متابعة فورية"
        headerIcon={<AlertTriangle className="w-5 h-5" />}
        headerIconBgClass="bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/50"
        tasks={alerts.filter(a => a.alertType === 'overdue').map(a => ({
          id: a.id,
          taskTitle: a.taskTitle,
          category: a.category,
          clientName: a.clientName,
          clientId: a.clientId,
          dueDate: a.dueDate,
          daysDiff: a.daysDiff
        }))}
        onSelectClient={(cId) => setSelectedClientId(cId)}
      />
`;

// Replace the two modals in App.tsx
appContent = appContent.replace(/<UpcomingTasksModal[\s\S]*?\/>\s*<DelayedTasksModal[\s\S]*?\/>/, unifiedModals);

fs.writeFileSync('src/App.tsx', appContent);
