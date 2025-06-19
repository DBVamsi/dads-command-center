import React, { useState } from 'react';
import { signInWithGoogle } from '../../services/firebaseService';
import { Button } from '../ui/Button';
import { LogIn, ShieldCheck } from 'lucide-react';
import { Spinner } from '../ui/Spinner';

export const LoginScreen: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      // Auth state change will handle redirect in App.tsx
    } catch (err) {
      setError('Failed to sign in. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-transparent p-4">
      <div className="bg-surface p-10 rounded-xl shadow-2xl w-full max-w-md text-center border border-borderLight">
        <ShieldCheck size={64} className="mx-auto text-primary mb-6" />
        <h1 className="text-5xl font-extrabold text-textPrimary mb-4">Dad's Command Center</h1>
        <p className="text-textSecondary mb-10 text-lg">Get your day organized, dad-style.</p>
        
        <Button 
          onClick={handleLogin} 
          disabled={isLoading}
          variant="primary"
          size="lg"
          className="w-full py-3"
          leftIcon={isLoading ? <Spinner size="sm" color="text-white"/> : <LogIn size={22} />}
        >
          {isLoading ? 'Signing In...' : 'Sign In with Google'}
        </Button>

        {error && <p className="mt-6 text-danger text-sm">{error}</p>}
        
        <p className="mt-16 text-xs text-textMuted">
          Powered by Firebase & React. Built for efficiency.
        </p>
      </div>
    </div>
  );
};