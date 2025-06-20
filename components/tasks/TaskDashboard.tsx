import React, { useState, useEffect, useCallback } from 'react';
import { AppUser, TaskCategory, TaskFilter } from '../../types';
import { signOutUser } from '../../services/firebaseService';
import { useApiKey } from '../../context/ApiKeyContext'; // Import useApiKey
import { CategoryTabs } from './CategoryTabs';
import { TaskForm } from './TaskForm';
import { TaskList } from './TaskList';
import { Button } from '../ui/Button';

import { Spinner } from '../ui/Spinner'; // Import Spinner
import { LogOut, LayoutDashboard, Moon, Sun, Settings as SettingsIcon, AlertCircle, CheckCircle } from 'lucide-react';

import useLocalStorageState from 'use-local-storage-state';

interface TaskDashboardProps {
  user: AppUser;
}

interface HeaderProps {
  onSignOut: () => void;
  userName?: string | null;
  onToggleSettings: () => void;
}

const Header: React.FC<HeaderProps> = React.memo(({ onSignOut, userName, onToggleSettings }) => {
    const [theme, setTheme] = useLocalStorageState('theme', { defaultValue: 'dark' });

    useEffect(() => {
        const element = document.documentElement;
        if (theme === 'light') {
            element.classList.remove('dark');
        } else {
            element.classList.add('dark');
        }
    }, [theme]);

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };
  
    return (
      <header className="bg-gray-100 dark:bg-gray_950 shadow-xl p-4 sticky top-0 z-50 border-b border-gray-200 dark:border-borderDark/50">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <LayoutDashboard size={32} className="text-primary mr-3" />
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-textPrimary tracking-tight">
              Dad's Command Center
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            {userName && <span className="text-gray-600 dark:text-textSecondary text-sm sm:text-base hidden sm:block">Hi, {userName.split(' ')[0]}!</span>}
            <Button onClick={toggleTheme} variant="outline" size="sm" className="p-2" aria-label="Toggle theme">
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </Button>
            <Button onClick={onToggleSettings} variant="outline" size="sm" className="p-2" aria-label="Open settings">
                <SettingsIcon size={18} />
            </Button>
            <Button onClick={onSignOut} variant="outline" size="md" leftIcon={<LogOut size={18} />}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>
    );
});
Header.displayName = 'Header';

