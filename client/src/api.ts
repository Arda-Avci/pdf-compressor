import type { CompressResult, ProgressEvent } from './types';

export interface StartCompressParams {
  files: File[];
  quality: number;
  preserveMetadata: boolean;
  onProgress: (event: ProgressEvent) => void;
  onComplete: (result: CompressResult) => void;
  onError: (error: string) => void;
}

export async function startCompress({
  files,
  quality,
  preserveMetadata,
  onProgress,
  onComplete,
  onError,
}: StartCompressParams): Promise<{ jobId: string; serverFiles: { id: string; originalName: string; originalSize: number }[] }> {
  const formData = new FormData();
  files.forEach(f => formData.append('files', f));
  formData.append('quality', String(quality));
  formData.append('preserveMetadata', String(preserveMetadata));

  const res = await fetch('/api/compress', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Sunucu hatası' }));
    throw new Error(err.error || 'Sıkıştırma başlatılamadı');
  }

  const body = await res.json();
  const jobId: string = body.jobId;
  const serverFiles: { id: string; originalName: string; originalSize: number }[] = body.files;
  pollProgress(jobId, onProgress, onComplete, onError);
  return { jobId, serverFiles };
}

function pollProgress(
  jobId: string,
  onProgress: (event: ProgressEvent) => void,
  onComplete: (result: CompressResult) => void,
  onError: (error: string) => void,
  attempt = 0,
): void {
  const POLL_INTERVAL = 1200;
  const MAX_ATTEMPTS = 300;

  fetch(`/api/compress/result/${jobId}`)
    .then(r => r.json())
    .then((result: CompressResult) => {
      for (const file of result.files) {
        onProgress({
          jobId,
          fileId: file.id,
          fileName: file.originalName,
          progress: file.status === 'done' ? 100 : file.status === 'error' ? 100 : 0,
          status: file.status,
          originalSize: file.originalSize,
          compressedSize: file.compressedSize ?? undefined,
          error: file.error,
        });
      }

      const allDone = result.files.every(f => f.status === 'done' || f.status === 'error');
      if (allDone) {
        onComplete(result);
      } else if (attempt < MAX_ATTEMPTS) {
        setTimeout(() => pollProgress(jobId, onProgress, onComplete, onError, attempt + 1), POLL_INTERVAL);
      } else {
        onError('Zaman aşımı: İşlem çok uzun sürdü.');
      }
    })
    .catch(err => {
      if (attempt < 10) {
        setTimeout(() => pollProgress(jobId, onProgress, onComplete, onError, attempt + 1), POLL_INTERVAL);
      } else {
        onError(err instanceof Error ? err.message : 'Sonuç alınamadı');
      }
    });
}
