# TrueNAS WebUI - React Version

This is a React-based TrueNAS web interface built on the webdesktop framework. This project migrates the original Angular webui to a modern React implementation.

## Project Overview

**Branch**: `truenas`
**Status**: Framework setup complete, migrating API layer

### Architecture

- **UI Framework**: webdesktop (React 18 + Vite)
  - Window management system
  - Desktop environment (Desktop, Taskbar, Launcher)
  - Modern UI components (glassmorphism, animations)
  
- **Backend Communication**: WebSocket (TrueNAS API)
  - Ported from Angular webui's WebSocketHandlerService
  - JSON-RPC 2.0 protocol

### Directory Structure

```
src/
├── components/      # UI framework components (Desktop, WindowManager, Taskbar, etc.)
├── truenas/         # TrueNAS-specific code
│   ├── api/          # WebSocket client and API service
│   ├── helpers/       # Utilities (to be migrated)
│   ├── interfaces/     # Type definitions (to be migrated)
│   └── types/        # TypeScript types (to be migrated)
├── apps/            # TrueNAS applications as desktop apps
│   ├── system-settings/
│   └── user-center/
├── sdk/             # Desktop SDK (placeholder)
└── state/           # State management (placeholder)
```

## Development

### Start Dev Server
```bash
npm run dev
```
Access at http://localhost:5173

### Build
```bash
npm run build
```

### Test
```bash
npm test
```

## Migration Progress

### ✅ Completed
- Create truenas branch
- Remove original webdesktop business apps
- Remove original REST API layer
- Set up TrueNAS API structure
- Create WebSocket client placeholder
- Simplify App.tsx

### 🚧 In Progress
- Migrating TrueNAS WebSocket API service
- Porting type definitions from webui

### 📋 Planned
- Port authentication system
- Create Dashboard app
- Port other TrueNAS modules (Storage, Settings, etc.)

## TrueNAS API Usage

```typescript
import { truenasApi } from './truenas/api'

// Initialize WebSocket client
truenasApi.init()

// Call API method
const result = await truenasApi.call('system.info')

// Subscribe to events
const unsubscribe = truenasApi.subscribe('system.config.changed', (data) => {
  console.log('Config changed:', data)
})
```

## Notes

- Original webui is in Angular at `../webui/`
- This is a complete rewrite in React, not a direct translation
- Focus on modern UI/UX with desktop-like interface
