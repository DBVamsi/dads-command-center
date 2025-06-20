import React, { useState } from 'react';
import { addTask } from '../../services/firebaseService';
import { parseTaskWithAI, ParsedTaskData } from '../../services/aiService'; // Import AI service
import { TaskCategory, AppUser, Priority } from '../../types';
import { Button } from '../ui/Button';
import { PlusCircle, Sparkles } from 'lucide-react';
import { Spinner } from '../ui/Spinner';

interface TaskFormProps {
  selectedCategory: TaskCategory;
  user: AppUser;
}

export const TaskForm: React.FC<TaskFormProps> = ({ selectedCategory, user }) => {
  const [taskText, setTaskText] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [isLoading, setIsLoading] = useState(false); // For main form submission
  const [error, setError] = useState<string | null>(null); // For main form errors

  // AI-specific state
  const [aiTaskText, setAiTaskText] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const canAdd = selectedCategory !== TaskCategory.ALL;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskText.trim() || !user) return;
    if (!canAdd) {
      setError('Select a specific category tab to add tasks.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await addTask(user.uid, taskText.trim(), selectedCategory, {
        dueDate: dueDate || undefined,
        priority: priority,
      });
      setTaskText('');
      setDueDate('');
      setPriority('Medium');
      // setError(null); // Already set at the beginning of try
    } catch (err) {
      setError('Failed to add task. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAiProcessClick = async () => {
    if (!aiTaskText.trim()) return;

    setIsAiProcessing(true);
    setAiError(null);
    setError(null); // Clear main errors as well

    try {
      const parsedData: ParsedTaskData = await parseTaskWithAI(aiTaskText);

      let combinedTaskText = parsedData.title || '';
      if (parsedData.description) {
        combinedTaskText += (combinedTaskText ? ' - ' : '') + parsedData.description;
      }
      // Append AI-suggested category to description for now, as directly setting category is complex
      if (parsedData.category) {
        combinedTaskText += ` (Category suggestion: ${parsedData.category})`;
      }

      setTaskText(combinedTaskText);

      if (parsedData.dueDate) {
        // Basic validation for YYYY-MM-DD format, can be improved
        if (/^\d{4}-\d{2}-\d{2}$/.test(parsedData.dueDate)) {
          setDueDate(parsedData.dueDate);
        } else {
          console.warn(`AI returned dueDate in incorrect format: ${parsedData.dueDate}. Expected YYYY-MM-DD.`);
          // Optionally set an aiError here or append to description
        }
      }

      setAiTaskText(''); // Clear AI input field
    } catch (err) {
      if (err instanceof Error) {
        setAiError(`AI processing failed: ${err.message}`);
      } else {
        setAiError('AI processing failed. Please try again.');
      }
      console.error(err);
    } finally {
      setIsAiProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8 p-4 bg-surface dark:bg-surface rounded-xl shadow-xl border border-borderLight dark:border-borderDark">
      <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-3">
        <input
          type="text"
          value={taskText}
          onChange={(e) => setTaskText(e.target.value)}
          placeholder={canAdd ? `Add a new task for ${selectedCategory}...` : "Select a category tab first"}
          className="flex-grow w-full bg-transparent p-3 text-textPrimary dark:text-textPrimary placeholder-textMuted dark:placeholder-textMuted focus:outline-none focus:ring-2 focus:ring-primary rounded-lg border border-borderLight dark:border-borderDark"
          disabled={isLoading || isAiProcessing || !canAdd}
          aria-label={`New task for ${selectedCategory}`}
        />
        <Button
          type="submit"
          disabled={isLoading || isAiProcessing || !taskText.trim() || !canAdd}
          variant="primary"
          size="md"
          className="w-full sm:w-auto px-5 py-3"
          leftIcon={isLoading ? <Spinner size="sm" color="text-white" /> : <PlusCircle size={20} />}
        >
          Add Task
        </Button>
      </div>

      {/* AI Task Creation Area */}
      <div className="mt-4 flex items-center space-x-3">
        <textarea
          value={aiTaskText}
          onChange={(e) => setAiTaskText(e.target.value)}
          placeholder={canAdd ? "Or describe your task for AI..." : "Select a category tab first to use AI"}
          className="flex-grow w-full bg-transparent p-3 text-textPrimary dark:text-textPrimary placeholder-textMuted dark:placeholder-textMuted focus:outline-none focus:ring-2 focus:ring-primary rounded-lg border border-borderLight dark:border-borderDark resize-none"
          rows={2}
          disabled={isAiProcessing || isLoading || !canAdd}
          aria-label="Describe task for AI"
        />
        <Button
          type="button"
          onClick={handleAiProcessClick}
          disabled={isAiProcessing || isLoading || !aiTaskText.trim() || !canAdd}
          variant="outline"
          size="icon"
          className="px-3 py-3 flex-shrink-0" // Added flex-shrink-0
          aria-label="Process with AI"
        >
          {isAiProcessing ? <Spinner size="sm" /> : <Sparkles size={20} />}
        </Button>
      </div>
      {aiError && <p className="mt-2 text-sm text-danger">{aiError}</p>}

      <div className="mt-4 flex flex-col sm:flex-row items-center gap-4">
        <div className="w-full sm:w-1/2">
            <label htmlFor="dueDate" className="block text-sm font-medium text-textSecondary dark:text-textSecondary mb-1">Due Date (Optional)</label>
            <input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-transparent p-2 text-textPrimary dark:text-textPrimary placeholder-textMuted dark:placeholder-textMuted focus:outline-none focus:ring-2 focus:ring-primary rounded-lg border border-borderLight dark:border-borderDark"
                disabled={isAiProcessing || isLoading}
            />
        </div>
        <div className="w-full sm:w-1/2">
            <label htmlFor="priority" className="block text-sm font-medium text-textSecondary dark:text-textSecondary mb-1">Priority</label>
            <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full bg-transparent p-2.5 text-textPrimary dark:text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary rounded-lg border border-borderLight dark:border-borderDark"
                disabled={isAiProcessing || isLoading}
            >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
            </select>
        </div>
      </div>
      {!canAdd && (
        <p className="mt-3 text-sm text-textSecondary">
          Select a category tab to add new tasks.
        </p>
      )}
      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
    </form>
  );
};