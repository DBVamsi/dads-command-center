import React, { ReactNode } from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { ApiKeyProvider, useApiKey } from './ApiKeyContext'; // Adjust path as needed

// Mock firebaseService
const mockGetUserApiKey = vi.fn();
const mockSaveUserApiKey = vi.fn();
const mockDeleteUserApiKey = vi.fn();

vi.mock('../services/firebaseService', () => ({
  getUserApiKey: mockGetUserApiKey,
  saveUserApiKey: mockSaveUserApiKey,
  deleteUserApiKey: mockDeleteUserApiKey,
}));

// A simple consumer component to display context values for testing
const TestConsumer: React.FC = () => {
  const {
    userApiKey,
    isApiKeyLoading,
    apiKeyError,
    fetchUserApiKeyState, // Exposing for direct call if needed in some tests, though useEffect is primary
    saveUserApiKeyToContextAndDb,
    deleteUserApiKeyFromContextAndDb,
  } = useApiKey();

  return (
    <div>
      <div data-testid="userApiKey">{userApiKey === null ? 'null' : userApiKey}</div>
      <div data-testid="isApiKeyLoading">{isApiKeyLoading.toString()}</div>
      <div data-testid="apiKeyError">{apiKeyError === null ? 'null' : apiKeyError}</div>
      {/* Buttons to trigger actions for more direct testing if needed, though not primary focus for provider tests */}
      <button onClick={() => fetchUserApiKeyState('manual-test-user')}>ManualFetch</button>
      <button onClick={() => saveUserApiKeyToContextAndDb('manual-test-user', 'new-manual-key')}>ManualSave</button>
      <button onClick={() => deleteUserApiKeyFromContextAndDb('manual-test-user')}>ManualDelete</button>
    </div>
  );
};

// Helper to render provider with consumer
const renderProvider = (userId: string | null) => {
  return render(
    <ApiKeyProvider userId={userId}>
      <TestConsumer />
    </ApiKeyProvider>
  );
};


