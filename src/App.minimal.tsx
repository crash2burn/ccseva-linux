import React, { useState, useEffect } from 'react';
import { UsageStats } from './types/usage';
import { ErrorBoundary } from './components/ErrorBoundary';

const App: React.FC = () => {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUsageStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!window.electronAPI) {
        throw new Error('Electron API not available');
      }
      
      const data = await window.electronAPI.getUsageStats();
      setStats(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load usage stats';
      setError(errorMessage);
      console.error('Error loading usage stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsageStats();
  }, []);

  const getUsageStatus = (percentage: number): 'safe' | 'warning' | 'critical' => {
    if (percentage >= 90) return 'critical';
    if (percentage >= 70) return 'warning';
    return 'safe';
  };

  if (loading) {
    return (
      <div className="h-screen w-full gradient-bg flex items-center justify-center">
        <div className="glass-card p-8 text-center">
          <div className="loading-spinner mb-4"></div>
          <div className="text-white text-lg">Loading Claude Code Monitor...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-full gradient-bg flex items-center justify-center p-6">
        <div className="glass-card max-w-md w-full text-center">
          <div className="text-6xl mb-6">⚠️</div>
          <h2 className="text-white text-2xl font-bold mb-4">Connection Error</h2>
          <p className="text-white/80 text-base mb-6">{error}</p>
          <button
            onClick={loadUsageStats}
            className="btn btn-primary hover-lift"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="h-screen w-full gradient-bg flex items-center justify-center">
        <div className="glass-card text-center p-8">
          <div className="text-white text-lg">No data available</div>
          <button
            onClick={loadUsageStats}
            className="btn btn-primary mt-4 hover-lift"
          >
            Load Data
          </button>
        </div>
      </div>
    );
  }

  const status = getUsageStatus(stats.percentageUsed);

  return (
    <ErrorBoundary>
      <div className="h-screen w-full gradient-bg relative overflow-hidden">
        
        {/* Header */}
        <header className="glass-card m-4 p-4 flex items-center justify-between">
          <div>
            <h1 className="text-white text-xl font-bold">Claude Code Monitor</h1>
            <p className="text-white/70 text-sm">Real-time usage tracking</p>
          </div>
          <button
            onClick={loadUsageStats}
            className="btn hover-scale"
            title="Refresh Data"
          >
            🔄
          </button>
        </header>

        {/* Main Content */}
        <main className="p-4">
          
          {/* Main Stats Card */}
          <div className="glass-card p-6 mb-6 hover-lift">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white text-2xl font-bold">Usage Overview</h2>
              <div className={`px-4 py-2 rounded-full ${
                status === 'critical' ? 'bg-red-500/20 border border-red-400/50' :
                status === 'warning' ? 'bg-yellow-500/20 border border-yellow-400/50' :
                'bg-green-500/20 border border-green-400/50'
              }`}>
                <span className={`text-sm font-medium ${
                  status === 'critical' ? 'text-red-400' :
                  status === 'warning' ? 'text-yellow-400' :
                  'text-green-400'
                }`}>
                  {Math.round(stats.percentageUsed)}% Used
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-white/70 mb-2">
                <span>Usage Progress</span>
                <span>{stats.tokensUsed.toLocaleString()} / {stats.tokenLimit.toLocaleString()} tokens</span>
              </div>
              <div className="progress-container h-4">
                <div
                  className={`progress-bar ${
                    status === 'critical' ? 'progress-critical' :
                    status === 'warning' ? 'progress-warning' :
                    'progress-safe'
                  }`}
                  style={{ width: `${Math.min(stats.percentageUsed, 100)}%` }}
                />
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-white text-2xl font-bold">{stats.currentPlan}</div>
                <div className="text-white/60 text-sm">Current Plan</div>
              </div>
              <div className="text-center">
                <div className="text-white text-2xl font-bold">${stats.today.totalCost.toFixed(3)}</div>
                <div className="text-white/60 text-sm">Today's Cost</div>
              </div>
              <div className="text-center">
                <div className="text-white text-2xl font-bold">{stats.burnRate}/hr</div>
                <div className="text-white/60 text-sm">Burn Rate</div>
              </div>
              <div className="text-center">
                <div className="text-white text-2xl font-bold">{stats.tokensRemaining.toLocaleString()}</div>
                <div className="text-white/60 text-sm">Remaining</div>
              </div>
            </div>
          </div>

          {/* Model Usage */}
          {Object.keys(stats.today.models).length > 0 && (
            <div className="glass-card p-6 hover-lift">
              <h3 className="text-white text-xl font-bold mb-4">Today's Model Usage</h3>
              <div className="space-y-3">
                {Object.entries(stats.today.models).map(([model, data]) => (
                  <div key={model} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div>
                      <div className="text-white font-medium">{model.replace('claude-', '').replace('-20250514', '')}</div>
                      <div className="text-white/60 text-sm">{data.tokens.toLocaleString()} tokens</div>
                    </div>
                    <div className="text-white font-bold">${data.cost.toFixed(3)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="glass-card m-4 mt-2 p-3 flex items-center justify-between text-sm text-white/60">
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
          <span>Press 'R' to refresh</span>
        </footer>
      </div>
    </ErrorBoundary>
  );
};

export default App;