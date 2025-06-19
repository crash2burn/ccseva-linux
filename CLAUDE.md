# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a macOS menu bar Electron application that monitors Claude Code usage in real-time. The app integrates with the `ccusage` CLI tool to fetch token usage data and displays it through a React-based UI with notifications and visualizations.

## Essential Commands

### Development
```bash
npm run electron-dev  # Start with hot reload (recommended for development)
npm run dev           # Build frontend only in watch mode
npm start            # Start built app
```

### Building
```bash
npm run build        # Production build (webpack + tsc compilation)
npm run pack         # Package app with electron-builder
npm run dist         # Build and create distribution package
```

### Dependencies
```bash
npm install          # Install all dependencies
ccusage --version    # Verify ccusage CLI is available (required for functionality)
```

## Architecture Overview

### Dual-Process Electron Architecture
The app follows standard Electron patterns with clear separation:

- **Main Process** (`main.ts`): Manages system tray, IPC, and background services
- **Renderer Process** (`src/`): React app handling UI and user interactions
- **Preload Script** (`preload.ts`): Secure bridge exposing `electronAPI` to renderer

### Key Architectural Components

#### Service Layer (Singleton Pattern)
- **CCUsageService**: Executes `npx ccusage daily --json` commands following ccusage CLI best practices, implements 30-second caching
- **NotificationService**: Manages macOS notifications with cooldown periods and threshold detection

#### Data Flow
1. Main process polls CCUsageService every 30 seconds
2. Service executes `ccusage daily --json --days 30` and `ccusage daily --json --days 1` via child_process.spawn
3. Raw JSON parsed into typed interfaces (UsageStats, MenuBarData) with fallback field names for compatibility
4. Menu bar updates with percentage, renderer receives data via IPC
5. React components render charts, cards, and progress indicators

#### UI Component Hierarchy
```
App.tsx (main container)
├── UsageCard (metric displays)
├── ProgressBar (visual usage indicators) 
├── TokenUsageChart (7-day trend visualization)
└── ModelBreakdown (Opus/Sonnet/Haiku distribution)
```

### Build System Specifics

#### Dual Compilation Process
The build requires both Webpack (renderer) and TypeScript compiler (main/preload):
```bash
webpack --mode production && tsc main.ts preload.ts --outDir dist
```

#### Critical Path Dependencies
- **ccusage CLI**: Must be available in PATH or via npx
- **Tailwind CSS v3**: PostCSS processing with custom gradient themes
- **React 19**: Uses new JSX transform (`react-jsx`)

### IPC Communication Pattern

Main process exposes these handlers:
- `get-usage-stats`: Returns full UsageStats object
- `refresh-data`: Forces cache refresh and returns fresh data
- `usage-updated`: Event emitted to renderer every 30 seconds

Renderer accesses via `window.electronAPI` (type-safe interface in preload.ts).

## Data Processing Logic

### Usage Calculation
The app detects Claude plans automatically:
- **Pro**: ≤7,000 tokens
- **Max5**: ≤35,000 tokens  
- **Max20**: ≤140,000 tokens
- **Custom**: >140,000 tokens

### Burn Rate Algorithm
Calculates tokens/hour based on last 24 hours of usage data, used for depletion time predictions.

### Error Handling Strategy
- CCUsageService returns default stats on ccusage command failures
- React components display error states with retry buttons
- Main process continues functioning even if data fetch fails

## Development Considerations

### TypeScript Configuration
Uses strict mode with custom path aliases (`@/*` → `src/*`). Main/preload files compile separately from src/ tree.

### Styling Architecture  
Tailwind CSS with custom color palette for Claude branding. Glass morphism effects achieved through `backdrop-filter` and RGBA backgrounds.

### Menu Bar Integration
macOS-specific Tray API usage with contextual menus. Window positioned near menu bar and auto-hides on blur for native feel.

### Notification System
Implements intelligent notification logic:
- 5-minute cooldown between notifications
- Progressive alerts (70% warning → 90% critical)
- Only notifies when status worsens, not repeated warnings

## Required External Dependencies

- **ccusage CLI**: The app requires ccusage ^13.0.1. Install via `npm install -g ccusage` or ensure `npx ccusage` works
- **Claude Code**: Must be configured with valid credentials in `~/.claude` directory containing JSONL usage files
- **macOS**: Tray and notification APIs are platform-specific

## ccusage Integration Best Practices

Following patterns from successful projects like `claude-usage-tracker-for-mac`:

1. **Use specific ccusage commands**: `ccusage daily --json --days N` instead of generic commands
2. **Handle multiple field name formats**: Support both `totalTokens`/`costUSD` and `total_tokens`/`cost_usd`
3. **Separate today vs historical data**: Make separate calls for current day and historical data
4. **Robust error handling**: Gracefully handle empty responses, malformed JSON, and missing fields

## Testing the App

Since there are no automated tests, manual verification checklist:
1. Menu bar icon appears and shows percentage
2. Click expands panel with usage data
3. Right-click shows context menu
4. Notifications appear at usage thresholds
5. Data updates every 30 seconds
6. Error states handle missing ccusage gracefully