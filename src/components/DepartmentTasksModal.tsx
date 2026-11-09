import React from 'react';
import { Client, TaskItem } from '../types';
import { getDaysDifference, hasValidDueDate } from '../utils/dateUtils';
import { CATEGORIES_INFO } from '../data/initialClients';
import { TasksListModal, TaskDisplayItem } from './TasksListModal';
import { CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

interface DepartmentTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'completed' | 'delayed' | 'upcoming';
  clients: Client[];
  categoryId: string;
  onSelectClient?: (clientId: string) => void;
}

export const DepartmentTasksModal: React.FC<DepartmentTasksModalProps> = ({ isOpen, onClose, type, clients, categoryId, onSelectClient }) => {
  const categoryInfo = CATEGORIES_INFO.find(c => c.id === categoryId) || CATEGORIES_INFO[0];
  const displayTasks: TaskDisplayItem[] = [];
  
  if (isOpen) {
    clients.forEach(client => {
      (client.tasks || []).forEach(task => {
        if (task.category !== categoryId) return;
        
        const daysDiff = getDaysDifference(task.dueDate);
        
        // Tasks without a due date are neither late nor "due today".
        const hasDate = hasValidDueDate(task);
        let shouldInclude = false;
        if (type === 'completed' && task.completed) shouldInclude = true;
        else if (type === 'delayed' && !task.completed && hasDate && daysDiff < 0) shouldInclude = true;
        else if (type === 'upcoming' && !task.completed && hasDate && daysDiff >= 0 && daysDiff <= 3) shouldInclude = true;
        
        if (shouldInclude) {
          displayTasks.push({
            id: `dept-${client.id}-${task.id}`,
            taskId: task.id,
            completed: task.completed,
            taskTitle: task.title,
            category: task.category,
            clientName: client.clientName,
            clientId: client.id,
            dueDate: task.dueDate,
            daysDiff: daysDiff,
          });
        }
      });
    });
    displayTasks.sort((a, b) => a.daysDiff - b.daysDiff);
  }

  const getHeaderInfo = () => {
    const baseTitle = type === 'completed' ? 'المهام المنجزة' : type === 'delayed' ? 'المهام المتأخرة' : 'المهام القريبة';
    const title = `${baseTitle} - ${categoryInfo.nameAr}`;
    
    switch (type) {
      case 'completed': return { title, desc: 'مهام تم إنجازها في هذا القسم', icon: <CheckCircle2 className="w-5 h-5"/>, bg: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50' };
      case 'delayed': return { title, desc: 'مهام تجاوزت وقت التسليم', icon: <AlertTriangle className="w-5 h-5"/>, bg: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/50' };
      case 'upcoming': return { title, desc: 'مهام قريبة جداً (خلال 3 أيام)', icon: <Clock className="w-5 h-5"/>, bg: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/50' };
    }
  };

  const header = getHeaderInfo();

  return (
    <TasksListModal
      isOpen={isOpen}
      onClose={onClose}
      title={header.title}
      description={header.desc}
      headerIcon={header.icon}
      headerIconBgClass={header.bg}
      tasks={displayTasks}
      onSelectClient={onSelectClient}
    />
  );
};
