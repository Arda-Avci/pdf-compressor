import { spawn, execSync } from 'child_process';
import fs from 'fs/promises';
import { CompressOptions } from '../types/index.js';

function getGsPath(): string {
  const candidates = [
    'gswin64c.exe', 'gswin32c.exe', 'gs.exe',
    'C:\\Program Files\\gs\\gs10.05.0\\bin\\gswin64c.exe',
    'C:\\Program Files\\gs\\gs10.04.0\\bin\\gswin64c.exe',
    'C:\\Program Files\\gs\\gs10.03.0\\bin\\gswin64c.exe',
  ];
  for (const exe of candidates) {
    try {
      execSync(`"${exe}" --version`, { stdio: 'ignore', timeout: 3000 });
      return exe;
    } catch { continue; }
  }
  return 'gswin64c.exe';
}

function qualityArgs(quality: number): string[] {
  const q = (sharpness: string, res: number, jpeg: number) => [
    `-dPDFSETTINGS=/${sharpness}`,
    `-dColorImageResolution=${res}`,
    `-dGrayImageResolution=${res}`,
    `-dMonoImageResolution=${Math.round(res * 1.5)}`,
    '-dColorImageDownsampleThreshold=1.0',
    '-dGrayImageDownsampleThreshold=1.0',
    '-dMonoImageDownsampleThreshold=1.0',
    `-dJPEGQ=${jpeg}`,
  ];
  if (quality <= 20) return q('screen', 72, 30);
  if (quality <= 40) return q('screen', 110, 50);
  if (quality <= 60) return q('ebook', 150, 65);
  if (quality <= 80) return q('printer', 200, 75);
  return ['-dPDFSETTINGS=/prepress',
    '-dDownsampleColorImages=false',
    '-dDownsampleGrayImages=false',
    '-dDownsampleMonoImages=false',
  ];
}

export async function compressPdf(
  inputPath: string,
  outputPath: string,
  options: CompressOptions,
): Promise<void> {
  const gsPath = getGsPath();

  const args = [
    '-dQUIET', '-dNOPAUSE', '-dBATCH', '-dSAFER',
    '-sDEVICE=pdfwrite', '-dCompatibilityLevel=1.5',
    '-dAutoRotatePages=/None', '-dPrinted=false',
    '-dDetectDuplicateImages=true',
    '-dCompressFonts=true', '-dSubsetFonts=true', '-dEmbedAllFonts=true',
    ...qualityArgs(options.quality),
  ];

  if (!options.preserveMetadata) {
    args.push('-dPreserveAnnots=false', '-dPreserveFormElements=false');
  }

  args.push(`-sOutputFile=${outputPath}`, inputPath);

  const proc = spawn(gsPath, args, {
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let stderr = '';

  proc.stderr?.on('data', (data: Buffer) => {
    stderr += data.toString();
  });

  return new Promise<void>((resolve, reject) => {
    proc.on('error', (err) => {
      reject(new Error(`Ghostscript başlatılamadı: ${err.message}`));
    });
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(stderr.trim().split('\n').slice(0, 3).join('; ') || `Çıkış kodu: ${code}`));
    });
  });
}

export async function getOutputSize(filePath: string): Promise<number> {
  try {
    return (await fs.stat(filePath)).size;
  } catch { return 0; }
}
