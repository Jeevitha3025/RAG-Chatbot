import { Router } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { retrieveRelevant } from '../services/vectorStore.js';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/', async (req, res) => {
  const { message, history = [] } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });

  try {
    const retrieved = await retrieveRelevant(message, 5);

    if (retrieved.length === 0) {
      return res.json({ reply: "No documents found. Upload some docs first.", sources: [] });
    }

    const context = retrieved
      .map((r, i) => `[Source ${i + 1}: ${r.metadata.fileName}]\n${r.text}`)
      .join('\n\n---\n\n');

    const sourceMap = new Map();
    retrieved.forEach(r => {
      if (!sourceMap.has(r.metadata.docId)) {
        sourceMap.set(r.metadata.docId, {
          fileName: r.metadata.fileName,
          category: r.metadata.category,
        });
      }
    });

    const systemPrompt = `You are a helpful internal assistant for JL Group of Institutions.
Answer using ONLY the retrieved document chunks below. Be concise and cite the source document.
If the answer is not in the context, say "I don't have that information in the available documents."

Retrieved context:
${context}`;

    // Build Gemini-compatible history
    const chatHistory = history.slice(-6).map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    // Use gemini-2.0-flash — same model as your MaaMind project
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: systemPrompt,   // <-- moved here, not in startChat
    });

    const chat = model.startChat({ history: chatHistory });
    const result = await chat.sendMessage(message);

    res.json({ reply: result.response.text(), sources: [...sourceMap.values()] });
  } catch (err) {
    console.error('Chat error:', err.message);
    res.status(500).json({ error: 'Failed: ' + err.message });
  }
});

export default router;