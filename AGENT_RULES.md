# AGENT_RULES.md — Engineering Guidelines & Operational Constraints

> **AI AGENT INSTRUCTION**: Always read this file and `PROGRESS.md` before writing any code in a new session.

---

## 🏛 Core Architectural Rules & Constraints

### 1. Strict Multi-Window Architecture (Non-SPA)
- **Solstice is NOT a Single Page Application (SPA).**
- The **Hub** serves strictly as a lightweight launcher and workspace dashboard.
- Every standalone application/tool (Docs, Sheets, Whiteboard, Video, Audio, Photo, PDF, Connect) **MUST** be spawned as a separate, isolated, maximized OS-level `BrowserWindow` via Electron IPC (`open-tool-window`).
- **Memory & Crash Isolation**: A memory leak, heavy computation, or fatal renderer crash in one tool must never bring down the Hub or another open application.
- **Deduplication**: Never open duplicate windows for the same tool. If an application is already open, restore it if minimized, maximize it, and bring it to focus.

### 2. Modular Code Discipline (Hard Limit: 250–300 Lines)
- **Hard file length limit**: No file should exceed 250–300 lines of code.
- Deconstruct complex components and logic into focused, single-responsibility files (e.g., `HubSidebar.tsx`, `HubHeader.tsx`, `AppCard.tsx`, `AppGrid.tsx`).
- Keep IPC handlers, window managers, and utility hooks neatly decomposed into dedicated modules.

### 3. Non-Blocking UI Thread
- **Never block the React UI thread.**
- All heavy disk operations, file system reads/writes, native binary executions (e.g. native FFmpeg), and compute-intensive workflows must execute within the **Electron Main process** or dedicated **Worker threads** over asynchronous IPC.

### 4. Strict Typing & IPC Contracts
- TypeScript `strict: true` is strictly enforced across the entire codebase.
- All IPC channels, request payloads, response objects, and window lifecycle events must be explicitly defined in [`src/shared/types.ts`](file:///home/k4m1nari/Antigravity/Projects/Solstice/src/shared/types.ts).
- `contextBridge.exposeInMainWorld` must expose a type-safe API contract (`window.solsticeAPI`). No untyped or raw `ipcRenderer` invocations in the frontend.

### 5. UI Preservation & Plumbing Integrity
- When updating styling, Tailwind classes, or applying redesigns, **never break or remove existing IPC calls, window routing, or window-spawning logic**.
- Interactive controls must remain fully wired to their underlying handlers.

### 6. Architectural Approval Before Heavy Engines
- **Never install or implement heavy libraries/engines without prior approval.**
- Before introducing major dependencies (such as Univer for Sheets, FFmpeg native binaries, Tldraw, TipTap, ONNX Runtime Web, etc.), write out a concise architectural plan in the chat for the user to review and approve first.

### 7. Window Sizing Strategy
- Default window state for both the Hub and Tool windows is **maximized** via `win.maximize()`, mimicking modern desktop applications like Discord or desktop browsers, while remaining fully resizable by the user.
- The native OS menu bar is completely stripped (`autoHideMenuBar: true` and `Menu.setApplicationMenu(null)`).

### 8. Progress Tracking Discipline
- Maintain documentation integrity.
- **Update `PROGRESS.md`** every time a major feature, phase, or architectural adjustment is completed.

### 9. UI Color & Styling Preference (Strict Rule)
- **Pale, Low-Opacity, Light-Valued Colors Only**:
  - The user strictly prefers pale, soft, low-opacity, light-valued hues across the entire application.
  - **NEVER** use harsh, heavily saturated, high-contrast, or intense solid color boxes (e.g. solid royal blue `#0050cb` buttons, dark saturated colored backgrounds, or thick harsh borders).
  - Hover states, focus rings, selection states, badges, and icon buttons must always use gentle, delicate tones (e.g. `bg-blue-50/70`, `bg-blue-100/70`, `border-blue-200`, `text-blue-600/90`, `bg-surface-container/50`, `border-outline-variant/25`).
  - Avoid eyesores; maintain a peaceful, soft, and restrained Swiss-modern aesthetic at all times.

### 10. PDF Working Copy & Export Architecture (Strict Rule)
- External originals are NEVER mutated or overwritten in-place.
- Whether opening an existing external file or creating a new document, an isolated working copy is maintained in the Solstice PDFs directory (`~/Documents/Solstice/PDFs/`).
- Solstice edits strictly occur within this working copy, ensuring changes persist even if the external source is moved or deleted.
- Users export edited PDFs to external locations via the Export button (`pdfExportFile`).
- Recent files lists and dashboard cards track only the Solstice working copy—never external paths—avoiding duplicate entries.
- Re-opening an external file reuses its existing working copy in `~/Documents/Solstice/PDFs/` instead of spawning duplicate `-1.pdf`, `-2.pdf` files.

---

## 🛠 Standard Commands & Verification

- `npm run dev`: Runs Vite dev server + Electron with hot-module reload.
- `npm run build`: Type-checks and creates production bundles for Renderer, Electron Main, and Preload.
- `npm test`: Runs typecheck, builds bundles, and executes the automated multi-window architecture verification suite. Always run this before declaring a task complete.
