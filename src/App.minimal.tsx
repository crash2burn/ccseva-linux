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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center border border-white/20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4 mx-auto"></div>
          <div className="text-white text-lg">Loading Claude Code Monitor...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center border border-red-500/50">
          <div className="text-red-400 text-4xl mb-4">❌</div>
          <div className="text-white text-xl mb-4">Error</div>
          <div className="text-red-300 mb-6">{error}</div>
          <button 
            onClick={loadUsageStats}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center border border-white/20">
          <div className="text-white text-xl mb-4">📊</div>
          <div className="text-white">No data available</div>
        </div>
      </div>
    );
  }

  const status = getUsageStatus(stats.percentageUsed);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Claude Code Monitor</h1>
            <p className="text-purple-300">Track your API usage with style</p>
          </div>

          {/* Main Stats Card */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 mb-6">
            <div className="text-center mb-6">
              <div className="text-6xl font-bold text-white mb-2">
                {Math.round(stats.percentageUsed)}%
              </div>
              <div className="text-xl text-purple-300">of {stats.currentPlan} plan used</div>
            </div>

            <div className="mb-6">
              <div className="flex justify-between text-sm text-white/70 mb-2">
                <span>Usage Progress</span>
                <span>{stats.tokensUsed.toLocaleString()} / {stats.tokenLimit.toLocaleString()} tokens</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-4">
                <div
                  className={`h-4 rounded-full transition-all duration-1000 ${
                    status === 'critical' ? 'bg-gradient-to-r from-red-500 to-red-600' :
                    status === 'warning' ? 'bg-gradient-to-r from-yellow-500 to-orange-600' :
                    'bg-gradient-to-r from-blue-500 to-purple-600'
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
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-6">
            <h3 className="text-white text-xl font-bold mb-4">Today's Model Usage</h3>
            <div className="space-y-3">
              {Object.entries(stats.today.models).map(([model, data]) => (
                <div key={model} className="flex justify-between items-center">
                  <span className="text-white/80">{model}</span>
                  <div className="text-right">
                    <div className="text-white font-semibold">{data.tokens.toLocaleString()} tokens</div>
                    <div className="text-white/60 text-sm">${data.cost.toFixed(3)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="text-center">
            <button 
              onClick={loadUsageStats}
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              🔄 Refresh Data
            </button>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default App;