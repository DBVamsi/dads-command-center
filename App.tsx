import React, { useState, useEffect } from 'react';
import { onAuthUserChanged } from './services/firebaseService';
import { AppUser } from './types';
import { LoginScreen } from './components/auth/LoginScreen';
import { TaskDashboard } from './components/tasks/TaskDashboard';
import { ApiKeyProvider } from './context/ApiKeyContext'; // Import ApiKeyProvider
import { Spinner } from './components/ui/Spinner';
import { FIREBASE_CONFIG } from './constants';
import { AlertTriangle } from 'lucide-react'; // Icon for error state

const App: React.FC = () => {
  const [user, setUser] = useState<AppUser | undefined>(undefined); 
  const [firebaseInitialized, setFirebaseInitialized] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  useEffect(() => {
    if (!FIREBASE_CONFIG.apiKey || !FIREBASE_CONFIG.projectId) {
        setInitializationError("Firebase configuration is missing. Please ensure environment variables (e.g., VITE_FIREBASE_API_KEY) are set correctly and accessible via process.env.");
        setFirebaseInitialized(true); 
        setUser(null); 
        return;
    }

    try {
      const unsubscribe = onAuthUserChanged((authUser) => {
        setUser(authUser);
        setFirebaseInitialized(true);
        setInitializationError(null); // Clear error on successful auth state change
      });
      return () => unsubscribe();
    } catch (error) {
      console.error("Critical Firebase Auth listener setup error:", error);
      let message = "Failed to initialize Firebase authentication. The app may not function correctly.";
      if (error instanceof Error) {
        message = error.message;
      }
      setInitializationError(message);
      setFirebaseInitialized(true);
      setUser(null);
    }
  }, []);


  if (!firebaseInitialized || user === undefined) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-transparent p-6">
        {initializationError ? (
          <div className="bg-surface p-8 rounded-xl shadow-2xl w-full max-w-lg text-center border border-danger">
            <AlertTriangle size={48} className="mx-auto text-danger mb-4" />
            <h2 className="text-2xl font-bold text-danger mb-3">Initialization Error</h2>
            <p className="text-textSecondary leading-relaxed">{initializationError}</p>
            <p className="text-xs text-textMuted mt-6">Please check your Firebase setup and environment variables. Refer to `instructions.md`.</p>
          </div>
        ) : (
          <>
            <Spinner size="lg" color="text-primary"/>
            <p className="mt-4 text-textSecondary text-lg">Initializing Command Center...</p>
          </>
        )}
      </div>
    );
  }

  // The ApiKeyProvider should wrap the part of the app that depends on user authentication
  // and needs access to the API key. It will react to user changes.
  return (
    <ApiKeyProvider userId={user ? user.uid : null}>
      {!user ? (
        <LoginScreen />
      ) : (
        <TaskDashboard user={user} />
      )}
    </ApiKeyProvider>
  );
};

export default App;