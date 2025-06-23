# CCDeva 🤖

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub release](https://img.shields.io/github/release/Iamshankhadeep/ccseva.svg)](https://github.com/Iamshankhadeep/ccseva/releases)
[![Build Status](https://img.shields.io/github/actions/workflow/status/Iamshankhadeep/ccseva/ci.yml?branch=main)](https://github.com/Iamshankhadeep/ccseva/actions)
[![Downloads](https://img.shields.io/github/downloads/Iamshankhadeep/ccseva/total.svg)](https://github.com/Iamshankhadeep/ccseva/releases)
[![macOS](https://img.shields.io/badge/macOS-10.15%2B-blue)](https://github.com/Iamshankhadeep/ccseva)

A beautiful macOS menu bar app for tracking your Claude Code usage in real-time. Monitor token consumption, costs, and usage patterns with an elegant interface.

![CCDeva](./assets/screenshot.png)

## Features

### 🎯 Real-time Monitoring
- **Live token usage tracking** with 30-second updates
- **Menu bar integration** with percentage indicator
- **Smart plan detection** (Pro/Max5/Max20/Custom)
- **Burn rate calculation** with depletion predictions

### 🎨 Beautiful Interface
- **Gradient UI** with glass morphism effects
- **Responsive design** optimized for menu bar usage
- **Data visualizations** showing usage trends
- **Model breakdown** (Opus, Sonnet, Haiku)

### 🔔 Smart Notifications
- **Usage warnings** at 70% and 90% thresholds
- **Cost tracking** with daily summaries
- **5-minute notification cooldown** to prevent spam

### 📊 Analytics & Insights
- **7-day usage charts** with visual trends
- **Model-specific breakdowns** with color coding
- **Daily/weekly/monthly** usage statistics
- **Cost estimation** with real-time updates

## Installation

### Prerequisites
- Node.js 18+ and npm
- macOS (tested on macOS 12+)
- Claude Code CLI installed and configured

### Quick Start

```bash
# Clone the repository
git clone https://github.com/Iamshankhadeep/ccseva.git
cd ccseva

# Install dependencies
npm install

# Build the app
npm run build

# Start the app
npm start
```

### Download Pre-built Binaries

Download the latest release from the [GitHub Releases](https://github.com/Iamshankhadeep/ccseva/releases) page:

1. **macOS (Apple Silicon)**: `CCDeva-darwin-arm64.dmg`
2. **macOS (Intel)**: `CCDeva-darwin-x64.dmg`

Simply download the appropriate DMG file, open it, and drag the app to your Applications folder.

### Development Mode

```bash
# Start development server with hot reload
npm run electron-dev
```

### Distribution

```bash
# Build for distribution
npm run dist
```

## Usage

### First Launch
1. **Start the app** - The CCTray icon appears in your menu bar
2. **Click the icon** - View detailed usage statistics in the dropdown
3. **Right-click** - Access context menu with refresh and quit options

### Menu Bar Features
- **Percentage display** - Shows current usage percentage
- **Color indicators** - Green (safe), Yellow (warning), Red (critical)
- **Click to expand** - View detailed statistics panel
- **Auto-refresh** - Updates every 30 seconds

### Understanding the Interface

#### Main Stats Cards
- **Tokens Used** - Current token consumption vs limit
- **Current Plan** - Detected plan with remaining tokens
- **Today's Cost** - Estimated cost for current day
- **Burn Rate** - Tokens per hour with time remaining

#### Data Visualizations
- **Usage Progress** - Visual progress bar with status colors
- **Model Breakdown** - Distribution across Claude models
- **7-Day Chart** - Historical usage trends

## Configuration

### ccusage Integration
The app automatically detects your Claude Code configuration from:
- `~/.claude` directory (default)
- Custom `CLAUDE_CONFIG_DIR` environment variable

### Notification Settings
Modify notification behavior in `src/services/notificationService.ts`:
- **Cooldown period** - Default 5 minutes between notifications
- **Threshold levels** - 70% warning, 90% critical
- **Daily summaries** - Configurable timing

## Architecture

### Tech Stack
- **Electron 36** - Cross-platform desktop framework
- **React 19** - UI library with hooks
- **TypeScript 5** - Type-safe development
- **Tailwind CSS 3** - Utility-first styling
- **ccusage CLI** - Claude Code usage data source

### Project Structure
```
ccseva/
├── main.ts              # Electron main process
├── preload.ts           # Electron preload script
├── src/
│   ├── components/      # React UI components
│   ├── services/        # Business logic services
│   ├── types/           # TypeScript definitions
│   └── styles/          # CSS and styling
├── assets/              # Icons and images
├── .github/             # GitHub workflows and templates
└── dist/                # Built application
```

### Key Services

#### CCUsageService
- Executes `ccusage` CLI commands
- Parses usage data and statistics
- Implements caching for performance
- Handles error states gracefully

#### NotificationService
- Smart notification management
- Usage threshold monitoring
- Cooldown period enforcement
- Cross-platform notification support

## Development

### Build System
- **Webpack** - Module bundling and optimization
- **TypeScript Compiler** - Main/preload process compilation
- **PostCSS** - CSS processing with Tailwind
- **Electron Builder** - App packaging and distribution

### Scripts
```bash
npm run dev         # Webpack development build
npm run build       # Production build
npm start           # Start Electron app
npm run electron-dev # Development with hot reload
npm run pack        # Package app
npm run dist        # Build and distribute

# Code Quality
npm run lint        # Run Biome linter
npm run lint:fix    # Fix linting issues
npm run format      # Format code with Biome
npm run format:check # Check code formatting
npm run type-check  # TypeScript type checking
```

### Adding Features

#### New UI Components
1. Create component in `src/components/`
2. Export from component file
3. Import and use in `src/App.tsx`

#### Data Services
1. Add service class in `src/services/`
2. Implement singleton pattern
3. Register in main process if needed

#### Electron Integration
1. Add IPC handlers in `main.ts`
2. Update preload script with new API
3. Use in React components via `window.electronAPI`

## Troubleshooting

### Common Issues

#### "ccusage not found"
```bash
# Install ccusage globally
npm install -g ccusage

# Or use with npx (recommended)
npx ccusage --version
```

#### "No usage data available"
- Ensure Claude Code is installed and configured
- Check `~/.claude` directory exists
- Verify JSONL log files are present

#### App won't start
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
npm start
```

#### Notifications not working
- Check macOS notification permissions
- Ensure app is not in Do Not Disturb mode
- Verify notification settings in System Preferences

### Debug Mode
Set environment variable for verbose logging:
```bash
DEBUG=true npm start
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for detailed information.

### Quick Start for Contributors

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Install dependencies**: `npm install`
4. **Make your changes**
5. **Run quality checks**: `npm run check:fix`
6. **Test your changes**: `npm run build && npm start`
7. **Submit a pull request**

### Code Style
- **TypeScript** - Strict mode enabled
- **Biome** - Linting and formatting
- **React** - Functional components with hooks
- **Conventional Commits** - Clear commit messages

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Credits

Built with ❤️ using:
- [Electron](https://electronjs.org) - Desktop app framework
- [React](https://reactjs.org) - UI library
- [Tailwind CSS](https://tailwindcss.com) - CSS framework
- [ccusage](https://github.com/ryoppippi/ccusage) - Claude Code usage CLI
- [Claude Code](https://claude.ai/code) - AI coding assistant

---

**Note**: This is an unofficial tool for tracking Claude Code usage. It requires a valid Claude Code installation and configuration to function properly.