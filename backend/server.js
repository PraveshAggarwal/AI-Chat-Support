import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { initGemini } from './services/gemini.js';
// No documentStore imports needed
import authRoutes from './routes/auth.js';
import chatRoutes from './routes/chat.js';
import documentRoutes from './routes/documents.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));

// Routes
app.get('/', (req, res) => {
  res.send('AI Customer Support Chatbot Backend is running! 🚀');
});

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/documents', documentRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    documentsLoaded: getDocumentCount(),
    dbConnected: mongoose.connection.readyState === 1,
  });
});

// Documents are now conversation-scoped, so no global sample data is loaded.

// Connect to MongoDB and start server
async function start() {
  console.log('\n🚀 Starting AI Customer Support Chatbot Server...\n');

  // Connect to MongoDB
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('❌ MONGODB_URI is not set in environment variables.');
    console.error('   Add MONGODB_URI to your .env file.');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ Failed to connect to MongoDB:', err.message);
    process.exit(1);
  }

  // Check JWT_SECRET
  if (!process.env.JWT_SECRET) {
    console.error('❌ JWT_SECRET is not set in environment variables.');
    console.error('   Add JWT_SECRET to your .env file.');
    process.exit(1);
  }

  // Initialize Gemini
  initGemini();

  app.listen(PORT, () => {
    console.log(`\n🌐 Server running at http://localhost:${PORT}`);
    console.log(`📡 API endpoints:`);
    console.log(`   POST /api/auth/signup     — Create account`);
    console.log(`   POST /api/auth/login      — Login`);
    console.log(`   GET  /api/auth/me         — Current user`);
    console.log(`   POST /api/chat            — Send a message`);
    console.log(`   GET  /api/chat/conversations — List conversations`);
    console.log(`   GET  /api/chat/conversations/:id — Load conversation`);
    console.log(`   DEL  /api/chat/conversations/:id — Delete conversation`);
    console.log(`   GET  /api/documents       — List documents`);
    console.log(`   POST /api/documents/upload — Upload document`);
    console.log(`   DEL  /api/documents/:id   — Delete document`);
    console.log(`   GET  /api/health          — Health check\n`);
  });
}

start();
