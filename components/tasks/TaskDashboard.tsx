import React, { useState } from 'react';
import { AppUser, TaskCategory } from '../../types';
import { signOutUser } from '../../services/firebaseService';
import { CategoryTabs } from './CategoryTabs';
import { TaskForm } from './TaskForm';
import { TaskList } from './TaskList';
import { Button } from '../ui/Button';
import { LogOut, LayoutDashboard } from 'lucide-react'; // Changed icon to LayoutDashboard
import { TASK_CATEGORIES } from '../../constants';

interface TaskDashboardProps {
  user: AppUser;
}

const Header: React.FC<{ onSignOut: () => void; userName?: string | null }> = React.memo(({ onSignOut, userName }) => (
  <header className="bg-gray_950 shadow-xl p-4 sticky top-0 z-50 border-b border-borderDark/50">
    <div className="container mx-auto flex justify-between items-center">
      <div className="flex items-center">
        <LayoutDashboard size={32} className="text-primary mr-3" />
        <h1 className="text-3xl sm:text-4xl font-bold text-textPrimary tracking-tight">
          Dad's Command Center
        </h1>
      </div>
      <div className="flex items-center space-x-4">
        {userName && <span className="text-textSecondary text-sm sm:text-base hidden sm:block">Hi, {userName.split(' ')[0]}!</span>}
        <Button onClick={onSignOut} variant="outline" size="md" leftIcon={<LogOut size={18} />}>
          Sign Out
        </Button>
      </div>
    </div>
  </header>
));
Header.displayName = 'Header'; // For React DevTools


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
    <div className="min-h-screen flex flex-col bg-transparent text-textPrimary">
      <Header onSignOut={handleSignOut} userName={user.displayName || user.email} />
      
      <main className="container mx-auto px-4 py-8 flex-grow">
        {showSignOutError && <p className="text-center text-danger mb-4 bg-danger/10 p-3 rounded-lg border border-danger">{showSignOutError}</p>}
        <CategoryTabs selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />
        <TaskForm selectedCategory={selectedCategory} user={user} />
        <TaskList selectedCategory={selectedCategory} user={user} />
      </main>

      <footer className="text-center py-8 text-xs text-textMuted border-t border-borderDark/30">
        &copy; {new Date().getFullYear()} Dad's Command Center. Master your tasks, champion your day.
      </footer>
    </div>
  );
};