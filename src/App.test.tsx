import React, { useState, useEffect } from 'react';
import { UsageStats } from './types/usage';

const SimpleApp: React.FC = () => {
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

  useEffect(() => {
    loadUsageStats();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-full gradient-bg flex items-center justify-center">
        <div className="text-white text-center">
          <div className="text-4xl mb-4">⏳</div>
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-full gradient-bg flex items-center justify-center">
        <div className="text-white text-center">
          <div className="text-4xl mb-4">❌</div>
          <div>Error: {error}</div>
          <button 
            onClick={loadUsageStats}
            className="mt-4 px-4 py-2 bg-white/20 rounded text-white"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="h-screen w-full gradient-bg flex items-center justify-center">
        <div className="text-white text-center">
          <div className="text-4xl mb-4">📊</div>
          <div>No data available</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full gradient-bg p-8">
      <div className="glass-card p-6 max-w-2xl mx-auto">
        <h1 className="text-white text-2xl font-bold mb-6">Claude Code Monitor - Test</h1>
        
        <div className="space-y-4 text-white">
          <div>
            <strong>Plan:</strong> {stats.currentPlan}
          </div>
          <div>
            <strong>Usage:</strong> {Math.round(stats.percentageUsed)}% 
            ({stats.tokensUsed.toLocaleString()} / {stats.tokenLimit.toLocaleString()})
          </div>
          <div>
            <strong>Today's Cost:</strong> ${stats.today.totalCost.toFixed(3)}
          </div>
          <div>
            <strong>Burn Rate:</strong> {stats.burnRate}/hr
          </div>
          
          <div className="mt-6">
            <div className="w-full bg-white/20 rounded-full h-4">
              <div
                className="h-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-600"
                style={{ width: `${Math.min(stats.percentageUsed, 100)}%` }}
              />
            </div>
          </div>
          
          <div className="mt-4">
            <button 
              onClick={loadUsageStats}
              className="px-4 py-2 bg-blue-500 rounded text-white hover:bg-blue-600"
            >
              Refresh Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleApp;