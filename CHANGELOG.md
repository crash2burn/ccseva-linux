# Changelog

All notable changes to CCDeva will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Open source preparation and GitHub release readiness
- Comprehensive documentation and contribution guidelines
- Security policy and vulnerability reporting process

## [1.0.0] - 2024-12-23

### Added
- **Menu Bar Integration**: Native macOS menu bar app with real-time usage display
- **Live Monitoring**: Token usage tracking with 30-second refresh intervals
- **Smart Plan Detection**: Automatic detection of Claude plans (Pro/Max5/Max20/Custom)
- **Burn Rate Analysis**: Tokens per hour calculation with depletion predictions
- **Advanced Analytics**: 7-day usage trends and model-specific breakdowns
- **Intelligent Notifications**: Usage warnings at 70% and 90% thresholds with cooldown
- **Modern UI**: Glass morphism interface with gradient themes and responsive design
- **Multi-Model Support**: Tracking for Claude Opus, Sonnet, and Haiku models
- **Cost Estimation**: Real-time cost calculations and daily summaries
- **Session Tracking**: Detailed session analysis and velocity monitoring
- **Reset Time Detection**: Automatic reset time calculation and display
- **Terminal View**: Live monitoring with terminal-style interface
- **Settings Panel**: Configurable notification preferences and display options

### Technical Features
- **ccusage Integration**: Direct API integration with the ccusage npm package
- **Electron 36**: Latest Electron framework with security best practices
- **React 19**: Modern React with hooks and functional components
- **TypeScript 5**: Full type safety and modern language features
- **Tailwind CSS 3**: Utility-first styling with custom themes
- **Dual Architecture**: Separate main and renderer processes with secure IPC
- **Caching System**: Intelligent caching for performance optimization
- **Error Handling**: Graceful degradation and user-friendly error states

### Platform Support
- **macOS**: Full native support with system tray integration
- **Code Signing**: App Store compatible with proper entitlements
- **Notarization**: macOS security compliance for distribution

### Security
- **Sandboxed Renderer**: Secure Electron configuration
- **Context Isolation**: Isolated preload script execution
- **No Remote Module**: Disabled for security
- **Local Processing**: All data processing happens locally

### Performance
- **Memory Efficient**: Optimized memory usage and garbage collection
- **Fast Startup**: Quick app initialization and UI rendering
- **Smooth Animations**: 60fps animations and transitions
- **Background Processing**: Non-blocking data fetching and updates

---

## Release Notes

### Version 1.0.0 - Initial Release

This is the first stable release of CCDeva, providing a comprehensive solution for tracking Claude Code usage on macOS. The application has been thoroughly tested and optimized for performance and user experience.

**Key Highlights:**
- Real-time token usage monitoring in your menu bar
- Beautiful, modern interface with advanced analytics
- Smart notifications to help manage your usage
- Comprehensive model and cost breakdowns
- Seamless integration with Claude Code configuration

**System Requirements:**
- macOS 10.15+ (Catalina or later)
- Node.js 18+ for development
- Claude Code CLI installed and configured

**Installation:**
Download the latest DMG from the GitHub releases page or build from source following the development setup guide.

---

For older versions and detailed change history, see the [GitHub Releases](https://github.com/Iamshankhadeep/ccseva/releases) page.