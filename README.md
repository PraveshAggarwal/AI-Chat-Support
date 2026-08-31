# AI Customer Support Chatbot

An intelligent customer support chatbot powered by Google's Gemini AI that answers questions exclusively from your uploaded knowledge base documents. Built with React, Tailwind CSS, Node.js, and Express.

## ✨ Features

- **Document-based Q&A** — AI answers only from uploaded documents, never invents information
- **PDF & Text Upload** — Upload PDF, TXT, and Markdown files to build your knowledge base
- **Source Citations** — Every answer includes references to the source document
- **Conversation History** — Context-aware conversations that remember previous messages
- **Feedback System** — Thumbs up/down buttons on AI responses
- **Document Management** — Upload, view, and delete documents from the knowledge base
- **Sample Data** — Includes a pre-loaded FAQ document for immediate testing

## 🛠 Tech Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Frontend  | React 19, Tailwind CSS 4, Vite    |
| Backend   | Node.js, Express.js               |
| AI        | Google Gemini 2.0 Flash           |
| Icons     | Lucide React                      |

## 📁 Project Structure

```
Ai-Support/
├── backend/
│   ├── data/               # Sample documents & JSON store
│   ├── routes/
│   │   ├── chat.js          # Chat API endpoint
│   │   └── documents.js     # Document CRUD endpoints
│   ├── services/
│   │   ├── documentStore.js # In-memory document storage
│   │   └── gemini.js        # Gemini AI integration
│   ├── server.js            # Express server entry point
│   ├── .env.example         # Environment variables template
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Chat & Documents pages
│   │   ├── api.js           # API client
│   │   ├── App.jsx          # Root component with routing
│   │   ├── index.css        # Global styles & Tailwind config
│   │   └── main.jsx         # Entry point
│   ├── index.html
│   └── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- A Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

### 1. Clone & Setup Backend

```bash
cd backend

# Create .env file with your Gemini API key
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# Install dependencies
npm install

# Start the server
npm run dev
```

The backend will start at `http://localhost:5000`.

### 2. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The frontend will start at `http://localhost:5173`.

## 📖 Usage

1. **Start chatting** — The app comes pre-loaded with a sample FAQ document. Ask questions like:
   - "What pricing plans do you offer?"
   - "How do I reset my password?"
   - "What integrations are available?"

2. **Upload documents** — Go to the Documents page to upload your own FAQ or product documents (PDF, TXT, MD).

3. **Manage knowledge base** — View and delete documents from the Documents page.

## 🔑 API Endpoints

| Method | Endpoint                  | Description              |
|--------|---------------------------|--------------------------|
| POST   | `/api/chat`               | Send a chat message      |
| GET    | `/api/documents`          | List all documents       |
| POST   | `/api/documents/upload`   | Upload a document        |
| DELETE  | `/api/documents/:id`      | Delete a document        |
| GET    | `/api/health`             | Health check             |

## 📄 Sample Data

The project includes `backend/data/sample-faq.txt` — a comprehensive FAQ for a fictional product "TechFlow Pro" covering pricing, features, support, billing, and troubleshooting.

## License

MIT
