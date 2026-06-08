export interface PdfFile {
  id: string;
  originalName: string;
  filePath: string;
  originalSize: number;
  compressedSize: number | null;
  status: 'pending' | 'processing' | 'done' | 'error';
  error?: string;
  hasMetadata: boolean;
  preserveMetadata: boolean;
}

export interface CompressOptions {
  quality: number;
  preserveMetadata: boolean;
}

export interface CompressJob {
  id: string;
  files: PdfFile[];
  options: CompressOptions;
  outputDir: string;
  createdAt: Date;
}

export interface ProgressEvent {
  jobId: string;
  fileId: string;
  fileName: string;
  progress: number;
  status: 'pending' | 'processing' | 'done' | 'error';
  originalSize?: number;
  compressedSize?: number;
  error?: string;
}
