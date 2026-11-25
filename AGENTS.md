# AGENTS.md — Workspace Guidelines & Rules

## Communication Style
- **Plain, Simple Language**: The user is not a coder — always explain changes, status, options, and next steps in clear, everyday language without unnecessary technical jargon.

## UI & Styling Preferences
- **Pale, Soft, Light-Valued Colors Only**:
  - The user strictly prefers pale, low-opacity, light-valued hues across all interfaces.
  - **Do NOT** use harsh, heavily saturated, or intense solid color boxes (e.g. solid saturated royal blues, bright highlighter colors, or thick colored borders).
  - Hover states, active buttons, selection indicators, badges, and icon buttons must always use gentle, delicate tones (e.g. `bg-blue-50/70`, `bg-blue-100/70`, `border-blue-200`, `text-blue-600/90`, `bg-surface-container/50`, `border-outline-variant/25`).
  - Keep interactive elements soft, restrained, and aesthetically calm.

## Architecture & Code Discipline
- Refer to `AGENT_RULES.md` for all core architectural rules:
  - Strict multi-window Tauri v2 desktop architecture (non-SPA).
  - Modular file discipline: strictly < 250–300 lines of code per file.
  - Non-blocking UI thread (heavy file I/O and native work in `src-tauri/` Rust backend).
  - Strict typing across all TypeScript/Rust IPC contracts and components.
  - Maintain and update `PROGRESS.md` concisely with every major adjustment.

## Solstice File Safety & Working-Copy Workflow (Strict & Permanent Rule)
- **External user files (PDFs, Docs, Whiteboards) must NEVER be mutated or edited in-place.**
- Isolated working copies in `~/Documents/Solstice/` (`PDFs/`, `Documents/`, `Whiteboards/`) are edited and saved instead, preserving originals untouched.
- Exporting changes to external locations happens via the **Export** / **Save As** flow.
- Do NOT create duplicate working copies (`-1`, `-2`) when re-opening an already-mapped external file, and only track the isolated working copy in Recents.
