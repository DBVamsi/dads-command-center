
import { Timestamp } from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';

export enum TaskCategory {
  WIFE = 'Wife',
  DAUGHTER = 'Daughter',
  WORK = 'Work',
  CHORES = 'Chores',
}

export interface Task {
  id: string;
  text: string;
  category: TaskCategory;
  completed: boolean;
  createdAt: Timestamp;
  userId: string;
}

export type AppUser = FirebaseUser | null;