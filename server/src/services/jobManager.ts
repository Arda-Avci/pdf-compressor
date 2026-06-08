import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import { CompressJob, PdfFile, CompressOptions, ProgressEvent } from '../types/index.js';
import { compressPdf, getOutputSize } from './pdfCompressor.js';
import { readMetadata, hasMetadata } from './metadataService.js';
import { EventEmitter } from 'events';

function sanitizeName(name: string): string {
  const map: Record<string, string> = {
    'ş': 's', 'Ş': 'S', 'ğ': 'g', 'Ğ': 'G',
    'ı': 'i', 'İ': 'I', 'ö': 'o', 'Ö': 'O',
    'ü': 'u', 'Ü': 'U', 'ç': 'c', 'Ç': 'C',
    'ə': 'e', 'Ə': 'E',
  };
  return name.replace(/[^\x20-\x7E]/g, c => map[c] ?? '').replace(/[<>:"\/\\|?*]/g, '_');
}

class JobManager extends EventEmitter {
  private jobs: Map<string, CompressJob> = new Map();

  async createJob(
    files: { originalName: string; filePath: string; size: number }[],
    outputDir: string,
    options: CompressOptions
  ): Promise<CompressJob> {
    const jobId = uuidv4();
    const pdfFiles: PdfFile[] = [];

    for (const file of files) {
      const meta = await readMetadata(file.filePath);
      pdfFiles.push({
        id: uuidv4(),
        originalName: file.originalName,
        filePath: file.filePath,
        originalSize: file.size,
        compressedSize: null,
        status: 'pending',
        hasMetadata: hasMetadata(meta),
        preserveMetadata: options.preserveMetadata,
      });
    }

    const job: CompressJob = {
      id: jobId,
      files: pdfFiles,
      options,
      outputDir,
      createdAt: new Date(),
    };

    this.jobs.set(jobId, job);
    return job;
  }

  async startJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) throw new Error(`Job bulunamadı: ${jobId}`);

    await fs.mkdir(job.outputDir, { recursive: true });

    for (const file of job.files) {
      const emitProgress = (data: Partial<ProgressEvent>) => {
        this.emit('progress', {
          jobId,
          fileId: file.id,
          fileName: file.originalName,
          progress: data.progress ?? 0,
          status: data.status ?? 'processing',
          originalSize: data.originalSize ?? file.originalSize,
          compressedSize: data.compressedSize,
          error: data.error,
        } as ProgressEvent);
      };

      file.status = 'processing';
      emitProgress({ progress: 0, status: 'processing' });

      try {
        const safeName = sanitizeName(path.basename(file.originalName, '.pdf'));
        const outputFileName = safeName + '-compressed.pdf';
        const outputPath = path.join(job.outputDir, outputFileName);

        await compressPdf(
          file.filePath,
          outputPath,
          { ...job.options, preserveMetadata: file.preserveMetadata },
        );

        let compressedSize = await getOutputSize(outputPath);

        if (compressedSize >= file.originalSize) {
          await fs.copyFile(file.filePath, outputPath);
          compressedSize = file.originalSize;
        }

        file.compressedSize = compressedSize;
        file.status = 'done';

        emitProgress({ progress: 100, status: 'done', compressedSize });
      } catch (err) {
        file.status = 'error';
        file.error = err instanceof Error ? err.message : 'Bilinmeyen hata';

        emitProgress({ status: 'error', error: file.error });
      }
    }
  }

  getJob(jobId: string): CompressJob | undefined {
    return this.jobs.get(jobId);
  }
}

export const jobManager = new JobManager();
