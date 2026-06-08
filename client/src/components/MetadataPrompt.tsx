import { useState } from 'react';

interface MetadataPromptProps {
  fileCount: number;
  metadataFileCount: number;
  onConfirm: (preserve: boolean) => void;
  onCancel: () => void;
}

export default function MetadataPrompt({
  fileCount,
  metadataFileCount,
  onConfirm,
  onCancel,
}: MetadataPromptProps) {
  const [preserve, setPreserve] = useState(true);

  if (metadataFileCount === 0) {
    onConfirm(true);
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900">
          Meta Veriler
        </h3>

        <p className="mt-2 text-sm text-gray-600">
          {metadataFileCount} dosyada meta veri (başlık, yazar, tarih vb.) bulundu.
        </p>

        <p className="mt-1 text-sm text-gray-500">
          Bu meta veriler PDF'in görünümünü etkilemez ancak boyutu artırabilir.
        </p>

        <label className="mt-4 flex items-center gap-3 rounded-lg border border-gray-200 p-3 cursor-pointer hover:bg-gray-50 transition-colors">
          <input
            type="checkbox"
            checked={preserve}
            onChange={e => setPreserve(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600"
          />
          <div>
            <p className="text-sm font-medium text-gray-900">Meta verileri koru</p>
            <p className="text-xs text-gray-500">İşaretlenirse dosya bilgileri (yazar, tarih) sıkıştırılmış PDF'de kalır</p>
          </div>
        </label>

        <div className="mt-5 flex gap-3">
          <button
            onClick={() => onConfirm(preserve)}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Sıkıştırmayı Başlat
          </button>
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            İptal
          </button>
        </div>
      </div>
    </div>
  );
}
