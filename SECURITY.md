# Security Policy

## Supported Versions

We actively support the following versions of CCSeva with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please report it responsibly.

### How to Report

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please report them via:

1. **GitHub Security Advisories**: Use the "Report a vulnerability" button in the Security tab of this repository
2. **Email**: Send details to the repository owner via GitHub

### What to Include

When reporting a security vulnerability, please include:

- **Description** of the vulnerability
- **Steps to reproduce** the issue
- **Potential impact** assessment
- **Suggested fix** if you have one
- **Your contact information** for follow-up

### Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 1 week
- **Resolution**: Varies based on complexity, but we aim for 30 days maximum

## Security Considerations

### Application Security

CCSeva implements several security measures:

- **Sandboxed Renderer**: Electron renderer process runs in a sandbox
- **Context Isolation**: Preload scripts use context isolation
- **No Remote Module**: Remote module is disabled
- **CSP Headers**: Content Security Policy headers are enforced
- **Secure Defaults**: All security features enabled by default

### Data Privacy

- **Local Data Only**: All data processing happens locally
- **No External Servers**: App doesn't send data to external servers
- **Claude Configuration**: Uses standard Claude Code configuration files
- **No Credentials Storage**: App doesn't store API keys or credentials

### File System Access

- **Limited Scope**: Only reads Claude Code configuration files
- **No Arbitrary Access**: Cannot access files outside of Claude config directory
- **User Permissions**: Respects macOS file system permissions

## Known Security Considerations

### Dependencies

- **Electron Framework**: Uses latest stable Electron version
- **Node.js Modules**: Dependencies are regularly updated
- **npm Audit**: Regular security audits of dependencies

### Platform Specific

#### macOS
- **Code Signing**: Distributed builds are code signed
- **Notarization**: Apps are notarized for macOS security
- **Hardened Runtime**: Runtime protections enabled
- **Sandboxing**: App Store builds use sandboxing

### User Responsibilities

Users should:

- **Keep Updated**: Install security updates promptly
- **Secure Configuration**: Protect Claude Code configuration files
- **Source Verification**: Only download from official sources
- **System Updates**: Keep macOS and system dependencies updated

## Security Features

### Electron Security

- **Disabled Node Integration**: Renderer process cannot access Node.js APIs directly
- **Context Isolation**: Isolated execution context for security
- **Secure Preload**: Minimal API surface exposed to renderer
- **No Eval**: Dynamic code execution is disabled

### Build Security

- **Reproducible Builds**: Build process is deterministic
- **Dependency Pinning**: Exact versions specified
- **Supply Chain**: Dependencies from trusted sources
- **Automated Scanning**: CI/CD includes security scanning

## Vulnerability Disclosure

### Public Disclosure

After a security issue is resolved:

1. **Security Advisory**: Published on GitHub
2. **CVE Assignment**: If applicable
3. **Release Notes**: Security fixes highlighted
4. **User Notification**: Through normal update channels

### Credit

Security researchers who responsibly disclose vulnerabilities will be:

- **Credited** in security advisories
- **Acknowledged** in release notes
- **Listed** in our security hall of fame (if desired)

## Security Updates

### Notification

Users are notified of security updates through:

- **GitHub Releases**: Security releases are clearly marked
- **In-App Updates**: If update mechanism is available
- **Security Advisories**: GitHub security advisories

### Installation

Security updates should be installed immediately:

```bash
# Update to latest version
npm install -g ccseva@latest

# Or download from GitHub releases
# https://github.com/Iamshankhadeep/ccseva/releases
```

## Contact

For security-related questions or concerns:

- **Security Team**: Contact via GitHub repository
- **General Issues**: [GitHub Issues](https://github.com/Iamshankhadeep/ccseva/issues)

---

Thank you for helping keep CCSeva secure! 🔒