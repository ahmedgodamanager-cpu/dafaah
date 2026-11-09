const fs = require('fs');

const jsx = fs.readFileSync('tasks_jsx.txt', 'utf8');
const handlers = fs.readFileSync('tasks_handlers.txt', 'utf8');

const content = `import React, { useState } from 'react';
import { Client, TaskCategory, TaskItem } from '../types';
import { Plus, GripVertical, CheckCircle2, Clock, MapPin, AlertTriangle, MessageSquare, StickyNote, Trash2, Edit3, X, Save, FileText, Share2, Briefcase, Calendar, CheckSquare, Search, Smartphone, Users, ChevronDown, ChevronUp, Copy } from 'lucide-react';
import { formatDateArabic, getTaskTimeStatus } from '../utils/dateUtils';
import { CATEGORIES_INFO } from '../data/initialClients';
import { TaskComments } from './TaskComments';

interface ClientTasksSectionProps {
  client: Client;
  isReadingMode: boolean;
  onUpdateClient: (client: Client) => void;
  onUpdateTask?: (clientId: string, updatedTask: TaskItem) => void;
  onDeleteTask?: (clientId: string, taskId: string) => void;
  onOpenAddTask: (clientId: string) => void;
  setConfirmModalConfig: React.Dispatch<React.SetStateAction<any>>;
}

export const ClientTasksSection: React.FC<ClientTasksSectionProps> = ({
  client,
  isReadingMode,
  onUpdateClient,
  onUpdateTask,
  onDeleteTask,
  onOpenAddTask,
  setConfirmModalConfig
}) => {
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory | 'all'>('all');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskNotes, setTaskNotes] = useState<string>('');
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

${handlers}

  // Filter tasks based on selected category
  const filteredTasks = (client.tasks || []).filter(task => {
    if (selectedCategory !== 'all' && task.category !== selectedCategory) return false;
    return true;
  });

  return (
${jsx}
  );
};
`;

fs.writeFileSync('src/components/ClientTasksSection.tsx', content);
