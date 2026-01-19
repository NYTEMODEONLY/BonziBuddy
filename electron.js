const { app, BrowserWindow, ipcMain, Menu, shell } = require("electron");
const electron = require("electron");
const path = require("path");
const fs = require("fs");

// ============================================
// ERROR LOGGING SETUP
// ============================================
const logFile = path.join(app.getPath('userData'), 'bonzibuddy-error.log');

function log(level, message, error = null) {
  const timestamp = new Date().toISOString();
  let logMessage = `[${timestamp}] [${level}] ${message}`;
  if (error) {
    logMessage += `\n  Error: ${error.message || error}`;
    if (error.stack) {
      logMessage += `\n  Stack: ${error.stack}`;
    }
  }
  console.log(logMessage);

  // Also write to file
  try {
    fs.appendFileSync(logFile, logMessage + '\n');
  } catch (e) {
    console.error('Failed to write to log file:', e);
  }
}

// Clear log on startup
try {
  fs.writeFileSync(logFile, `=== BonziBuddy Started at ${new Date().toISOString()} ===\n`);
  log('INFO', `Log file location: ${logFile}`);
} catch (e) {
  console.error('Failed to initialize log file:', e);
}

// Global error handlers
process.on('uncaughtException', (error) => {
  log('FATAL', 'Uncaught Exception', error);
});

process.on('unhandledRejection', (reason, promise) => {
  log('FATAL', `Unhandled Rejection at: ${promise}`, reason);
});

// ============================================
// LAZY LOAD OPTIONAL DEPENDENCIES
// ============================================
let Store;

function initStore() {
  if (!Store) {
    try {
      Store = require("electron-store");
      log('INFO', 'electron-store loaded successfully');
    } catch (error) {
      log('ERROR', 'Failed to load electron-store', error);
      return null;
    }
  }
  return Store;
}

// ============================================
// APP CONFIGURATION
// ============================================
let store = null;

function getStore() {
  if (!store) {
    const StoreClass = initStore();
    if (StoreClass) {
      try {
        store = new StoreClass({
          encryptionKey: 'bonzibuddy-secure-key',
          defaults: {
            voiceEnabled: true,
            speechRate: 1.0,
            apiKey: ''
          }
        });
        log('INFO', 'Store initialized successfully');
      } catch (error) {
        log('ERROR', 'Failed to initialize store', error);
      }
    }
  }
  return store;
}

// AI conversation history
let conversationHistory = [];
const MAX_HISTORY = 20;

// System prompt for BonziBuddy personality
const SYSTEM_PROMPT = `You are BonziBuddy, a friendly and helpful purple gorilla desktop assistant from the late 1990s/early 2000s. You're cheerful, a bit silly, and love to help users with anything they need.

Key personality traits:
- Enthusiastic and upbeat
- Uses casual, friendly language
- Occasionally makes jokes or puns
- Nostalgic for the early internet era
- Helpful and eager to please

Keep your responses SHORT (1-3 sentences max). You're a chatty desktop buddy, not writing essays!`;

// xAI API configuration
const XAI_API_URL = 'https://api.x.ai/v1/chat/completions';
const XAI_MODEL = 'grok-3-mini';

let main, home, settings;
let xaiApiKey = null;

// Use electron-serve for production, dev server for development
const isDev = process.env.NODE_ENV === 'development';
log('INFO', `Running in ${isDev ? 'DEVELOPMENT' : 'PRODUCTION'} mode`);

let loadURL;

if (!isDev) {
  try {
    const serve = require('electron-serve');
    loadURL = serve({ directory: 'public' });
    log('INFO', 'electron-serve initialized for production');
  } catch (error) {
    log('ERROR', 'Failed to initialize electron-serve', error);
  }
}

const getURL = (page) => {
  if (isDev) {
    return `http://localhost:8000/${page}`;
  }
  return `app://-/${page}`;
};

// Initialize xAI API key if it exists
const initXAIClient = () => {
  const s = getStore();
  if (!s) return false;

  const apiKey = s.get('apiKey');
  if (apiKey) {
    xaiApiKey = apiKey;
    log('INFO', 'xAI API key loaded');
    return true;
  }
  return false;
};

const createSettingsMenu = () => {
  log('INFO', 'Creating settings menu');
  if (settings) {
    settings.focus();
    return;
  }

  try {
    settings = new BrowserWindow({
      width: 800,
      height: 600,
      icon: path.join(__dirname, "static/favicon.ico"),
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
      },
    });

    settings.on("close", () => {
      settings = null;
    });

    settings.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      log('ERROR', `Settings window failed to load: ${errorDescription} (${errorCode})`);
    });

    if (isDev) {
      settings.loadURL(getURL('settings'));
    } else {
      loadURL(settings).then(() => {
        settings.loadURL(getURL('settings'));
      });
    }
    log('INFO', 'Settings window created');
  } catch (error) {
    log('ERROR', 'Failed to create settings window', error);
  }
};

