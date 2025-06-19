# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a macOS menu bar Electron application that monitors Claude Code usage in real-time. The app uses the `ccusage` npm package to fetch token usage data and displays it through a React-based UI with notifications and visualizations.

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
```

## Architecture Overview

### Dual-Process Electron Architecture
The app follows standard Electron patterns with clear separation:

- **Main Process** (`main.ts`): Manages system tray, IPC, and background services
- **Renderer Process** (`src/`): React app handling UI and user interactions
- **Preload Script** (`preload.ts`): Secure bridge exposing `electronAPI` to renderer

### Key Architectural Components

#### Service Layer (Singleton Pattern)
- **CCUsageService**: Uses the `ccusage` npm package API to fetch daily usage data, implementing a 30-second cache.
- **NotificationService**: Manages macOS notifications with cooldown periods and threshold detection

#### Data Flow
1. Main process polls CCUsageService every 30 seconds
2. Service imports and calls `getDailyUsage` from the `ccusage` npm package to fetch historical (30-day) and current-day usage data.
3. The returned JavaScript objects are mapped to typed interfaces (`UsageStats`, `MenuBarData`).
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

- **`ccusage` npm package**: This is a direct dependency managed in `package.json`.
- **Claude Code**: Must be configured with valid credentials in `~/.claude` directory containing JSONL usage files, which the `ccusage` package uses as its data source.
- **macOS**: Tray and notification APIs are platform-specific

## ccusage Integration Best Practices

When using the `ccusage` package API:

1. **Use specific API functions**: Prefer targeted functions like `getDailyUsage` over more generic ones if available.
2. **Handle API data structures**: The API returns structured JavaScript objects, eliminating the need for JSON parsing and field name compatibility layers.
3. **Separate data calls**: Make separate API calls for current day and historical data to optimize performance and clarity.
4. **Robust error handling**: Implement `try/catch` blocks around API calls to gracefully handle potential errors, such as a missing `~/.claude` configuration.

## Recent Updates and Improvements

### ccusage Integration Refactor (Latest)
- **Switched from CLI to API**: Refactored `CCUsageService` to use the `ccusage` npm package directly, replacing `child_process` calls.
- **Simplified data fetching**: API calls (`getDailyUsage`) now return structured JS objects, removing the need for manual JSON parsing and field name mapping.
- **Improved reliability**: Direct API integration is more robust and less prone to issues from shell environment differences.
- **Dependency management**: `ccusage` is now a formal npm dependency in `package.json`, ensuring version consistency.

### Project Structure Evolution
```
ccmonitor/ (now claude-code-monitor)
├── main.ts                     # Electron main process with tray management
├── preload.ts                  # Secure IPC bridge
├── src/
│   ├── App.tsx                 # Main React application container
│   ├── components/             # UI components (UsageCard, ProgressBar, etc.)
│   ├── services/               # Business logic services
│   │   ├── ccusageService.ts   # ccusage API integration (recently refactored)
│   │   └── notificationService.ts # macOS notification management
│   ├── types/usage.ts          # TypeScript interfaces
│   └── styles/index.css        # Tailwind CSS with custom themes
├── package.json                # Updated metadata and dependencies
├── CLAUDE.md                   # This documentation file
├── README.md                   # User-facing documentation
└── .gitignore                  # Git exclusions for build artifacts
```

### Git Repository Status
- **Initialized git repository** with comprehensive .gitignore
- **Two commits made**:
  1. Initial commit with full feature set
  2. Refactor commit improving ccusage integration
- **Clean working tree** ready for development

## Testing the App

Since there are no automated tests, manual verification checklist:
1. Menu bar icon appears and shows percentage
2. Click expands panel with usage data
3. Right-click shows context menu
4. Notifications appear at usage thresholds
5. Data updates every 30 seconds
6. Error states handle missing ccusage gracefully
7. **`ccusage` package integration**: Verify the app correctly imports and calls the `ccusage` API.
8. **Data consistency**: Ensure the data displayed in the app matches the output from the underlying `ccusage` data source.