import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import compressRouter from './routes/compress.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3021;

app.use(cors({ origin: ['http://localhost:3020', 'http://localhost:5173'] }));
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({ name: 'PDF Sıkıştırıcı API', status: 'running', port: PORT });
});

app.use('/api/compress', compressRouter);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ error: err.message || 'İç sunucu hatası' });
});

app.listen(PORT, () => {
  console.log(`[INFO] Server http://localhost:${PORT} adresinde çalışıyor`);
});

export default app;
