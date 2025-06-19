import React, { useState } from 'react';
import { Task } from '../../types';
import { updateTaskCompletion, deleteTask } from '../../services/firebaseService';
import { Button } from '../ui/Button';
import { CheckSquare, Square, Trash2, Loader2 } from 'lucide-react'; // Using Loader2 for a potentially smoother spinner

interface TaskItemProps {
  task: Task;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task }) => {
  const [isCompleting, setIsCompleting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleToggleComplete = async () => {
    setIsCompleting(true);
    try {
      await updateTaskCompletion(task.id, !task.completed);
    } catch (error) {
      console.error("Error toggling task completion:", error);
      // Add user feedback here if needed
    } finally {
      setIsCompleting(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${task.text}"? This action cannot be undone.`)) {
      setIsDeleting(true);
      try {
        await deleteTask(task.id);
      } catch (error) {
        console.error("Error deleting task:", error);
        // Add user feedback here if needed
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const iconSize = 22;

  return (
    <li className={`flex items-center justify-between p-4 bg-surface rounded-xl shadow-lg mb-4 transition-all duration-300 ease-in-out border border-borderDark hover:shadow-xl hover:border-primary/50
      ${task.completed ? 'opacity-70 bg-surface/60' : 'opacity-100'}
      ${isDeleting ? 'scale-95 opacity-50' : ''}
    `}>
      <div className="flex items-center flex-grow min-w-0">
        <button
          onClick={handleToggleComplete}
          disabled={isCompleting || isDeleting}
          className={`mr-4 p-1 rounded-md text-primary hover:text-primary-hover focus:outline-none focus:ring-1 focus:ring-primary focus:ring-offset-1 focus:ring-offset-surface transition-colors ${isCompleting ? 'cursor-wait' : ''}`}
          aria-label={task.completed ? "Mark task as incomplete" : "Mark task as complete"}
          aria-live="polite"
        >
          {isCompleting ? <Loader2 size={iconSize} className="animate-spin text-primary" /> : task.completed ? <CheckSquare size={iconSize} className="text-green-500" /> : <Square size={iconSize} className="text-textSecondary" />}
        </button>
        <span className={`flex-grow truncate text-base ${task.completed ? 'line-through text-textMuted italic' : 'text-textPrimary'}`}>
          {task.text}
        </span>
      </div>
      <div className="flex-shrink-0 ml-4">
        <Button
          onClick={handleDelete}
          variant="ghost"
          size="sm"
          className="text-textMuted hover:text-danger hover:bg-danger/10 p-2"
          disabled={isDeleting || isCompleting}
          aria-label="Delete task"
          aria-live="polite"
        >
          {isDeleting ? <Loader2 size={18} className="animate-spin text-danger"/> : <Trash2 size={18} />}
        </Button>
      </div>
    </li>
  );
};