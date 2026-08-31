import { GoogleGenerativeAI } from '@google/generative-ai';
import { getAllDocumentsWithContent } from './documentStore.js';

let genAI = null;
let model = null;

/**
 * Initialize the Gemini client with the API key.
 */
export function initGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('⚠️  GEMINI_API_KEY is not set in environment variables.');
    console.error('   Create a .env file in the backend directory with your API key.');
    console.error('   See .env.example for reference.');
    return false;
  }
  genAI = new GoogleGenerativeAI(apiKey);
  model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  console.log('✅ Gemini AI initialized successfully');
  return true;
}

/**
 * Build the system instruction for the AI.
 */
function buildSystemInstruction(documents) {
  let systemPrompt = `You are a helpful AI customer support assistant. Your role is to answer questions ONLY based on the provided knowledge base documents.

CRITICAL RULES:
1. ONLY answer questions using information found in the provided documents below.
2. If the answer is NOT found in any document, respond with: "I don't have information about that in my knowledge base. Please contact our support team for further assistance."
3. NEVER invent, fabricate, or guess information that isn't in the documents.
4. When answering, cite which document your answer comes from using the format: [Source: Document Name]
5. Be friendly, professional, and concise.
6. If a question is partially answerable, answer what you can and clearly state what information is not available.
7. Format your responses using Markdown for readability (bullet points, bold text, etc.).

`;

  const textDocs = documents.filter(d => !d.type.startsWith('image/'));

  if (textDocs.length === 0 && documents.length === 0) {
    systemPrompt += `\n--- KNOWLEDGE BASE ---\nNo documents have been uploaded yet. Inform the user that the knowledge base is empty and they need to upload documents first.\n--- END KNOWLEDGE BASE ---`;
  } else if (textDocs.length > 0) {
    systemPrompt += `\n--- KNOWLEDGE BASE ---\n`;
    textDocs.forEach((doc, index) => {
      systemPrompt += `\n### Document ${index + 1}: "${doc.name}" (Uploaded: ${doc.uploadedAt})\n${doc.content}\n`;
    });
    systemPrompt += `\n--- END KNOWLEDGE BASE ---`;
  }

  return systemPrompt;
}

/**
 * Send a message to Gemini with document context and conversation history.
 * @param {string} userMessage - The user's question
 * @param {Array} conversationHistory - Previous messages [{role, content}]
 * @returns {object} { reply, sources }
 */
export async function chat(userMessage, conversationHistory = []) {
  if (!genAI) {
    throw new Error('Gemini AI is not initialized. Check your API key.');
  }

  const documents = getAllDocumentsWithContent();
  const systemPrompt = buildSystemInstruction(documents);
  const imageDocs = documents.filter(d => d.type.startsWith('image/'));

  const systemParts = [{ text: systemPrompt }];
  imageDocs.forEach(doc => {
    systemParts.push({ text: `Reference Image: [Source: ${doc.name}]` });
    systemParts.push({
      inlineData: {
        data: doc.content,
        mimeType: doc.type
      }
    });
  });

  // Initialize model with dynamic system instruction
  const dynamicModel = genAI.getGenerativeModel({ 
    model: 'models/gemini-3.1-flash-lite',
    systemInstruction: {
      role: 'system',
      parts: systemParts
    }
  });

  // Build chat history for Gemini format
  const history = conversationHistory.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }],
  }));

  const chatSession = dynamicModel.startChat({
    history,
  });

  const result = await chatSession.sendMessage(userMessage);
  const responseText = result.response.text();

  // Extract source references from the response
  const sourceMatches = responseText.match(/\[Source:\s*([^\]]+)\]/g);
  const sources = sourceMatches
    ? [...new Set(sourceMatches.map(s => s.replace(/\[Source:\s*/, '').replace(/\]$/, '')))]
    : [];

  return {
    reply: responseText,
    sources,
    documentCount: documents.length,
  };
}
