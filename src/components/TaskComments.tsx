import React, { useState } from 'react';
import { TaskItem, TaskComment } from '../types';
import { MessageSquare, Send, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface TaskCommentsProps {
  task: TaskItem;
  onUpdateTask: (task: TaskItem) => void;
}

export function TaskComments({ task, onUpdateTask }: TaskCommentsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  const { user, profile } = useAuth();
  
  const comments = task.comments || [];

  const handleAddComment = () => {
    if (!newComment.trim() || !user) return;
    
    const comment: TaskComment = {
      id: Date.now().toString(),
      text: newComment.trim(),
      createdBy: profile?.name || user.email || 'مستخدم',
      createdAt: new Date().toISOString()
    };

    const updatedTask = {
      ...task,
      comments: [...comments, comment]
    };

    onUpdateTask(updatedTask);
    setNewComment('');
  };

  return (
    <div className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-3">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
      >
        <MessageSquare className="w-3.5 h-3.5" />
        {comments.length > 0 ? `التعليقات (${comments.length})` : 'إضافة تعليق'}
      </button>

      {isOpen && (
        <div className="mt-3 space-y-3">
          {comments.length > 0 ? (
            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
              {comments.map(comment => (
                <div key={comment.id} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 text-sm border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center mb-1 text-xs text-slate-400">
                    <span className="font-bold flex items-center gap-1 text-slate-600 dark:text-slate-300">
                      <User className="w-3 h-3" />
                      {comment.createdBy}
                    </span>
                    <span>
                      {new Date(comment.createdAt).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-200 whitespace-pre-wrap">{comment.text}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-center text-slate-400 py-2">لا توجد تعليقات بعد.</div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
              placeholder="اكتب تعليقاً..."
              className="flex-1 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            <button 
              onClick={handleAddComment}
              disabled={!newComment.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl px-3 py-2 transition-colors flex items-center justify-center"
            >
              <Send className="w-4 h-4 rtl:rotate-180" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
