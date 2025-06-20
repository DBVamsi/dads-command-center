import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { TaskForm } from './TaskForm';
import { TaskCategory, AppUser, Priority } from '../../types';
import { ParsedTaskData } from '../../services/aiService';

// Mock the services
vi.mock('../../services/aiService', () => ({
  parseTaskWithAI: vi.fn(),
}));
// Mock firebaseService as it's a dependency, though not directly tested here
vi.mock('../../services/firebaseService', () => ({
  addTask: vi.fn().mockResolvedValue('mocked-task-id'),
}));

// Mock lucide-react icons
vi.mock('lucide-react', async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    Sparkles: () => <svg data-testid="sparkles-icon" />,
    PlusCircle: () => <svg data-testid="plus-icon" />,
    // Spinner is used internally by Button, if Button is complex, mock it too or ensure Spinner is simple
  };
});


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
  // Import mocked function with correct type after mocks are set up
  let parseTaskWithAIMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    // Dynamically import the mock implementation after vi.mock has run
    // and cast it to the spy type.
    parseTaskWithAIMock = require('../../services/aiService').parseTaskWithAI;
  });

  test('renders AI input field and AI trigger button', () => {
    render(<TaskForm {...defaultProps} />);
    expect(screen.getByPlaceholderText(/Or describe your task for AI.../i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Process with AI/i)).toBeInTheDocument();
    expect(screen.getByTestId('sparkles-icon')).toBeInTheDocument();
  });

  test('calls parseTaskWithAI with correct input when AI button is clicked', async () => {
    parseTaskWithAIMock.mockResolvedValue({ title: 'Test AI Task' });
    render(<TaskForm {...defaultProps} />);

    const aiInput = screen.getByPlaceholderText(/Or describe your task for AI.../i);
    const aiButton = screen.getByLabelText(/Process with AI/i);

    fireEvent.change(aiInput, { target: { value: 'Buy milk tomorrow' } });
    fireEvent.click(aiButton);

    expect(parseTaskWithAIMock).toHaveBeenCalledTimes(1);
    expect(parseTaskWithAIMock).toHaveBeenCalledWith('Buy milk tomorrow');
  });

  test('shows loading indicator during AI processing and disables fields', async () => {
    // Mock parseTaskWithAI to return a promise that doesn't resolve immediately
    let resolvePromise: (value: ParsedTaskData) => void = () => {};
    parseTaskWithAIMock.mockImplementation(() =>
      new Promise<ParsedTaskData>(resolve => {
        resolvePromise = resolve;
      })
    );

    render(<TaskForm {...defaultProps} />);

    const aiInput = screen.getByPlaceholderText(/Or describe your task for AI.../i) as HTMLTextAreaElement;
    const aiButton = screen.getByLabelText(/Process with AI/i) as HTMLButtonElement;
    const mainTaskInput = screen.getByPlaceholderText(/Add a new task for GENERAL.../i) as HTMLInputElement;
    const dueDateInput = screen.getByLabelText(/Due Date/i) as HTMLInputElement;
    const prioritySelect = screen.getByLabelText(/Priority/i) as HTMLSelectElement;


    fireEvent.change(aiInput, { target: { value: 'Process this' } });
    fireEvent.click(aiButton);

    // Check for loading state (e.g., spinner, button disabled)
    // Assuming the button shows a spinner by replacing the icon or adding a spinner component
    // For this test, we'll check if the button is disabled, as that's a common pattern.
    await waitFor(() => {
      expect(aiButton).toBeDisabled();
      expect(aiInput).toBeDisabled();
      expect(mainTaskInput).toBeDisabled();
      expect(dueDateInput).toBeDisabled();
      expect(prioritySelect).toBeDisabled();
      // Check if Sparkles icon is replaced by Spinner (if Spinner has a distinct testid)
      // For now, Sparkles icon might still be in the button but button is disabled.
      // If Spinner component replaces icon, then:
      // expect(screen.queryByTestId('sparkles-icon')).not.toBeInTheDocument();
      // expect(screen.getByTestId('spinner-icon')).toBeInTheDocument(); // Assuming Spinner has data-testid
    });

    // Resolve the promise to allow the test to complete
    resolvePromise({ title: 'Resolved' });
    await waitFor(() => expect(aiButton).not.toBeDisabled()); // Wait for processing to finish
  });

  test('populates main task input and clears AI input on successful AI response', async () => {
    const mockResponse: ParsedTaskData = {
      title: 'AI Task Title',
      description: 'AI task description.',
      category: 'Work',
      dueDate: '2024-07-26',
    };
    parseTaskWithAIMock.mockResolvedValue(mockResponse);

    render(<TaskForm {...defaultProps} />);
    const aiInput = screen.getByPlaceholderText(/Or describe your task for AI.../i) as HTMLTextAreaElement;
    const aiButton = screen.getByLabelText(/Process with AI/i);
    const mainTaskInput = screen.getByPlaceholderText(/Add a new task for GENERAL.../i);
    const dueDateInput = screen.getByLabelText(/Due Date/i) as HTMLInputElement;

    fireEvent.change(aiInput, { target: { value: 'Plan a party' } });
    fireEvent.click(aiButton);

    await waitFor(() => {
      expect(mainTaskInput).toHaveValue('AI Task Title - AI task description. (Category suggestion: Work)');
      expect(dueDateInput.value).toBe('2024-07-26');
      expect(aiInput.value).toBe(''); // AI input field should be cleared
    });
  });

  test('populates only title if other fields are not in AI response', async () => {
    const mockResponse: ParsedTaskData = {
      title: 'Only Title Here',
    };
    parseTaskWithAIMock.mockResolvedValue(mockResponse);

    render(<TaskForm {...defaultProps} />);
    const aiInput = screen.getByPlaceholderText(/Or describe your task for AI.../i) as HTMLTextAreaElement;
    const aiButton = screen.getByLabelText(/Process with AI/i);
    const mainTaskInput = screen.getByPlaceholderText(/Add a new task for GENERAL.../i);
    const dueDateInput = screen.getByLabelText(/Due Date/i) as HTMLInputElement;

    fireEvent.change(aiInput, { target: { value: 'Quick note' } });
    fireEvent.click(aiButton);

    await waitFor(() => {
      expect(mainTaskInput).toHaveValue('Only Title Here');
      expect(dueDateInput.value).toBe(''); // Due date should not be set
      expect(aiInput.value).toBe('');
    });
  });


  test('displays error message if parseTaskWithAI throws an error', async () => {
    parseTaskWithAIMock.mockRejectedValue(new Error('AI service unavailable'));

    render(<TaskForm {...defaultProps} />);
    const aiInput = screen.getByPlaceholderText(/Or describe your task for AI.../i) as HTMLTextAreaElement;
    const aiButton = screen.getByLabelText(/Process with AI/i);

    fireEvent.change(aiInput, { target: { value: 'This will fail' } });
    fireEvent.click(aiButton);

    await waitFor(() => {
      // Check for the error message. The exact text depends on your implementation.
      expect(screen.getByText(/AI processing failed: AI service unavailable/i)).toBeInTheDocument();
      expect(aiInput.value).toBe('This will fail'); // AI input should not be cleared on error
    });
     // Ensure button is re-enabled
    expect(aiButton).not.toBeDisabled();
  });

  test('AI button is disabled if AI input is empty', () => {
    render(<TaskForm {...defaultProps} />);
    const aiButton = screen.getByLabelText(/Process with AI/i) as HTMLButtonElement;
    expect(aiButton).toBeDisabled(); // Initially disabled as input is empty

    const aiInput = screen.getByPlaceholderText(/Or describe your task for AI.../i);
    fireEvent.change(aiInput, { target: { value: ' ' } }); // Input with only spaces
    expect(aiButton).toBeDisabled();

    fireEvent.change(aiInput, { target: { value: 'Not empty' } });
    expect(aiButton).not.toBeDisabled();
  });

  test('AI features are disabled if category is ALL', () => {
    render(<TaskForm {...defaultProps} selectedCategory={TaskCategory.ALL} />);

    const aiInput = screen.getByPlaceholderText(/Select a category tab first to use AI/i) as HTMLTextAreaElement;
    const aiButton = screen.getByLabelText(/Process with AI/i) as HTMLButtonElement;

    expect(aiInput).toBeDisabled();
    expect(aiButton).toBeDisabled();
  });

});