export const TaskDashboard: React.FC<TaskDashboardProps> = ({ user }) => {
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory>(TaskCategory.ALL);
  const [filter, setFilter] = useState<TaskFilter>('all');
  const [showSignOutError, setShowSignOutError] = useState<string | null>(null);
  const [showUserSettings, setShowUserSettings] = useState(false);
  const [apiKeyInputValue, setApiKeyInputValue] = useState('');

  // Consume ApiKeyContext
  const {
    userApiKey,
    isApiKeyLoading: isGlobalApiKeyLoading,
    apiKeyError: globalApiKeyError,
    saveUserApiKeyToContextAndDb,
    deleteUserApiKeyFromContextAndDb,
    // fetchUserApiKeyState, // Not directly called from here, but available
  } = useApiKey();

  // Local state for API key operations within settings
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [isDeletingKey, setIsDeletingKey] = useState(false);
  const [keyOpError, setKeyOpError] = useState<string | null>(null);
  const [keyOpSuccessMessage, setKeyOpSuccessMessage] = useState<string | null>(null);

  const handleApiKeyFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleSaveApiKey();
  };

  const handleSignOut = async () => {
    setShowSignOutError(null);
    try {
      await signOutUser();
    } catch (error) {
      console.error("Sign out failed:", error);
      setShowSignOutError("Failed to sign out. Please try again.");
    }
  };

  const toggleUserSettings = () => {
    setShowUserSettings(prev => !prev);
    if (showUserSettings) { // If we are closing the settings
        setApiKeyInputValue(''); // Clear potentially sensitive input
        setKeyOpError(null);
        setKeyOpSuccessMessage(null);
    }
  };

  const handleSaveApiKey = async () => {
    if (!apiKeyInputValue.trim() || !user?.uid) return;

    setIsSavingKey(true);
    setKeyOpError(null);
    setKeyOpSuccessMessage(null);
    try {
      await saveUserApiKeyToContextAndDb(user.uid, apiKeyInputValue.trim());
      setKeyOpSuccessMessage("API Key saved successfully!");
      setApiKeyInputValue(''); // Clear input on success
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save API key.";
      setKeyOpError(message);
      console.error("Error saving API key:", error);
    } finally {
      setIsSavingKey(false);
    }
  };

  const handleDeleteApiKey = async () => {
    if (!user?.uid) return;

    // Add confirmation dialog
    const isConfirmed = window.confirm("Are you sure you want to delete your API Key? This action cannot be undone.");
    if (!isConfirmed) {
      return;
    }

    setIsDeletingKey(true);
    setKeyOpError(null);
    setKeyOpSuccessMessage(null);
    try {
      await deleteUserApiKeyFromContextAndDb(user.uid);
      setKeyOpSuccessMessage("API Key deleted successfully!");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete API key.";
      setKeyOpError(message);
      console.error("Error deleting API key:", error);
    } finally {
      setIsDeletingKey(false);
    }
  };

  // Effect to clear local op messages when settings are closed or global key changes
  useEffect(() => {
    if (!showUserSettings) {
      setKeyOpError(null);
      setKeyOpSuccessMessage(null);
      // apiKeyInputValue is cleared by toggleUserSettings when closing
    }
  }, [showUserSettings]);

  useEffect(() => {
    // If global key status changes (e.g. fetched, or cleared by another instance),
    // clear local messages as they might be stale.
    setKeyOpError(null);
    setKeyOpSuccessMessage(null);
  }, [userApiKey, isGlobalApiKeyLoading]);


  if (!user) {
    return <p className="text-center text-textPrimary py-10">Loading user data or user not found...</p>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-transparent text-gray-800 dark:text-textPrimary">
      <Header
        onSignOut={handleSignOut}
        userName={user.displayName || user.email}
        onToggleSettings={toggleUserSettings}
      />
      
      <main className="container mx-auto px-4 py-8 flex-grow">
        {showSignOutError && <p className="text-center text-danger mb-4 bg-danger/10 p-3 rounded-lg border border-danger">{showSignOutError}</p>}

        {/* User Settings Section */}
        {showUserSettings && (
          <section className="my-6 p-6 bg-surface dark:bg-gray_800 rounded-xl shadow-lg border border-borderLight dark:border-borderDark">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-textPrimary dark:text-textPrimary">
                User Settings
              </h2>
              {/* Optional: Add a close button for the settings section here */}
            </div>

            <div>
              <h3 className="text-lg font-medium text-textPrimary dark:text-textPrimary mb-2">Gemini API Key</h3>
              <p className="text-sm text-textSecondary dark:text-textSecondary mb-3">
                Manage your Gemini API key for AI-powered features. Your key is stored securely.
              </p>

              <form onSubmit={handleApiKeyFormSubmit} className="space-y-4">
                <div> {/* Grouping label and input */}
                  <label htmlFor="apiKeyInput" className="block text-sm font-medium text-textSecondary dark:text-textSecondary mb-1">
                    API Key
                  </label>
                  <input
                    type="password"
                    id="apiKeyInput"
                    value={apiKeyInputValue}
                    onChange={(e) => {
                      setApiKeyInputValue(e.target.value);
                      setKeyOpError(null); // Clear error when user types
                      setKeyOpSuccessMessage(null); // Clear success message
                    }}
                    placeholder="Enter your Gemini API Key"
                    className="w-full max-w-md bg-transparent p-2.5 text-textPrimary dark:text-textPrimary placeholder-textMuted dark:placeholder-textMuted focus:outline-none focus:ring-2 focus:ring-primary rounded-lg border border-borderLight dark:border-borderDark"
                    disabled={isSavingKey || isDeletingKey || isGlobalApiKeyLoading}
                  />
                </div>

                <Button
                  type="submit" // Important for form submission
                  variant="primary"
                  // onClick={handleSaveApiKey} // Removed as form onSubmit handles it
                  disabled={!apiKeyInputValue.trim() || isSavingKey || isDeletingKey || isGlobalApiKeyLoading}
                  leftIcon={isSavingKey ? <Spinner size="sm" /> : undefined}
                >
                  {isSavingKey ? 'Saving...' : 'Save API Key'}
                </Button>
              </form>

              {/* Delete button and feedback messages remain outside the form, but related */}
              <div className="mt-6 pt-4 border-t border-borderLight dark:border-borderDark/20">
                <Button
                  variant="danger"
                  onClick={handleDeleteApiKey}
                  disabled={!userApiKey || isDeletingKey || isSavingKey || isGlobalApiKeyLoading}
                  leftIcon={isDeletingKey ? <Spinner size="sm" /> : undefined}
                >
                  {isDeletingKey ? 'Deleting...' : 'Delete API Key'}
                </Button>
              </div>

              {/* Combined feedback area - consider placing this near both save and delete actions if universal */}
              <div className="h-10 mt-2 mb-2"> {/* Reserve space to prevent layout shifts */}
                {keyOpError && (
                  <p className="text-sm text-danger flex items-center">
                    <AlertCircle size={16} className="mr-2 flex-shrink-0" /> {keyOpError}
                  </p>
                )}
                {keyOpSuccessMessage && (
                  <p className="text-sm text-success flex items-center">
                    <CheckCircle size={16} className="mr-2 flex-shrink-0" /> {keyOpSuccessMessage}
                  </p>
                )}
                {globalApiKeyError && !keyOpError && ( // Show global context error if no local op error
                  <p className="text-sm text-danger flex items-center">
                    <AlertCircle size={16} className="mr-2 flex-shrink-0" /> Context Error: {globalApiKeyError}
                  </p>
                )}
              </div>

              <div className="text-sm text-textSecondary dark:text-textMuted mb-2" data-testid="api-key-status">
                API Key Status: {isGlobalApiKeyLoading ? <Spinner size="xs" className="inline ml-1" /> :
                  (userApiKey ? `Set (Gemini Key: ...${userApiKey.length > 4 ? userApiKey.slice(-4) : userApiKey})` : 'Not Set')}
              </div>
            </div>
            {/* Other settings can be added below */}
          </section>
        )}

        <CategoryTabs selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />
        <div className="mb-6 flex flex-wrap justify-center sm:justify-start -m-1">
          {(['all', 'active', 'completed'] as TaskFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 m-1 rounded-lg text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background
                ${filter === f ? 'bg-primary text-white shadow-lg scale-105' : 'bg-surface text-textSecondary hover:bg-surface-lighter hover:text-textPrimary shadow-sm hover:shadow-md'}`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <TaskForm selectedCategory={selectedCategory} user={user} />
        <TaskList selectedCategory={selectedCategory} filter={filter} user={user} />
      </main>

      <footer className="text-center py-8 text-xs text-gray-500 dark:text-textMuted border-t border-gray-200 dark:border-borderDark/30">
        &copy; {new Date().getFullYear()} Dad's Command Center. Master your tasks, champion your day.
      </footer>
    </div>
  );
};