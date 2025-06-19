import React, { useState, useEffect } from 'react';
import { UsageStats } from './types/usage';
import { Dashboard } from './components/Dashboard';
import { SettingsPanel } from './components/SettingsPanel';
import { NotificationSystem } from './components/NotificationSystem';
import { Sidebar } from './components/Sidebar';
import { LoadingScreen } from './components/LoadingScreen';
import { ErrorBoundary } from './components/ErrorBoundary';

type ViewType = 'dashboard' | 'analytics' | 'models' | 'settings' | 'about';

interface AppState {
  currentView: ViewType;
  stats: UsageStats | null;
  loading: boolean;
  error: string | null;
  sidebarExpanded: boolean;
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
  };
}

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    currentView: 'dashboard',
    stats: null,
    loading: true,
    error: null,
    sidebarExpanded: false,
    notifications: [],
    preferences: {
      autoRefresh: true,
      refreshInterval: 30000,
      theme: 'auto',
      notifications: true,
      animationsEnabled: true,
    },
  });

  // Load usage stats with enhanced error handling
  const loadUsageStats = async (showLoading = true) => {
    try {
      if (showLoading) {
        setState(prev => ({ ...prev, loading: true, error: null }));
      }
      
      if (!window.electronAPI) {
        throw new Error('Electron API not available');
      }
      
      const data = await window.electronAPI.getUsageStats();
      
      setState(prev => ({
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
      
      setState(prev => ({
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
  };

  // Force refresh data
  const refreshData = async () => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      if (!window.electronAPI) {
        throw new Error('Electron API not available');
      }
      
      const data = await window.electronAPI.refreshData();
      
      setState(prev => ({ ...prev, stats: data }));
      
      addNotification({
        type: 'success',
        title: 'Data Refreshed',
        message: 'Latest usage data loaded',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh data';
      
      setState(prev => ({ ...prev, error: errorMessage }));
      
      addNotification({
        type: 'error',
        title: 'Refresh Failed',
        message: errorMessage,
      });
    }
  };

  // Add notification with auto-dismiss
  const addNotification = (notification: Omit<AppState['notifications'][0], 'id' | 'timestamp'>) => {
    const newNotification = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
    };

    setState(prev => ({
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
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.filter(n => n.id !== id),
    }));
  };

  // Update preferences
  const updatePreferences = (newPreferences: Partial<AppState['preferences']>) => {
    setState(prev => ({
      ...prev,
      preferences: { ...prev.preferences, ...newPreferences },
    }));
  };

  // Handle navigation
  const navigateTo = (view: ViewType) => {
    setState(prev => ({ ...prev, currentView: view }));
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    setState(prev => ({ ...prev, sidebarExpanded: !prev.sidebarExpanded }));
  };

  // Setup auto-refresh and event listeners
  useEffect(() => {
    loadUsageStats();

    // Handle usage updates from main process
    const handleUsageUpdate = () => {
      if (state.preferences.autoRefresh) {
        loadUsageStats(false);
      }
    };

    if (window.electronAPI) {
      window.electronAPI.onUsageUpdated(handleUsageUpdate);
    }

    // Setup auto-refresh interval
    let intervalId: NodeJS.Timeout | null = null;
    if (state.preferences.autoRefresh) {
      intervalId = setInterval(() => {
        loadUsageStats(false);
      }, state.preferences.refreshInterval);
    }

    return () => {
      if (window.electronAPI) {
        window.electronAPI.removeUsageUpdatedListener(handleUsageUpdate);
      }
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [state.preferences.autoRefresh, state.preferences.refreshInterval]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey) {
        switch (event.key) {
          case 'r':
            event.preventDefault();
            refreshData();
            break;
          case '1':
            event.preventDefault();
            navigateTo('dashboard');
            break;
          case '2':
            event.preventDefault();
            navigateTo('analytics');
            break;
          case '3':
            event.preventDefault();
            navigateTo('models');
            break;
          case ',':
            event.preventDefault();
            navigateTo('settings');
            break;
          case 'b':
            event.preventDefault();
            toggleSidebar();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

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
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-4">Connection Error</h2>
            <p className="text-neutral-300 mb-6">{state.error}</p>
            <button
              onClick={() => loadUsageStats()}
              className="btn btn-primary w-full"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentStats = state.stats!;
  const usageStatus = getUsageStatus(currentStats.percentageUsed);
  const timeRemaining = formatTimeRemaining(currentStats.burnRate, currentStats.tokensRemaining);

  return (
    <ErrorBoundary>
      <div className="app-background" />
      
      <div className="relative min-h-screen flex">
        {/* Sidebar */}
        <Sidebar
          currentView={state.currentView}
          expanded={state.sidebarExpanded}
          onNavigate={navigateTo}
          onToggle={toggleSidebar}
          stats={currentStats}
          status={usageStatus}
        />

        {/* Main Content */}
        <main className={`flex-1 transition-all duration-300 ${
          state.sidebarExpanded ? 'ml-64' : 'ml-16'
        }`}>
          <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <header className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gradient mb-2">
                    Claude Credits Monitor
                  </h1>
                  <p className="text-neutral-400">
                    Track your API usage with style and precision
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="glass px-4 py-2 rounded-full">
                    <span className="text-sm text-neutral-300">
                      Last updated: {new Date().toLocaleTimeString()}
                    </span>
                  </div>
                  
                  <button
                    onClick={refreshData}
                    className="btn btn-ghost hover-scale"
                    title="Refresh Data (⌘R)"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
              </div>
            </header>

            {/* Content */}
            <div className="space-y-6">
              {state.currentView === 'dashboard' && (
                <Dashboard
                  stats={currentStats}
                  status={usageStatus}
                  timeRemaining={timeRemaining}
                  onRefresh={refreshData}
                  preferences={state.preferences}
                />
              )}

              {state.currentView === 'settings' && (
                <SettingsPanel
                  preferences={state.preferences}
                  onUpdatePreferences={updatePreferences}
                  stats={currentStats}
                />
              )}

              {(state.currentView === 'analytics' || state.currentView === 'models' || state.currentView === 'about') && (
                <div className="glass-card p-12 text-center">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 7.172V5L8 4z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-4">Coming Soon</h2>
                  <p className="text-neutral-300 max-w-md mx-auto">
                    {state.currentView === 'analytics' && 'Advanced analytics and insights are being developed.'}
                    {state.currentView === 'models' && 'Model-specific usage breakdown and comparison tools.'}
                    {state.currentView === 'about' && 'Learn more about Claude Credits Monitor and its features.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Notification System */}
        <NotificationSystem
          notifications={state.notifications}
          onRemove={removeNotification}
          enabled={state.preferences.notifications}
        />
      </div>
    </ErrorBoundary>
  );
};

export default App;