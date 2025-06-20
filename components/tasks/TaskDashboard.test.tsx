import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi } from 'vitest';
import { TaskDashboard } from './TaskDashboard';
import { AppUser, TaskCategory } from '../../types'; // Assuming TaskCategory might be needed for default props
import { ApiKeyContextType } from '../../context/ApiKeyContext';

// --- Mocks ---
const mockSignOutUser = vi.fn();
vi.mock('../../services/firebaseService', () => ({
  signOutUser: mockSignOutUser,
  // Add other firebase functions if TaskDashboard directly calls them, though most should be in contexts/hooks
}));

const mockUseApiKey = vi.fn();
const mockSaveUserApiKeyToContextAndDb = vi.fn();
const mockDeleteUserApiKeyFromContextAndDb = vi.fn();
const mockFetchUserApiKeyState = vi.fn();

vi.mock('../../context/ApiKeyContext', () => ({
  useApiKey: mockUseApiKey,
}));

vi.mock('lucide-react', async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    LayoutDashboard: () => <div data-testid="layout-dashboard-icon" />,
    Moon: () => <div data-testid="moon-icon" />,
    Sun: () => <div data-testid="sun-icon" />,
    Settings: () => <div data-testid="settings-icon" />, // For header button
    SettingsIcon: () => <div data-testid="settings-icon" />, // Used in TaskDashboard
    LogOut: () => <div data-testid="logout-icon" />,
    AlertCircle: () => <div data-testid="alert-circle-icon" />,
    CheckCircle: () => <div data-testid="check-circle-icon" />,
    Spinner: ({size}: {size?:string}) => <div data-testid={`spinner-icon-${size || 'default'}`} />,
  };
});

vi.mock('use-local-storage-state', () => ({
  __esModule: true,
  default: vi.fn(() => ['dark', vi.fn()]), // Mock theme state
}));

const mockUser: AppUser = {
  uid: 'test-user-123',
  email: 'test@example.com',
  displayName: 'Test User',
};

const defaultApiKeyContextValue: ApiKeyContextType = {
  userApiKey: null,
  isApiKeyLoading: false,
  apiKeyError: null,
  fetchUserApiKeyState: mockFetchUserApiKeyState,
  saveUserApiKeyToContextAndDb: mockSaveUserApiKeyToContextAndDb,
  deleteUserApiKeyFromContextAndDb: mockDeleteUserApiKeyFromContextAndDb,
};

// Helper to render TaskDashboard and open settings
async function renderDashboardAndOpenSettings(apiKeyContextOverrides: Partial<ApiKeyContextType> = {}) {
  mockUseApiKey.mockReturnValue({ ...defaultApiKeyContextValue, ...apiKeyContextOverrides });

  render(<TaskDashboard user={mockUser} />);

  const settingsButton = screen.getByLabelText(/Open settings/i);
  expect(settingsButton).toBeInTheDocument();
  fireEvent.click(settingsButton);

  // Wait for a distinctive element in the settings panel to ensure it's open
  await screen.findByText('Gemini API Key');
}


