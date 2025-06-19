
import { TaskCategory } from './types';

export const TASK_CATEGORIES: TaskCategory[] = [
  TaskCategory.WIFE,
  TaskCategory.DAUGHTER,
  TaskCategory.WORK,
  TaskCategory.CHORES,
];

// Ensure your .env file has VITE_ prefixed environment variables
// These are typically exposed on process.env by build tools or can be accessed via import.meta.env in Vite (if typed correctly).
// Switching to process.env for broader compatibility and to resolve current TS errors.
export const FIREBASE_CONFIG = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};