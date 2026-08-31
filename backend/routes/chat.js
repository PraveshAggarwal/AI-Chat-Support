import express from 'express';
import { chat } from '../services/gemini.js';
import auth from '../middleware/auth.js';
import Conversation from '../models/Conversation.js';
import Document from '../models/Document.js';

const router = express.Router();

// All chat routes require authentication
router.use(auth);

/**
 * POST /api/chat
 * Send a message. Creates or continues a conversation.
 * Body: { message, conversationId? }
 * Response: { reply, sources, documentCount, conversationId }
 */
router.post('/', async (req, res) => {
  try {
    const { message, conversationId, attachments = [] } = req.body;

    if ((!message || typeof message !== 'string' || message.trim().length === 0) && attachments.length === 0) {
      return res.status(400).json({ error: 'Message or attachment is required.' });
    }
    if (message && message.length > 5000) {
      return res.status(400).json({ error: 'Message is too long. Maximum 5000 characters.' });
    }

    let conversation;

    if (conversationId) {
      // Load existing conversation
      conversation = await Conversation.findOne({ _id: conversationId, userId: req.user.id });
      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found.' });
      }
    } else {
      // Create new conversation
      conversation = new Conversation({ userId: req.user.id, messages: [] });
    }

    // Add user message
    conversation.messages.push({
      role: 'user',
      content: message ? message.trim() : '',
      attachments: attachments,
      timestamp: new Date(),
    });

    // Build history for Gemini (previous messages in this conversation)
    const conversationHistory = conversation.messages.slice(0, -1)
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role,
        content: m.content || 'I have attached a document.',
      }));

    const safeMessage = message ? message.trim() : '';
    console.log(`💬 [${req.user.email}] User: ${safeMessage ? safeMessage.substring(0, 80) : '[Attachment only]'}`);

    let result;
    if (!safeMessage && attachments.length > 0) {
      // If they only sent an attachment, bypass the AI and ask what they want to know
      result = {
        reply: "I've received your document. What would you like to ask about it?",
        sources: [],
        documentCount: await Document.countDocuments({ conversationId: conversation._id })
      };
    } else {
      result = await chat(safeMessage, conversationHistory, conversation._id.toString());
    }

    // Add AI response
    conversation.messages.push({
      role: 'assistant',
      content: result.reply,
      sources: result.sources || [],
      timestamp: new Date(),
    });

    // Auto-generate title from first message
    if (!conversationId) {
      conversation.generateTitle();
    }

    await conversation.save();

    console.log(`🤖 [${req.user.email}] AI: ${result.reply.substring(0, 80)}${result.reply.length > 80 ? '...' : ''}`);

    res.json({
      reply: result.reply,
      sources: result.sources,
      documentCount: result.documentCount,
      conversationId: conversation._id,
    });
  } catch (err) {
    console.error('Chat error:', err);
    if (err.message?.includes('API key')) {
      return res.status(500).json({ error: 'Gemini API key is not configured.' });
    }
    res.status(500).json({ error: 'Failed to generate a response. Please try again.' });
  }
});

/**
 * GET /api/chat/conversations
 * List all conversations for the current user.
 */
router.get('/conversations', async (req, res) => {
  try {
    const conversations = await Conversation.find({ userId: req.user.id })
      .select('title createdAt updatedAt')
      .sort({ updatedAt: -1 })
      .lean();

    const result = conversations.map(c => ({
      id: c._id,
      title: c.title,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));

    res.json({ conversations: result });
  } catch (err) {
    console.error('List conversations error:', err);
    res.status(500).json({ error: 'Failed to load conversations.' });
  }
});

/**
 * GET /api/chat/conversations/:id
 * Get a specific conversation with all messages.
 */
router.get('/conversations/:id', async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      userId: req.user.id,
    }).lean();

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    res.json({
      id: conversation._id,
      title: conversation.title,
      messages: conversation.messages.map(m => ({
        role: m.role,
        content: m.content,
        attachments: m.attachments || [],
        sources: m.sources || [],
        timestamp: m.timestamp,
      })),
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    });
  } catch (err) {
    console.error('Get conversation error:', err);
    res.status(500).json({ error: 'Failed to load conversation.' });
  }
});

/**
 * DELETE /api/chat/conversations/:id
 * Delete a conversation and its associated documents.
 */
router.delete('/conversations/:id', async (req, res) => {
  try {
    const result = await Conversation.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!result) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    // Delete all associated documents from MongoDB
    await Document.deleteMany({ conversationId: req.params.id });

    console.log(`🗑️  [${req.user.email}] Conversation deleted: ${req.params.id}`);
    res.json({ message: 'Conversation deleted.' });
  } catch (err) {
    console.error('Delete conversation error:', err);
    res.status(500).json({ error: 'Failed to delete conversation.' });
  }
});

export default router;
