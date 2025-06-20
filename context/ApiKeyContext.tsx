import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  getUserApiKey as fbGetUserApiKey,
  saveUserApiKey as fbSaveUserApiKey,
  deleteUserApiKey as fbDeleteUserApiKey,
} from '../services/firebaseService'; // Assuming path is correct

interface ApiKeyContextType {
  userApiKey: string | null;
  isApiKeyLoading: boolean;
  fetchUserApiKeyState: (userId: string) => Promise<void>; // Renamed for clarity within context
  saveUserApiKeyToContextAndDb: (userId: string, apiKey: string) => Promise<void>;
  deleteUserApiKeyFromContextAndDb: (userId: string) => Promise<void>;
  apiKeyError: string | null; // For displaying errors
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

interface ApiKeyProviderProps {
  children: ReactNode;
  userId: string | null; // User ID from App.tsx based on auth state
}

export const ApiKeyProvider: React.FC<ApiKeyProviderProps> = ({ children, userId }) => {
  const [userApiKey, setUserApiKey] = useState<string | null>(null);
  const [isApiKeyLoading, setIsApiKeyLoading] = useState<boolean>(true); // Start true on mount / userId change
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);

  const fetchUserApiKeyState = useCallback(async (currentUserId: string) => {
    if (!currentUserId) {
      setUserApiKey(null);
      setIsApiKeyLoading(false);
      return;
    }
    setIsApiKeyLoading(true);
    setApiKeyError(null);
    try {
      console.log(`ApiKeyProvider: Fetching API key for user ${currentUserId}`);
      const apiKey = await fbGetUserApiKey(currentUserId);
      setUserApiKey(apiKey);
      console.log(`ApiKeyProvider: API key for user ${currentUserId} fetched: ${apiKey ? 'Exists' : 'Not found'}`);
    } catch (error) {
      console.error('ApiKeyProvider: Error fetching user API key:', error);
      setApiKeyError('Failed to fetch API key.');
      setUserApiKey(null); // Clear key on error
    } finally {
      setIsApiKeyLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userId) {
      console.log(`ApiKeyProvider: userId changed to ${userId}, fetching key.`);
      fetchUserApiKeyState(userId);
    } else {
      console.log('ApiKeyProvider: userId is null, clearing API key state.');
      setUserApiKey(null);
      setIsApiKeyLoading(false); // No user, so not loading
      setApiKeyError(null);
    }
  }, [userId, fetchUserApiKeyState]);

  const saveUserApiKeyToContextAndDb = async (currentUserId: string, apiKey: string) => {
    if (!currentUserId) {
        console.error('ApiKeyProvider: No user ID provided to save API key.');
        setApiKeyError('Cannot save API key: User not identified.');
        return;
    }
    setIsApiKeyLoading(true); // Optional: provide loading feedback during save
    setApiKeyError(null);
    try {
      console.log(`ApiKeyProvider: Saving API key for user ${currentUserId}`);
      await fbSaveUserApiKey(currentUserId, apiKey);
      setUserApiKey(apiKey);
      console.log(`ApiKeyProvider: API key for user ${currentUserId} saved.`);
    } catch (error) {
      console.error('ApiKeyProvider: Error saving user API key:', error);
      setApiKeyError('Failed to save API key.');
      // Potentially leave old key in state or clear it? Clearing might be safer.
      // setUserApiKey(null);
    } finally {
      setIsApiKeyLoading(false); // Reset loading state
    }
  };

  const deleteUserApiKeyFromContextAndDb = async (currentUserId: string) => {
    if (!currentUserId) {
        console.error('ApiKeyProvider: No user ID provided to delete API key.');
        setApiKeyError('Cannot delete API key: User not identified.');
        return;
    }
    setIsApiKeyLoading(true); // Optional: provide loading feedback
    setApiKeyError(null);
    try {
      console.log(`ApiKeyProvider: Deleting API key for user ${currentUserId}`);
      await fbDeleteUserApiKey(currentUserId);
      setUserApiKey(null);
      console.log(`ApiKeyProvider: API key for user ${currentUserId} deleted.`);
    } catch (error) {
      console.error('ApiKeyProvider: Error deleting user API key:', error);
      setApiKeyError('Failed to delete API key.');
    } finally {
      setIsApiKeyLoading(false); // Reset loading state
    }
  };

  return (
    <ApiKeyContext.Provider
      value={{
        userApiKey,
        isApiKeyLoading,
        fetchUserApiKeyState,
        saveUserApiKeyToContextAndDb,
        deleteUserApiKeyFromContextAndDb,
        apiKeyError,
      }}
    >
      {children}
    </ApiKeyContext.Provider>
  );
};

export const useApiKey = (): ApiKeyContextType => {
  const context = useContext(ApiKeyContext);
  if (context === undefined) {
    throw new Error('useApiKey must be used within an ApiKeyProvider');
  }
  return context;
};
