import { vi } from 'vitest';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, GenerationBlockReason } from '@google/generative-ai';
import { parseTaskWithAI, ParsedTaskData } from './aiService'; // Adjust path as needed
import { TaskCategory } from '../types'; // Adjust path as needed

// Mock the GoogleGenerativeAI SDK
const mockGenerateContent = vi.fn();
const mockGetGenerativeModel = vi.fn(() => ({
  generateContent: mockGenerateContent,
}));

vi.mock('@google/generative-ai', () => {
  // Need to mock the default export if it's a class constructor
  const actualSdk = vi.importActual('@google/generative-ai'); // Import actual to get enums/types
  return {
    GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
      getGenerativeModel: mockGetGenerativeModel,
    })),
    // Export enums/constants needed by the service or tests
    HarmCategory: actualSdk.HarmCategory,
    HarmBlockThreshold: actualSdk.HarmBlockThreshold,
    GenerationBlockReason: actualSdk.GenerationBlockReason,
  };
});


describe('parseTaskWithAI', () => {
  const apiKey = 'test-api-key';

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset GoogleGenerativeAI constructor mock if needed, though instance mocks (getGenerativeModel, generateContent) are usually enough
    // (GoogleGenerativeAI as any).mockClear();
    mockGetGenerativeModel.mockClear();
    mockGenerateContent.mockClear();
  });

  test('should throw error if API key is missing', async () => {
    await expect(parseTaskWithAI('', 'test input')).rejects.toThrow(
      'Gemini API key is missing. Please configure it in settings to use AI features.'
    );
  });

  test('should return full ParsedTaskData on valid JSON response', async () => {
    const mockApiResponse = {
      response: {
        candidates: [{
          content: { parts: [{ text: JSON.stringify({
            title: 'Buy groceries',
            description: 'Milk, eggs, bread',
            category: 'Shopping',
            dueDate: '2024-08-15',
          })}] },
        }],
        promptFeedback: null,
      },
    };
    mockGenerateContent.mockResolvedValue(mockApiResponse);

    const result = await parseTaskWithAI(apiKey, 'Buy groceries for tomorrow evening');

    expect(result).toEqual({
      title: 'Buy groceries',
      description: 'Milk, eggs, bread',
      category: TaskCategory.SHOPPING, // Assuming 'Shopping' matches TaskCategory.SHOPPING
      dueDate: '2024-08-15',
    });
    expect(mockGetGenerativeModel).toHaveBeenCalledWith({ model: "gemini-1.5-flash-latest" });
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    // You could also add a snapshot test for the prompt or check parts of it
    expect(mockGenerateContent.mock.calls[0][0]).toContain("User request: \"Buy groceries for tomorrow evening\"");
  });

  test('should return minimal ParsedTaskData (only title) if AI provides only title', async () => {
    const mockApiResponse = {
      response: {
        candidates: [{ content: { parts: [{ text: JSON.stringify({ title: 'Quick call' }) }] } }],
        promptFeedback: null,
      },
    };
    mockGenerateContent.mockResolvedValue(mockApiResponse);

    const result = await parseTaskWithAI(apiKey, 'Call John');
    expect(result).toEqual({ title: 'Quick call' });
  });

  test('should throw error if AI response is not valid JSON', async () => {
    const mockApiResponse = {
      response: {
        candidates: [{ content: { parts: [{ text: 'This is not JSON.' }] } }],
        promptFeedback: null,
      },
    };
    mockGenerateContent.mockResolvedValue(mockApiResponse);

    await expect(parseTaskWithAI(apiKey, 'test')).rejects.toThrow(
      'AI model response was not valid JSON. Please try rephrasing your request or check the AI\'s output format.'
    );
  });

  test('should throw error if AI response is an empty text', async () => {
    const mockApiResponse = {
      response: {
        candidates: [{ content: { parts: [{ text: '' }] } }],
        promptFeedback: null,
      },
    };
    mockGenerateContent.mockResolvedValue(mockApiResponse);

    await expect(parseTaskWithAI(apiKey, 'test')).rejects.toThrow(
      'AI model returned an empty text response. Please try again.'
    );
  });


  test('should throw error if AI response is blocked', async () => {
    const mockApiResponse = {
      response: {
        promptFeedback: {
          blockReason: GenerationBlockReason.SAFETY,
          blockReasonMessage: 'Content was violative.'
        },
        candidates: [], // Typically no candidates if blocked like this
      },
    };
    mockGenerateContent.mockResolvedValue(mockApiResponse);

    await expect(parseTaskWithAI(apiKey, 'blocked content test')).rejects.toThrow(
      'AI request was blocked: SAFETY. Content was violative.'
    );
  });

  test('should throw error if AI response is blocked for OTHER reason', async () => {
    const mockApiResponse = {
      response: {
        promptFeedback: {
          blockReason: GenerationBlockReason.OTHER,
        },
      },
    };
    mockGenerateContent.mockResolvedValue(mockApiResponse);

    await expect(parseTaskWithAI(apiKey, 'blocked content test')).rejects.toThrow(
      'AI request was blocked: OTHER. No specific message provided.'
    );
  });


  test('should throw error if AI response has no candidates', async () => {
    const mockApiResponse = {
      response: {
        candidates: [],
        promptFeedback: null,
      },
    };
    mockGenerateContent.mockResolvedValue(mockApiResponse);

    await expect(parseTaskWithAI(apiKey, 'test')).rejects.toThrow(
      'AI model did not return a valid response candidate. Please try again.'
    );
  });

   test('should throw error if AI response candidate has no content parts', async () => {
    const mockApiResponse = {
      response: {
        candidates: [{ content: { parts: [] } }],
        promptFeedback: null,
      },
    };
    mockGenerateContent.mockResolvedValue(mockApiResponse);

    await expect(parseTaskWithAI(apiKey, 'test')).rejects.toThrow(
      'AI model did not return a valid response candidate. Please try again.'
    );
  });


  test('should re-throw generic error if SDK call fails', async () => {
    mockGenerateContent.mockRejectedValue(new Error('SDK internal error'));
    await expect(parseTaskWithAI(apiKey, 'test')).rejects.toThrow(
      'Failed to process task with AI: SDK internal error'
    );
  });

  test('should throw specific error for invalid API key message from SDK', async () => {
    mockGenerateContent.mockRejectedValue(new Error('Some error about API key not valid for project'));
    await expect(parseTaskWithAI(apiKey, 'test')).rejects.toThrow(
      'Invalid Gemini API Key. Please check your key in settings.'
    );
  });

  test('should throw specific error for permission denied message from SDK', async () => {
    mockGenerateContent.mockRejectedValue(new Error('permission denied or something like that'));
    await expect(parseTaskWithAI(apiKey, 'test')).rejects.toThrow(
      "Gemini API Key is not authorized, permission denied, or project billing may not be configured. Check API key, project settings, and ensure the 'Generative Language API' is enabled with billing."
    );
  });

  test('should throw specific error for quota exhausted message from SDK', async () => {
    mockGenerateContent.mockRejectedValue(new Error('User quota exceeded'));
    await expect(parseTaskWithAI(apiKey, 'test')).rejects.toThrow(
      "AI request quota exceeded. Please try again later or check your Gemini project quotas."
    );
  });

  describe('Data Validation from AI Response', () => {
    test('should strip invalid category from AI response', async () => {
      const mockApiResponse = {
        response: {
          candidates: [{ content: { parts: [{ text: JSON.stringify({
            title: 'Task with bad category',
            category: 'RandomCategoryNotInEnum',
          }) }] } }],
          promptFeedback: null,
        },
      };
      mockGenerateContent.mockResolvedValue(mockApiResponse);
      const result = await parseTaskWithAI(apiKey, 'test');
      expect(result.category).toBeUndefined();
    });

    test('should strip invalid dueDate format from AI response', async () => {
      const mockApiResponse = {
        response: {
          candidates: [{ content: { parts: [{ text: JSON.stringify({
            title: 'Task with bad date',
            dueDate: 'tomorrow evening', // Not YYYY-MM-DD
          }) }] } }],
          promptFeedback: null,
        },
      };
      mockGenerateContent.mockResolvedValue(mockApiResponse);
      const result = await parseTaskWithAI(apiKey, 'test');
      expect(result.dueDate).toBeUndefined();
    });

    test('should accept valid category from AI response', async () => {
      const mockApiResponse = {
        response: {
          candidates: [{ content: { parts: [{ text: JSON.stringify({
            title: 'Task with good category',
            category: TaskCategory.WORK, // Assuming 'Work' is a valid TaskCategory enum value
          }) }] } }],
          promptFeedback: null,
        },
      };
      mockGenerateContent.mockResolvedValue(mockApiResponse);
      const result = await parseTaskWithAI(apiKey, 'test');
      expect(result.category).toBe(TaskCategory.WORK);
    });
  });
});
