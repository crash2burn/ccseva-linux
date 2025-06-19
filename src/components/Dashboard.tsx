import React, { useState, useEffect } from 'react';
import { UsageStats } from '../types/usage';
import { MetricCard } from './MetricCard';
import { ProgressRing } from './ProgressRing';
import { UsageChart } from './UsageChart';
import { ModelBreakdown } from './ModelBreakdown';
import { BurnRateIndicator } from './BurnRateIndicator';
import { QuickStats } from './QuickStats';

interface DashboardProps {
  stats: UsageStats;
  status: 'safe' | 'warning' | 'critical';
  timeRemaining: string;
  onRefresh: () => void;
  preferences: {
    autoRefresh: boolean;
    refreshInterval: number;
    theme: 'auto' | 'light' | 'dark';
    notifications: boolean;
    animationsEnabled: boolean;
  };
}

export const Dashboard: React.FC<DashboardProps> = ({
  stats,
  status,
  timeRemaining,
  onRefresh,
  preferences
}) => {
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'detailed'>('grid');
  const [animationKey, setAnimationKey] = useState(0);

  // Trigger animations when stats change
  useEffect(() => {
    if (preferences.animationsEnabled) {
      setAnimationKey(prev => prev + 1);
    }
  }, [stats, preferences.animationsEnabled]);

  const handleMetricClick = (metricId: string) => {
    setSelectedMetric(selectedMetric === metricId ? null : metricId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      default: return 'text-green-400';
    }
  };

  const getStatusGradient = (status: string) => {
    switch (status) {
      case 'critical': return 'from-red-500/20 to-red-600/20';
      case 'warning': return 'from-yellow-500/20 to-yellow-600/20';
      default: return 'from-green-500/20 to-green-600/20';
    }
  };

  return (
    <div className={`space-y-6 ${preferences.animationsEnabled ? 'stagger-children' : ''}`} key={animationKey}>
      
      {/* Top Status Bar */}
      <div className="glass-card p-6 hover-lift">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white text-2xl font-bold text-shadow">Usage Overview</h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'detailed' : 'grid')}
              className="btn btn-primary hover-scale"
            >
              {viewMode === 'grid' ? '📊 Detailed' : '🔲 Grid'}
            </button>
            <button
              onClick={onRefresh}
              className="btn hover-scale"
              title="Refresh Data"
            >
              🔄
            </button>
          </div>
        </div>

        {/* Main Progress Ring */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <ProgressRing
              percentage={stats.percentageUsed}
              status={status}
              size={120}
              strokeWidth={8}
              showAnimation={preferences.animationsEnabled}
            />
            
            <div className="space-y-3">
              <div>
                <h3 className="text-white text-3xl font-bold">
                  {Math.round(stats.percentageUsed)}%
                </h3>
                <p className="text-white/70 text-lg">of {stats.currentPlan} plan used</p>
              </div>
              
              <div className={`px-4 py-2 rounded-full backdrop-blur border bg-gradient-to-r ${getStatusGradient(status)} border-white/20`}>
                <span className={`text-sm font-medium ${getStatusColor(status)}`}>
                  {stats.tokensUsed.toLocaleString()} / {stats.tokenLimit.toLocaleString()} tokens
                </span>
              </div>
            </div>
          </div>

          <QuickStats stats={stats} timeRemaining={timeRemaining} />
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1'} gap-6`}>
        
        <MetricCard
          title="Tokens Used"
          value={stats.tokensUsed.toLocaleString()}
          subtitle={`${stats.tokensRemaining.toLocaleString()} remaining`}
          icon="🔢"
          trend={stats.tokensUsed > 0 ? 'up' : 'stable'}
          percentage={stats.percentageUsed}
          onClick={() => handleMetricClick('tokens')}
          selected={selectedMetric === 'tokens'}
          status={status}
          detailed={viewMode === 'detailed'}
        />

        <MetricCard
          title="Today's Cost"
          value={`$${stats.today.totalCost.toFixed(3)}`}
          subtitle="Current session"
          icon="💰"
          trend={stats.today.totalCost > 0 ? 'up' : 'stable'}
          percentage={(stats.today.totalCost / 10) * 100} // Assuming $10 daily budget
          onClick={() => handleMetricClick('cost')}
          selected={selectedMetric === 'cost'}
          status="safe"
          detailed={viewMode === 'detailed'}
        />

        <MetricCard
          title="Burn Rate"
          value={`${stats.burnRate}/hr`}
          subtitle={timeRemaining}
          icon="🔥"
          trend={stats.burnRate > 100 ? 'up' : stats.burnRate > 0 ? 'stable' : 'down'}
          percentage={Math.min((stats.burnRate / 1000) * 100, 100)}
          onClick={() => handleMetricClick('burnrate')}
          selected={selectedMetric === 'burnrate'}
          status={stats.burnRate > 500 ? 'warning' : 'safe'}
          detailed={viewMode === 'detailed'}
        />

        <MetricCard
          title="Current Plan"
          value={stats.currentPlan}
          subtitle={`${stats.tokenLimit.toLocaleString()} limit`}
          icon="📊"
          trend="stable"
          percentage={100}
          onClick={() => handleMetricClick('plan')}
          selected={selectedMetric === 'plan'}
          status="safe"
          detailed={viewMode === 'detailed'}
        />
      </div>

      {/* Burn Rate Indicator */}
      {selectedMetric === 'burnrate' && (
        <BurnRateIndicator
          burnRate={stats.burnRate}
          tokensRemaining={stats.tokensRemaining}
          timeRemaining={timeRemaining}
          onClose={() => setSelectedMetric(null)}
        />
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Usage Chart */}
        <div className="chart-container hover-lift">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white text-xl font-bold text-shadow">Usage Trends</h3>
            <div className="flex space-x-2">
              <button className="btn text-xs px-3 py-1">7D</button>
              <button className="btn text-xs px-3 py-1 btn-primary">30D</button>
            </div>
          </div>
          
          <UsageChart
            data={stats.thisWeek}
            animationEnabled={preferences.animationsEnabled}
            height={200}
          />
        </div>

        {/* Model Breakdown */}
        <div className="chart-container hover-lift">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white text-xl font-bold text-shadow">Model Usage</h3>
            <div className="text-white/60 text-sm">
              Today: {stats.today.totalTokens.toLocaleString()} tokens
            </div>
          </div>
          
          <ModelBreakdown
            models={stats.today.models}
            animationEnabled={preferences.animationsEnabled}
          />
        </div>
      </div>

      {/* Detailed Stats Section */}
      {viewMode === 'detailed' && (
        <div className="glass-card p-6 hover-lift">
          <h3 className="text-white text-xl font-bold mb-6 text-shadow">Detailed Statistics</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* This Week Summary */}
            <div className="space-y-4">
              <h4 className="text-white/80 font-semibold">This Week</h4>
              <div className="space-y-2">
                {stats.thisWeek.slice(-7).map((day, index) => (
                  <div key={day.date} className="flex justify-between items-center p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                    <span className="text-white/70 text-sm">
                      {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    <div className="text-right">
                      <div className="text-white text-sm font-medium">
                        {day.totalTokens.toLocaleString()}
                      </div>
                      <div className="text-white/60 text-xs">
                        ${day.totalCost.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Model Performance */}
            <div className="space-y-4">
              <h4 className="text-white/80 font-semibold">Model Performance</h4>
              <div className="space-y-2">
                {Object.entries(stats.today.models).map(([model, data]) => (
                  <div key={model} className="p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white text-sm font-medium">{model}</span>
                      <span className="text-white/60 text-xs">${data.cost.toFixed(3)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-white/70">
                      <span>{data.tokens.toLocaleString()} tokens</span>
                      <span>{((data.tokens / stats.today.totalTokens) * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Usage Insights */}
            <div className="space-y-4">
              <h4 className="text-white/80 font-semibold">Insights</h4>
              <div className="space-y-3">
                
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-blue-400">💡</span>
                    <span className="text-white text-sm font-medium">Usage Pattern</span>
                  </div>
                  <p className="text-white/70 text-xs">
                    {stats.burnRate > 100 ? 'High activity period' : 'Normal usage pattern'}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-green-400">⚡</span>
                    <span className="text-white text-sm font-medium">Efficiency</span>
                  </div>
                  <p className="text-white/70 text-xs">
                    Average cost per token: ${(stats.today.totalCost / stats.today.totalTokens || 0).toFixed(6)}
                  </p>
                </div>

                {stats.predictedDepleted && (
                  <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-yellow-400">⏰</span>
                      <span className="text-white text-sm font-medium">Projection</span>
                    </div>
                    <p className="text-white/70 text-xs">
                      At current rate: {timeRemaining} remaining
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="glass-card p-4 hover-lift">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-white/70 text-sm">Quick Actions:</span>
            <button className="btn text-xs px-3 py-1 hover-scale">Export Data</button>
            <button className="btn text-xs px-3 py-1 hover-scale">Set Alert</button>
            <button className="btn text-xs px-3 py-1 hover-scale">View History</button>
          </div>
          
          <div className="flex items-center space-x-2 text-white/60 text-xs">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>Live updates active</span>
          </div>
        </div>
      </div>
    </div>
  );
};