# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

## Features

- Central "All" tab to view tasks from every category at once.

### ✨ AI-Powered Task Creation

- **Natural Language Input**: Simply type your task in plain English! For example, "call John about the project meeting next Tuesday at 2pm" or "buy groceries after work tomorrow".
- **Smart Parsing**: Click the "Sparkles" button (✨) next to the dedicated AI input field. The application uses an AI model (powered by Gemini) to understand your input and automatically populate the main task details, such as the task title, description, and due date.
- **Streamlined Workflow**: This helps you add tasks more quickly and naturally, letting the AI handle the structuring.

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. **Configure API Key**: For the AI-powered features to work, you need a Gemini API key.
   - Create a file named `.env.local` in the root of the project if it doesn't already exist.
   - Add the following line to your `.env.local` file, replacing `YOUR_API_KEY_HERE` with your actual Gemini API key:
     ```env
     VITE_GEMINI_API_KEY=YOUR_API_KEY_HERE
     ```
   - **Important**: This key is essential for the AI to process task descriptions. Without it, the AI features will not function.
3. Run the app:
   `npm run dev`
