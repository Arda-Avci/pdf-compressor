export interface PdfFileInfo {
  id: string;
  originalName: string;
  originalSize: number;
  compressedSize: number | null;
  status: 'pending' | 'processing' | 'done' | 'error';
  error?: string;
  hasMetadata: boolean;
  preserveMetadata: boolean;
}

export interface CompressResult {
  jobId: string;
  files: PdfFileInfo[];
}

export interface ProgressEvent {
  type?: string;
  jobId: string;
  fileId: string;
  fileName: string;
  progress: number;
  status: 'pending' | 'processing' | 'done' | 'error';
  originalSize?: number;
  compressedSize?: number;
  error?: string;
}
