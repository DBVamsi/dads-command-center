import { Timestamp } from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';

export enum TaskCategory {
  ALL = 'All',
  WIFE = 'Wife',
  DAUGHTER = 'Daughter',
  WORK = 'Work',
  CHORES = 'Chores',
}

export type Priority = 'High' | 'Medium' | 'Low';

export interface Task {
  id: string;
  text: string;
  category: TaskCategory;
  completed: boolean;
  createdAt: Timestamp;
  userId: string;
  priority?: Priority;
  dueDate?: Timestamp | null;
  position: number; // Add this field
}

export type AppUser = FirebaseUser | null;

export type TaskFilter = 'all' | 'active' | 'completed';
