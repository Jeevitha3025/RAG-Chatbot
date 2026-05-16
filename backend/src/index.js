import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import chatRoutes from './routes/chat.js';
import documentsRoutes from './routes/documents.js';
import { seedMockDocuments } from './services/vectorStore.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());
app.use('/uploads', express.static(join(__dirname, '../uploads')));

app.use('/api/chat', chatRoutes);
app.use('/api/documents', documentsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'RAG Chatbot API running' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

const start = async () => {
  await seedMockDocuments();
  app.listen(PORT, () => {
    console.log(`\n✅ Backend running at http://localhost:${PORT}`);
    console.log(`📚 Mock company docs loaded and ready`);
    console.log(`💬 Chat at http://localhost:5173\n`);
  });
};

start();
