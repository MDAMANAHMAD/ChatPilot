# ChatPilot 🚀

A real-time chat application with an integrated AI Agent side-panel, powered by the MERN stack and Google Gemini.

## Features

- **Real-time Messaging**: Powered by Socket.io.
- **AI Copilot**: Smart reply suggestions powered by Google Gemini.
- **Auto-Pilot Mode**: Automatically replies if the AI is >90% confident.
- **Modern UI**: Built with React, Tailwind CSS, and Lucide Icons.

## Setup Instructions

### 1. Backend (Server)

1.  Navigate to the server folder: `cd server`
2.  Install dependencies (if not done): `npm install`
3.  **IMPORTANT**: Open `.env` and set your `GEMINI_API_KEY`.
    *   Get a key from [Google AI Studio](https://makersuite.google.com/app/apikey).
4.  Start the server: `node index.js`
    *   (Runs on Port 3001)

### 2. Frontend (Client)

1.  Navigate to the client folder: `cd client`
2.  Install dependencies: `npm install`
3.  Start the dev server: `npm run dev`
4.  Open `http://localhost:5173` in your browser.

## How to Use

1.  **Select a Contact** from the Left Sidebar (e.g., Alice).
2.  **Send Messages** as usual.
3.  **AI Suggestions**:
    *   Open the app in two different browser tabs (or use Incognito) to simulate two users.
    *   Have one user send a message.
    *   The other user will see "Smart Suggestions" in the Right Sidebar.
    *   Click a suggestion to use it.
4.  **Auto-Pilot**:
    *   Toggle "Auto" in the Right Sidebar.
    *   If the AI is confident (>90%), it will send the reply automatically!
