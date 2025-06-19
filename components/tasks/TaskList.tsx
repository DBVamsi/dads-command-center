import React, { useState, useEffect } from 'react';
import { getTasksStream, updateTaskOrder } from '../../services/firebaseService';
import { Task, TaskCategory, AppUser, TaskFilter } from '../../types';
import { TaskItem } from './TaskItem';
import { Spinner } from '../ui/Spinner';
import { Inbox } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';


interface TaskListProps {
  selectedCategory: TaskCategory;
  filter: TaskFilter;
  user: AppUser;
}

export const TaskList: React.FC<TaskListProps> = ({ selectedCategory, filter, user }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
      filter,
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
  }, [selectedCategory, filter, user]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setTasks((currentTasks) => {
        const oldIndex = currentTasks.findIndex((t) => t.id === active.id);
        const newIndex = currentTasks.findIndex((t) => t.id === over.id);
        const reorderedTasks = arrayMove(currentTasks, oldIndex, newIndex);

        // Update position based on new order for Firestore
        const updatedTasksForFirebase = reorderedTasks.map((task, index) => ({
            ...task,
            position: index,
        }));
        updateTaskOrder(updatedTasksForFirebase);

        return reorderedTasks;
      });
    }
  };


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
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <ul className="space-y-0">
          {tasks.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
};