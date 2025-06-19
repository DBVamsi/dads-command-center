# Dad's Command Center - Setup and Deployment Guide

This guide provides instructions for setting up the "Dad's Command Center" project for local development and deploying it to GitHub Pages using GitHub Actions. The project is a React application built with Vite, using Firebase for backend services.

## 1. Local Development Setup

### Prerequisites

*   **Node.js**: Version 18.x or later recommended. Download from [nodejs.org](https://nodejs.org/).
    *   `npm` (Node Package Manager) is included with Node.js. You can also use `yarn`.
*   **Git**: For version control. Download from [git-scm.com](https://git-scm.com/).
*   **A Code Editor**: VS Code, WebStorm, etc.

### Steps

**1. Get the Project Files**

If you are cloning an existing repository:
```bash
git clone <your-repository-url>
cd dads-command-center # Or your project directory name
```
If you have the files locally (e.g., from a zip archive):
   1. Create a new directory for your project: `mkdir dads-command-center && cd dads-command-center`
   2. Place all the provided project files (`index.html`, `index.tsx`, `App.tsx`, `components/`, `services/`, `types.ts`, `constants.ts`, `metadata.json`, `vite.config.ts`) into this directory, maintaining the existing file structure.

**2. Initialize `package.json`**

If you don't have a `package.json` file yet, create one:
```bash
npm init -y
```
Then, ensure your `package.json` includes the necessary scripts (Vite typically adds these if you initialize a Vite project from scratch, but you can add them manually):
```json
{
  "name": "dads-command-center",
  "private": true, // Good practice for applications
  "version": "0.1.0",
  "type": "module", // Important for ES module support with Vite
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0", // Optional: if using ESLint
    "preview": "vite preview"
  },
  // ... dependencies and devDependencies will be added in the next step
}
```

**3. Install Vite and Dependencies**

Install Vite, the React plugin for Vite, and other project dependencies:
```bash
# Install Vite and React plugin as dev dependencies
npm install --save-dev vite @vitejs/plugin-react typescript @types/react @types/react-dom eslint vite-plugin-eslint # Add ESLint if desired

# Install project dependencies
npm install react react-dom firebase lucide-react
```

**4. Configure Vite (`vite.config.ts`)**

   You should have a `vite.config.ts` file in your project root. If not, create it. This file configures Vite, including setting the base path for deployment (important for GitHub Pages).

   ```typescript
   // vite.config.ts
   import { defineConfig, loadEnv } from 'vite';
   import react from '@vitejs/plugin-react';

   // https://vitejs.dev/config/
   export default defineConfig(({ mode }) => {
     const env = loadEnv(mode, process.cwd(), '');

     return {
       plugins: [react()],
       base: env.VITE_GITHUB_PAGES_BASE_PATH || '/',
       // For example, if your repo is 'my-dad-app', set VITE_GITHUB_PAGES_BASE_PATH in .env to '/my-dad-app/' for GH Pages
       // Or hardcode: base: '/your-repo-name/',
       define: {
         // Ensures process.env variables are available if needed, though import.meta.env is preferred in Vite
         // 'process.env': JSON.stringify(env) // Careful with exposing all env vars
       },
       build: {
         outDir: 'dist',
       },
       server: {
         port: 3000, // Default is 5173
       }
     };
   });
   ```
   **Note on `base` path**: For GitHub Pages, this should be `/<YOUR_REPOSITORY_NAME>/`. You can set this via an environment variable `VITE_GITHUB_PAGES_BASE_PATH` in your `.env` file for local builds, and also set it in GitHub Secrets for the deployment workflow.

**5. Adjust `index.html` for Vite**

Vite uses `index.html` as the entry point. It should be in the project root.
   a. **Update the script tag**: Change the main script tag to point to your main TypeScript/JavaScript file (e.g., `index.tsx`). Vite will handle the bundling.
   b. **Remove CDN import maps for JavaScript libraries**: Since you've installed React, Firebase, etc., via npm, Vite will manage these. The `importmap` for these libraries is no longer needed and should be removed from `index.html`.
   c. **Tailwind CSS**: The current `index.html` uses Tailwind CSS via CDN and a `<script>` tag for configuration. This can remain for simplicity. For a more integrated setup, you might consider [installing Tailwind CSS as a PostCSS plugin](https://tailwindcss.com/docs/guides/vite).

   Your `index.html`'s `<head>` and `<body>` script tag should look something like:
   ```html
   <!DOCTYPE html>
   <html lang="en">
   <head>
       <meta charset="UTF-8">
       <meta name="viewport" content="width=device-width, initial-scale=1.0">
       <title>Dad's Command Center</title>
       <script src="https://cdn.tailwindcss.com"></script>
       <script>
         tailwind.config = {
           // Your existing Tailwind config
           theme: {
             extend: {
               colors: {
                 primary: '#6D28D9', // Vibrant Violet-700
                 // ... other colors from your original config
                 'primary-hover': '#5B21B6',
                 secondary: '#EC4899',
                 background: '#111827',
                 surface: '#1F2937',
                 'surface-lighter': '#374151',
                 textPrimary: '#F9FAFB',
                 textSecondary: '#D1D5DB',
                 textMuted: '#9CA3AF',
                 danger: '#E11D48',
                 'danger-hover': '#BE123C',
                 borderLight: '#374151',
                 borderDark: '#4B5563',
                 gray_950: '#030712',
               }
             }
           }
         }
       </script>
       <!-- The <script type="importmap"> block should be REMOVED -->
   </head>
   <body class="bg-gradient-to-br from-background to-gray_950 text-textPrimary antialiased">
       <div id="root"></div>
       <script type="module" src="/index.tsx"></script> <!-- Vite entry point -->
   </body>
   </html>
   ```

**6. Set up Firebase** (These instructions remain largely the same)

   a. **Create a Firebase Project**:
      *   Go to the [Firebase Console](https://console.firebase.google.com/).
      *   Click "Add project" and follow the steps to create a new project.

   b. **Add a Web App to Firebase**:
      *   In your Firebase project dashboard, click the Web icon (`</>`) to add a new web app.
      *   Register your app. Firebase Hosting setup is optional at this stage if using GitHub Pages.
      *   Firebase will provide you with a configuration object. Copy this object.

   c. **Enable Firebase Services**:
      *   **Authentication**: Enable "Google" provider.
      *   **Firestore Database**: Create database, start in **test mode** for development. **Secure rules for production.**

**7. Configure Environment Variables for Local Development**

   a. Create a file named `.env` in the root of your project. **This file should not be committed to Git.**
   b. Add your Firebase configuration details and the GitHub Pages base path to `.env`, prefixing each key with `VITE_`:
      ```env
      # .env (for local development)
      VITE_FIREBASE_API_KEY="YOUR_API_KEY_FROM_FIREBASE"
      VITE_FIREBASE_AUTH_DOMAIN="YOUR_AUTH_DOMAIN_FROM_FIREBASE"
      VITE_FIREBASE_PROJECT_ID="YOUR_PROJECT_ID_FROM_FIREBASE"
      VITE_FIREBASE_STORAGE_BUCKET="YOUR_STORAGE_BUCKET_FROM_FIREBASE"
      VITE_FIREBASE_MESSAGING_SENDER_ID="YOUR_MESSAGING_SENDER_ID_FROM_FIREBASE"
      VITE_FIREBASE_APP_ID="YOUR_APP_ID_FROM_FIREBASE"

      # Set this to /your-repository-name/ if you plan to deploy to GitHub Pages
      # Example: VITE_GITHUB_PAGES_BASE_PATH="/dads-command-center/"
      # If not deploying to a subpath, or for general local dev, you can omit or set to "/"
      VITE_GITHUB_PAGES_BASE_PATH="/"
      ```

   c. **Update `constants.ts` to use `import.meta.env`**:
      Vite exposes environment variables through `import.meta.env`. Your `constants.ts` should use this standard:
      ```typescript
      // constants.ts
      import { TaskCategory } from './types';

      export const TASK_CATEGORIES: TaskCategory[] = [
        TaskCategory.WIFE,
        TaskCategory.DAUGHTER,
        TaskCategory.WORK,
        TaskCategory.CHORES,
      ];

      // Vite replaces import.meta.env variables at build time.
      export const FIREBASE_CONFIG = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID,
      };
      ```
      The existing `constants.ts` using `process.env.VITE_FIREBASE_API_KEY` will also work if Vite is configured to define `process.env` (e.g. via `define: { 'process.env': JSON.stringify(env) }` in `vite.config.ts`), but `import.meta.env` is the idiomatic Vite way. **It is recommended to use `import.meta.env` as shown above for best Vite compatibility.**

**8. Run the Development Server**

```bash
npm run dev
```
Access at `http://localhost:3000` (or the port Vite chooses).

## 2. Pushing to GitHub

(These instructions remain largely the same: Initialize Git, create `.gitignore`, add, commit, push)

### Steps

**1. Create a GitHub Repository**

   *   Go to [GitHub](https://github.com/).
   *   Create a new repository. (e.g., `dads-command-center`).

**2. Initialize Git Locally (if not already done)**

```bash
git init -b main
```

**3. Create a `.gitignore` file**

```
# .gitignore

# Dependencies
/node_modules

# Build output
/dist
# /out (if used by other tools)

# Vite specific
.vite/
*.local

# Environment variables
.env
.env.*
!.env.example

# IDE / OS specific
.DS_Store
Thumbs.db
*.swp
.idea/
.vscode/
```
Commit this file.

**4. Add, Commit, and Push Your Code**

```bash
git add .
git commit -m "Initial commit of Dad's Command Center project"
git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPOSITORY_NAME>.git
git push -u origin main
```

## 3. Deploying to GitHub Pages with GitHub Actions

This section explains how to automate the deployment of your Vite application to GitHub Pages whenever you push changes to your `main` branch.

**3.1. Configure Vite for GitHub Pages (Review)**

Ensure your `vite.config.ts` has the `base` property correctly set for GitHub Pages. It should be the name of your repository, preceded and followed by a slash (e.g., `/dads-command-center/`).
```typescript
// vite.config.ts excerpt
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    // ... other config
    base: env.VITE_GITHUB_PAGES_BASE_PATH || '/dads-command-center/', // Replace /dads-command-center/ with your actual repo name if not using .env for this
  };
});
```
You'll set `VITE_GITHUB_PAGES_BASE_PATH` as a GitHub Secret in your repository for the Action to use.

**3.2. Set up GitHub Secrets**

Your Firebase API keys and the GitHub Pages base path need to be stored as secrets in your GitHub repository. The GitHub Actions workflow will use these to build your application with the correct configuration.

   *   In your GitHub repository, go to "Settings" > "Secrets and variables" > "Actions".
   *   Click "New repository secret" for each of the following:
      *   `VITE_FIREBASE_API_KEY`
      *   `VITE_FIREBASE_AUTH_DOMAIN`
      *   `VITE_FIREBASE_PROJECT_ID`
      *   `VITE_FIREBASE_STORAGE_BUCKET`
      *   `VITE_FIREBASE_MESSAGING_SENDER_ID`
      *   `VITE_FIREBASE_APP_ID`
      *   `VITE_GITHUB_PAGES_BASE_PATH` (e.g., `/dads-command-center/` - include leading/trailing slashes)

**3.3. Create GitHub Actions Workflow File**

   a. Create a directory named `.github/workflows` in the root of your project.
   b. Inside this directory, create a new file named `deploy.yml` (or any other `.yml` name).

   c. Add the following content to `deploy.yml`:

      ```yaml
      name: Deploy to GitHub Pages

      on:
        push:
          branches:
            - main # Or your default branch
        workflow_dispatch: # Allows manual triggering

      permissions:
        contents: read
        pages: write
        id-token: write

      jobs:
        build:
          runs-on: ubuntu-latest
          steps:
            - name: Checkout repository
              uses: actions/checkout@v4

            - name: Set up Node.js
              uses: actions/setup-node@v4
              with:
                node-version: '18' # Use a version compatible with your project
                cache: 'npm'

            - name: Install dependencies
              run: npm ci # Use ci for cleaner installs in CI

            - name: Build project
              run: npm run build
              env:
                VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
                VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
                VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
                VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
                VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
                VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}
                VITE_GITHUB_PAGES_BASE_PATH: ${{ secrets.VITE_GITHUB_PAGES_BASE_PATH }} # Crucial for correct asset paths

            - name: Upload GitHub Pages artifact
              uses: actions/upload-pages-artifact@v3
              with:
                path: ./dist # Path to your build output directory

        deploy:
          needs: build
          runs-on: ubuntu-latest
          environment:
            name: github-pages
            url: ${{ steps.deployment.outputs.page_url }}
          steps:
            - name: Deploy to GitHub Pages
              id: deployment
              uses: actions/deploy-pages@v4
      ```

**3.4. Commit and Push the Workflow File**

```bash
git add .github/workflows/deploy.yml
git add vite.config.ts # If you created or modified it
git commit -m "Add GitHub Actions workflow for GitHub Pages deployment"
git push
```

**3.5. Configure GitHub Pages Source**

After the first successful run of your GitHub Action, a `gh-pages` branch (or another branch, depending on the action's config, though `actions/deploy-pages` uses artifacts and a specific GitHub Pages environment) will be created and your site deployed.

   *   Go to your GitHub repository's "Settings" tab.
   *   Navigate to the "Pages" section in the left sidebar.
   *   Under "Build and deployment", for "Source", select "GitHub Actions".
   *   The `actions/deploy-pages@v4` action is designed to work with this setting.

**3.6. Accessing Your Deployed Site**

Once the workflow completes successfully:
   *   You can find the URL of your deployed site in the "Pages" section of your repository settings.
   *   It will typically be `https://<YOUR_USERNAME>.github.io/<YOUR_REPOSITORY_NAME>/`.
   *   The deployment action (`actions/deploy-pages`) will also output the URL in the Action's summary.

---

You should now have a fully set up local development environment, your project on GitHub, and an automated deployment pipeline to GitHub Pages! Remember to check the "Actions" tab in your GitHub repository to monitor the workflow runs.
