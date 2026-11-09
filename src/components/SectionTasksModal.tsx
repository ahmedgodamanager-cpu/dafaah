import React from 'react';
import { Client, TaskItem } from '../types';
import { getDaysDifference } from '../utils/dateUtils';
import { TasksListModal, TaskDisplayItem } from './TasksListModal';
import { CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

interface SectionTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'completed' | 'delayed' | 'upcoming';
  clients: Client[];
  onSelectClient?: (clientId: string) => void;
}

export const SectionTasksModal: React.FC<SectionTasksModalProps> = ({ isOpen, onClose, type, clients, onSelectClient }) => {
  const displayTasks: TaskDisplayItem[] = [];
  
  if (isOpen) {
    clients.forEach(client => {
      (client.tasks || []).forEach(task => {
        const daysDiff = getDaysDifference(task.dueDate);
        
        let shouldInclude = false;
        if (type === 'completed' && task.completed) shouldInclude = true;
        else if (type === 'delayed' && !task.completed && daysDiff < 0) shouldInclude = true;
        else if (type === 'upcoming' && !task.completed && daysDiff >= 0 && daysDiff <= 3) shouldInclude = true;
        
        if (shouldInclude) {
          displayTasks.push({
            id: `sec-${client.id}-${task.id}`,
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
    switch (type) {
      case 'completed': return { title: 'المهام المنجزة', desc: 'مهام تم إنجازها (أول 30 يوم)', icon: <CheckCircle2 className="w-5 h-5"/>, bg: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50' };
      case 'delayed': return { title: 'المهام المتأخرة', desc: 'مهام تجاوزت وقت التسليم (أول 30 يوم)', icon: <AlertTriangle className="w-5 h-5"/>, bg: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/50' };
      case 'upcoming': return { title: 'المهام القريبة', desc: 'مهام قريبة جداً (خلال 3 أيام)', icon: <Clock className="w-5 h-5"/>, bg: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/50' };
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
