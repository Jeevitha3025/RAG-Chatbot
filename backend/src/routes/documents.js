import { Router } from 'express';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, unlinkSync } from 'fs';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import { v4 as uuidv4 } from 'uuid';
import {
  addDocuments,
  listDocuments,
  deleteDocument,
  chunkText,
} from '../services/vectorStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = Router();

const storage = multer.diskStorage({
  destination: join(__dirname, '../../uploads'),
  filename: (req, file, cb) => cb(null, `${uuidv4()}-${file.originalname}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'text/plain'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only PDF and TXT files are supported'));
  },
});

// GET /api/documents — list all indexed documents
router.get('/', async (req, res) => {
  try {
    const docs = await listDocuments();
    res.json({ documents: docs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/documents/upload — upload and index a document
router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const { category = 'General' } = req.body;
  const filePath = req.file.path;
  const docId = uuidv4();

  try {
    let text = '';

    if (req.file.mimetype === 'application/pdf') {
      const buffer = readFileSync(filePath);
      const data = await pdfParse(buffer);
      text = data.text;
    } else {
      text = readFileSync(filePath, 'utf-8');
    }

    // Clean up the temp file
    unlinkSync(filePath);

    if (!text.trim()) {
      return res.status(400).json({ error: 'Could not extract text from file' });
    }

    const chunks = chunkText(text, docId, req.file.originalname, category);
    const count = await addDocuments(chunks);

    res.json({
      message: `Document indexed successfully`,
      docId,
      fileName: req.file.originalname,
      chunkCount: count,
    });
  } catch (err) {
    try { unlinkSync(filePath); } catch {}
    console.error('Upload error:', err.message);
    res.status(500).json({ error: 'Failed to process document: ' + err.message });
  }
});

// DELETE /api/documents/:id — remove a document
router.delete('/:id', async (req, res) => {
  try {
    const removed = await deleteDocument(req.params.id);
    res.json({ message: `Removed ${removed} chunks`, docId: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
