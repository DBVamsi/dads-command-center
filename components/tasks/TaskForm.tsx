import React, { useState } from 'react';
import { addTask } from '../../services/firebaseService';
import { TaskCategory, AppUser, Priority } from '../../types';
import { Button } from '../ui/Button';
import { PlusCircle } from 'lucide-react';
import { Spinner } from '../ui/Spinner';

interface TaskFormProps {
  selectedCategory: TaskCategory;
  user: AppUser;
}

export const TaskForm: React.FC<TaskFormProps> = ({ selectedCategory, user }) => {
  const [taskText, setTaskText] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskText.trim() || !user) return;

    setIsLoading(true);
    setError(null);
    try {
      await addTask(user.uid, taskText.trim(), selectedCategory, {
        dueDate: dueDate || undefined,
        priority: priority,
      });
      setTaskText('');
      setDueDate('');
      setPriority('Medium');
    } catch (err) {
      setError('Failed to add task. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8 p-4 bg-surface dark:bg-surface rounded-xl shadow-xl border border-borderLight dark:border-borderDark">
      <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-3">
        <input
          type="text"
          value={taskText}
          onChange={(e) => setTaskText(e.target.value)}
          placeholder={`Add a new task for ${selectedCategory}...`}
          className="flex-grow w-full bg-transparent p-3 text-textPrimary dark:text-textPrimary placeholder-textMuted dark:placeholder-textMuted focus:outline-none focus:ring-2 focus:ring-primary rounded-lg border border-borderLight dark:border-borderDark"
          disabled={isLoading}
          aria-label={`New task for ${selectedCategory}`}
        />
        <Button
          type="submit"
          disabled={isLoading || !taskText.trim()}
          variant="primary"
          size="md"
          className="w-full sm:w-auto px-5 py-3"
          leftIcon={isLoading ? <Spinner size="sm" color="text-white" /> : <PlusCircle size={20} />}
        >
          Add Task
        </Button>
      </div>
      <div className="mt-4 flex flex-col sm:flex-row items-center gap-4">
        <div className="w-full sm:w-1/2">
            <label htmlFor="dueDate" className="block text-sm font-medium text-textSecondary dark:text-textSecondary mb-1">Due Date (Optional)</label>
            <input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-transparent p-2 text-textPrimary dark:text-textPrimary placeholder-textMuted dark:placeholder-textMuted focus:outline-none focus:ring-2 focus:ring-primary rounded-lg border border-borderLight dark:border-borderDark"
            />
        </div>
        <div className="w-full sm:w-1/2">
            <label htmlFor="priority" className="block text-sm font-medium text-textSecondary dark:text-textSecondary mb-1">Priority</label>
            <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full bg-transparent p-2.5 text-textPrimary dark:text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary rounded-lg border border-borderLight dark:border-borderDark"
            >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
            </select>
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
    </form>
  );
};