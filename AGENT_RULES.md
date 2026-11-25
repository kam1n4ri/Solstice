# AGENT_RULES.md — Engineering Guidelines & Operational Constraints

> **AI AGENT INSTRUCTION**: Always read `AGENTS.md`, this file, and `PROGRESS.md` before writing code in a new session. Speak to the user in simple, everyday language.

---

## Core Architectural Rules

1. **Strict Multi-Window Tauri v2 Architecture (Non-SPA)**
   - The **Hub** serves as the central launcher and workspace dashboard.
   - Each standalone app (`Docs`, `PDF`, `Whiteboard`, etc.) runs in its own OS-level Tauri window via `open_tool_window`, avoiding duplicate windows by focusing an open tool if already launched.

2. **Modular Code Discipline (Hard Limit: 250–300 Lines)**
   - No source file should exceed 250–300 lines of code.
   - Keep React components, hooks, Rust engines, and Tauri command modules focused and single-responsibility.

3. **Non-Blocking UI & Native Rust Backend**
   - Keep heavy file I/O, path validation, OS dialogs, and native compute in `src-tauri/src/` (or Web Workers / WASM where appropriate) so the UI thread stays responsive.

4. **Strict Typing & IPC Contracts**
   - TypeScript `strict: true` is enforced across `src/`.
   - All `window.solsticeAPI` methods and payloads live in [`src/shared/types/api.ts`](src/shared/types/api.ts) and bridge cleanly to `src-tauri/` via [`src/renderer/lib/tauriBridge.ts`](src/renderer/lib/tauriBridge.ts).

5. **Approval Before Heavy Engines**
   - Before adding heavy dependencies or designing large features (like Solstice Photo, Sheets, FFmpeg, etc.), align with the user in plain language first.

6. **Pale, Low-Opacity Styling (`AGENTS.md`)**
   - Never use harsh, high-saturation solid color fills; always use soft, calm pastel tones that also support dark mode cleanly.

7. **Safe Working-Copy Storage**
   - External files opened in Docs, PDF, or Whiteboard are copied into `~/Documents/Solstice/` working directories and never overwritten in-place. Exports write out explicitly via Save As / Export dialogs.

---

## Standard Commands

- `npm test` — Runs `npx tsc --noEmit`, unit tests, and `cargo test --workspace`.
- `npm run build` — Typechecks and creates the renderer production bundle (`dist/renderer/`).
- `npm run tauri:dev` — Runs the Vite dev server and live multi-window Tauri desktop app.
- `npm run tauri:build` — Compiles standalone native installers (`src-tauri/target/release/bundle/`).
