import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, GenerationBlockReason } from "@google/generative-ai";
import { TaskCategory } from "../types"; // Import TaskCategory

/**
 * Interface for the structured data returned after AI parsing.
 */
export interface ParsedTaskData {
  title?: string;
  description?: string;
  category?: string;
  dueDate?: string; // Expected format: YYYY-MM-DD
}

/**
 * Parses a natural language task description using the Gemini AI service.
 *
 * @param apiKey The Gemini API key.
 * @param naturalLanguageInput The user's input string (e.g., "buy milk tomorrow evening").
 * @returns A promise that resolves to ParsedTaskData.
 * @throws Error if the API key is missing, invalid, or if the AI processing fails.
 */
export async function parseTaskWithAI(apiKey: string, naturalLanguageInput: string): Promise<ParsedTaskData> {
  if (!apiKey || apiKey.trim() === '') {
    console.error('Gemini API key is missing in parseTaskWithAI call.');
    throw new Error('Gemini API key is missing. Please configure it in settings to use AI features.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash", // Changed to new hypothetical model
    // Optional: Add safety settings if needed, though defaults are usually quite strict.
    // safetySettings: [
    //   { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    //   { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    //   { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    //   { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    // ],
  });

  // Dynamically get task categories, excluding "ALL" as it's not a user-assignable category.
  const allowedCategories = Object.values(TaskCategory).filter(cat => cat !== TaskCategory.ALL);

  const prompt = `
    Parse the following user request to create a task. Your goal is to extract key details and respond ONLY with a valid JSON object.
    The JSON object should have the following fields:
    - "title": (string) The main subject or title of the task. This should be concise.
    - "description": (string, optional) Any additional details, notes, or context for the task. If not much detail is provided, this can be a short elaboration of the title or omitted.
    - "category": (string, optional) Suggest a category for this task from the following allowed categories: ${allowedCategories.join(", ")}. If no suitable category is apparent, omit this field or use "General".
    - "dueDate": (string, optional) If a due date or timeframe is mentioned (e.g., "tomorrow", "next Tuesday", "June 27th at 5pm"), convert it to YYYY-MM-DD format. If no specific date is mentioned, omit this field.

    User request: "${naturalLanguageInput}"

    Respond ONLY with the JSON object. Do not include any other text, greetings, or explanations before or after the JSON.
    Example of a valid JSON response if a date was mentioned:
    {
      "title": "Buy groceries",
      "description": "Milk, eggs, bread, and cheese from the supermarket.",
      "category": "Shopping",
      "dueDate": "2024-07-28"
    }
    Example if no date or specific category was clear:
    {
      "title": "Call John",
      "description": "Regarding the project update."
    }
  `;

  // console.log("Sending prompt to Gemini:", prompt); // Good for debugging, but can be noisy

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;

    if (response.promptFeedback?.blockReason) {
      const blockReason = response.promptFeedback.blockReason;
      const blockMessage = response.promptFeedback.blockReasonMessage || "No specific message provided.";
      console.error(`Gemini request blocked due to: ${blockReason}. Message: ${blockMessage}`, response.promptFeedback);
      // More user-friendly messages for common block reasons
      if (blockReason === GenerationBlockReason.SAFETY) {
        throw new Error(`AI request was blocked for safety reasons. Please rephrase your request or check content policies. ${blockMessage}`);
      } else if (blockReason === GenerationBlockReason.OTHER) {
         throw new Error(`AI request was blocked for an unspecified reason. Please try again. ${blockMessage}`);
      }
      throw new Error(`AI request was blocked: ${blockReason}. ${blockMessage}`);
    }

    if (!response.candidates?.length || !response.candidates[0].content?.parts?.length) {
      console.error("Gemini response missing valid candidates:", response);
      throw new Error("AI model did not return a valid response candidate. Please try again.");
    }

    const textResponse = response.candidates[0].content.parts[0].text;
    // console.log("Raw AI text response:", textResponse); // Good for debugging

    if (!textResponse) {
        throw new Error("AI model returned an empty text response. Please try again.");
    }

    // Attempt to clean the response: remove potential markdown backticks and "json" label
    const cleanedTextResponse = textResponse.replace(/^```json\s*|\s*```$/g, '').trim();

    let parsedData: ParsedTaskData;
    try {
      parsedData = JSON.parse(cleanedTextResponse);
    } catch (jsonError) {
      console.error("Failed to parse JSON response from AI:", cleanedTextResponse, jsonError);
      throw new Error("AI model response was not valid JSON. Please try rephrasing your request or check the AI's output format.");
    }

    // Basic validation (can be expanded)
    if (parsedData.title && typeof parsedData.title !== 'string') {
        console.warn("AI response 'title' is not a string. Attempting to coerce or ignoring.", parsedData);
        parsedData.title = String(parsedData.title); // Coerce, or handle error differently
    }
    if (!parsedData.title || parsedData.title.trim() === '') {
        console.warn("AI response missing title, or title is empty.", parsedData);
        // Fallback or error based on requirements. For now, we allow tasks without titles from AI.
        // throw new Error("AI response is missing a valid title.");
    }

    if (parsedData.category && !allowedCategories.includes(parsedData.category as TaskCategory)) {
      console.warn(`AI suggested an invalid category: "${parsedData.category}". This category will be ignored.`);
      delete parsedData.category;
    }
    if (parsedData.dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(parsedData.dueDate)) {
      console.warn(`AI suggested an invalid dueDate format: "${parsedData.dueDate}". This due date will be ignored.`);
      delete parsedData.dueDate;
    }

    // console.log("Parsed AI Response:", parsedData); // Good for debugging
    return parsedData;

  } catch (error) {
    console.error('Error during Gemini AI task parsing:', error);
    if (error instanceof Error) {
      // Check for specific API key error messages (these might vary depending on the SDK/API)
      // The GoogleGenerativeAI SDK throws errors with a `cause` or specific properties for HTTP errors.
      // A more robust check might involve looking at `error.cause` or `error.status` if available.
      const errorMessage = error.message.toLowerCase();
      if (errorMessage.includes("api key not valid") ||
          errorMessage.includes("invalid api key") ||
          errorMessage.includes("api_key_not_valid")) {
        throw new Error("Invalid Gemini API Key. Please check your key in settings.");
      }
      if (errorMessage.includes("permission denied") ||
          errorMessage.includes("api key not authorized") ||
          errorMessage.includes("detailed error information httpstatus 403")) { // Often indicates billing or API not enabled
         throw new Error("Gemini API Key is not authorized, permission denied, or project billing may not be configured. Check API key, project settings, and ensure the 'Generative Language API' is enabled with billing.");
      }
      if (errorMessage.includes("quota") || errorMessage.includes("resource has been exhausted")) {
        throw new Error("AI request quota exceeded. Please try again later or check your Gemini project quotas.");
      }
      if (errorMessage.includes("model not found")) {
        throw new Error("AI model (gemini-2.5-flash) not found. This could be a temporary issue or configuration problem. Please ensure the model name is correct.");
      }
      throw new Error(`Failed to process task with AI: ${error.message}`);
    }
    throw new Error('An unknown error occurred while processing with AI.');
  }
}

