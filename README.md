# 🤖 RAG Chatbot — Company Knowledge Assistant

A production-ready RAG (Retrieval-Augmented Generation) chatbot that answers questions from your company documents. Built with **React + Vite** (frontend) and **Node.js + Express** (backend), powered by the **Anthropic Claude API**.

---

## 📁 Project Structure

```
rag-chatbot/
├── backend/
│   ├── src/
│   │   ├── index.js              # Express server entry point
│   │   ├── routes/
│   │   │   ├── chat.js           # POST /api/chat — RAG pipeline
│   │   │   └── documents.js      # GET/POST/DELETE /api/documents
│   │   └── services/
│   │       └── vectorStore.js    # In-memory TF-IDF retrieval + mock data
│   ├── uploads/                  # Temp storage for uploaded files
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── index.css
│   │   └── components/
│   │       ├── Sidebar.jsx       # Document list + upload
│   │       └── ChatWindow.jsx    # Chat interface
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── README.md
```

---

## ⚡ Quick Start (Step-by-Step)

### Prerequisites
- Node.js v18 or higher → https://nodejs.org
- An Anthropic API key → https://console.anthropic.com

---

### Step 1 — Open in VS Code

```bash
# In your terminal
cd rag-chatbot
code .
```

---

### Step 2 — Set up the Backend

```bash
cd backend
npm install
```

Create your `.env` file:
```bash
cp .env.example .env
```

Open `.env` and add your API key:
```
ANTHROPIC_API_KEY=sk-ant-your-key-here
PORT=3001
FRONTEND_URL=http://localhost:5173
```

Start the backend:
```bash
npm run dev
```

You should see:
```
✅ Backend running at http://localhost:3001
🌱 Seeded 6 mock company documents (XX total chunks)
```

---

### Step 3 — Set up the Frontend

Open a **new terminal** in VS Code (Terminal → New Terminal):

```bash
cd frontend
npm install
npm run dev
```

You should see:
```
VITE v5.x.x ready in XXX ms
➜  Local:   http://localhost:5173/
```

---

### Step 4 — Open the App

Visit **http://localhost:5173** in your browser. The chatbot is ready!

Try asking:
- "How many vacation days do I get?"
- "What are the CloudSync Pro pricing plans?"
- "What is the 401k match?"
- "What is the remote work policy?"

---

## 📄 Uploading Your Own Documents

1. Click **"Upload PDF / TXT"** in the left sidebar
2. Select a category from the dropdown (HR, Products, IT, etc.)
3. Choose a PDF or TXT file (max 10MB)
4. The document will be chunked and indexed automatically
5. Ask questions about the uploaded content immediately

---

## 🏗️ How the RAG Pipeline Works

```
User Question
      │
      ▼
  TF-IDF Retrieval ──── finds top 5 most relevant text chunks
      │
      ▼
  Context Builder ────── injects chunks into Claude system prompt
      │
      ▼
  Claude API ─────────── generates answer grounded in the context
      │
      ▼
  Response + Sources ─── displayed in chat UI
```

---

## 🔧 Upgrading to Production (Optional)

| Feature | Current | Production Upgrade |
|---|---|---|
| Retrieval | TF-IDF in-memory | ChromaDB / Pinecone vector DB |
| Embeddings | None | Voyage-3 via Anthropic API |
| Storage | RAM only | Persistent database |
| Auth | None | Add JWT / OAuth |
| File types | PDF, TXT | Add DOCX, CSV support |

---

## 🐙 Adding to Git

```bash
# From the rag-chatbot root folder
git init
git add .
git commit -m "feat: RAG chatbot with React + Express + Claude API"

# Push to GitHub
git remote add origin https://github.com/YOUR_USERNAME/rag-chatbot.git
git push -u origin main
```

> ⚠️ Never commit your `.env` file — it's already in `.gitignore`

---

## 📦 Tech Stack

- **Frontend**: React 18, Vite, Lucide Icons
- **Backend**: Node.js, Express, Multer, pdf-parse
- **AI**: Anthropic Claude API (claude-sonnet-4)
- **Retrieval**: TF-IDF similarity (no external DB needed)
- **Styling**: Pure CSS with CSS variables (dark theme)
