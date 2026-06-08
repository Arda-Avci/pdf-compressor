import { useState, useRef, type DragEvent } from 'react';

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

export default function DropZone({ onFilesSelected, disabled }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    const items = Array.from(e.dataTransfer.items);
    const files: File[] = [];

    const traverse = (entries: FileSystemEntry[]) => {
      entries.forEach(entry => {
        if (entry.isFile && entry.name.toLowerCase().endsWith('.pdf')) {
          (entry as FileSystemFileEntry).file(file => files.push(file));
        } else if (entry.isDirectory) {
          const reader = (entry as FileSystemDirectoryEntry).createReader();
          reader.readEntries(childEntries => traverse(childEntries as FileSystemEntry[]));
        }
      });
    };

    const fileEntries = items
      .filter(i => i.kind === 'file')
      .map(i => i.webkitGetAsEntry())
      .filter(Boolean) as FileSystemEntry[];

    if (fileEntries.length > 0) {
      traverse(fileEntries);
      setTimeout(() => {
        if (files.length > 0) onFilesSelected(files);
      }, 100);
    } else {
      const droppedFiles = Array.from(e.dataTransfer.files).filter(f =>
        f.name.toLowerCase().endsWith('.pdf')
      );
      if (droppedFiles.length > 0) onFilesSelected(droppedFiles);
    }
  };

  const handleInputChange = () => {
    const inputFiles = inputRef.current?.files;
    if (inputFiles) {
      onFilesSelected(Array.from(inputFiles).filter(f =>
        f.name.toLowerCase().endsWith('.pdf')
      ));
    }
  };

  const handleClick = () => inputRef.current?.click();

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={disabled ? undefined : handleClick}
      className={`
        relative cursor-pointer rounded-2xl border-2 border-dashed p-12
        text-center transition-all duration-200
        ${disabled
          ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
          : isDragging
            ? 'border-blue-500 bg-blue-50 scale-[1.02]'
            : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50/50'
        }
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        multiple
        onChange={handleInputChange}
        className="hidden"
      />

      <div className="flex flex-col items-center gap-3">
        <div className={`rounded-full p-4 ${isDragging ? 'bg-blue-100' : 'bg-gray-100'}`}>
          <svg className={`w-8 h-8 ${isDragging ? 'text-blue-600' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>

        <div>
          <p className="text-lg font-medium text-gray-700">
            PDF dosyalarını sürükleyip bırakın
          </p>
          <p className="mt-1 text-sm text-gray-500">
            veya tıklayarak dosya seçin • PDF veya klasör
          </p>
        </div>
      </div>
    </div>
  );
}
