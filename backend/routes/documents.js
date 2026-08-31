import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import auth from '../middleware/auth.js';
import Conversation from '../models/Conversation.js';
import Document from '../models/Document.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
router.use(auth); // All document routes require authentication

// Configure multer for file uploads
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['.pdf', '.txt', '.md', '.png', '.jpg', '.jpeg', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${ext} is not supported. Allowed: ${allowed.join(', ')}`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
});

/**
 * POST /api/documents/upload
 * Upload a document (PDF, TXT, MD, or Image) to the knowledge base.
 */
router.post('/upload', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    let { conversationId } = req.body;
    
    // If no conversation exists (uploading to a New Chat), create an empty one
    if (!conversationId) {
      const newConv = await Conversation.create({ userId: req.user.id, messages: [] });
      conversationId = newConv._id.toString();
    }

    const filePath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();
    let content = '';
    let docType = ext.replace('.', '');

    if (ext === '.pdf') {
      // Dynamically import pdf-parse (CommonJS module)
      const pdfParse = (await import('pdf-parse')).default;
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      content = pdfData.text;
    } else if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) {
      // Read image as base64
      const dataBuffer = fs.readFileSync(filePath);
      content = dataBuffer.toString('base64');
      docType = `image/${ext.replace('.', '')}`;
      if (docType === 'image/jpg') docType = 'image/jpeg';
    } else {
      // .txt or .md
      content = fs.readFileSync(filePath, 'utf-8');
    }

    if (!content || content.trim().length === 0) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: 'Could not extract content from the file.' });
    }

    const doc = await Document.create({
      name: req.file.originalname,
      type: docType,
      content,
      conversationId,
      userId: req.user.id,
    });

    // Clean up uploaded file after extraction
    fs.unlinkSync(filePath);

    console.log(`📄 [${req.user.email}] Document uploaded to chat ${conversationId}: "${doc.name}"`);

    res.status(201).json({
      message: 'Document uploaded successfully.',
      document: {
        id: doc._id,
        name: doc.name,
        type: doc.type,
        uploadedAt: doc.createdAt,
      },
      conversationId, // Return this so the frontend knows if a new chat was created
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message || 'Failed to upload document.' });
  }
});

/**
 * GET /api/documents
 * List all documents in the knowledge base.
 */
router.get('/', async (req, res) => {
  try {
    const { conversationId } = req.query;
    if (!conversationId) {
      return res.json({ documents: [], total: 0 }); // Empty if no chat selected
    }
    const docs = await Document.find({ conversationId, userId: req.user.id })
      .select('-content') // Exclude heavy content payload
      .sort({ createdAt: -1 })
      .lean();
      
    const result = docs.map(d => ({
      id: d._id,
      name: d.name,
      type: d.type,
      uploadedAt: d.createdAt,
    }));
    
    res.json({ documents: result, total: result.length });
  } catch (err) {
    console.error('List documents error:', err);
    res.status(500).json({ error: 'Failed to list documents.' });
  }
});

/**
 * GET /api/documents/:id
 * Get a specific document.
 */
router.get('/:id', async (req, res) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, userId: req.user.id }).lean();
    if (!doc) {
      return res.status(404).json({ error: 'Document not found.' });
    }
    // Rename _id to id
    doc.id = doc._id;
    delete doc._id;
    res.json({ document: doc });
  } catch (err) {
    console.error('Get document error:', err);
    res.status(500).json({ error: 'Failed to load document.' });
  }
});

/**
 * DELETE /api/documents/:id
 * Delete a document from the knowledge base.
 */
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Document.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!deleted) {
      return res.status(404).json({ error: 'Document not found or unauthorized.' });
    }
    console.log(`🗑️  [${req.user.email}] Document deleted: ${req.params.id}`);
    res.json({ message: 'Document deleted successfully.' });
  } catch (err) {
    console.error('Delete document error:', err);
    res.status(500).json({ error: 'Failed to delete document.' });
  }
});

export default router;
