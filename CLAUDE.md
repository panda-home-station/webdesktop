# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# TrueNAS WebDesktop

React-based TrueNAS web interface providing a full desktop environment. Migrates the original Angular webui to React.

## Project Overview

- **Branch**: `truenas`
- **Stack**: React 18 + Vite + TypeScript + Zustand
- **Backend**: WebSocket with JSON-RPC 2.0 protocol (TrueNAS middleware)

## Development Commands

```bash
npm run dev        # Start dev server at http://localhost:5173
npm run build      # Production build
npm run test       # Run tests with vitest
npm run lint       # ESLint check
npm run lint:fix   # Auto-fix linting
```

## Architecture

### Desktop Environment
The app renders a full desktop with:
- **Desktop.tsx**: Main desktop component with wallpaper, context menu, app launcher
- **WindowManager.tsx**: Manages window z-order, dragging, resizing
- **Window.tsx**: Individual window chrome (titlebar, controls)
- **Taskbar.tsx**: Bottom taskbar with open windows and system tray
- **Launcher.tsx**: Application launcher/menu

### Window State Management
Zustand store at [src/state/windows-store.ts](src/state/windows-store.ts) manages:
- Window positions, sizes, maximized/minimized states
- Z-order for focus management
- Persistence to localStorage

### SDK Event System
[sdk/desktop.ts](src/sdk/desktop.ts) provides a pub/sub system for desktop-wide events:
- `openApp(id)` / `subscribeOpenApp(callback)` - App launch
- `showDesktop()` / `subscribeShowDesktop(callback)` - Minimize all windows
- `openLauncher()` / `subscribeLauncher(callback)` - Toggle launcher
- `logout()` / `lockScreen()` - Session management

### App Loading System
Apps are defined in `apps/*/manifest.json` and loaded dynamically:
- [apps/registry.ts](src/apps/registry.ts) scans manifests and creates app definitions
- `listApps()` returns all registered apps
- `loadApp(id)` dynamically imports and returns the app component

Each app directory contains:
```
apps/<app-name>/
├── manifest.json   # App metadata (name, title, entry, icon, capabilities)
├── src/
│   └── index.tsx   # App component
```

### TrueNAS WebSocket API
[truenas/api/websocket-client.ts](src/truenas/api/websocket-client.ts) implements:
- JSON-RPC 2.0 protocol over WebSocket
- Exponential backoff reconnection
- Heartbeat/keepalive mechanism
- Event subscription system
- Connection state management (Connected/Connecting/Reconnecting/Disconnected/Error)

### TrueNAS API Service
[truenas/api/index.ts](src/truenas/api/index.ts) wraps the WebSocket client with typed API methods:
- `truenasApi.call(method, params)` - Make API call
- `truenasApi.subscribe(event, callback)` - Subscribe to events
- `truenasApi.init()` - Initialize connection

### State Stores (Zustand)
- `useWindowsStore` - Window management
- `useAuthStore` - Authentication state
- `useAlertStore` - Alert state
- `usePoolManagerStore` - Storage pool management
- `useDiskStore` - Disk management
- `useToastStore` - Toast notifications

### App Layouts
Pre-built layouts in [apps/layouts/](src/apps/layouts/):
- `SidebarLayout.tsx` - Left sidebar + main content (for 3-5 sub-items)
- `TabsLayout.tsx` - Top tabs + content (for equal-priority sub-items)

## Directory Structure

```
src/
├── components/           # Core desktop UI (Desktop, Window, Taskbar, Launcher)
├── truenas/             # TrueNAS integration
│   ├── api/             # WebSocket client and API service
│   ├── services/        # API service methods (auth, pool, disk, dataset, alert)
│   ├── stores/          # Zustand stores (auth, alerts, pool, disk, vdevs)
│   ├── types/           # TypeScript type definitions
│   └── utils/           # Utility functions (storage, dataset, topology)
├── apps/                # Desktop applications
│   ├── layouts/         # Reusable app layouts
│   ├── registry.ts      # Dynamic app loader
│   └── <app-name>/      # Individual apps
├── sdk/                 # Desktop SDK (event pub/sub)
├── state/               # Global state (windows-store, toast, desktop)
├── hooks/               # Custom React hooks
└── environments/       # Environment configuration
```

## Migration Notes

- Original webui is Angular at `../webui/` - not a direct translation
- Focus on desktop-like UX with window management
- See `plan.md` for detailed app migration mapping (Storage, Datasets, Sharing, VMs, etc.)