// Example usage (can be removed or commented out)
// This part is for direct Node.js testing and won't run in the browser via Vite directly.
// To use, ensure you have ts-node and set VITE_GEMINI_API_KEY_CLI_TEST environment variable.
/*
if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test_direct_execution') {
  const testApiKey = process.env.VITE_GEMINI_API_KEY_CLI_TEST;

  if (!testApiKey) {
    console.error("Please set VITE_GEMINI_API_KEY_CLI_TEST environment variable to test aiService.ts directly.");
  } else {
    (async () => {
      try {
        console.log('Running direct execution test with CLI-provided API_KEY.');

        const inputs = [
          "buy groceries tomorrow at 5pm",
          "Schedule a meeting with John for next Monday about the new design system",
          "call mom this evening",
          "book flight to Bali for December",
          "Workout session - legs day - tomorrow morning at 7am #Health",
          "Finalize Q3 report by EOD Friday",
          "Get a haircut next week",
          "Pay electricity bill"
        ];

        for (const input of inputs) {
          console.log(`\n--- Testing input: "${input}" ---`);
          const parsed = await parseTaskWithAI(testApiKey, input);
          console.log(`Input: "${input}" => Parsed:`, parsed);
        }

        // Test missing API key (by passing empty string, as initial check should catch it)
        // console.log("\n--- Testing with missing API key (should throw error) ---");
        // await parseTaskWithAI("", "test missing key"); // This will be caught by the initial check

      } catch (e) {
        if (e instanceof Error) {
          console.error("\nDirect execution test failed:", e.message);
        } else {
          console.error("\nDirect execution test failed with unknown error:", e);
        }
      }
    })();
  }
}
*/
