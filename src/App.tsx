import { Camera } from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Analytics } from './components/Analytics';
import { Dashboard } from './components/Dashboard';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingScreen } from './components/LoadingScreen';
import { NavigationTabs } from './components/NavigationTabs';
import { SettingsPanel } from './components/SettingsPanel';
import { TerminalView } from './components/TerminalView';
import { Button } from './components/ui/button';
import { Toaster } from './components/ui/sonner';
import type { UsageStats } from './types/usage';

type ViewType = 'dashboard' | 'live' | 'analytics' | 'terminal' | 'settings';

interface AppState {
  currentView: ViewType;
  stats: UsageStats | null;
  loading: boolean;
  error: string | null;
  sidebarExpanded: boolean;
  focusMode: boolean;
  notifications: Array<{
    id: string;
    type: 'success' | 'warning' | 'error' | 'info';
    title: string;
    message: string;
    timestamp: Date;
  }>;
  preferences: {
    autoRefresh: boolean;
    refreshInterval: number;
    theme: 'auto' | 'light' | 'dark';
    notifications: boolean;
    animationsEnabled: boolean;
    timezone?: string;
    resetHour?: number;
    menuBarDisplay: 'off' | 'percentage' | 'value' | 'all';
  };
}

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    currentView: 'dashboard',
    stats: null,
    loading: true,
    error: null,
    sidebarExpanded: false,
    focusMode: false,
    notifications: [],
    preferences: {
      autoRefresh: true,
      refreshInterval: 30000,
      theme: 'auto',
      notifications: true,
      animationsEnabled: true,
      timezone: 'America/Los_Angeles',
      resetHour: 0,
      menuBarDisplay: 'all',
    },
  });

  // Load usage stats with enhanced error handling
  const loadUsageStats = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setState((prev) => ({ ...prev, loading: true, error: null }));
      }

      if (!window.electronAPI) {
        throw new Error('Electron API not available');
      }

      const data = await window.electronAPI.getUsageStats();

      setState((prev) => ({
        ...prev,
        stats: data,
        loading: false,
        error: null,
      }));

      // Add success notification for manual refresh
      if (!showLoading) {
        addNotification({
          type: 'success',
          title: 'Data Refreshed',
          message: 'Usage statistics updated successfully',
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load usage stats';

      setState((prev) => ({
        ...prev,
        error: errorMessage,
        loading: false,
      }));

      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: errorMessage,
      });
    }
  }, []);

  // Force refresh data
  const refreshData = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, error: null }));

      if (!window.electronAPI) {
        throw new Error('Electron API not available');
      }

      const data = await window.electronAPI.refreshData();

      setState((prev) => ({ ...prev, stats: data }));
      addNotification({
        type: 'success',
        title: 'Data Refreshed',
        message: 'Latest usage data loaded',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh data';

      setState((prev) => ({ ...prev, error: errorMessage }));

      addNotification({
        type: 'error',
        title: 'Refresh Failed',
        message: errorMessage,
      });
    }
  }, []);

  // Take screenshot
  const takeScreenshot = useCallback(async () => {
    try {
      if (!window.electronAPI) {
        throw new Error('Electron API not available');
      }

      const result = await window.electronAPI.takeScreenshot();

      if (result.success) {
        toast.success('Screenshot captured!', {
          description: result.message,
          duration: 4000,
        });
      } else {
        toast.error('Screenshot failed', {
          description: result.error || 'Unknown error occurred',
          duration: 4000,
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to take screenshot';
      toast.error('Screenshot failed', {
        description: errorMessage,
        duration: 4000,
      });
    }
  }, []);

  // Add notification with auto-dismiss
  const addNotification = (
    notification: Omit<AppState['notifications'][0], 'id' | 'timestamp'>
  ) => {
    const newNotification = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
      timestamp: new Date(),
    };

    setState((prev) => ({
      ...prev,
      notifications: [newNotification, ...prev.notifications.slice(0, 4)], // Keep max 5
    }));

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      removeNotification(newNotification.id);
    }, 5000);
  };

  // Remove notification
  const removeNotification = (id: string) => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.filter((n) => n.id !== id),
    }));
  };

  // Update preferences
  const updatePreferences = (newPreferences: Partial<AppState['preferences']>) => {
    setState((prev) => ({
      ...prev,
      preferences: { ...prev.preferences, ...newPreferences },
    }));

    // Send menu bar display preference to main process
    if ('menuBarDisplay' in newPreferences && newPreferences.menuBarDisplay) {
      window.electronAPI.updateMenuBarDisplay(newPreferences.menuBarDisplay);
    }
  };

  // Handle navigation
  const navigateTo = useCallback((view: ViewType) => {
    setState((prev) => ({ ...prev, currentView: view }));
  }, []);

  // Toggle focus mode
  const toggleFocusMode = useCallback(() => {
    setState((prev) => ({ ...prev, focusMode: !prev.focusMode }));
  }, []);

  // Setup keyboard shortcut for focus mode
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only trigger on spacebar when not typing in an input
      if (event.code === 'Space' && !['INPUT', 'TEXTAREA', 'SELECT'].includes((event.target as HTMLElement)?.tagName)) {
        event.preventDefault();
        toggleFocusMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleFocusMode]);

  // Setup auto-refresh and event listeners
  useEffect(() => {
    loadUsageStats();

    // Handle usage updates from main process
    const handleUsageUpdate = () => {
      if (state.preferences.autoRefresh) {
        // Silent update from main process - no notification needed
        setState((prev) => ({ ...prev, loading: true, error: null }));

        window.electronAPI
          .getUsageStats()
          .then((data) => {
            setState((prev) => ({
              ...prev,
              stats: data,
              loading: false,
              error: null,
            }));
          })
          .catch((err) => {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load usage stats';
            setState((prev) => ({
              ...prev,
              error: errorMessage,
              loading: false,
            }));
          });
      }
    };

    if (window.electronAPI) {
      window.electronAPI.onUsageUpdated(handleUsageUpdate);
    }

    return () => {
      if (window.electronAPI) {
        window.electronAPI.removeUsageUpdatedListener(handleUsageUpdate);
      }
    };
  }, [state.preferences.autoRefresh, loadUsageStats]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey) {
        switch (event.key) {
          case 'r':
            event.preventDefault();
            refreshData();
            break;
          case 'q':
            event.preventDefault();
            window.electronAPI?.quitApp();
            break;
          case '1':
            event.preventDefault();
            navigateTo('dashboard');
            break;
          case '2':
            event.preventDefault();
            navigateTo('live');
            break;
          case '3':
            event.preventDefault();
            navigateTo('analytics');
            break;
          case '4':
            event.preventDefault();
            navigateTo('terminal');
            break;
          case ',':
            event.preventDefault();
            navigateTo('settings');
            break;
          case 'S':
            if (event.shiftKey) {
              event.preventDefault();
              takeScreenshot();
            }
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [navigateTo, refreshData, takeScreenshot]);

  // Helper functions
  const getUsageStatus = (percentage: number): 'safe' | 'warning' | 'critical' => {
    if (percentage >= 90) return 'critical';
    if (percentage >= 75) return 'warning';
    return 'safe';
  };

  const formatTimeRemaining = (burnRate: number, tokensRemaining: number): string => {
    if (burnRate <= 0) return 'Unlimited';
    const hoursRemaining = tokensRemaining / burnRate;
    if (hoursRemaining < 1) return `${Math.round(hoursRemaining * 60)}m remaining`;
    if (hoursRemaining < 24) return `${Math.round(hoursRemaining)}h remaining`;
    return `${Math.round(hoursRemaining / 24)}d remaining`;
  };

  // Render loading screen
  if (state.loading && !state.stats) {
    return (
      <div className="app-background">
        <LoadingScreen />
      </div>
    );
  }

  // Render error state
  if (state.error && !state.stats) {
    return (
      <div className="app-background">
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="glass-card p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-4">Connection Error</h2>
            <p className="text-neutral-300 mb-6">{state.error}</p>
            <Button
              onClick={() => loadUsageStats()}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/20 transition-all duration-200"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentStats = state.stats;
  if (!currentStats) {
    return (
      <div className="app-background">
        <LoadingScreen />
      </div>
    );
  }

  const usageStatus = getUsageStatus(currentStats.percentageUsed);
  const timeRemaining = formatTimeRemaining(currentStats.burnRate, currentStats.tokensRemaining);

  return (
    <ErrorBoundary>
      <div className="app-background" />

      <div className="relative flex h-screen overflow-hidden">
        {/* Main Content - Full Width for Compact Mode */}
        <main className="flex-1 overflow-y-auto">
          <div className={state.focusMode ? "p-0 max-w-full min-h-full" : "p-3 max-w-full min-h-full"}>
            {/* Compact Header - Hidden in focus mode */}
            {!state.focusMode && (
              <header className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 flex-shrink-0">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-full h-full"
                      >
                        <circle cx="12" cy="12" r="11" fill="#CC785C" />
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2ZM12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20C13.8214 20 15.4983 19.4024 16.8358 18.3914C15.8231 17.0375 15.1667 15.352 15.1667 13.5C15.1667 9.35786 11.8088 6 7.66667 6C7.25363 6 6.84888 6.04259 6.45976 6.12411C7.59756 4.81331 9.65863 4 12 4Z"
                          fill="white"
                        />
                      </svg>
                    </div>
                    <div>
                      <h1 className="text-lg font-bold text-gradient mb-1">CCSeva</h1>
                      <p className="text-xs text-neutral-400">Track API usage</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="glass px-2 py-1 rounded-lg">
                      <span className="text-xs text-neutral-300">
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <Button
                      onClick={refreshData}
                      variant="ghost"
                      size="icon"
                      className="p-1 hover:bg-white/10 hover:scale-105 transition-all duration-200"
                      title="Refresh Data (⌘R)"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                    </Button>

                    <Button
                      onClick={takeScreenshot}
                      variant="ghost"
                      size="icon"
                      className="p-1 hover:bg-white/10 hover:scale-105 transition-all duration-200"
                      title="Take Screenshot (⌘⇧S)"
                    >
                      <Camera className="w-4 h-4" />
                    </Button>

                    <Button
                      onClick={() => window.electronAPI?.quitApp()}
                      variant="ghost"
                      size="icon"
                      className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 hover:scale-105 transition-all duration-200"
                      title="Quit Application (⌘Q)"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </Button>
                  </div>
                </div>

                {/* Navigation Tabs - Hidden in focus mode */}
                <NavigationTabs
                  currentView={state.currentView}
                  onNavigate={navigateTo}
                  className="mb-3"
                />
              </header>
            )}

            {/* Content */}
            <div className={state.focusMode ? "h-screen" : "space-y-3 pb-3"}>
              {state.currentView === 'dashboard' && (
                <Dashboard
                  stats={currentStats}
                  status={usageStatus}
                  timeRemaining={timeRemaining}
                />
              )}

              {state.currentView === 'analytics' && (
                <Analytics stats={currentStats} preferences={state.preferences} />
              )}

              {state.currentView === 'terminal' && (
                <TerminalView stats={currentStats} onRefresh={refreshData} focusMode={state.focusMode} />
              )}

              {state.currentView === 'settings' && (
                <SettingsPanel
                  preferences={state.preferences}
                  onUpdatePreferences={updatePreferences}
                  stats={currentStats}
                />
              )}
            </div>
          </div>
        </main>
      </div>
      <Toaster />
    </ErrorBoundary>
  );
};

export default App;
