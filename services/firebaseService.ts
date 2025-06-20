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
  Unsubscribe,
  writeBatch, // Import writeBatch
  setDoc,     // Added for saveUserApiKey
  getDoc      // Added for getUserApiKey
} from 'firebase/firestore';
import { FIREBASE_CONFIG } from '../constants';
import { Task, TaskCategory, Priority }       from '../types';

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

try {
  if (!FIREBASE_CONFIG.apiKey || !FIREBASE_CONFIG.projectId) {
    throw new Error("Firebase API key or Project ID is missing. Check environment configuration.");
  }
  app = initializeApp(FIREBASE_CONFIG);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  console.error("Error initializing Firebase:", error);
  if (!FIREBASE_CONFIG.apiKey) {
    console.error("Firebase API key is missing. Please ensure your environment variables are correctly set.");
  }
}

const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async (): Promise<User | null> => {
  if (!auth) throw new Error("Firebase Auth not initialized.");
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
    console.warn("Firebase Auth not initialized. User will be reported as null.");
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
};

export const addTask = async (
  userId: string,
  text: string,
  category: TaskCategory,
  details: { priority?: Priority; dueDate?: string }
): Promise<string> => {
  if (!db) throw new Error("Firestore not initialized.");
  try {
    const docRef = await addDoc(collection(db, 'tasks'), {
      userId,
      text,
      category,
      completed: false,
      createdAt: Timestamp.now(),
      priority: details.priority || 'Medium',
      dueDate: details.dueDate ? Timestamp.fromDate(new Date(details.dueDate)) : null,
      position: Date.now(), // Set initial position
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
  filter: 'all' | 'active' | 'completed',
  callback: (tasks: Task[]) => void
): Unsubscribe => {
  if (!db) {
    console.warn("Firestore not initialized. Task list will be empty.");
    callback([]);
    return () => {};
  }
  const q = query(
    collection(db, 'tasks'),
    where('userId', '==', userId),
    ...(category !== TaskCategory.ALL ? [where('category', '==', category)] : []),
    ...(filter === 'active' ? [where('completed', '==', false)] : []),
    ...(filter === 'completed' ? [where('completed', '==', true)] : []),
    orderBy('position', 'asc') // Order by the new position field
  );

  return onSnapshot(q, (querySnapshot) => {
    const tasks = querySnapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as Task)
    );
    callback(tasks);
  }, (error) => {
    console.error("Error fetching tasks in real-time:", error);
    callback([]);
  });
};

// New function to update task order in a batch
export const updateTaskOrder = async (tasks: Task[]): Promise<void> => {
    if (!db) throw new Error("Firestore not initialized.");
    const batch = writeBatch(db);
    tasks.forEach((task, index) => {
        const taskRef = doc(db, 'tasks', task.id);
        batch.update(taskRef, { position: index });
    });
    try {
        await batch.commit();
    } catch (error) {
        console.error("Error updating task order:", error);
        throw error;
    }
};

export const updateTask = async (
  taskId: string,
  updates: Partial<Task>
): Promise<void> => {
  if (!db) throw new Error("Firestore not initialized.");
  const taskRef = doc(db, 'tasks', taskId);
  try {
    await updateDoc(taskRef, updates);
  } catch (error) {
    console.error("Error updating task:", error);
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

// Collection name for user API keys
const USER_API_KEY_COLLECTION = 'user_gemini_keys';

/**
 * Saves a user's Gemini API key to Firestore.
 * The key is stored directly; security relies on Firestore security rules.
 * TODO: Explore client-side encryption for the API key before storing, if enhanced security is needed beyond Firestore rules.
 * @param userId The ID of the user.
 * @param apiKey The API key to save.
 */
export const saveUserApiKey = async (userId: string, apiKey: string): Promise<void> => {
  if (!db) throw new Error("Firestore not initialized.");
  if (!userId) throw new Error("User ID is required to save API key.");
  if (!apiKey) throw new Error("API key is required."); // Or handle as a delete operation if apiKey is empty? For now, require it.

  try {
    const apiKeyRef = doc(db, USER_API_KEY_COLLECTION, userId);
    await setDoc(apiKeyRef, { key: apiKey });
    console.log(`API Key for user ${userId} saved. Storage relies on Firestore security rules.`);
  } catch (error) {
    console.error(`Error saving API key for user ${userId}:`, error);
    throw error; // Re-throw to allow caller to handle
  }
};

/**
 * Retrieves a user's Gemini API key from Firestore.
 * @param userId The ID of the user.
 * @returns The API key string if found, otherwise null.
 */
export const getUserApiKey = async (userId: string): Promise<string | null> => {
  if (!db) throw new Error("Firestore not initialized.");
  if (!userId) throw new Error("User ID is required to fetch API key.");

  try {
    const apiKeyRef = doc(db, USER_API_KEY_COLLECTION, userId);
    const docSnap = await getDoc(apiKeyRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return data?.key || null; // Return the key if it exists, otherwise null
    } else {
      console.log(`No API key found for user ${userId}.`);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching API key for user ${userId}:`, error);
    throw error; // Re-throw
  }
};

/**
 * Deletes a user's Gemini API key from Firestore.
 * @param userId The ID of the user.
 */
export const deleteUserApiKey = async (userId: string): Promise<void> => {
  if (!db) throw new Error("Firestore not initialized.");
  if (!userId) throw new Error("User ID is required to delete API key.");

  try {
    const apiKeyRef = doc(db, USER_API_KEY_COLLECTION, userId);
    await deleteDoc(apiKeyRef);
    console.log(`API Key for user ${userId} deleted successfully.`);
  } catch (error) {
    console.error(`Error deleting API key for user ${userId}:`, error);
    throw error; // Re-throw
  }
};