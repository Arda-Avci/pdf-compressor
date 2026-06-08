import { PDFDocument } from 'pdf-lib';
import fs from 'fs/promises';

export interface PdfMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  producer?: string;
  creator?: string;
  creationDate?: string;
  modificationDate?: string;
}

export async function readMetadata(filePath: string): Promise<PdfMetadata | null> {
  try {
    const buffer = await fs.readFile(filePath);
    const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
    const meta = doc.getTitle() || doc.getAuthor() || doc.getSubject() ||
                 doc.getKeywords() || doc.getProducer() || doc.getCreator() ||
                 doc.getCreationDate() || doc.getModificationDate();

    if (!meta) return null;

    return {
      title: doc.getTitle() ?? undefined,
      author: doc.getAuthor() ?? undefined,
      subject: doc.getSubject() ?? undefined,
      keywords: doc.getKeywords() ?? undefined,
      producer: doc.getProducer() ?? undefined,
      creator: doc.getCreator() ?? undefined,
      creationDate: doc.getCreationDate()?.toISOString(),
      modificationDate: doc.getModificationDate()?.toISOString(),
    };
  } catch {
    return null;
  }
}

export function hasMetadata(meta: PdfMetadata | null): boolean {
  if (!meta) return false;
  return Object.values(meta).some(v => v !== undefined && v !== null);
}
