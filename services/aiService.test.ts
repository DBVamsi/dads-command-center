import { vi } from 'vitest';
// Import only GoogleGenerativeAI as per the change in aiService.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { parseTaskWithAI, ParsedTaskData } from './aiService'; // Adjust path as needed
import { TaskCategory } from '../types'; // Adjust path as needed

// Mock the GoogleGenerativeAI SDK
const mockGenerateContent = vi.fn();
const mockGetGenerativeModel = vi.fn(() => ({
  generateContent: mockGenerateContent,
}));

vi.mock('@google/generative-ai', () => {
  // Mock the constructor and its methods
  // The actual enums (GenerationBlockReason, etc.) are assumed to be static properties
  // of the GoogleGenerativeAI class by the code in aiService.ts.
  // So, the mock for GoogleGenerativeAI itself should provide these if they are referenced
  // directly in tests (e.g. GoogleGenerativeAI.GenerationBlockReason.SAFETY).
  // For this test file, we mainly need to ensure that the mocked SDK behavior
  // (like blockReason values) uses the same assumed path if we construct them here.

  // If actualSdk.GenerationBlockReason was used to *set up* a mock, that would need to change.
  // Let's assume for now that the mock setup in tests uses object literals for `promptFeedback`
  // and the string values for blockReason (e.g., "SAFETY", "OTHER") which are then compared
  // in aiService.ts using GoogleGenerativeAI.GenerationBlockReason.SAFETY (which would resolve to the string "SAFETY").
  // The SDK might internally use string enums or objects that resolve to strings.

  // The most important part is that the constructor mock is correct.
  // The static properties for enums will be accessed on the actual GoogleGenerativeAI class/object
  // imported into aiService.ts, not necessarily on the *mocked instance* of it unless we explicitly mock statics.
  // However, Vitest's vi.mock often replaces the entire module, so direct imports of enums would fail
  // in aiService.ts if not handled by the mock.
  // The current aiService.ts now does `GoogleGenerativeAI.GenerationBlockReason.SAFETY`.
  // This means the `GoogleGenerativeAI` object available to `aiService.ts` must have these static properties.

  // We need to ensure that the `GoogleGenerativeAI` provided by this mock has these static properties
  // if they are to be used by the `aiService.ts` as `GoogleGenerativeAI.GenerationBlockReason.SAFETY`.
  const actualSdk = vi.importActual('@google/generative-ai');
  const mockGGAI = vi.fn().mockImplementation(() => ({
    getGenerativeModel: mockGetGenerativeModel,
  }));

  // Attach static properties to the mock constructor if they are used like GoogleGenerativeAI.GenerationBlockReason
  (mockGGAI as any).HarmCategory = actualSdk.HarmCategory;
  (mockGGAI as any).HarmBlockThreshold = actualSdk.HarmBlockThreshold;
  (mockGGAI as any).GenerationBlockReason = actualSdk.GenerationBlockReason;


  return {
    GoogleGenerativeAI: mockGGAI,
    // We no longer export HarmCategory, etc., directly from the mock if aiService uses GoogleGenerativeAI.HarmCategory
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
    // We need to use the actual enum values if the service compares against them.
    // The mock for GoogleGenerativeAI should make these available if they're static.
    // If GenerationBlockReason is just a string type in practice from the SDK's response,
    // then using string literals ("SAFETY") is fine for setting up the mock response.
    // The aiService.ts now uses GoogleGenerativeAI.GenerationBlockReason.SAFETY for comparison.
    // So, the value provided by the SDK (mocked here) must match that.
    // The actual `GenerationBlockReason` enum from the SDK will provide the correct values.
    const { GenerationBlockReason: SDKGenerationBlockReason } = await vi.importActual('@google/generative-ai');

    const mockApiResponse = {
      response: {
        promptFeedback: {
          blockReason: SDKGenerationBlockReason.SAFETY,
          blockReasonMessage: 'Content was violative.'
        },
        candidates: [],
      },
    };
    mockGenerateContent.mockResolvedValue(mockApiResponse);

    // The error message in aiService.ts uses the string value of the enum.
    await expect(parseTaskWithAI(apiKey, 'blocked content test')).rejects.toThrow(
      `AI request was blocked: ${SDKGenerationBlockReason.SAFETY}. Content was violative.`
    );
  });

  test('should throw error if AI response is blocked for OTHER reason', async () => {
    const { GenerationBlockReason: SDKGenerationBlockReason } = await vi.importActual('@google/generative-ai');
    const mockApiResponse = {
      response: {
        promptFeedback: {
          blockReason: SDKGenerationBlockReason.OTHER,
        },
      },
    };
    mockGenerateContent.mockResolvedValue(mockApiResponse);

    await expect(parseTaskWithAI(apiKey, 'blocked content test')).rejects.toThrow(
      `AI request was blocked: ${SDKGenerationBlockReason.OTHER}. No specific message provided.`
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
