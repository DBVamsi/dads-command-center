import React, { useState, useEffect } from 'react';
import { getTasksStream } from '../../services/firebaseService';
import { Task, TaskCategory, AppUser } from '../../types';
import { TaskItem } from './TaskItem';
import { Spinner } from '../ui/Spinner';
import { Inbox } from 'lucide-react'; // Icon for empty state

interface TaskListProps {
  selectedCategory: TaskCategory;
  user: AppUser;
}

export const TaskList: React.FC<TaskListProps> = ({ selectedCategory, user }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setTasks([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    const unsubscribe = getTasksStream(
      user.uid,
      selectedCategory,
      (fetchedTasks) => {
        setTasks(fetchedTasks);
        setIsLoading(false);
        setError(null); 
      }
    );
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [selectedCategory, user]); // Simplified dependency array, user object itself is fine

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center py-16 text-center">
        <Spinner size="lg" color="text-primary" />
        <p className="mt-4 text-textSecondary text-lg">Loading tasks for {selectedCategory}...</p>
      </div>
    );
  }

  if (error) {
    return <p className="text-center text-danger py-16 text-lg">Error loading tasks: {error}</p>;
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center text-textMuted py-16 bg-surface rounded-xl shadow-lg border border-borderDark">
        <Inbox size={48} className="mx-auto mb-4 opacity-50" />
        <p className="text-xl font-semibold mb-2">It's quiet in {selectedCategory}...</p>
        <p className="text-md">No tasks here yet. Time to add one and get organized!</p>
      </div>
    );
  }

  return (
    <ul className="space-y-0"> {/* Adjusted space-y if TaskItem has mb */}
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} />
      ))}
    </ul>
  );
};