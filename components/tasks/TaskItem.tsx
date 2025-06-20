import React, { useState, useRef, useEffect } from 'react';
import { Task, TaskCategory } from '../../types';
import { updateTask, deleteTask } from '../../services/firebaseService';
import { Button } from '../ui/Button';
import { CheckSquare, Square, Trash2, Loader2, Edit, Save, XCircle, Calendar, Flag, GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TaskItemProps {
  task: Task;
  showCategory?: boolean;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task, showCategory }) => {
  const [isCompleting, setIsCompleting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(task.text);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 'auto',
    opacity: isDragging ? 0.8 : 1,
  };


  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const priorityStyles = {
    High: 'bg-red-500/20 text-red-400 border-red-500/30',
    Medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    Low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  };

  const categoryStyles = {
    Wife: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    Daughter: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    Work: 'bg-green-500/20 text-green-400 border-green-500/30',
    Chores: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  } as const;

  const handleToggleComplete = async () => {
    setIsCompleting(true);
    try {
      await updateTask(task.id, { completed: !task.completed });
    } catch (error) {
      console.error("Error toggling task completion:", error);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${task.text}"?`)) {
      setIsDeleting(true);
      try {
        await deleteTask(task.id);
      } catch (error) {
        console.error("Error deleting task:", error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleEdit = () => {
    setEditText(task.text);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditText(task.text);
  };

  const handleSaveEdit = async () => {
    if (editText.trim() === '' || editText.trim() === task.text) {
      handleCancelEdit();
      return;
    }
    setIsEditing(false);
    await updateTask(task.id, { text: editText.trim() });
  };
  
  const formattedDueDate = task.dueDate ? new Date(task.dueDate.seconds * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null;


  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex flex-col p-4 bg-surface dark:bg-surface rounded-xl shadow-lg mb-4 transition-all duration-300 ease-in-out border border-borderLight dark:border-borderDark hover:shadow-xl hover:border-primary/50
        ${task.completed ? 'opacity-60 bg-surface/60 dark:bg-surface/60' : 'opacity-100'}
        ${isDeleting ? 'scale-95 opacity-50' : ''}
      `}
    >
        <div className="flex items-center justify-between w-full">
            <div className="flex items-center flex-grow min-w-0">
                <button {...attributes} {...listeners} className="mr-2 p-1 cursor-grab active:cursor-grabbing touch-none text-textMuted focus:outline-none focus:ring-1 focus:ring-primary">
                    <GripVertical size={20} />
                </button>
                <button
                    onClick={handleToggleComplete}
                    disabled={isCompleting || isDeleting || isEditing}
                    className="mr-4 p-1 rounded-md text-primary focus:outline-none focus:ring-1 focus:ring-primary focus:ring-offset-1 focus:ring-offset-surface transition-colors"
                    >
                    {isCompleting ? <Loader2 size={22} className="animate-spin text-primary" /> : task.completed ? <CheckSquare size={22} className="text-green-500" /> : <Square size={22} className="text-textSecondary dark:text-textSecondary" />}
                </button>
          
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onBlur={handleSaveEdit}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
              className="flex-grow truncate text-base bg-white/10 dark:bg-black/20 rounded p-1 text-textPrimary dark:text-textPrimary"
            />
          ) : (
            <span className={`flex-grow truncate text-base ${task.completed ? 'line-through text-textMuted dark:text-textMuted italic' : 'text-textPrimary dark:text-textPrimary'}`}>
              {task.text}
            </span>
          )}
        </div>
        <div className="flex-shrink-0 ml-4 flex items-center gap-1">
          {isEditing ? (
            <>
              <Button onClick={handleSaveEdit} variant="ghost" size="sm" className="p-2 text-green-500 hover:text-green-400"><Save size={18} /></Button>
              <Button onClick={handleCancelEdit} variant="ghost" size="sm" className="p-2 text-red-500 hover:text-red-400"><XCircle size={18} /></Button>
            </>
          ) : (
            <>
              <Button onClick={handleEdit} variant="ghost" size="sm" className="p-2 text-textMuted dark:text-textMuted hover:text-primary"><Edit size={18} /></Button>
              <Button onClick={handleDelete} variant="ghost" size="sm" className="p-2 text-textMuted dark:text-textMuted hover:text-danger" disabled={isDeleting}>
                {isDeleting ? <Loader2 size={18} className="animate-spin"/> : <Trash2 size={18} />}
              </Button>
            </>
          )}
        </div>
      </div>
      {(showCategory || formattedDueDate || task.priority) && (
        <div className="mt-2 pt-2 border-t border-borderLight/50 dark:border-borderDark/50 flex items-center gap-4 pl-11">
            {showCategory && (
                <div className={`flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border ${categoryStyles[task.category as Exclude<TaskCategory, TaskCategory.ALL>]}`}> 
                    <span>{task.category}</span>
                </div>
            )}
            {task.priority && (
                <div className={`flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border ${priorityStyles[task.priority]}`}> 
                    <Flag size={12} />
                    <span>{task.priority}</span>
                </div>
            )}
            {formattedDueDate && (
                <div className="flex items-center gap-1.5 text-xs text-textSecondary dark:text-textSecondary">
                    <Calendar size={12} />
                    <span>{formattedDueDate}</span>
                </div>
            )}
        </div>
      )}
    </li>
  );
};