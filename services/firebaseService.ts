
import { initializeApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
  Auth
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
  orderBy,
  Firestore,
  Unsubscribe
} from 'firebase/firestore';
import { FIREBASE_CONFIG } from '../constants';
import { Task, TaskCategory } from '../types';

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

try {
  // Check if essential config values are present before initializing
  // This helps in providing a clearer error message if process.env variables were not loaded.
  if (!FIREBASE_CONFIG.apiKey || !FIREBASE_CONFIG.projectId) {
    throw new Error("Firebase API key or Project ID is missing. Check environment configuration.");
  }
  app = initializeApp(FIREBASE_CONFIG);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  console.error("Error initializing Firebase:", error);
  // Potentially display a more user-friendly error or disable Firebase features
  if (!FIREBASE_CONFIG.apiKey) {
    console.error("Firebase API key is missing. Please ensure your environment variables (e.g., VITE_FIREBASE_API_KEY accessed via process.env) are correctly set and accessible.");
  }
}


const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async (): Promise<User | null> => {
  if (!auth) throw new Error("Firebase Auth not initialized. Check Firebase configuration and initialization logs.");
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

export const signOutUser = async (): Promise<void> => {
  if (!auth) throw new Error("Firebase Auth not initialized.");
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

export const onAuthUserChanged = (callback: (user: User | null) => void): Unsubscribe => {
  if (!auth) {
    console.warn("Firebase Auth not initialized when trying to set up onAuthUserChanged listener. User will be reported as null.");
    // Call callback with null immediately if auth is not available
    // and return a no-op unsubscribe function.
    callback(null);
    return () => {}; 
  }
  return onAuthStateChanged(auth, callback);
};

export const addTask = async (
  userId: string,
  text: string,
  category: TaskCategory
): Promise<string> => {
  if (!db) throw new Error("Firestore not initialized. Check Firebase configuration and initialization logs.");
  try {
    const docRef = await addDoc(collection(db, 'tasks'), {
      userId,
      text,
      category,
      completed: false,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding task:", error);
    throw error;
  }
};

export const getTasksStream = (
  userId: string,
  category: TaskCategory,
  callback: (tasks: Task[]) => void
): Unsubscribe => {
  if (!db) {
    console.warn("Firestore not initialized when trying to set up getTasksStream listener. Task list will be empty.");
    callback([]); // Return empty list if db not available
    return () => {};
  }
  const q = query(
    collection(db, 'tasks'),
    where('userId', '==', userId),
    where('category', '==', category),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (querySnapshot) => {
    const tasks = querySnapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as Task)
    );
    callback(tasks);
  }, (error) => {
    console.error("Error fetching tasks in real-time:", error);
    // Potentially handle error state in UI
     callback([]); //  Return empty list on error too
  });
};

export const updateTaskCompletion = async (
  taskId: string,
  completed: boolean
): Promise<void> => {
  if (!db) throw new Error("Firestore not initialized.");
  const taskRef = doc(db, 'tasks', taskId);
  try {
    await updateDoc(taskRef, { completed });
  } catch (error) {
    console.error("Error updating task completion:", error);
    throw error;
  }
};

export const deleteTask = async (taskId: string): Promise<void> => {
  if (!db) throw new Error("Firestore not initialized.");
  const taskRef = doc(db, 'tasks', taskId);
  try {
    await deleteDoc(taskRef);
  } catch (error) {
    console.error("Error deleting task:", error);
    throw error;
  }
};

export { auth, db };