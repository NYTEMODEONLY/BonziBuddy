# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Development - run both Gatsby and Electron together
yarn start:dev

# Or run separately (Gatsby must be ready before Electron)
yarn develop          # Terminal 1: Start Gatsby dev server on localhost:8000
yarn start            # Terminal 2: Start Electron in dev mode

# Production
yarn build            # Build Gatsby static files
yarn bonzi            # Run Electron in production mode
yarn package:mac      # Build macOS .dmg installer

# Utilities
yarn format           # Run Prettier on all files
```

## Architecture Overview

This is an Electron + Gatsby hybrid application. Gatsby generates the UI as static HTML/React pages, which Electron loads into BrowserWindows.

### Process Model

**Main Process** (`electron.js`):
- Creates transparent, frameless BrowserWindow for Bonzi character
- Creates standard windows for Settings and Home menus
- Handles all IPC communication via `ipcMain`
- Manages xAI API calls for AI chat (direct fetch to `https://api.x.ai/v1/chat/completions`)
- Persists settings via electron-store (encrypted)
- Logs to `~/Library/Application Support/bonzibuddy/bonzibuddy-error.log`

**Preload Script** (`preload.js`):
- Bridges main and renderer processes securely via `contextBridge`
- Exposes `window.electronAPI` object with all IPC methods
- Never expose `ipcRenderer` directly to renderer

**Renderer Process** (Gatsby pages in `src/pages/`):
- `bonzi/` - Main character window with ClippyJS agent, drag handling, chat input
- `settings/` - Configuration UI (API key, voice settings, hyperlinks)
- `home/` - Quick links menu

### IPC Communication Pattern

All renderer-to-main communication uses the preload bridge:
```javascript
// Renderer (React component)
window.electronAPI.sendMessage(text)      // invoke → returns Promise
window.electronAPI.windowMoving(coords)   // send → fire-and-forget
window.electronAPI.onCloseProgram(cb)     // listen for main→renderer events
```

### Gatsby SSR Considerations

Browser-only modules must be excluded from SSR builds in `gatsby-node.js`:
- clippyjs, electron-store, node-fetch are null-loaded during `build-html`/`develop-html`
- CSS modules use `import * as styles from './file.module.scss'` syntax (Gatsby 5)

### Animation System

Bonzi uses ClippyJS with animations defined in `static/clippy.js/agents/Bonzi/agent.js`. The React component in `src/pages/bonzi/index.js` manages:
- Idle animation cycling (15-30 second intervals)
- Contextual animations (greeting, thinking, success, error)
- Animation arrays: `IDLE_ANIMATIONS`, `GREETING_ANIMATIONS`, `THINKING_ANIMATIONS`, etc.

### Window Expansion for Chat

When chat opens, the window expands to fit the input:
1. `expandWindowForChat({ extraWidth, extraHeight })` - Expands window size only (no position change)
2. Chat input positioned at `bottom: 8px` in expanded area
3. `shrinkWindowFromChat()` restores original size

## Key Configuration

- **xAI Model**: `grok-3-mini` (defined in electron.js)
- **Dev server**: Gatsby runs on `localhost:8000`
- **Window size**: Bonzi frame is 200x160, expands to 360x230 for chat
