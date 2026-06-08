# PDF Sıkıştırıcı

Ghostscript motoru ile PDF dosyalarını sıkıştıran web tabanlı masaüstü uygulaması. Sayfa adedini ve görsel kaliteyi koruyarak dosya boyutunu küçültür.

## Özellikler

- **Sürükle-bırak** ile PDF yükleme (tek dosya veya tüm klasör)
- **Toplu sıkıştırma** — aynı anda birden çok PDF işleme
- **Sıkıştırma seviyesi** — kaydırıcı ile boyut/kalite dengesi
- **Meta veri kontrolü** — sıkıştırma öncesi koruma/strip seçeneği
- **Canlı ilerleme** — her dosyanın durumu ve yüzdesel ilerleme
- **Boyut karşılaştırması** — sıkıştırma öncesi/sonrası karşılaştırma
- **Akıllı fallback** — sıkıştırılmış dosya büyükse orijinal kopyalanır
- **İndirme** — her dosya için tek tıkla indirme bağlantısı
- **Türkçe karakter desteği** — çıktı dosya adlarında ASCII dönüşümü

## Gereksinimler

- **Node.js** v18+ (npm ile birlikte)
- **Ghostscript** 10.x — PDF sıkıştırma motoru

### Ghostscript Kurulumu

**Windows:** [gsdld.net](https://www.ghostscript.com/releases/gsdnld.html) adresinden 64-bit sürücüyü indirip kurun. Varsayılan yol:

```
C:\Program Files\gs\gs10.05.0\bin\gswin64c.exe
```

Kurulum sonrası doğrulama:
```bash
gswin64c --version
# 10.05.0
```

> Uygulama Ghostscript'i PATH üzerinden veya doğrudan bilinen yollardan bulur. Windows'ta `C:\Program Files\gs\gs10.05.0\bin\gswin64c.exe` otomatik algılanır.

**macOS / Linux:**
```bash
# macOS
brew install ghostscript

# Ubuntu/Debian
sudo apt install ghostscript

# Doğrulama
gs --version
```

## Kurulum

```bash
# 1. Projeyi klonlayın
git clone https://github.com/kullanici/pdf-compressor.git
cd pdf-compressor

# 2. Bağımlılıkları yükleyin
npm install

# 3. Çıktı klasörünü oluşturun
mkdir output
```

## Geliştirme

Sunucu ve istemci aynı anda çalışır:

```bash
npm run dev
```

- **Client:** http://localhost:3020
- **Server:** http://localhost:3021

| Komut | Açıklama |
|-------|----------|
| `npm run dev` | Client + server paralel |
| `npm run dev:server` | Yalnızca server |
| `npm run dev:client` | Yalnızca client |
| `npm run build` | Client production build |
| `npm run check` | Typecheck + lint + test |
| `npm run check:types` | TypeScript typecheck |
| `npm run check:lint` | ESLint |
| `npm run lint` | ESLint (cache ile) |
| `npm run format` | Prettier formatlama |

## Kullanım

1. Uygulamayı başlatın: `npm run dev`
2. Tarayıcıda `http://localhost:3020` adresine gidin
3. PDF dosyalarını sürükleyip bırakın veya tıklayarak seçin
4. Sıkıştırma seviyesini ayarlayın (düşük = küçük dosya, yüksek = kaliteli)
5. Meta veri koruma tercihinizi yapın
6. "Sıkıştır" butonuna tıklayın
7. İlerleme çubuğunu ve dosya durumlarını izleyin
8. Sonuçları görüntüleyin ve dosyaları indirin

## Mimari

```
pdf-compressor/
├── client/                        # React + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/
│   │   │   ├── DropZone.tsx        # Dosya yükleme alanı (drag-drop + klasör)
│   │   │   ├── FileList.tsx        # Seçilen dosya listesi
│   │   │   ├── MetadataPrompt.tsx  # Meta veri dialogu
│   │   │   ├── ProgressPanel.tsx   # İlerleme çubuğu ve dosya durumları
│   │   │   └── ResultsSummary.tsx  # Sıkıştırma sonuçları ve indirme
│   │   ├── api.ts                  # HTTP API servis katmanı
│   │   ├── types.ts                # TypeScript tipleri
│   │   ├── App.tsx                 # Ana uygulama bileşeni
│   │   ├── main.tsx                # Giriş noktası
│   │   └── index.css               # Tailwind CSS
│   └── vite.config.ts
├── server/                        # Express + TypeScript
│   ├── src/
│   │   ├── routes/
│   │   │   └── compress.ts         # API endpointleri
│   │   ├── services/
│   │   │   ├── pdfCompressor.ts    # Ghostscript entegrasyonu
│   │   │   ├── metadataService.ts  # PDF meta veri okuma (pdf-lib)
│   │   │   └── jobManager.ts       # İş yönetimi
│   │   ├── types/index.ts          # Server tipleri
│   │   └── index.ts                # Express giriş noktası
│   └── tsconfig.json
├── output/                        # Sıkıştırılmış PDF çıktıları
├── .gitignore
├── AGENTS.md                      # AI asistan yönergeleri
├── PROJECT_STATUS.md              # Proje durumu
├── TODO.md                        # Yapılacaklar
├── package.json                   # Monorepo root (npm workspaces)
└── README.md
```

## API

### `POST /api/compress`
PDF dosyalarını yükler ve sıkıştırma işini başlatır.

| Alan | Tip | Açıklama |
|------|-----|----------|
| `files` | File[] | PDF dosyaları (multipart) |
| `quality` | number | 1–100 arası kalite (varsayılan: 70) |
| `preserveMetadata` | string | Meta veri koruma (`"true"` / `"false"`) |

Yanıt:
```json
{
  "jobId": "uuid",
  "files": [{ "id": "uuid", "originalName": "dosya.pdf", "originalSize": 123456, "hasMetadata": true, "status": "pending" }]
}
```

### `GET /api/compress/result/:jobId`
İş durumunu sorgular. Polling ile kullanılır.

```json
{
  "jobId": "uuid",
  "outputDir": "...",
  "files": [{ "id": "uuid", "originalName": "dosya.pdf", "originalSize": 123456, "compressedSize": 50000, "status": "done", "error": null }]
}
```

### `GET /api/compress/download/:jobId/:fileId`
Sıkıştırılmış dosyayı indirir.

### `GET /api/compress/progress/:jobId`
SSE (Server-Sent Events) ile gerçek zamanlı ilerleme.

## Bileşen Mimarisi

### Client

| Bileşen | Sorumluluk |
|---------|-----------|
| `DropZone` | Dosya seçme (drag-drop, tıklama, klasör gezintisi) |
| `FileList` | Seçilen dosyaları listeleme ve kaldırma |
| `MetadataPrompt` | Meta veri koruma dialogu |
| `ProgressPanel` | Sıkıştırma ilerlemesi, dosya durumları, yüzde |
| `ResultsSummary` | Sıkıştırma sonuçları, boyut karşılaştırması, indirme |

**App state machine:** `select → metadata → progress → done`

### Server

| Servis | Sorumluluk |
|--------|-----------|
| `pdfCompressor` | Ghostscript çağrısı, kalite presetleri, çıktı boyutu kontrolü |
| `metadataService` | PDF/A metadata okuma (pdf-lib) |
| `jobManager` | İş kuyruğu, dosya durum takibi, EventEmitter ile progress |

**Job state machine (dosya bazında):** `pending → processing → done` / `error`

## Ghostscript Yapılandırması

Sıkıştırma kalitesi `-dPDFSETTINGS` parametresi ile belirlenir:

| Kalite | Değer | Kullanım |
|--------|-------|----------|
| Düşük (10-30) | `/screen` | Ekran görüntüleme |
| Orta (31-70) | `/ebook` | Dijital yayın (varsayılan) |
| Yüksek (71-100) | `/prepress` | Baskı kalitesi |

Ghostscript bulunamazsa veya çıktı boyutu girdiden büyükse orijinal dosya olduğu gibi kopyalanır.

## License

MIT
