import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { addDocument, listDocuments, deleteDocument, getDocument } from '../services/documentStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

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

    const doc = addDocument(req.file.originalname, docType, content);

    // Clean up uploaded file after extraction
    fs.unlinkSync(filePath);

    console.log(`📄 Document uploaded: "${doc.name}" (${content.length} chars)`);

    res.status(201).json({
      message: 'Document uploaded successfully.',
      document: {
        id: doc.id,
        name: doc.name,
        type: doc.type,
        uploadedAt: doc.uploadedAt,
      },
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
router.get('/', (req, res) => {
  const docs = listDocuments();
  res.json({ documents: docs, total: docs.length });
});

/**
 * GET /api/documents/:id
 * Get a specific document.
 */
router.get('/:id', (req, res) => {
  const doc = getDocument(req.params.id);
  if (!doc) {
    return res.status(404).json({ error: 'Document not found.' });
  }
  res.json({ document: doc });
});

/**
 * DELETE /api/documents/:id
 * Delete a document from the knowledge base.
 */
router.delete('/:id', (req, res) => {
  const deleted = deleteDocument(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Document not found.' });
  }
  console.log(`🗑️  Document deleted: ${req.params.id}`);
  res.json({ message: 'Document deleted successfully.' });
});

export default router;
