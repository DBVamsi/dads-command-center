// services/aiService.ts

/**
 * Interface for the structured data returned after AI parsing.
 */
export interface ParsedTaskData {
  title?: string;
  description?: string;
  category?: string; // Assuming category might be inferred
  dueDate?: string; // Expected format: YYYY-MM-DD
  // We can add other fields like priority, tags, etc. later
}

/**
 * Parses a natural language task description using a (mocked) AI service.
 *
 * @param naturalLanguageInput The user's input string (e.g., "buy milk tomorrow evening").
 * @returns A promise that resolves to ParsedTaskData.
 * @param apiKey The Gemini API key.
 * @param naturalLanguageInput The user's input string (e.g., "buy milk tomorrow evening").
 * @returns A promise that resolves to ParsedTaskData.
 * @throws Error if the API key is missing or if the AI processing fails.
 */
export async function parseTaskWithAI(apiKey: string, naturalLanguageInput: string): Promise<ParsedTaskData> {
  if (!apiKey || apiKey.trim() === '') {
    console.error('Gemini API key is missing in parseTaskWithAI call.');
    throw new Error('Gemini API key is missing. Please configure it in settings to use AI features.');
  }

  // Placeholder for actual Gemini API call
  console.log(`Simulating AI processing for: "${naturalLanguageInput}"`);
  console.log('Using provided API Key (first 5 chars):', apiKey.substring(0, 5)); // Be careful not to log the full key in production

  try {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mocked response based on the input
    const mockedResponse: ParsedTaskData = {
      title: `Parsed: ${naturalLanguageInput}`,
      description: `This is a generated description for "${naturalLanguageInput}".`,
      // category: "General", // Example category
      // dueDate: "2024-12-31", // Example date
    };

    // Simulate a potential error for specific inputs (for testing error handling)
    if (naturalLanguageInput.toLowerCase().includes("error_test")) {
      throw new Error("Simulated AI processing error.");
    }

    console.log('Mocked AI Response:', mockedResponse);
    return mockedResponse;

  } catch (error) {
    console.error('Error during (mocked) AI task parsing:', error);
    throw new Error('Failed to parse task with AI.');
  }
}

// Example usage (can be removed or commented out)
/*
async function testParse() {
  // To test this, you'd need to set VITE_GEMINI_API_KEY in your environment
  // For example, run: VITE_GEMINI_API_KEY="testkey123" node -r ts-node/register services/aiService.ts
// Note: The below test code will not work directly with import.meta.env outside a Vite/ESM context.
// You would typically test this by running the Vite dev server and calling the function from a component.
/*
if (typeof process !== 'undefined' && require.main === module) { // Ensure this only runs when script is executed directly (e.g. node)
  // This block is for Node.js direct execution testing and won't have import.meta.env
  // To test, you'd manually set it or use a .env file with a loader like dotenv.
  // For Vite apps, import.meta.env is the way.
  // process.env.VITE_GEMINI_API_KEY = "testkey123"; // This won't affect import.meta.env

  (async () => {
    try {
      // To properly test, you'd need to mock import.meta.env or run within Vite.
      // This direct execution is more for logic testing if apiKey was passed differently.
      console.warn("Note: Direct Node execution of this file won't have import.meta.env.VITE_GEMINI_API_KEY set automatically by Vite.");
      // Manually set for this test IF you are running this file directly with node
      // and not through Vite's dev/build process.
      // import.meta.env.VITE_GEMINI_API_KEY = "testkey123"; // This line will cause a runtime error if import.meta.env is undefined.

      // A better way for standalone testing might be to allow passing the key or using a .env file
      // For now, we'll assume it's tested within the Vite app.

      const input1 = "buy groceries tomorrow at 5pm";
      // const parsed1 = await parseTaskWithAI(input1); // This would fail if apiKey is not somehow provided.
      // console.log(`Input: "${input1}" => Parsed:`, parsed1);

      // const input2 = "Schedule a meeting with John for next Monday";
      // const parsed2 = await parseTaskWithAI(input2);
      // console.log(`Input: "${input2}" => Parsed:`, parsed2);
    } catch (e) {
      console.error("Test failed:", e);
    }
  })();
}
*/
// Example of how you might structure test setup if you wanted to run this file directly with Node
// and simulate the Vite environment variable. This is for demonstration and might need adjustment.
if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test_direct_execution') {
  // This is a hack to simulate import.meta.env for direct node execution.
  // Not recommended for actual testing within a Vite project.
  (globalThis as any).importMetaEnvBackup = (globalThis as any).importMeta?.env; // backup if exists
  (globalThis as any).import = (globalThis as any).import || {};
  (globalThis as any).import.meta = (globalThis as any).import.meta || {};
  (globalThis as any).import.meta.env = (globalThis as any).import.meta.env || {};
  // This is a hack to simulate import.meta.env for direct node execution.
  // Not recommended for actual testing within a Vite project.
  // (globalThis as any).importMetaEnvBackup = (globalThis as any).importMeta?.env; // backup if exists
  // (globalThis as any).import = (globalThis as any).import || {};
  // (globalThis as any).import.meta = (globalThis as any).import.meta || {};
  // (globalThis as any).import.meta.env = (globalThis as any).import.meta.env || {};
  // (globalThis as any).import.meta.env.VITE_GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY_CLI_TEST;
  const testApiKey = process.env.VITE_GEMINI_API_KEY_CLI_TEST || "testkey123";


  (async () => {
    try {
      console.log('Running direct execution test with CLI-provided or default API_KEY:', testApiKey);
      const input1 = "buy groceries tomorrow at 5pm";
      const parsed1 = await parseTaskWithAI(testApiKey, input1);
      console.log(`Input: "${input1}" => Parsed:`, parsed1);

      const input2 = "Schedule a meeting with John for next Monday";
      const parsed2 = await parseTaskWithAI(testApiKey, input2);
      console.log(`Input: "${input2}" => Parsed:`, parsed2);

      // Test missing API key
      try {
        console.log("\nTesting with missing API key (should throw error):");
        await parseTaskWithAI("", "test missing key");
      } catch (e) {
        console.log("Correctly threw error for missing key:", (e as Error).message);
      }

    } catch (e) {
      console.error("Direct execution test failed:", e);
    } finally {
      // Restore original import.meta.env if it was backed up
      if ((globalThis as any).importMetaEnvBackup) {
        (globalThis as any).import.meta.env = (globalThis as any).importMetaEnvBackup;
      } else {
        delete (globalThis as any).import.meta.env; // Clean up
      }
    }
  })();
}

/*
async function testParse() {
  // To test this, you'd need to set VITE_GEMINI_API_KEY in your .env file for Vite
  // Or, for direct node execution (demonstration purposes only):
  // VITE_GEMINI_API_KEY_CLI_TEST="testkey123" NODE_ENV=test_direct_execution ts-node services/aiService.ts

    try {
      // This part of the test would run if NODE_ENV=test_direct_execution is set
      // and VITE_GEMINI_API_KEY_CLI_TEST is also set.
      // For example:
      // VITE_GEMINI_API_KEY_CLI_TEST="clikey123" NODE_ENV=test_direct_execution npx ts-node services/aiService.ts

      // The code inside the if block above already runs the tests.
      // This testParse() function is now largely superseded by the conditional block.

    } catch (e) {
      // console.error("Test failed:", e); // Already handled in the block above
    }
  // } // This was part of the original conditional require.main
}
// testParse(); // Commented out as test logic is now in the conditional block above for direct execution
*/