const createHomeMenu = () => {
  log('INFO', 'Creating home menu');
  if (home) {
    home.focus();
    return;
  }

  try {
    home = new BrowserWindow({
      width: 658,
      height: 436,
      maximizable: false,
      autoHideMenuBar: true,
      icon: path.join(__dirname, "static/favicon.ico"),
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
      },
    });

    home.on("close", () => {
      home = null;
    });

    home.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      log('ERROR', `Home window failed to load: ${errorDescription} (${errorCode})`);
    });

    if (isDev) {
      home.loadURL(getURL('home'));
    } else {
      loadURL(home).then(() => {
        home.loadURL(getURL('home'));
      });
    }
    log('INFO', 'Home window created');
  } catch (error) {
    log('ERROR', 'Failed to create home window', error);
  }
};

const createWindow = async () => {
  log('INFO', 'Creating main window');

  try {
    // Initialize xAI client (optional, don't fail if it doesn't work)
    initXAIClient();

    main = new BrowserWindow({
      width: 200,
      height: 160,
      transparent: true,
      frame: false,
      maximizable: false,
      alwaysOnTop: true,
      hasShadow: false,
      backgroundColor: '#00000000',
      icon: path.join(__dirname, "static/favicon.ico"),
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
      },
    });

    log('INFO', 'Main BrowserWindow created');

    // Center the window on screen
    main.center();
    log('INFO', 'Window centered on screen');

    // macOS: Make visible on all workspaces/desktops
    if (process.platform === 'darwin') {
      main.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
      log('INFO', 'Set visible on all workspaces (macOS)');
    }

    // Error handler for main window
    main.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      log('ERROR', `Main window failed to load URL ${validatedURL}: ${errorDescription} (${errorCode})`);
    });

    main.webContents.on('crashed', (event) => {
      log('FATAL', 'Main window renderer process crashed');
    });

    main.on('unresponsive', () => {
      log('ERROR', 'Main window became unresponsive');
    });

    // Window movement handlers
    ipcMain.on("windowMoving", (e, { mouseX, mouseY }) => {
      try {
        const { x, y } = electron.screen.getCursorScreenPoint();
        main.setPosition(x - mouseX, y - mouseY);
      } catch (error) {
        log('ERROR', 'Error in windowMoving handler', error);
      }
    });

    ipcMain.on('resizeWindow', (e, [width, height]) => {
      try {
        log('INFO', `Resizing window to ${width}x${height}`);
        main.setSize(width, height);
      } catch (error) {
        log('ERROR', 'Error in resizeWindow handler', error);
      }
    });

    ipcMain.on("windowMoved", () => {
      // Do something when dragging stops
    });

    // Window expansion for chat input
    ipcMain.on("expandWindowForChat", (e, { extraWidth, extraHeight }) => {
      try {
        const [width, height] = main.getSize();
        // Expand to the right and down ONLY - no position change, Bonzi stays put
        const newWidth = width + extraWidth;
        const newHeight = height + extraHeight;
        main.setSize(newWidth, newHeight);
        // No setPosition call - window anchor stays at top-left
        log('INFO', `Expanded window for chat: ${width}x${height} -> ${newWidth}x${newHeight}`);
      } catch (error) {
        log('ERROR', 'Error expanding window for chat', error);
      }
    });

    ipcMain.on("shrinkWindowFromChat", (e, { extraWidth, extraHeight }) => {
      try {
        const [width, height] = main.getSize();
        // Shrink back - no position change needed
        const newWidth = width - extraWidth;
        const newHeight = height - extraHeight;
        main.setSize(newWidth, newHeight);
        log('INFO', `Shrunk window from chat: ${width}x${height} -> ${newWidth}x${newHeight}`);
      } catch (error) {
        log('ERROR', 'Error shrinking window from chat', error);
      }
    });

    // Close program handler
    ipcMain.on("closeProgram", (e, code) => {
      log('INFO', `closeProgram called with code: ${code}`);
      if (typeof code !== "undefined") {
        if (main) main.close();
        if (home) home.close();
        if (settings) settings.close();
      } else {
        main.webContents.send("closeProgram");
      }
    });

    // Menu handlers
    ipcMain.on("openMainMenu", createHomeMenu);
    ipcMain.on("openSettingsMenu", createSettingsMenu);

    // Context menu handler
    ipcMain.handle('showContextMenu', async (event) => {
      return new Promise((resolve) => {
        let resolved = false;
        const menu = Menu.buildFromTemplate([
          {
            label: 'My Home',
            click: () => {
              resolved = true;
              createHomeMenu();
              resolve('home');
            }
          },
          {
            label: 'Chat with Bonzi',
            click: () => {
              resolved = true;
              main.webContents.send('openChatInput');
              resolve('chat');
            }
          },
          { type: 'separator' },
          {
            label: 'Options',
            click: () => {
              resolved = true;
              createSettingsMenu();
              resolve('settings');
            }
          },
          { type: 'separator' },
          {
            label: 'Goodbye',
            click: () => {
              resolved = true;
              main.webContents.send('closeProgram');
              resolve('goodbye');
            }
          }
        ]);

        // Handle menu close without selection
        menu.on('menu-will-close', () => {
          if (!resolved) {
            resolve('closed');
          }
        });

        menu.popup({ window: BrowserWindow.fromWebContents(event.sender) });
      });
    });

    // External URL handler
    ipcMain.handle('openExternal', async (event, url) => {
      await shell.openExternal(url);
    });

    // AI handlers
    ipcMain.handle('ai:sendMessage', async (event, message) => {
      if (!xaiApiKey) {
        const hasKey = initXAIClient();
        if (!hasKey) {
          return { error: 'No API key configured. Please set your xAI API key in Settings.' };
        }
      }

      try {
        conversationHistory.push({
          role: 'user',
          content: message
        });

        if (conversationHistory.length > MAX_HISTORY) {
          conversationHistory = conversationHistory.slice(-MAX_HISTORY);
        }

        // Build messages array with system prompt
        const messages = [
          { role: 'system', content: SYSTEM_PROMPT },
          ...conversationHistory
        ];

        const response = await fetch(XAI_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${xaiApiKey}`
          },
          body: JSON.stringify({
            model: XAI_MODEL,
            max_tokens: 256,
            messages: messages
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
        }

        const data = await response.json();
        const assistantMessage = data.choices[0].message.content;

        conversationHistory.push({
          role: 'assistant',
          content: assistantMessage
        });

        return { response: assistantMessage };
      } catch (error) {
        log('ERROR', 'AI sendMessage error', error);
        return { error: error.message || 'Failed to get response from Grok' };
      }
    });

    ipcMain.handle('ai:setApiKey', async (event, apiKey) => {
      const s = getStore();
      if (s) {
        s.set('apiKey', apiKey);
        xaiApiKey = apiKey || null;
      }
      return { success: true };
    });

    ipcMain.handle('ai:getApiKey', async () => {
      const s = getStore();
      if (!s) return '';
      const key = s.get('apiKey');
      if (key) {
        return key.substring(0, 8) + '...' + key.substring(key.length - 4);
      }
      return '';
    });

    ipcMain.handle('ai:clearHistory', async () => {
      conversationHistory = [];
      return { success: true };
    });

    // Settings handlers
    ipcMain.handle('settings:get', async (event, key) => {
      const s = getStore();
      return s ? s.get(key) : null;
    });

    ipcMain.handle('settings:set', async (event, key, value) => {
      const s = getStore();
      if (s) s.set(key, value);
      return { success: true };
    });

    // Chat input trigger
    ipcMain.on('openChatInput', () => {
      main.webContents.send('openChatInput');
    });

    // Load the main bonzi page
    const url = getURL('bonzi');
    log('INFO', `Loading URL: ${url}`);

    if (isDev) {
      main.loadURL(url);
    } else {
      await loadURL(main);
      main.loadURL(url);
    }

    log('INFO', 'Main window URL load initiated');

    // Open DevTools in development for debugging
    if (isDev) {
      main.webContents.openDevTools({ mode: 'detach' });
    }

  } catch (error) {
    log('FATAL', 'Failed to create main window', error);
  }
};

app.on("ready", () => {
  log('INFO', 'App ready event fired');
  createWindow();
});

app.on('window-all-closed', () => {
  log('INFO', 'All windows closed, quitting app');
  app.quit();
});

app.on('activate', () => {
  log('INFO', 'App activate event fired');
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Log app paths
app.on('ready', () => {
  log('INFO', `App paths:`);
  log('INFO', `  userData: ${app.getPath('userData')}`);
  log('INFO', `  __dirname: ${__dirname}`);
  log('INFO', `  preload.js exists: ${fs.existsSync(path.join(__dirname, 'preload.js'))}`);
});