describe('TaskDashboard - API Key Management', () => {
  let mockConfirm: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseApiKey.mockReturnValue(defaultApiKeyContextValue); // Reset to default before each test
    mockSaveUserApiKeyToContextAndDb.mockResolvedValue(undefined);
    mockDeleteUserApiKeyFromContextAndDb.mockResolvedValue(undefined);
    mockConfirm = vi.spyOn(window, 'confirm').mockReturnValue(true); // Default to user confirming
  });

  afterEach(() => {
    mockConfirm.mockRestore();
  });

  test('renders API key management UI when settings panel is open', async () => {
    await renderDashboardAndOpenSettings();
    expect(screen.getByPlaceholderText(/Enter your Gemini API Key/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save API Key/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Delete API Key/i })).toBeInTheDocument();
    expect(screen.getByTestId('api-key-status')).toBeInTheDocument();
  });

  describe('Initial State Display', () => {
    test('shows "API Key: Not Set" and disabled Delete button if no key exists', async () => {
      await renderDashboardAndOpenSettings({ userApiKey: null, isApiKeyLoading: false });
      expect(screen.getByTestId('api-key-status')).toHaveTextContent('API Key Status: Not Set');
      expect(screen.getByRole('button', { name: /Delete API Key/i })).toBeDisabled();
    });

    test('shows masked API key and enabled Delete button if key exists', async () => {
      await renderDashboardAndOpenSettings({ userApiKey: 'test-api-key', isApiKeyLoading: false });
      expect(screen.getByTestId('api-key-status')).toHaveTextContent('API Key Status: Set (Gemini Key: ...-key)');
      expect(screen.getByRole('button', { name: /Delete API Key/i })).toBeEnabled();
    });

    test('shows loading status if isApiKeyLoading is true', async () => {
      await renderDashboardAndOpenSettings({ isApiKeyLoading: true });
      expect(screen.getByTestId('api-key-status')).toHaveTextContent(/Loading/i);
      expect(screen.getByTestId('spinner-icon-xs')).toBeInTheDocument();
    });
  });

  test('input field updates state and enables Save button', async () => {
    await renderDashboardAndOpenSettings();
    const input = screen.getByPlaceholderText(/Enter your Gemini API Key/i) as HTMLInputElement;
    const saveButton = screen.getByRole('button', { name: /Save API Key/i });

    expect(saveButton).toBeDisabled(); // Initially disabled as input is empty
    fireEvent.change(input, { target: { value: 'new-key' } });
    expect(input.value).toBe('new-key');
    expect(saveButton).toBeEnabled();
  });

  describe('Save API Key', () => {
    test('calls saveUserApiKeyToContextAndDb, shows success, and clears input', async () => {
      await renderDashboardAndOpenSettings();
      const input = screen.getByPlaceholderText(/Enter your Gemini API Key/i) as HTMLInputElement;
      const saveButton = screen.getByRole('button', { name: /Save API Key/i });

      fireEvent.change(input, { target: { value: 'new-api-key' } });
      fireEvent.click(saveButton);

      expect(saveButton).toBeDisabled(); // Should be disabled during save
      expect(screen.getByTestId('spinner-icon-sm')).toBeInTheDocument(); // Spinner on button

      await waitFor(() => {
        expect(mockSaveUserApiKeyToContextAndDb).toHaveBeenCalledWith(mockUser.uid, 'new-api-key');
        expect(screen.getByText('API Key saved successfully!')).toBeInTheDocument();
        expect(input.value).toBe(''); // Input cleared
      });
      expect(saveButton).toBeEnabled(); // Re-enabled
    });

    test('shows error message on save failure', async () => {
      mockSaveUserApiKeyToContextAndDb.mockRejectedValue(new Error('Save failed miserably'));
      await renderDashboardAndOpenSettings();
      const input = screen.getByPlaceholderText(/Enter your Gemini API Key/i);
      const saveButton = screen.getByRole('button', { name: /Save API Key/i });

      fireEvent.change(input, { target: { value: 'fail-key' } });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Save failed miserably')).toBeInTheDocument();
      });
      expect(saveButton).toBeEnabled();
    });
  });

  describe('Delete API Key', () => {
    test('confirms, calls deleteUserApiKeyToContextAndDb, and shows success', async () => {
      await renderDashboardAndOpenSettings({ userApiKey: 'existing-key' });
      const deleteButton = screen.getByRole('button', { name: /Delete API Key/i });

      fireEvent.click(deleteButton);

      expect(mockConfirm).toHaveBeenCalledWith("Are you sure you want to delete your API Key? This action cannot be undone.");
      expect(deleteButton).toBeDisabled();
      expect(screen.getByTestId('spinner-icon-sm')).toBeInTheDocument(); // Spinner on button

      await waitFor(() => {
        expect(mockDeleteUserApiKeyFromContextAndDb).toHaveBeenCalledWith(mockUser.uid);
        expect(screen.getByText('API Key deleted successfully!')).toBeInTheDocument();
      });
      expect(deleteButton).toBeDisabled(); // Still disabled as userApiKey from context would now be null
    });

    test('does not call delete if user cancels confirmation', async () => {
      mockConfirm.mockReturnValue(false);
      await renderDashboardAndOpenSettings({ userApiKey: 'existing-key' });
      const deleteButton = screen.getByRole('button', { name: /Delete API Key/i });

      fireEvent.click(deleteButton);

      expect(mockConfirm).toHaveBeenCalled();
      expect(mockDeleteUserApiKeyFromContextAndDb).not.toHaveBeenCalled();
      expect(deleteButton).toBeEnabled();
    });

    test('shows error message on delete failure', async () => {
      mockDeleteUserApiKeyFromContextAndDb.mockRejectedValue(new Error('Delete failed badly'));
      await renderDashboardAndOpenSettings({ userApiKey: 'existing-key' });
      const deleteButton = screen.getByRole('button', { name: /Delete API Key/i });

      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText('Delete failed badly')).toBeInTheDocument();
      });
      expect(deleteButton).toBeEnabled(); // Re-enabled (key still exists on error)
    });
  });

  describe('Button Disabled States (Context-driven)', () => {
    test('Save and Delete buttons are disabled if isGlobalApiKeyLoading is true', async () => {
      await renderDashboardAndOpenSettings({ isApiKeyLoading: true, userApiKey: 'some-key' });
      const input = screen.getByPlaceholderText(/Enter your Gemini API Key/i);
      fireEvent.change(input, { target: { value: 'new-key' } }); // Enable save by typing

      expect(screen.getByRole('button', { name: /Save API Key/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /Delete API Key/i })).toBeDisabled();
    });
  });
});
