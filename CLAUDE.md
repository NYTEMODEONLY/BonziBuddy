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
- Manages AI provider system (xAI, Anthropic, OpenAI, Custom/Local)
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
- clippyjs, electron-store, node-fetch, encoding, iconv-lite, @anthropic-ai are null-loaded during `build-html`/`develop-html`
- CSS modules use `import * as styles from './file.module.scss'` syntax (Gatsby 5)
- Webpack 5 polyfill fallbacks are disabled for fs, path, os, buffer, stream, crypto

### Animation System

Bonzi uses ClippyJS with animations defined in `static/clippy.js/agents/Bonzi/agent.js`. The React component in `src/pages/bonzi/index.js` manages:
- Idle animation cycling (15-30 second intervals)
- Contextual animations (greeting, thinking, success, error, attention)
- Animation arrays: `IDLE_ANIMATIONS`, `GREETING_ANIMATIONS`, `THINKING_ANIMATIONS`, `SUCCESS_ANIMATIONS`, `ERROR_ANIMATIONS`, `ATTENTION_ANIMATIONS`, `SINGING_ANIMATIONS`, `JOKE_ANIMATIONS`, `FACT_ANIMATIONS`, `STORY_ANIMATIONS`

### Multi-Provider AI System

BonziBuddy supports multiple AI providers via a pluggable provider system in `providers/`:

**Available Providers**:
- `xai` - xAI (Grok): Default provider, OpenAI-compatible API
- `anthropic` - Anthropic (Claude): Uses x-api-key header and different message format
- `openai` - OpenAI (ChatGPT): Standard OpenAI chat completions
- `custom` - Custom/Local: OpenAI-compatible endpoints (Ollama, LM Studio, etc.)

**Provider Architecture** (`providers/`):
- `base-provider.js` - Abstract base class with common interface
- `xai-provider.js`, `anthropic-provider.js`, `openai-provider.js`, `custom-provider.js` - Provider implementations
- `index.js` - Provider factory and registry

**Key IPC Handlers**:
- `ai:getProviders` - List available providers with their models
- `ai:getConfig` - Get current provider config (API keys masked)
- `ai:setProvider` - Switch active provider
- `ai:setProviderApiKey` - Set API key for a provider
- `ai:setProviderModel` - Set model for a provider
- `ai:setProviderBaseUrl` - Set base URL (custom provider)
- `ai:testConnection` - Test provider connection

**Storage Structure**:
```javascript
{
  aiProvider: 'xai',  // Current active provider
  providers: {
    xai: { apiKey: '', model: 'grok-3-mini', baseUrl: 'https://api.x.ai/v1' },
    anthropic: { apiKey: '', model: 'claude-sonnet-4-20250514', baseUrl: 'https://api.anthropic.com' },
    openai: { apiKey: '', model: 'gpt-4o-mini', baseUrl: 'https://api.openai.com/v1' },
    custom: { apiKey: '', model: 'llama2', baseUrl: 'http://localhost:11434/v1' }
  }
}
```

### Entertainment System

Context menu entertainment options (Joke, Fact, Story, Sing) are handled via:
1. Main process sends `entertainment` event with type to renderer
2. Renderer calls `window.electronAPI.getEntertainment(type)`
3. Main process handler `entertainment:getContent`:
   - `sing` → Returns hardcoded Daisy Bell lyrics (no API needed)
   - `joke/fact/story` → Uses current AI provider with specialized prompts

### Classic Voice (SAPI4)

The original BonziBuddy voice is available via the TETYYS SAPI4 API:
- Voice: `Adult Male #2, American English (TruVoice)`
- Pitch: 140, Speed: 157
- API: `https://tetyys.com/SAPI4/SAPI4?text=...&voice=...&pitch=140&speed=157`
- Toggle in Settings → AI Assistant → "Use classic BonziBuddy voice"
- Falls back to Web Speech API if the external API fails

### Window Expansion for Chat

When chat opens, the window expands to fit the input:
1. `expandWindowForChat({ extraWidth, extraHeight })` - Expands window size only (no position change)
2. Chat input positioned at `bottom: 8px` in expanded area
3. `shrinkWindowFromChat()` restores original size

## Key Configuration

- **Default AI Provider**: xAI with `grok-3-mini` model
- **Supported Providers**: xAI (Grok), Anthropic (Claude), OpenAI (ChatGPT), Custom/Local
- **Dev server**: Gatsby runs on `localhost:8000`
- **Window size**: Bonzi frame is 200x160, expands by 160x70 for chat
- **Settings stored**: `voiceEnabled`, `useClassicVoice`, `speechRate`, `aiProvider`, `providers` (encrypted via electron-store)
- **Classic voice API**: TETYYS SAPI4 at `tetyys.com/SAPI4/SAPI4`
- **Conversation history**: Limited to 20 messages (MAX_HISTORY constant)
- **Log file**: `~/Library/Application Support/bonzibuddy/bonzibuddy-error.log`
