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
          case ',':
            event.preventDefault();
            navigateTo('settings');
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
        }
      }
      
      if (event.key === 'Escape') {
        setState(prev => ({ ...prev, sidebarExpanded: false }));
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Get usage status for theming
  const getUsageStatus = (percentage: number): 'safe' | 'warning' | 'critical' => {
    if (percentage >= 90) return 'critical';
    if (percentage >= 70) return 'warning';
    return 'safe';
  };

  // Format time remaining
  const formatTimeRemaining = (burnRate: number, tokensRemaining: number): string => {
    if (burnRate <= 0) return 'Unknown';
    
    const hoursRemaining = tokensRemaining / burnRate;
    
    if (hoursRemaining < 1) return 'Less than 1 hour';
    if (hoursRemaining < 24) return `${Math.round(hoursRemaining)} hours`;
    
    const daysRemaining = Math.round(hoursRemaining / 24);
    return `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`;
  };

  // Show loading screen
  if (state.loading && !state.stats) {
    return <LoadingScreen />;
  }

  // Show error screen with retry
  if (state.error && !state.stats) {
    return (
      <div className="h-screen w-full gradient-bg flex items-center justify-center p-6">
        <div className="glass-card max-w-md w-full text-center stagger-children">
          <div className="text-6xl mb-6 floating">⚠️</div>
          <h2 className="text-white text-2xl font-bold mb-4 text-shadow">Connection Error</h2>
          <p className="text-white/80 text-base mb-6 leading-relaxed">{state.error}</p>
          <div className="space-y-3">
            <button
              onClick={() => loadUsageStats()}
              className="btn btn-primary w-full hover-lift"
            >
              Try Again
            </button>
            <button
              onClick={refreshData}
              className="btn w-full hover-lift"
            >
              Force Refresh
            </button>
          </div>
          <div className="mt-6 text-white/60 text-sm">
            <p>Tip: Press ⌘R to refresh manually</p>
          </div>
        </div>
      </div>
    );
  }

  if (!state.stats) {
    return (
      <div className="h-screen w-full gradient-bg flex items-center justify-center">
        <div className="glass-card text-center p-8">
          <div className="text-white text-lg">No data available</div>
          <button
            onClick={() => loadUsageStats()}
            className="btn btn-primary mt-4 hover-lift"
          >
            Load Data
          </button>
        </div>
      </div>
    );
  }

  const status = getUsageStatus(state.stats.percentageUsed);
  const timeRemaining = formatTimeRemaining(state.stats.burnRate, state.stats.tokensRemaining);

  return (
    <ErrorBoundary>
      <div className={`h-screen w-full gradient-bg relative overflow-hidden ${state.preferences.animationsEnabled ? 'gpu-accelerated' : ''}`}>
        
        {/* Background Effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="floating absolute top-10 left-10 w-2 h-2 bg-white/20 rounded-full"></div>
          <div className="floating-delayed absolute top-32 right-16 w-1 h-1 bg-white/30 rounded-full"></div>
          <div className="floating absolute bottom-20 left-20 w-1.5 h-1.5 bg-white/25 rounded-full"></div>
        </div>

        {/* Sidebar */}
        <Sidebar
          currentView={state.currentView}
          expanded={state.sidebarExpanded}
          onNavigate={navigateTo}
          onToggle={toggleSidebar}
          stats={state.stats}
          status={status}
        />

        {/* Main Content Area */}
        <div className={`transition-all duration-300 ${state.sidebarExpanded ? 'ml-64' : 'ml-16'} h-full flex flex-col`}>
          
          {/* Header */}
          <header className="glass-card m-4 mb-2 p-4 flex items-center justify-between stagger-children">
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleSidebar}
                className="btn p-2 hover-scale focusable"
                title="Toggle Sidebar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
              <div>
                <h1 className="text-white text-xl font-bold text-shadow">
                  Claude Code Monitor
                </h1>
                <p className="text-white/70 text-sm">
                  Real-time usage tracking and analytics
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Status Indicator */}
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full backdrop-blur border ${
                status === 'critical' ? 'border-red-400/50 bg-red-500/20' :
                status === 'warning' ? 'border-yellow-400/50 bg-yellow-500/20' :
                'border-green-400/50 bg-green-500/20'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  status === 'critical' ? 'bg-red-400' :
                  status === 'warning' ? 'bg-yellow-400' :
                  'bg-green-400'
                } animate-pulse`}></div>
                <span className="text-white text-xs font-medium">
                  {Math.round(state.stats.percentageUsed)}% Used
                </span>
              </div>

              {/* Auto-refresh indicator */}
              {state.preferences.autoRefresh && (
                <div className="flex items-center space-x-1 text-white/60 text-xs">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
                  <span>Auto</span>
                </div>
              )}

              {/* Refresh Button */}
              <button
                onClick={refreshData}
                className="btn p-2 hover-scale focusable"
                title="Refresh Data (⌘R)"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </header>

          {/* Content Area */}
          <main className="flex-1 p-4 pt-2 overflow-y-auto">
            {state.currentView === 'dashboard' && (
              <Dashboard
                stats={state.stats}
                status={status}
                timeRemaining={timeRemaining}
                onRefresh={refreshData}
                preferences={state.preferences}
              />
            )}
            
            {state.currentView === 'analytics' && (
              <div className="glass-card p-8 text-center">
                <h2 className="text-white text-2xl font-bold mb-4">Analytics Dashboard</h2>
                <p className="text-white/70">Advanced analytics coming soon...</p>
              </div>
            )}
            
            {state.currentView === 'models' && (
              <div className="glass-card p-8 text-center">
                <h2 className="text-white text-2xl font-bold mb-4">Model Usage</h2>
                <p className="text-white/70">Detailed model breakdown coming soon...</p>
              </div>
            )}
            
            {state.currentView === 'settings' && (
              <SettingsPanel
                preferences={state.preferences}
                onUpdatePreferences={updatePreferences}
                stats={state.stats}
              />
            )}
            
            {state.currentView === 'about' && (
              <div className="glass-card p-8 text-center stagger-children">
                <div className="text-6xl mb-6 floating">🤖</div>
                <h2 className="text-white text-3xl font-bold mb-4 text-gradient">
                  Claude Code Monitor
                </h2>
                <p className="text-white/80 text-lg mb-6">
                  A beautiful, modern interface for monitoring Claude Code usage
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm text-white/70 max-w-md mx-auto">
                  <div>Version: 1.0.0</div>
                  <div>Build: {new Date().toLocaleDateString()}</div>
                  <div>Electron: Latest</div>
                  <div>React: 19.x</div>
                </div>
                <div className="mt-8">
                  <button className="btn btn-primary hover-lift">
                    Check for Updates
                  </button>
                </div>
              </div>
            )}
          </main>

          {/* Footer */}
          <footer className="glass-card m-4 mt-2 p-3 flex items-center justify-between text-sm text-white/60">
            <div className="flex items-center space-x-4">
              <span>Last updated: {new Date().toLocaleTimeString()}</span>
              {state.error && (
                <span className="text-red-400 flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>Connection Issue</span>
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <span>⌘R Refresh</span>
              <span>⌘, Settings</span>
              <span>ESC Close</span>
            </div>
          </footer>
        </div>

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