<div align="center">
<a href="https://www.moonvert.app">
<img src="assets/icon.png" alt="Moonvert Logo" width="128" height="128">
</a>

# Moonvert

A powerful local file converter for macOS.

Convert images, videos, audio, documents, books, geospatial data, and config files — all locally on your device.

[![Download](https://img.shields.io/badge/Download-macOS-blue?style=for-the-badge)](https://www.moonvert.app)
[![License](https://img.shields.io/badge/License-AGPL--3.0-green?style=for-the-badge)](LICENSE)
[![GitHub](https://img.shields.io/badge/GitHub-kavostudio%2Fmoonvert-black?style=for-the-badge&logo=github)](https://github.com/kavostudio/moonvert)

</div>

## 🚀 Quick Start

- **Download:** Get the pre-built version from [moonvert.app](https://www.moonvert.app)
- **Homebrew:** `brew install --cask kavostudio/tap/moonvert`
- **Build from source:** See [Building from Source](#-building-from-source) below

## ✨ Features

- **🔒 100% Local Processing:** Your files never leave your device. No uploads, no cloud processing, complete privacy.

- **📁 60+ Supported Formats:** Convert between a wide variety of file formats across multiple categories.

- **🗺️ Geospatial Support:** Unique support for GIS formats like GeoJSON, Shapefile, KML, GPKG, and more — rarely found in other converters.

- **⚡ Batch Conversion:** Drop multiple files and convert them all at once.

- **📂 Finder Integration:** Right-click any file in Finder and open it in Moonvert.

- **🎨 Clean Interface:** Modern, clean macOS design.

## 📋 Supported Formats

### Images

PNG, JPG, JPEG, HEIC, WebP, TIFF, BMP, ICO, ICNS, AVIF

### Videos

MP4, MOV, WebM, MKV, AVI, GIF, M4V, 3GP, FLV, TS, MTS, M2TS, WMV, OGV, MPG, MPEG, MXF, VOB

### Audio

MP3, WAV, FLAC, AAC, M4A, OGG, WMA, AIFF, ALAC, Opus, APE, WV

### Documents

DOCX, ODT, RTF, Markdown, HTML, LaTeX

### Books

EPUB, MOBI, AZW3

### Geospatial

GeoJSON, GeoPackage (.gpkg), Shapefile (.shp), KML, KMZ, GPX, GML, WKT

### Config Files

JSON, YAML, PLIST, TOML

## 🛠️ Built With

- **[FFmpeg](https://ffmpeg.org)** — Video and audio processing
- **[ImageMagick](https://imagemagick.org)** — Image conversion
- **[Pandoc](https://pandoc.org)** — Document conversion
- **[GeoPandas](https://geopandas.org)** — Geospatial data processing
- **[Electron](https://www.electronjs.org)** — Cross-platform desktop framework

## 📊 Privacy

Moonvert is designed with privacy as a core principle:

- **All conversions happen locally** on your Mac
- **No files are uploaded** to any server
- **No tracking or analytics** in the app itself. Only UTM parameters are used on external links.
- **No account required** to use the app

## 🔨 Building from Source

### Prerequisites

- Node.js 18+
- pnpm 10+
- macOS (for building the Mac app)

### Environment Setup

1. Copy the example environment file:

    ```bash
    cp .env.example .env
    ```

2. Fill in the required values in `.env`:

    | Variable                 | Description                                                                                                                |
    | ------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
    | `BUILD_TYPE`             | Set to `"standard"` for full build or `"light"` for minimal build for quick testing, it does not include external binaries |
    | `VITE_IS_OFFICIAL_BUILD` | Set to `false` for personal builds                                                                                         |

    The remaining variables for personal builds, some are optional:
    - Apple signing credentials (`APPLE_ID`, `APPLE_TEAM_ID`, etc.) — only needed for signed/notarized builds
    - S3/AWS credentials — only needed for release publishing
    - `VITE_MAIN_API_URL`, `VITE_JWT_PUBLIC_KEY` — only needed for license verification features

### Setup

```bash
# Clone the repository
git clone https://github.com/kavostudio/moonvert.git
cd moonvert

# Copy and configure environment
cp .env.example .env
# Edit .env with your values

# Install dependencies
pnpm install

# Set up Python environment (for geospatial conversions)
pnpm python:setup

# Build binaries (FFmpeg, Pandoc, Python)
pnpm build:binaries

# Run in development mode
pnpm dev
```

### Build for Production

```bash
# Full build with all binaries
pnpm build:full

# Or just build the app (if binaries are already built)
pnpm build
```

## 💡 Why Moonvert?

1. **Privacy First:** No cloud uploads. Your files stay on your device.
2. **Geospatial Support:** One of the few converters that handles GIS formats.
3. **No Subscriptions:** Pay once (or build from source for free) and own it forever.
4. **Open Source:** Inspect the code, customize it, contribute to it.
5. **Native Experience:** Built for macOS with a clean, modern interface.

## 📝 License

Moonvert is released under the [GNU Affero General Public License v3.0 (AGPL-3.0)](LICENSE).

You are free to:

- Use the application for any purpose
- Study how the program works and modify it
- Distribute copies
- Distribute your modified versions

Under the condition that you:

- Disclose the source code of your modifications
- License your modifications under AGPL-3.0
- State changes made to the code

## 💰 Support Development

If you find Moonvert useful, consider supporting development by purchasing a license at [moonvert.app](https://www.moonvert.app). This helps fund continued development and provides you with automatic updates.

Building from source is always free!

## 👥 About

Moonvert is developed by **Kavo Studio** – a small developer studio focusing on useful and clean software, brought to you by Andy Kyrychenko and Oskar Vereš.

## 🤝 Contact

- **Website:** [moonvert.app](https://www.moonvert.app)
- **Email:** [support@kavostudio.dev](mailto:support@kavostudio.dev)
- **GitHub:** [github.com/kavostudio/moonvert](https://github.com/kavostudio/moonvert)
- **Twitter/X:** [@thekavostudio](https://x.com/thekavostudio)
- **Kavo Studio Website** [kavostudio.dev](https://kavostudio.dev)

## ❓ FAQ

**Q: Why macOS only?**
A: We're starting with macOS to deliver the best possible experience on one platform. Additional platform support may come in the future based on demand.

**Q: Is the app really free?**
A: You can build from source for free. The paid version on our website includes automatic updates and supports continued development.

**Q: Can I contribute?**
A: Absolutely! We welcome PRs. Feel free to open issues or submit pull requests.
