<div align="center">

# ☀️ Solstice

**An open-source, local-first productivity & creativity suite.**  
*Crafted with Tauri v2, Rust, React, and calm pale pastel aesthetics.*

[![Tauri v2](https://img.shields.io/badge/Tauri-v2-24C8DB?style=flat-square&logo=tauri&logoColor=white)](https://tauri.app)
[![Rust](https://img.shields.io/badge/Rust-2024-DEA584?style=flat-square&logo=rust&logoColor=white)](https://www.rust-lang.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-F59E0B?style=flat-square)](LICENSE)

[Features](#-the-suite) • [Architecture](#-architecture--philosophy) • [Getting Started](#-getting-started) • [Roadmap](#-roadmap)

</div>

---

## 🌿 Core Philosophy

* **100% Offline & Local-First**: No telemetry, no mandatory cloud accounts, and no subscriptions. Your data remains strictly on your computer.
* **Non-Destructive Storage**: External documents and PDFs are never mutated in-place. Solstice preserves your originals and manages isolated working copies inside `~/Documents/Solstice/`.
* **Native Rust Performance**: Heavy file I/O, binary packaging, format conversions, and dialogs are powered by native Rust backend services over strongly-typed IPC.
* **Pale Pastel Aesthetics**: Built with low-opacity, light-valued hues and delicate borders designed to eliminate visual fatigue during long creative sessions.
* **True Multi-Window Workspace**: An OS-native multi-window architecture. Closing or processing a heavy task in one window will never freeze or crash the Hub or other active tools.

---

## 🛠 The Suite

### 1. 🗂 Solstice Hub
The central command deck for your workspace:
* **Triple-Disk Recents Scanner**: Automatically discovers and tracks documents, PDFs, and sketches across `~/Documents/Solstice/`.
* **System & Custom Fonts Studio**: Download and install Google Fonts or import local `.ttf`/`.otf`/`.woff2` fonts with live, real-time font synchronization across all open suite windows.
* **Window Lifecycle Management**: Intelligent multi-window focus, window heartbeat reconciliation, and instant document handoff.

### 2. 📝 Solstice Docs
A fast, focused word processor:
* **Native Word (.docx) Pipeline**: Generates and parses genuine binary Microsoft Word `.docx` documents.
* **Multi-Format Support**: Seamless import and export across `.docx`, Markdown (`.md`), HTML, and plain text (`.txt`).
* **Distraction-Free Canvas**: Clean blank document start, outline jump navigation with active heading indicator, and fluid `Ctrl + Mouse Wheel` canvas zooming (50%–200%).
* **Safe Auto-Save**: Real-time background auto-saving to `~/Documents/Solstice/Documents/`.

### 3. 📑 Solstice PDF & Offline Studio
A complete local PDF reader and 9-in-1 offline processing studio:
* **Reading Experience**: High-performance single-page document canvas, page number scroll stabilization, smooth native text selection with clipboard copy, and minimal right-click context menu.
* **9 Offline Processing Tools**:
  1. **Merge PDF**: Combine multiple PDFs with custom ordering.
  2. **Split PDF**: Extract page ranges or burst into single-page documents.
  3. **Organize Pages**: Visual reordering, rotating, and selective page deletion.
  4. **Watermark PDF**: Add custom text watermarks with opacity and angle controls.
  5. **Page Numbers**: Add clean page numbering across header/footer positions.
  6. **Security & Encryption Studio**: Dedicated workspace to encrypt PDFs with AES-256 passwords or unlock protected documents.
  7. **Unlock PDF**: Remove permissions and decrypt documents.
  8. **Image to PDF**: Convert JPG, PNG, and WebP collections into clean PDF documents.
  9. **PDF to Images**: High-resolution page rendering to image formats.

### 4. 🎨 Solstice Whiteboard
An infinite sketching and visual diagramming studio:
* **Infinite Canvas**: Freehand drawing, geometric shapes, flowcharts, and text annotations.
* **Clean Desk Hero**: Delicate pale pastel controls and recent sketch management.
* **Multi-Format Export**: One-click native exports to binary PNG, vector SVG, and JSON snapshots.
* **Automated Persistence**: Working copies safely saved and synchronized in `~/Documents/Solstice/Whiteboards/`.

---

## 🏛 Architecture & Philosophy

```
┌────────────────────────────────────────────────────────┐
│                      Solstice Hub                      │
│        (Central Deck, Recents Scanner, Fonts)          │
└──────────────────────────┬─────────────────────────────┘
                           │ IPC (Tauri v2 Events)
     ┌─────────────────────┼─────────────────────┐
     ▼                     ▼                     ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Docs Window │     │  PDF Window  │     │  Whiteboard  │
│ (Independent)│     │ (Independent)│     │ (Independent)│
└──────────────┘     └──────────────┘     └──────────────┘
                           │
                           ▼
          Native Rust Backend (`src-tauri`)
          • Safe File I/O Engine (~/Documents/Solstice/)
          • Multi-Window Controller & Shell Dialogs
          • Font Manifest & Real-Time Sync
```

* **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, Tiptap, PDF.js, pdf-lib.
* **Backend**: Tauri v2, Rust 2024, `rfd` native dialogs, `serde`, `urlencoding`.
* **Discipline**: Modular architecture with strict file length discipline (< 250–300 lines per module).

---

## 🚀 Getting Started

### Prerequisites
* **Node.js**: `v18.0.0` or higher
* **Rust**: Latest stable toolchain (`rustup update`)
* **System Dependencies (Linux)**:
  ```bash
  # Debian / Ubuntu / Mint:
  sudo apt-get update && sudo apt-get install -y \
    libwebkit2gtk-4.1-dev \
    build-essential \
    curl \
    wget \
    file \
    libxdo-dev \
    libssl-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev
  ```

### Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/kam1n4ri/Solstice.git
   cd Solstice
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run in development mode (Multi-Window Desktop)**:
   ```bash
   npm run tauri:dev
   ```

### Building Installers

To compile standalone native distribution bundles (`.AppImage`, `.deb`, `.exe`, or `.dmg` depending on your OS):

```bash
npm run tauri:build
```
The compiled binaries will be output to `src-tauri/target/release/bundle/`.

---

## 🗺 Roadmap

- [x] **Hub**: Multi-window launcher & triple-disk recent file discovery
- [x] **Fonts Studio**: Google Fonts installer & local font importer
- [x] **Docs**: Binary Word `.docx` pipeline, markdown conversion & auto-save
- [x] **PDF**: Native viewer + 9 offline processing tools & AES-256 security studio
- [x] **Whiteboard**: Sketch engine & auto-save to `~/Documents/Solstice/Whiteboards/`
- [ ] **Photo Studio**: Ground-up GPU/WASM photo editor with non-destructive layers
- [ ] **Sheets**: Offline, local-first spreadsheet engine
- [ ] **Slides**: Presentation designer
- [ ] **Automations**: Offline multi-step recipe engine

---

## 📄 License

Distributed under the MIT License. See [LICENSE](LICENSE) for details.
