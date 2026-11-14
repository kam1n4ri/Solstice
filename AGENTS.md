# AGENTS.md — Workspace Guidelines & Rules

## UI & Styling Preferences
- **Pale, Soft, Light-Valued Colors Only**:
  - The user strictly prefers pale, low-opacity, light-valued hues across all interfaces.
  - **Do NOT** use harsh, heavily saturated, or intense solid color boxes (e.g. solid saturated royal blues, bright highlighter colors, or thick colored borders).
  - Hover states, active buttons, selection indicators, badges, and icon buttons must always use gentle, delicate tones (e.g. `bg-blue-50/70`, `bg-blue-100/70`, `border-blue-200`, `text-blue-600/90`, `bg-surface-container/50`, `border-outline-variant/25`).
  - Keep interactive elements soft, restrained, and aesthetically calm.

## Architecture & Code Discipline
- Refer to `AGENT_RULES.md` for all core architectural rules:
  - Strict multi-window Electron architecture (non-SPA).
  - Modular file discipline: strictly < 250–300 lines of code per file.
  - Non-blocking UI thread (heavy I/O offloaded to Electron Main).
  - Strict typing across all IPC contracts and components.
  - Maintain and update `PROGRESS.md` with every major adjustment.

## Solstice PDF File Workflow (Strict & Permanent Rule)
- **External PDF files must NEVER be mutated or edited in-place.**
- When any PDF is opened (existing or new), an isolated working copy in `~/Documents/Solstice/PDFs/` is edited and saved.
- This ensures the original is preserved untouched, and the working copy remains safe even if the external original is moved or deleted.
- Exporting changes to external files is done via the **Export** button.
- Do NOT open or track external file paths in the Recent Documents list—only track the Solstice working copy path so there are no duplicate cards.
- When an external file is re-opened, reuse its existing working copy in `~/Documents/Solstice/PDFs/` (do NOT create duplicate `-1.pdf`, `-2.pdf` copies).