describe('ApiKeyProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mocks for successful operations
    mockGetUserApiKey.mockResolvedValue(null); // Default to no key found
    mockSaveUserApiKey.mockResolvedValue(undefined);
    mockDeleteUserApiKey.mockResolvedValue(undefined);
  });

  test('initial state: userApiKey is null, isApiKeyLoading is true (then false after initial fetch for null userId)', async () => {
    renderProvider(null);
    // Initially true because userId is null, then useEffect runs, sets loading to false.
    expect(screen.getByTestId('isApiKeyLoading').textContent).toBe('true');
    await waitFor(() => expect(screen.getByTestId('isApiKeyLoading').textContent).toBe('false'));
    expect(screen.getByTestId('userApiKey').textContent).toBe('null');
    expect(screen.getByTestId('apiKeyError').textContent).toBe('null');
  });

  describe('useEffect behavior (userId changes)', () => {
    test('fetches API key when userId is provided on mount', async () => {
      mockGetUserApiKey.mockResolvedValue('test-key-123');
      renderProvider('user-1');

      expect(screen.getByTestId('isApiKeyLoading').textContent).toBe('true'); // Initial loading
      await waitFor(() => expect(mockGetUserApiKey).toHaveBeenCalledWith('user-1'));
      expect(screen.getByTestId('userApiKey').textContent).toBe('test-key-123');
      expect(screen.getByTestId('isApiKeyLoading').textContent).toBe('false');
    });

    test('fetches API key again when userId prop changes', async () => {
      mockGetUserApiKey.mockResolvedValueOnce('key-for-user1');
      const { rerender } = render(
        <ApiKeyProvider userId="user-1">
          <TestConsumer />
        </ApiKeyProvider>
      );
      await waitFor(() => expect(screen.getByTestId('userApiKey').textContent).toBe('key-for-user1'));

      mockGetUserApiKey.mockResolvedValueOnce('key-for-user2');
      rerender(
        <ApiKeyProvider userId="user-2">
          <TestConsumer />
        </ApiKeyProvider>
      );

      expect(screen.getByTestId('isApiKeyLoading').textContent).toBe('true'); // Starts loading on prop change
      await waitFor(() => expect(mockGetUserApiKey).toHaveBeenCalledWith('user-2'));
      expect(screen.getByTestId('userApiKey').textContent).toBe('key-for-user2');
      expect(screen.getByTestId('isApiKeyLoading').textContent).toBe('false');
    });

    test('clears userApiKey and apiKeyError when userId becomes null (logout)', async () => {
      mockGetUserApiKey.mockResolvedValueOnce('key-for-user1');
      const { rerender } = render(
        <ApiKeyProvider userId="user-1">
          <TestConsumer />
        </ApiKeyProvider>
      );
      await waitFor(() => expect(screen.getByTestId('userApiKey').textContent).toBe('key-for-user1'));

      // Simulate logout by passing null userId
      rerender(
        <ApiKeyProvider userId={null}>
          <TestConsumer />
        </ApiKeyProvider>
      );

      // Should not be loading, key should be null
      await waitFor(() => {
        expect(screen.getByTestId('userApiKey').textContent).toBe('null');
        expect(screen.getByTestId('isApiKeyLoading').textContent).toBe('false');
        expect(screen.getByTestId('apiKeyError').textContent).toBe('null');
      });
    });
  });

  describe('fetchUserApiKeyState', () => {
    test('updates userApiKey and sets isApiKeyLoading to false on successful fetch', async () => {
      mockGetUserApiKey.mockResolvedValue('fetched-key');
      renderProvider('test-user'); // Triggers useEffect -> fetch

      await waitFor(() => expect(mockGetUserApiKey).toHaveBeenCalledWith('test-user'));
      expect(screen.getByTestId('userApiKey').textContent).toBe('fetched-key');
      expect(screen.getByTestId('isApiKeyLoading').textContent).toBe('false');
    });

    test('sets userApiKey to null if no key is found', async () => {
      mockGetUserApiKey.mockResolvedValue(null);
      renderProvider('test-user');

      await waitFor(() => expect(mockGetUserApiKey).toHaveBeenCalledWith('test-user'));
      expect(screen.getByTestId('userApiKey').textContent).toBe('null');
      expect(screen.getByTestId('isApiKeyLoading').textContent).toBe('false');
    });

    test('sets apiKeyError and userApiKey to null on fetch failure', async () => {
      mockGetUserApiKey.mockRejectedValue(new Error('Fetch failed'));
      renderProvider('test-user');

      await waitFor(() => expect(mockGetUserApiKey).toHaveBeenCalledWith('test-user'));
      expect(screen.getByTestId('apiKeyError').textContent).toBe('Failed to fetch API key.');
      expect(screen.getByTestId('userApiKey').textContent).toBe('null');
      expect(screen.getByTestId('isApiKeyLoading').textContent).toBe('false');
    });
  });

  describe('saveUserApiKeyToContextAndDb', () => {
    // Note: These tests will use the "ManualSave" button for more direct invocation,
    // assuming userId is passed correctly or use a wrapper to set userId for the provider.
    // For simplicity, we'll assume 'manual-test-user' is active in the provider for these.

    test('updates userApiKey on successful save', async () => {
      renderProvider('manual-test-user'); // Ensure userId is set
      await waitFor(() => expect(screen.getByTestId('isApiKeyLoading').textContent).toBe('false')); // Wait for initial fetch

      mockSaveUserApiKey.mockResolvedValue(undefined);

      await act(async () => {
        // Need to get the save function from the context via the TestConsumer
        // This setup is a bit complex for direct calls, usually you test effects.
        // Let's trigger via button if possible or simplify by testing effect of prop changes.
        // For now, let's assume we can get the function and call it.
        const providerInternalSave = screen.getByText('ManualSave'); // Get button
        fireEvent.click(providerInternalSave); // This calls saveUserApiKeyToContextAndDb('manual-test-user', 'new-manual-key')
      });

      await waitFor(() => expect(mockSaveUserApiKey).toHaveBeenCalledWith('manual-test-user', 'new-manual-key'));
      expect(screen.getByTestId('userApiKey').textContent).toBe('new-manual-key');
      expect(screen.getByTestId('apiKeyError').textContent).toBe('null');
    });

    test('sets apiKeyError on save failure', async () => {
      renderProvider('manual-test-user');
      await waitFor(() => expect(screen.getByTestId('isApiKeyLoading').textContent).toBe('false'));

      mockSaveUserApiKey.mockRejectedValue(new Error('Save failed'));

      await act(async () => {
        const providerInternalSave = screen.getByText('ManualSave');
        fireEvent.click(providerInternalSave);
      });

      await waitFor(() => expect(mockSaveUserApiKey).toHaveBeenCalledWith('manual-test-user', 'new-manual-key'));
      expect(screen.getByTestId('apiKeyError').textContent).toBe('Failed to save API key.');
       // userApiKey might remain old key or be cleared depending on desired behavior in context. Current: not cleared.
    });
  });

  describe('deleteUserApiKeyFromContextAndDb', () => {
    test('sets userApiKey to null on successful delete', async () => {
      // Set an initial key by mocking fetch
      mockGetUserApiKey.mockResolvedValue('key-to-delete');
      renderProvider('manual-test-user');
      await waitFor(() => expect(screen.getByTestId('userApiKey').textContent).toBe('key-to-delete'));

      mockDeleteUserApiKey.mockResolvedValue(undefined);

      await act(async () => {
        const providerInternalDelete = screen.getByText('ManualDelete');
        fireEvent.click(providerInternalDelete);
      });

      await waitFor(() => expect(mockDeleteUserApiKey).toHaveBeenCalledWith('manual-test-user'));
      expect(screen.getByTestId('userApiKey').textContent).toBe('null');
      expect(screen.getByTestId('apiKeyError').textContent).toBe('null');
    });

    test('sets apiKeyError on delete failure', async () => {
      mockGetUserApiKey.mockResolvedValue('key-to-delete');
      renderProvider('manual-test-user');
      await waitFor(() => expect(screen.getByTestId('userApiKey').textContent).toBe('key-to-delete'));

      mockDeleteUserApiKey.mockRejectedValue(new Error('Delete failed'));

      await act(async () => {
        const providerInternalDelete = screen.getByText('ManualDelete');
        fireEvent.click(providerInternalDelete);
      });

      await waitFor(() => expect(mockDeleteUserApiKey).toHaveBeenCalledWith('manual-test-user'));
      expect(screen.getByTestId('apiKeyError').textContent).toBe('Failed to delete API key.');
      expect(screen.getByTestId('userApiKey').textContent).toBe('key-to-delete'); // Key remains on error
    });
  });
});

// Helper to make fireEvent available for manual button clicks in TestConsumer
import { fireEvent } from '@testing-library/react';
