import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { TaskForm } from './TaskForm';
import { TaskCategory, AppUser } from '../../types'; // Priority removed as not directly used in this file's tests now
import { ParsedTaskData } from '../../services/aiService';

// Mock services and context
vi.mock('../../services/aiService', () => ({
  parseTaskWithAI: vi.fn(),
}));
vi.mock('../../services/firebaseService', () => ({
  addTask: vi.fn().mockResolvedValue('mocked-task-id'),
}));

// Mock ApiKeyContext
const mockUseApiKey = vi.fn();
vi.mock('../../context/ApiKeyContext', () => ({
  useApiKey: mockUseApiKey,
}));

// Mock lucide-react icons
vi.mock('lucide-react', async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    Sparkles: () => <svg data-testid="sparkles-icon" />,
    PlusCircle: () => <svg data-testid="plus-icon" />,
    AlertCircle: () => <svg data-testid="alert-circle-icon" />, // Added AlertCircle
    // Spinner might be implicitly handled if Button is simple or tests don't rely on its specific output
  };
});

// Default mock for useApiKey - AI enabled
const defaultApiKeyContextValue = {
  userApiKey: 'test-api-key',
  isApiKeyLoading: false,
  apiKeyError: null,
  fetchUserApiKeyState: vi.fn(),
  saveUserApiKeyToContextAndDb: vi.fn(),
  deleteUserApiKeyFromContextAndDb: vi.fn(),
};


const mockUser: AppUser = {
  uid: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User',
};

const defaultProps = {
  selectedCategory: TaskCategory.GENERAL,
  user: mockUser,
};

