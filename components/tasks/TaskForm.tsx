import React, { useState } from 'react';
import { addTask } from '../../services/firebaseService';
import { TaskCategory, AppUser } from '../../types';
import { Button } from '../ui/Button';
import { PlusCircle } from 'lucide-react';
import { Spinner } from '../ui/Spinner';

interface TaskFormProps {
  selectedCategory: TaskCategory;
  user: AppUser;
}

export const TaskForm: React.FC<TaskFormProps> = ({ selectedCategory, user }) => {
  const [taskText, setTaskText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskText.trim() || !user) return;

    setIsLoading(true);
    setError(null);
    try {
      await addTask(user.uid, taskText.trim(), selectedCategory);
      setTaskText('');
    } catch (err) {
      setError('Failed to add task. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8">
      <div className="flex items-center space-x-3 bg-surface p-3 rounded-xl shadow-xl border border-borderDark">
        <input
          type="text"
          value={taskText}
          onChange={(e) => setTaskText(e.target.value)}
          placeholder={`Add a new task for ${selectedCategory}...`}
          className="flex-grow bg-transparent p-3 text-textPrimary placeholder-textMuted focus:outline-none focus:ring-2 focus:ring-primary rounded-lg"
          disabled={isLoading}
          aria-label={`New task for ${selectedCategory}`}
        />
        <Button 
          type="submit" 
          disabled={isLoading || !taskText.trim()}
          variant="primary"
          size="md"
          className="px-5 py-3"
          leftIcon={isLoading ? <Spinner size="sm" color="text-white" /> : <PlusCircle size={20}/>}
        >
          Add Task
        </Button>
      </div>
      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
    </form>
  );
};