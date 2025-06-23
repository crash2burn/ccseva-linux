# Contributing to CCDeva

Thank you for your interest in contributing to CCDeva! This document provides guidelines and information for contributors.

## Development Setup

### Prerequisites

- **Node.js** 18+ and npm
- **macOS** (for full testing, though development can be done on other platforms)
- **Claude Code CLI** installed and configured
- **Git** for version control

### Getting Started

1. **Fork the repository**
   ```bash
   git clone https://github.com/your-username/ccseva.git
   cd ccseva
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the application**
   ```bash
   npm run build
   ```

4. **Start development mode**
   ```bash
   npm run electron-dev
   ```

## Project Structure

```
ccseva/
├── main.ts                 # Electron main process
├── preload.ts              # Electron preload script  
├── src/
│   ├── components/         # React UI components
│   ├── services/           # Business logic services
│   ├── types/              # TypeScript definitions
│   └── styles/             # CSS and styling
├── assets/                 # Icons and images
└── dist/                   # Built application
```

## Development Guidelines

### Code Style

- **TypeScript**: Use strict mode, prefer type safety
- **React**: Functional components with hooks
- **Electron**: Follow security best practices
- **CSS**: Tailwind CSS with utility-first approach

### Architecture Patterns

- **Services**: Singleton pattern for shared services
- **IPC**: Secure communication between main and renderer processes
- **Error Handling**: Graceful degradation with user-friendly messages
- **Caching**: Implement appropriate caching for performance

### Testing

Before submitting changes:
1. Test the application manually
2. Verify menu bar functionality works correctly
3. Check notifications appear at proper thresholds
4. Ensure data updates every 30 seconds
5. Test error states handle missing ccusage gracefully

## Making Changes

### Branch Strategy

1. Create a descriptive branch name:
   ```bash
   git checkout -b feature/add-new-metric
   git checkout -b fix/notification-timing
   git checkout -b docs/update-readme
   ```

2. Make your changes following the guidelines above

3. Test thoroughly on macOS if possible

### Commit Messages

Use clear, descriptive commit messages:
- `feat: add token velocity tracking`
- `fix: resolve notification cooldown issue`
- `docs: update installation instructions`
- `refactor: simplify usage calculation logic`

### Pull Request Process

1. **Update documentation** if you've made changes to APIs or functionality
2. **Add tests** if you've added new features
3. **Update CHANGELOG.md** with your changes
4. **Ensure the build passes**: `npm run build`
5. **Create a clear PR description** explaining what and why

## Code Quality

### Biome

Follow the project's linting and formatting rules:
```bash
npm run lint        # Run Biome linter
npm run lint:fix    # Fix linting issues
npm run format      # Format code with Biome
npm run format:check # Check code formatting
npm run check       # Run both linting and formatting
npm run check:fix   # Fix both linting and formatting issues
```

### TypeScript

- Use strict type checking
- Avoid `any` types when possible
- Document complex interfaces
- Use proper imports/exports

### Performance

- Implement caching where appropriate
- Minimize main thread blocking
- Use efficient React patterns
- Optimize bundle size

## Security Guidelines

- **Never commit sensitive data** (API keys, tokens, credentials)
- **Validate all external data** from ccusage CLI
- **Follow Electron security best practices**
- **Use context isolation** in preload scripts
- **Sanitize user inputs** if any

## Getting Help

- **GitHub Issues**: Ask questions or report bugs
- **Discussions**: General questions and ideas

## Issue Guidelines

### Bug Reports

Include:
- **OS version** and Node.js version
- **Steps to reproduce** the issue
- **Expected vs actual behavior**
- **Error messages** or logs
- **Screenshots** if relevant

### Feature Requests

Include:
- **Clear description** of the feature
- **Use case** and motivation
- **Proposed implementation** if you have ideas
- **Alternatives considered**

## Release Process

Releases are handled by maintainers:
1. Version bump in package.json
2. Update CHANGELOG.md
3. Create GitHub release with built binaries
4. Update documentation if needed

## Recognition

Contributors are recognized in:
- GitHub contributors list
- Release notes for significant contributions
- README acknowledgments

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Questions?

Don't hesitate to ask questions in GitHub Issues or Discussions. We're here to help make your contribution experience as smooth as possible!

---

Thank you for contributing to CCDeva! 🚀