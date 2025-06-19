import React, { useState, useEffect } from 'react';
import { AppUser, TaskCategory } from '../../types';
import { signOutUser } from '../../services/firebaseService';
import { CategoryTabs } from './CategoryTabs';
import { TaskForm } from './TaskForm';
import { TaskList } from './TaskList';
import { Button } from '../ui/Button';
import { LogOut, LayoutDashboard, Moon, Sun } from 'lucide-react';
import { TASK_CATEGORIES } from '../../constants';
import useLocalStorageState from 'use-local-storage-state';

interface TaskDashboardProps {
  user: AppUser;
}

const Header: React.FC<{ onSignOut: () => void; userName?: string | null }> = React.memo(({ onSignOut, userName }) => {
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
            <Button onClick={toggleTheme} variant="outline" size="sm" className="p-2">
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
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
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory>(TASK_CATEGORIES[0]);
  const [showSignOutError, setShowSignOutError] = useState<string | null>(null);

  const handleSignOut = async () => {
    setShowSignOutError(null);
    try {
      await signOutUser();
    } catch (error) {
      console.error("Sign out failed:", error);
      setShowSignOutError("Failed to sign out. Please try again.");
    }
  };

  if (!user) {
    return <p className="text-center text-textPrimary py-10">Loading user data or user not found...</p>; 
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-transparent text-gray-800 dark:text-textPrimary">
      <Header onSignOut={handleSignOut} userName={user.displayName || user.email} />
      
      <main className="container mx-auto px-4 py-8 flex-grow">
        {showSignOutError && <p className="text-center text-danger mb-4 bg-danger/10 p-3 rounded-lg border border-danger">{showSignOutError}</p>}
        <CategoryTabs selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />
        <TaskForm selectedCategory={selectedCategory} user={user} />
        <TaskList selectedCategory={selectedCategory} user={user} />
      </main>

      <footer className="text-center py-8 text-xs text-gray-500 dark:text-textMuted border-t border-gray-200 dark:border-borderDark/30">
        &copy; {new Date().getFullYear()} Dad's Command Center. Master your tasks, champion your day.
      </footer>
    </div>
  );
};