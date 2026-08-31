import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const STORE_PATH = path.join(DATA_DIR, 'documents.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory store
let documents = [];

// Load from disk on startup
function loadFromDisk() {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf-8');
      documents = JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to load documents from disk:', err.message);
    documents = [];
  }
}

// Persist to disk
function saveToDisk() {
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(documents, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save documents to disk:', err.message);
  }
}

// Initialize store
loadFromDisk();

/**
 * Add a document to the store.
 * @param {string} name - Document filename
 * @param {string} type - File type (pdf, txt)
 * @param {string} content - Extracted text content
 * @returns {object} The created document record
 */
export function addDocument(name, type, content) {
  const doc = {
    id: uuidv4(),
    name,
    type,
    content,
    uploadedAt: new Date().toISOString(),
  };
  documents.push(doc);
  saveToDisk();
  return doc;
}

/**
 * Get all documents (without full content for listing).
 * @returns {Array} Array of document metadata
 */
export function listDocuments() {
  return documents.map(({ id, name, type, uploadedAt }) => ({
    id,
    name,
    type,
    uploadedAt,
    contentPreview: documents.find(d => d.id === id).content.substring(0, 150) + '...',
  }));
}

/**
 * Get all documents with full content (for AI context).
 * @returns {Array} Array of full document objects
 */
export function getAllDocumentsWithContent() {
  return documents;
}

/**
 * Get a single document by ID.
 * @param {string} id
 * @returns {object|null}
 */
export function getDocument(id) {
  return documents.find(d => d.id === id) || null;
}

/**
 * Delete a document by ID.
 * @param {string} id
 * @returns {boolean} True if deleted
 */
export function deleteDocument(id) {
  const index = documents.findIndex(d => d.id === id);
  if (index === -1) return false;
  documents.splice(index, 1);
  saveToDisk();
  return true;
}

/**
 * Get total count of documents.
 * @returns {number}
 */
export function getDocumentCount() {
  return documents.length;
}
