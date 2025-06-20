
import { TaskCategory } from './types';

export const TASK_CATEGORIES: TaskCategory[] = [
  TaskCategory.WIFE,
  TaskCategory.DAUGHTER,
  TaskCategory.WORK,
  TaskCategory.CHORES,
];

export const CATEGORY_TABS: TaskCategory[] = [
  TaskCategory.ALL,
  ...TASK_CATEGORIES,
];

// Ensure your .env file has VITE_ prefixed environment variables
// These are typically exposed on process.env by build tools or can be accessed via import.meta.env in Vite (if typed correctly).
// Switching to process.env for broader compatibility and to resolve current TS errors.
export const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};