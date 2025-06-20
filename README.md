# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

## Features

- Central "All" tab to view tasks from every category at once.

### ✨ AI-Powered Task Creation

- **Natural Language Input**: Simply type your task in plain English! For example, "call John about the project meeting next Tuesday at 2pm" or "buy groceries after work tomorrow".
- **Smart Parsing**: Click the "Sparkles" button (✨) next to the dedicated AI input field. The application uses an AI model (powered by Gemini) to understand your input and automatically populate the main task details, such as the task title, description, and due date. This feature utilizes the `gemini-2.5-flash` model for task parsing, and the AI suggestions are powered by real-time calls to the Gemini API.
- **Streamlined Workflow**: This helps you add tasks more quickly and naturally, letting the AI handle the structuring.
- **User-Provided API Key**: To use the AI features, you now need to provide your own Gemini API key. This approach ensures fair usage, gives you control over your API consumption, and helps manage costs in a multi-user environment.
    - **How to Add Your Key**:
        1. Click on the "Settings" (⚙️ or similar gear icon) in the application header.
        2. In the "User Settings" section that appears, locate the input field for the "Gemini API Key".
        3. Enter your personal Gemini API key into this field.
        4. Click the "Save" (or similar) button to store your key.
    - Your API key is securely associated with your account and will be used for all AI-powered actions you perform.

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev`

*Note on API Keys for Local Development:* While the application now uses user-specific API keys stored via the settings UI, if you are a developer working on the AI integration itself, you might still use a local `.env.local` file with `VITE_GEMINI_API_KEY` for initial testing of the `aiService.ts` if you directly execute its test code or before the user settings UI is fully functional. However, for normal application use, users will provide their keys through the settings interface.
