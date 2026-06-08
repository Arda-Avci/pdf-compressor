import type { PdfFileInfo } from '../types';

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function compressionRatio(original: number, compressed: number): number {
  return Math.round((1 - compressed / original) * 100);
}

interface ResultsSummaryProps {
  files: PdfFileInfo[];
  jobId?: string;
}

export default function ResultsSummary({ files, jobId }: ResultsSummaryProps) {
  const doneFiles = files.filter(f => f.status === 'done' && f.compressedSize != null);
  const errorFiles = files.filter(f => f.status === 'error');

  if (doneFiles.length === 0) return null;

  const totalOriginal = doneFiles.reduce((sum, f) => sum + f.originalSize, 0);
  const totalCompressed = doneFiles.reduce((sum, f) => sum + (f.compressedSize ?? 0), 0);
  const totalRatio = totalOriginal > 0 ? compressionRatio(totalOriginal, totalCompressed) : 0;

  const shrunk = doneFiles.filter(f => f.compressedSize! < f.originalSize);
  const grew = doneFiles.filter(f => f.compressedSize! >= f.originalSize);

  const downloadUrl = (fileId: string) => `/api/compress/download/${jobId}/${fileId}`;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Sıkıştırma Tamamlandı</h3>
        <span className={`rounded-full px-3 py-1 text-sm font-medium ${
          totalRatio > 0
            ? 'bg-green-100 text-green-700'
            : totalRatio === 0
              ? 'bg-gray-100 text-gray-600'
              : 'bg-amber-100 text-amber-700'
        }`}>
          {totalRatio > 0
            ? `%${totalRatio} küçüldü`
            : totalRatio === 0
              ? 'Değişim yok'
              : `%${Math.abs(totalRatio)} büyüdü`
          }
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-4">
        <div>
          <p className="text-xs text-gray-500">Toplam Giriş</p>
          <p className="text-lg font-semibold text-gray-900">{formatSize(totalOriginal)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Toplam Çıkış</p>
          <p className={`text-lg font-semibold ${totalCompressed < totalOriginal ? 'text-green-600' : 'text-amber-600'}`}>
            {formatSize(totalCompressed)}
          </p>
        </div>
      </div>

      {grew.length > 0 && (
        <div className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
          Bazı dosyalar sıkıştırılamadı (zaten optimize edilmiş olabilir).
        </div>
      )}

      <div className="mt-4 space-y-2">
        {doneFiles.map(file => {
          const isGrew = file.compressedSize! >= file.originalSize;
          const ratio = compressionRatio(file.originalSize, file.compressedSize!);
          const bg = isGrew ? 'border-amber-100 bg-amber-50/50' : 'border-gray-100';
          const color = isGrew ? 'text-amber-600' : 'text-green-600';
          const prefix = isGrew ? '+' : '-';

          return (
            <div key={file.id} className={`flex items-center justify-between rounded-lg border ${bg} px-3 py-2`}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{file.originalName}</p>
                <p className="text-xs text-gray-500">
                  {formatSize(file.originalSize)} → {formatSize(file.compressedSize!)}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-2">
                <span className={`text-xs font-medium ${color} whitespace-nowrap`}>
                  {prefix}%{Math.abs(ratio)}
                </span>
                {jobId && (
                  <a
                    href={downloadUrl(file.id)}
                    className="flex-shrink-0 rounded-lg bg-blue-50 p-1.5 text-blue-600 hover:bg-blue-100 transition-colors"
                    title="İndir"
                    download
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {errorFiles.length > 0 && (
        <div className="mt-4 rounded-lg bg-red-50 p-3">
          <p className="text-sm font-medium text-red-700">
            {errorFiles.length} dosyada hata oluştu
          </p>
          {errorFiles.map(f => (
            <p key={f.id} className="mt-1 text-xs text-red-600">
              {f.originalName}: {f.error}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
