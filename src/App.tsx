import React, { useState, useEffect } from 'react';
import { UsageStats } from './types/usage';
import { UsageCard } from './components/UsageCard';
import { ProgressBar } from './components/ProgressBar';
import { TokenUsageChart } from './components/TokenUsageChart';
import { ModelBreakdown } from './components/ModelBreakdown';

const App: React.FC = () => {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUsageStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await window.electronAPI.getUsageStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load usage stats');
      console.error('Error loading usage stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    try {
      setError(null);
      const data = await window.electronAPI.refreshData();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh data');
      console.error('Error refreshing data:', err);
    }
  };

  useEffect(() => {
    loadUsageStats();

    const handleUsageUpdate = () => {
      loadUsageStats();
    };

    window.electronAPI.onUsageUpdated(handleUsageUpdate);

    return () => {
      window.electronAPI.removeUsageUpdatedListener(handleUsageUpdate);
    };
  }, []);

  const getUsageStatus = (percentage: number): 'safe' | 'warning' | 'critical' => {
    if (percentage >= 90) return 'critical';
    if (percentage >= 70) return 'warning';
    return 'safe';
  };

  const formatTimeRemaining = (burnRate: number, tokensRemaining: number): string => {
    if (burnRate <= 0) return 'Unknown';
    
    const hoursRemaining = tokensRemaining / burnRate;
    
    if (hoursRemaining < 1) return 'Less than 1 hour';
    if (hoursRemaining < 24) return `${Math.round(hoursRemaining)} hours`;
    
    const daysRemaining = Math.round(hoursRemaining / 24);
    return `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`;
  };

  if (loading) {
    return (
      <div className="h-screen w-full gradient-bg flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <div>Loading usage data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-full gradient-bg flex items-center justify-center p-4">
        <div className="gradient-card rounded-lg p-6 max-w-sm w-full text-center">
          <div className="text-red-400 text-4xl mb-4">⚠️</div>
          <h2 className="text-white text-lg font-bold mb-2">Error Loading Data</h2>
          <p className="text-white/80 text-sm mb-4">{error}</p>
          <button
            onClick={refreshData}
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm transition-colors"
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
        <div className="text-white">No data available</div>
      </div>
    );
  }

  const status = getUsageStatus(stats.percentageUsed);
  const timeRemaining = formatTimeRemaining(stats.burnRate, stats.tokensRemaining);

  return (
    <div className="h-screen w-full gradient-bg overflow-y-auto">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-white text-xl font-bold">Claude Code Monitor</h1>
          <button
            onClick={refreshData}
            className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition-colors"
            title="Refresh Data"
          >
            🔄
          </button>
        </div>

        {/* Main Usage Stats */}
        <div className="grid grid-cols-2 gap-4">
          <UsageCard
            title="Tokens Used"
            value={stats.tokensUsed.toLocaleString()}
            subtitle={`of ${stats.tokenLimit.toLocaleString()}`}
            icon="🔢"
            status={status}
          />
          <UsageCard
            title="Current Plan"
            value={stats.currentPlan}
            subtitle={`${stats.tokensRemaining.toLocaleString()} remaining`}
            icon="📊"
          />
        </div>

        {/* Progress Bar */}
        <div className="gradient-card rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-white/80 text-sm font-medium">Usage Progress</span>
            <span className="text-white text-sm font-bold">
              {Math.round(stats.percentageUsed)}%
            </span>
          </div>
          <ProgressBar percentage={stats.percentageUsed} status={status} showText={false} />
        </div>

        {/* Today's Usage */}
        <div className="grid grid-cols-2 gap-4">
          <UsageCard
            title="Today's Cost"
            value={`$${stats.today.totalCost.toFixed(3)}`}
            icon="💰"
          />
          <UsageCard
            title="Burn Rate"
            value={`${stats.burnRate}/hr`}
            subtitle={timeRemaining}
            icon="🔥"
          />
        </div>

        {/* Model Breakdown */}
        <ModelBreakdown models={stats.today.models} />

        {/* Usage Chart */}
        <TokenUsageChart data={stats.thisWeek} />

        {/* Footer */}
        <div className="text-center text-white/60 text-xs py-2">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export default App;