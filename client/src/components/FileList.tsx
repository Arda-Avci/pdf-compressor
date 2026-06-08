import type { PdfFileInfo } from '../types';

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

interface FileListProps {
  files: PdfFileInfo[];
  onRemove?: (id: string) => void;
  showRemove?: boolean;
}

export default function FileList({ files, onRemove, showRemove }: FileListProps) {
  if (files.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
        <p className="text-sm font-medium text-gray-700">
          {files.length} dosya
        </p>
      </div>

      <ul className="divide-y divide-gray-100">
        {files.map(file => (
          <li key={file.id} className="flex items-center gap-3 px-4 py-3">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {file.originalName}
              </p>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-xs text-gray-500">
                  {formatSize(file.originalSize)}
                </span>

                {file.status === 'done' && file.compressedSize && (
                  <>
                    <span className="text-xs text-gray-400">→</span>
                    <span className="text-xs font-medium text-green-600">
                      {formatSize(file.compressedSize)}
                    </span>
                    <span className="text-xs text-green-600">
                      (%{Math.round((1 - file.compressedSize / file.originalSize) * 100)} küçüldü)
                    </span>
                  </>
                )}

                {file.status === 'error' && (
                  <span className="text-xs text-red-500" title={file.error}>
                    Hata
                  </span>
                )}

                {file.hasMetadata && (
                  <span className="text-xs text-amber-600">
                    Meta veri var
                  </span>
                )}
              </div>
            </div>

            {showRemove && onRemove && file.status === 'pending' && (
              <button
                onClick={() => onRemove(file.id)}
                className="flex-shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
