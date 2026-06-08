import { useState, useCallback } from 'react';
import DropZone from './components/DropZone';
import FileList from './components/FileList';
import MetadataPrompt from './components/MetadataPrompt';
import ProgressPanel from './components/ProgressPanel';
import ResultsSummary from './components/ResultsSummary';
import { startCompress } from './api';
import type { PdfFileInfo } from './types';

type Step = 'select' | 'metadata' | 'progress' | 'done';

let fileIdCounter = 0;
function nextId(): string {
  return `file-${++fileIdCounter}`;
}

export default function App() {
  const [step, setStep] = useState<Step>('select');
  const [quality, setQuality] = useState(70);
  const [selectedFiles, setSelectedFiles] = useState<{ id: string; file: File; size: number }[]>([]);
  const [pdfFiles, setPdfFiles] = useState<PdfFileInfo[]>([]);
  const [outputDir, setOutputDir] = useState<string>('');

  const handleFilesSelected = useCallback((files: File[]) => {
    const newFiles = files.map(f => ({
      id: nextId(),
      file: f,
      size: f.size,
    }));
    setSelectedFiles(prev => [...prev, ...newFiles]);
  }, []);

  const handleRemoveFile = useCallback((id: string) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  const handleStartCompress = useCallback(async (preserveMetadata: boolean) => {
    setStep('progress');

    try {
      const { serverFiles } = await startCompress({
        files: selectedFiles.map(f => f.file),
        quality,
        preserveMetadata,
        onProgress: (event) => {
          setPdfFiles(prev =>
            prev.map(f =>
              f.id === event.fileId
                ? {
                    ...f,
                    status: event.status,
                    compressedSize: event.compressedSize ?? f.compressedSize,
                    error: event.error,
                  }
                : f
            )
          );
        },
        onComplete: (result) => {
          setPdfFiles(result.files);
          setOutputDir(result.jobId);
          setStep('done');
        },
        onError: (error) => {
          setPdfFiles(prev =>
            prev.map(f => ({
              ...f,
              status: f.status === 'pending' ? 'error' as const : f.status,
              error: f.status === 'pending' ? error : f.error,
            }))
          );
          setStep('done');
        },
      });

      const initialFiles: PdfFileInfo[] = selectedFiles.map((f, i) => ({
        id: serverFiles[i].id,
        originalName: f.file.name,
        originalSize: f.size,
        compressedSize: null,
        status: 'pending',
        hasMetadata: false,
        preserveMetadata,
      }));
      setPdfFiles(initialFiles);
    } catch (err) {
      setPdfFiles(prev =>
        prev.map(f => ({
          ...f,
          status: 'error' as const,
          error: err instanceof Error ? err.message : 'Bağlantı hatası',
        }))
      );
      setStep('done');
    }
  }, [selectedFiles, quality]);

  const handleRestart = useCallback(() => {
    setStep('select');
    setSelectedFiles([]);
    setPdfFiles([]);
    setOutputDir('');
  }, []);

  const handleCompressClick = useCallback(() => {
    const hasMetaFiles = selectedFiles.length > 0;
    if (hasMetaFiles) {
      setStep('metadata');
    } else {
      handleStartCompress(true);
    }
  }, [selectedFiles, handleStartCompress]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-3">
            <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h1 className="text-2xl font-bold text-gray-900">PDF Sıkıştırıcı</h1>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Kaliteyi koruyarak PDF dosyalarınızı küçültün
          </p>
        </div>

        <div className="space-y-4">
          {step === 'select' && (
            <>
              <DropZone
                onFilesSelected={handleFilesSelected}
                disabled={step !== 'select'}
              />

              <FileList
                files={selectedFiles.map(f => ({
                  id: f.id,
                  originalName: f.file.name,
                  originalSize: f.size,
                  compressedSize: null,
                  status: 'pending' as const,
                  hasMetadata: false,
                  preserveMetadata: true,
                }))}
                onRemove={handleRemoveFile}
                showRemove
              />

              {selectedFiles.length > 0 && (
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sıkıştırma Seviyesi
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={quality}
                    onChange={e => setQuality(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Maksimum</span>
                    <span className="font-medium text-blue-600">{quality}%</span>
                    <span>Minimum</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Düşük değer = daha küçük dosya, yüksek değer = daha kaliteli çıktı
                  </p>

                  <button
                    onClick={handleCompressClick}
                    className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                  >
                    {selectedFiles.length} Dosyayı Sıkıştır
                  </button>
                </div>
              )}
            </>
          )}

          {step === 'metadata' && (
            <MetadataPrompt
              fileCount={selectedFiles.length}
              metadataFileCount={selectedFiles.length}
              onConfirm={handleStartCompress}
              onCancel={() => setStep('select')}
            />
          )}

          {step === 'progress' && (
            <ProgressPanel files={pdfFiles} />
          )}

          {step === 'done' && (
            <>
              <ResultsSummary files={pdfFiles} jobId={outputDir} />

              <button
                onClick={handleRestart}
                className="mt-4 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Yeni Sıkıştırma Başlat
              </button>

              {outputDir && (
                <p className="text-center text-xs text-gray-400">
                  Çıktı dosyaları geçici dizine kaydedildi
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
