import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-full gradient-bg flex items-center justify-center p-6">
          <div className="glass-card max-w-lg w-full text-center stagger-children">
            
            {/* Error Icon */}
            <div className="text-6xl mb-6 floating">💥</div>
            
            {/* Error Title */}
            <h2 className="text-white text-2xl font-bold mb-4 text-shadow">
              Something went wrong
            </h2>
            
            {/* Error Description */}
            <p className="text-white/80 text-base mb-6 leading-relaxed">
              An unexpected error occurred in the application. This might be a temporary issue.
            </p>

            {/* Error Details (in development) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-left">
                <div className="text-red-400 font-mono text-sm mb-2">
                  {this.state.error.name}: {this.state.error.message}
                </div>
                {this.state.errorInfo?.componentStack && (
                  <div className="text-red-300/70 font-mono text-xs max-h-32 overflow-y-auto">
                    {this.state.errorInfo.componentStack}
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={this.handleReset}
                className="btn btn-primary w-full hover-lift"
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="btn w-full hover-lift"
              >
                Reload Application
              </button>
            </div>

            {/* Help Text */}
            <div className="mt-6 text-white/60 text-sm space-y-2">
              <p>If this problem persists:</p>
              <div className="flex flex-col space-y-1 text-xs">
                <span>• Try restarting the application</span>
                <span>• Check your Claude Code configuration</span>
                <span>• Contact support if needed</span>
              </div>
            </div>

            {/* Debug Info */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-6 pt-4 border-t border-white/10">
                <details className="text-left">
                  <summary className="text-white/60 text-xs cursor-pointer hover:text-white/80">
                    Show Debug Information
                  </summary>
                  <div className="mt-2 p-3 bg-black/20 rounded text-xs font-mono text-white/70 max-h-40 overflow-auto">
                    <div>User Agent: {navigator.userAgent}</div>
                    <div>Timestamp: {new Date().toISOString()}</div>
                    <div>URL: {window.location.href}</div>
                    {this.state.error?.stack && (
                      <div className="mt-2 whitespace-pre-wrap">
                        Stack: {this.state.error.stack}
                      </div>
                    )}
                  </div>
                </details>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}