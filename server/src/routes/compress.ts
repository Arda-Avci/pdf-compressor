import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import { fileURLToPath } from 'url';
import { jobManager } from '../services/jobManager.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.resolve(__dirname, '..', '..', '..', 'output');

const router = Router();

const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    const dir = path.join(os.tmpdir(), 'pdf-compressor-uploads');
    await fs.mkdir(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (!file.originalname.toLowerCase().endsWith('.pdf')) {
      cb(new Error('Yalnızca PDF dosyaları kabul edilir'));
      return;
    }
    cb(null, true);
  },
});

router.post('/', upload.array('files'), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) {
      res.status(400).json({ error: 'En az bir PDF dosyası seçmelisiniz' });
      return;
    }

    const quality = Math.min(100, Math.max(1, parseInt(req.body.quality as string) || 70));
    const preserveMetadata = req.body.preserveMetadata === 'true';

    const outputDir = path.join(
      OUTPUT_DIR,
      `job-${Date.now()}`
    );

    const pdfFiles = files.map(f => ({
      originalName: f.originalname,
      filePath: f.path,
      size: f.size,
    }));

    const job = await jobManager.createJob(pdfFiles, outputDir, {
      quality,
      preserveMetadata,
    });

    res.json({
      jobId: job.id,
      files: job.files.map(f => ({
        id: f.id,
        originalName: f.originalName,
        originalSize: f.originalSize,
        hasMetadata: f.hasMetadata,
        status: f.status,
      })),
    });

    setTimeout(() => jobManager.startJob(job.id).catch(console.error), 500);
  } catch (err) {
    console.error('Sıkıştırma başlatılamadı:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Sunucu hatası' });
  }
});

router.get('/progress/:jobId', (req: Request, res: Response) => {
  const jobId = req.params.jobId as string;
  const job = jobManager.getJob(jobId);

  if (!job) {
    res.status(404).json({ error: 'Job bulunamadı' });
    return;
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  const sendEvent = (data: unknown) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const onProgress = (event: { jobId: string }) => {
    if (event.jobId === jobId) {
      sendEvent(event);

      const currentJob = jobManager.getJob(jobId);
      if (currentJob?.files.every(f => f.status === 'done' || f.status === 'error')) {
        sendEvent({ type: 'complete', jobId });
        cleanup();
      }
    }
  };

  const cleanup = () => {
    jobManager.removeListener('progress', onProgress);
    res.end();
  };

  jobManager.on('progress', onProgress);

  if (job.files.every(f => f.status === 'done' || f.status === 'error')) {
    for (const file of job.files) {
      sendEvent({
        jobId,
        fileId: file.id,
        fileName: file.originalName,
        progress: 100,
        status: file.status,
        originalSize: file.originalSize,
        compressedSize: file.compressedSize,
        error: file.error,
      });
    }
    sendEvent({ type: 'complete', jobId });
    cleanup();
    return;
  }

  req.on('close', cleanup);

  sendEvent({ type: 'connected', jobId });
});

router.get('/result/:jobId', (req: Request, res: Response) => {
  const job = jobManager.getJob(req.params.jobId as string);
  if (!job) {
    res.status(404).json({ error: 'Job bulunamadı' });
    return;
  }

  res.json({
    jobId: job.id,
    outputDir: job.outputDir,
    files: job.files.map(f => ({
      id: f.id,
      originalName: f.originalName,
      originalSize: f.originalSize,
      compressedSize: f.compressedSize,
      status: f.status,
      error: f.error,
      hasMetadata: f.hasMetadata,
      preserveMetadata: f.preserveMetadata,
    })),
  });
});

router.get('/download/:jobId/:fileId', async (req: Request, res: Response) => {
  const job = jobManager.getJob(req.params.jobId as string);
  if (!job) {
    res.status(404).json({ error: 'Job bulunamadı' });
    return;
  }
  const file = job.files.find(f => f.id === req.params.fileId);
  if (!file || !file.compressedSize) {
    res.status(404).json({ error: 'Dosya bulunamadı' });
    return;
  }

  const safeName = path.basename(file.originalName, '.pdf').replace(/[^\x20-\x7E]/g, '_').replace(/[<>:"\/\\|?*]/g, '_');
  const outputPath = path.join(job.outputDir, safeName + '-compressed.pdf');

  try {
    await fs.access(outputPath);
    res.download(outputPath, file.originalName.replace('.pdf', '-sikistirilmis.pdf'));
  } catch {
    res.status(404).json({ error: 'Çıktı dosyası bulunamadı' });
  }
});

export default router;
