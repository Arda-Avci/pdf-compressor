import type { PdfFileInfo } from '../types';

function formatPercent(value: number): string {
  return value.toFixed(1).replace('.', ',') + '%';
}

interface ProgressPanelProps {
  files: PdfFileInfo[];
}

export default function ProgressPanel({ files }: ProgressPanelProps) {
  const totalFiles = files.length;
  const doneCount = files.filter(f => f.status === 'done').length;
  const errorCount = files.filter(f => f.status === 'error').length;
  const processing = files.filter(f => f.status === 'processing');

  if (totalFiles === 0) return null;

  const completedCount = doneCount + errorCount;
  const progress = totalFiles > 0 ? (completedCount / totalFiles) * 100 : 0;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-gray-700">
          Sıkıştırılıyor... ({completedCount}/{totalFiles})
        </p>
        <span className="text-sm tabular-nums text-gray-500">{formatPercent(progress)}</span>
      </div>

      <div className="h-2 rounded-full bg-gray-100">
        <div
          className="h-2 rounded-full bg-blue-600 transition-all duration-300 ease-out"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>

      {processing.length > 0 && (
        <p className="mt-2 text-xs text-blue-600 animate-pulse">
          {processing[0].originalName} işleniyor...
        </p>
      )}

      <ul className="mt-3 space-y-1">
        {files.map(file => (
          <li key={file.id} className="flex items-center gap-2 text-sm">
            {file.status === 'pending' && (
              <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {file.status === 'processing' && (
              <svg className="w-4 h-4 text-blue-500 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {file.status === 'done' && (
              <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            )}
            {file.status === 'error' && (
              <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            {file.status === 'done' ? (
              <span className="truncate text-green-700 font-medium">{file.originalName}</span>
            ) : file.status === 'error' ? (
              <span className="truncate text-red-600">{file.originalName}</span>
            ) : (
              <span className="truncate text-gray-600">{file.originalName}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
