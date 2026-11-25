# Solstice — Project Status & Roadmap

> **What Solstice Is**: An offline, local-first productivity and creativity suite built with **Tauri v2**, **Rust**, **React**, and **Tailwind CSS**, designed with soft, calm pale colors and safe local file handling.
> Older historical logs from the early prototype phases are archived in [`docs/CHANGELOG_ARCHIVE.md`](docs/CHANGELOG_ARCHIVE.md).

---

## Working Now

- **Hub**: Central multi-window launcher, recent files discovery across `~/Documents/Solstice/`, light/dark/system themes, Hub storage readout & folder shortcut, and in-app GitHub release updates checker.
- **Docs**: Rich document editor with Word (`.docx`), Markdown (`.md`), HTML, and `.txt` support, Find & Replace, zoom (`50%`–`200%`), keyboard shortcuts, outline navigation, and background auto-save to `~/Documents/Solstice/Documents/`.
- **PDF Studio**: Native PDF reader plus 9 offline tools (Merge, Split, Organize, Watermark, Page Numbers, Protect/Encrypt, Unlock/Decrypt, Images to PDF, PDF to Images) using isolated working copies in `~/Documents/Solstice/PDFs/`.
- **Whiteboard**: Drawing & diagram canvas (`.excalidraw`, `.tldr`, `.solstice`, JSON snapshots) with SVG/PNG export and auto-save in `~/Documents/Solstice/Whiteboards/`.
- **Fonts Studio**: Google Fonts downloader and local font importer (`.ttf`, `.otf`, `.woff`, `.woff2`) stored in `~/Documents/Solstice/Fonts/` and synced live across windows.

---

## Recent Hardening & Cleanup (Nov 2026)

- [x] Security & data-safety fixes (tightened Tauri permissions/CSP, Markdown XSS sanitization, IPC path-traversal checks, safe window-close auto-save flush).
- [x] Bug-fix pass across PDF Decrypt/Tools/Recents, Docs Save/Export/Find/Zoom/Shortcuts/Status, Whiteboard listeners/snapshots, Font downloads/cleanup, and Hub UI/Updates.
- [x] Removed legacy Electron runtime (`src/main/`, `src/preload/`) and stubbed egui launcher/theme crates (`apps/`, `crates/`).
- [x] Unified app version sync across `package.json`, `Cargo.toml`, and Hub Updates, added Hub Settings folder/storage utility, and added automated unit tests (`npm test`).

---

## Up Next

1. **Solstice Photo (From-Scratch Rebuild)**:
   - Plan a clean design first in plain language before coding: fast pixel engine in Rust + smooth zoom/pan canvas + reliable cropping, tone adjustments, layers, and export.
2. **Future Suite Apps ("Coming Soon")**:
   - **Solstice Sheets**: Offline spreadsheet & formula engine.
   - **Solstice Slides**: Presentation designer.
   - **Audio / Video & Automations**: Offline media tools and local workflow recipes.

---

## Commands

- `npm test` — Runs TypeScript typecheck, automated unit tests, and Rust `cargo test --workspace`.
- `npm run build` — Builds the frontend production bundle (`dist/renderer/`).
- `npm run tauri:dev` — Starts the live multi-window desktop app in development mode.
- `npm run tauri:build` — Packages standalone desktop installers.

---

## Publishing a New App Update (Reminder)

- **Daily saves (`git commit` + push to `main`)** only save code safely on GitHub — users are **not** notified yet.
- **Shipping an update to users** happens only when we:
  1. Bump the version (e.g. `0.1.0` -> `0.1.1` for fixes, `0.2.0` for new apps) in `package.json`, `src-tauri/tauri.conf.json`, and `src-tauri/Cargo.toml`.
  2. Commit and push a matching Git tag (like `git tag v0.1.1 && git push origin v0.1.1`).
  3. GitHub automatically builds Windows/Mac/Linux installers and publishes the release — new visitors download the latest version, and existing users get the green dot in **Updates**.