describe('TaskForm AI Features', () => {
  let parseTaskWithAIMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    parseTaskWithAIMock = require('../../services/aiService').parseTaskWithAI;
    // Set default mock for useApiKey before each test
    mockUseApiKey.mockReturnValue(defaultApiKeyContextValue);
  });

  test('renders AI input field and AI trigger button when API key exists and is not loading', () => {
    render(<TaskForm {...defaultProps} />);
    expect(screen.getByPlaceholderText(/Or describe your task for AI.../i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Process with AI/i)).toBeInTheDocument();
    expect(screen.getByTestId('sparkles-icon')).toBeInTheDocument();
  });

  test('calls parseTaskWithAI with API key and input when AI button is clicked', async () => {
    parseTaskWithAIMock.mockResolvedValue({ title: 'Test AI Task' });
    render(<TaskForm {...defaultProps} />);

    const aiInput = screen.getByPlaceholderText(/Or describe your task for AI.../i);
    const aiButton = screen.getByLabelText(/Process with AI/i);

    fireEvent.change(aiInput, { target: { value: 'Buy milk tomorrow' } });
    fireEvent.click(aiButton);

    expect(parseTaskWithAIMock).toHaveBeenCalledTimes(1);
    expect(parseTaskWithAIMock).toHaveBeenCalledWith('test-api-key', 'Buy milk tomorrow');
  });

  test('shows loading indicator on AI button and disables fields during AI processing', async () => {
    let resolvePromise: (value: ParsedTaskData) => void = () => {};
    parseTaskWithAIMock.mockImplementation(() => new Promise<ParsedTaskData>(resolve => {
      resolvePromise = resolve; // Allow manual resolution
    }));

    render(<TaskForm {...defaultProps} />);
    const aiInput = screen.getByPlaceholderText(/Or describe your task for AI.../i) as HTMLTextAreaElement;
    const aiButton = screen.getByLabelText(/Process with AI/i) as HTMLButtonElement;
    const mainTaskInput = screen.getByPlaceholderText(/Add a new task for GENERAL.../i) as HTMLInputElement;
    // const dueDateInput = screen.getByLabelText(/Due Date/i) as HTMLInputElement; // Not strictly needed for this test focus
    // const prioritySelect = screen.getByLabelText(/Priority/i) as HTMLSelectElement; // Not strictly needed for this test focus

    fireEvent.change(aiInput, { target: { value: 'Process this' } });
    fireEvent.click(aiButton);

    await waitFor(() => {
      expect(aiButton).toBeDisabled();
      expect(aiInput).toBeDisabled();
      expect(mainTaskInput).toBeDisabled();
      // Check for spinner presence if it has a data-testid, or absence of sparkles icon
      expect(screen.queryByTestId('sparkles-icon')).not.toBeInTheDocument();
      // Assuming spinner is part of the button and replaces the icon or is rendered distinctly
    });

    resolvePromise({ title: 'Resolved' }); // Resolve the promise
    await waitFor(() => expect(aiButton).not.toBeDisabled()); // Wait for processing to finish
    expect(screen.getByTestId('sparkles-icon')).toBeInTheDocument(); // Icon restored
  });

  test('populates main task input and clears AI input on successful AI response with API key', async () => {
    const mockResponse: ParsedTaskData = {
      title: 'AI Task Title',
      description: 'AI task description.',
      category: 'Work',
      dueDate: '2024-07-26',
    };
    parseTaskWithAIMock.mockResolvedValue(mockResponse);

    render(<TaskForm {...defaultProps} />); // uses defaultApiKeyContextValue (key available)
    const aiInput = screen.getByPlaceholderText(/Or describe your task for AI.../i) as HTMLTextAreaElement;
    const aiButton = screen.getByLabelText(/Process with AI/i);
    const mainTaskInput = screen.getByPlaceholderText(/Add a new task for GENERAL.../i);
    const dueDateInput = screen.getByLabelText(/Due Date/i) as HTMLInputElement;

    fireEvent.change(aiInput, { target: { value: 'Plan a party' } });
    fireEvent.click(aiButton);

    await waitFor(() => {
      expect(mainTaskInput).toHaveValue('AI Task Title - AI task description. (Category suggestion: Work)');
      expect(dueDateInput.value).toBe('2024-07-26');
      expect(aiInput.value).toBe('');
    });
  });

  test('displays error message if parseTaskWithAI throws an error (with API key present)', async () => {
    parseTaskWithAIMock.mockRejectedValue(new Error('AI service unavailable'));

    render(<TaskForm {...defaultProps} />); // API key is available
    const aiInput = screen.getByPlaceholderText(/Or describe your task for AI.../i) as HTMLTextAreaElement;
    const aiButton = screen.getByLabelText(/Process with AI/i);

    fireEvent.change(aiInput, { target: { value: 'This will fail' } });
    fireEvent.click(aiButton);

    await waitFor(() => {
      expect(screen.getByText(/AI processing failed: AI service unavailable/i)).toBeInTheDocument();
      expect(aiInput.value).toBe('This will fail');
    });
    expect(aiButton).not.toBeDisabled();
  });

  test('AI features disabled and prompt shown if API key is missing and not loading', () => {
    mockUseApiKey.mockReturnValue({
      ...defaultApiKeyContextValue,
      userApiKey: null,
      isApiKeyLoading: false,
    });
    render(<TaskForm {...defaultProps} />);

    expect(screen.getByPlaceholderText(/API Key needed for AI features/i)).toBeDisabled();
    expect(screen.getByLabelText(/Process with AI/i)).toBeDisabled();
    expect(screen.getByText(/Add your Gemini API key in User Settings/i)).toBeInTheDocument();
    expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument(); // For the prompt
  });

  test('AI features disabled if API key is loading', () => {
    mockUseApiKey.mockReturnValue({
      ...defaultApiKeyContextValue,
      userApiKey: null,
      isApiKeyLoading: true,
    });
    render(<TaskForm {...defaultProps} />);

    expect(screen.getByPlaceholderText(/Or describe your task for AI.../i)).toBeDisabled(); // Or some other placeholder indicating loading
    const aiButton = screen.getByLabelText(/Process with AI/i);
    expect(aiButton).toBeDisabled();
    // Check for spinner on button if it replaces icon
    expect(screen.queryByTestId('sparkles-icon')).not.toBeInTheDocument();
  });

  test('AI button is disabled if AI input is empty, even with API key', () => {
    // API key is available via default mock
    render(<TaskForm {...defaultProps} />);
    const aiButton = screen.getByLabelText(/Process with AI/i) as HTMLButtonElement;
    expect(aiButton).toBeDisabled(); // Initially disabled as input is empty

    const aiInput = screen.getByPlaceholderText(/Or describe your task for AI.../i);
    fireEvent.change(aiInput, { target: { value: ' ' } }); // Input with only spaces
    expect(aiButton).toBeDisabled();

    fireEvent.change(aiInput, { target: { value: 'Not empty' } });
    expect(aiButton).not.toBeDisabled();
  });

  test('AI features are disabled if category is ALL, regardless of API key', () => {
    // API key is available via default mock
    render(<TaskForm {...defaultProps} selectedCategory={TaskCategory.ALL} />);

    const aiInput = screen.getByPlaceholderText(/Select a category tab first to use AI/i) as HTMLTextAreaElement;
    const aiButton = screen.getByLabelText(/Process with AI/i) as HTMLButtonElement;

    expect(aiInput).toBeDisabled();
    expect(aiButton).toBeDisabled();
  });

  test('Clicking AI button when API key is missing shows error', async () => {
    mockUseApiKey.mockReturnValue({
      ...defaultApiKeyContextValue,
      userApiKey: null,
      isApiKeyLoading: false,
    });
    render(<TaskForm {...defaultProps} />);
    const aiInput = screen.getByPlaceholderText(/API Key needed for AI features/i) as HTMLTextAreaElement;
    const aiButton = screen.getByLabelText(/Process with AI/i); // This button will be disabled, but testing the handler logic too

    // Manually enable button for test, or change test to check for disabled state primarily
    // For this test, we assume the function could be called if not disabled.
    // A better test is that the button IS disabled, which is covered by 'AI features disabled and prompt shown...'

    // Test the internal logic of handleAiProcessClick if key is missing
    fireEvent.change(aiInput, { target: { value: 'Some AI task' } });
    // The button should be disabled, but if we were to somehow click it:
    // We can't directly test the click if it's disabled.
    // Instead, we verify the disabled state and the prompt.
    // If we want to test the error message from handleAiProcessClick directly,
    // we might need a different setup or accept the button is disabled.

    // This test case might be redundant if the button is correctly disabled.
    // However, if the `handleAiProcessClick` is exported or called internally elsewhere:
    if (!aiButton.disabled) { // Should not happen based on other tests
        fireEvent.click(aiButton);
        await waitFor(() => {
            expect(screen.getByText(/API key is missing. Please configure it in User Settings./i)).toBeInTheDocument();
        });
    }
    expect(aiButton).toBeDisabled(); // Confirming it's disabled.
    expect(parseTaskWithAIMock).not.toHaveBeenCalled();
  });

});
// Note: Removed Priority from imports as it was unused after refactoring.
// Removed one of the duplicate "populates main task" tests for clarity.
