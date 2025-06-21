# CCTray 🤖

A beautiful Mac menu bar Electron app for tracking your Claude Code usage in real-time. Monitor token consumption, costs, and usage patterns with an elegant interface.

![CCTray](./assets/screenshot.png)

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
git clone <repository-url>
cd cctray

# Install dependencies
npm install

# Build the app
npm run build

# Start the app
npm start
```

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
cctray/
├── main.ts              # Electron main process
├── preload.ts           # Electron preload script
├── src/
│   ├── components/      # React UI components
│   ├── services/        # Business logic services
│   ├── types/           # TypeScript definitions
│   └── styles/          # CSS and styling
├── assets/              # Icons and images
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

### Development Setup
1. Fork the repository
2. Create feature branch
3. Install dependencies
4. Make changes with tests
5. Submit pull request

### Code Style
- **TypeScript** - Strict mode enabled
- **ESLint** - Follow project configuration
- **Prettier** - Auto-formatting on save
- **React** - Functional components with hooks

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