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
  const [viewMode, setViewMode] = useState<'overview' | 'detailed'>('overview');
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
      case 'critical': return 'from-red-500 to-red-600';
      case 'warning': return 'from-yellow-500 to-yellow-600';
      default: return 'from-green-500 to-green-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'critical': return '🚨';
      case 'warning': return '⚠️';
      default: return '✅';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 3,
      maximumFractionDigits: 3
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  return (
    <div className={`space-y-8 ${preferences.animationsEnabled ? 'stagger-children' : ''}`} key={animationKey}>
      
      {/* Hero Section - Main Usage Overview */}
      <div className="glass-card p-8 hover-lift">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Usage Overview</h2>
            <p className="text-neutral-400">Monitor your Claude API consumption in real-time</p>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setViewMode(viewMode === 'overview' ? 'detailed' : 'overview')}
              className="btn btn-ghost hover-scale"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              {viewMode === 'overview' ? 'Detailed View' : 'Overview'}
            </button>
            
            <button
              onClick={onRefresh}
              className="btn btn-primary hover-scale"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* Main Progress Display */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="flex items-center justify-center">
            <ProgressRing
              percentage={stats.percentageUsed}
              status={status}
              size={200}
              strokeWidth={12}
              showAnimation={preferences.animationsEnabled}
            />
          </div>
          
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-4xl">{getStatusIcon(status)}</span>
                <div>
                  <h3 className="text-4xl font-bold text-white">
                    {Math.round(stats.percentageUsed)}%
                  </h3>
                  <p className="text-xl text-neutral-300">of {stats.currentPlan} plan used</p>
                </div>
              </div>
            </div>
            
            <div className={`glass p-6 rounded-2xl bg-gradient-to-r ${getStatusColor(status)} bg-opacity-10`}>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-white">{formatNumber(stats.tokensUsed)}</div>
                  <div className="text-sm text-neutral-300">Tokens Used</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{formatNumber(stats.tokensRemaining)}</div>
                  <div className="text-sm text-neutral-300">Remaining</div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-white/20">
                <div className="text-center">
                  <div className="text-lg font-semibold text-white">{timeRemaining}</div>
                  <div className="text-sm text-neutral-300">at current burn rate</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Today's Cost */}
        <div className="glass-card p-6 hover-lift glass-interactive" onClick={() => handleMetricClick('cost')}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">{formatCurrency(stats.today.totalCost)}</div>
              <div className="text-sm text-neutral-400">Today's Cost</div>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-400">Current session</span>
            <span className="text-green-400">{stats.today.totalTokens.toLocaleString()} tokens</span>
          </div>
        </div>

        {/* Burn Rate */}
        <div className="glass-card p-6 hover-lift glass-interactive" onClick={() => handleMetricClick('burnrate')}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
              </svg>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">{formatNumber(stats.burnRate)}</div>
              <div className="text-sm text-neutral-400">Tokens/Hour</div>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-400">Burn rate</span>
            <span className={`${stats.burnRate > 500 ? 'text-orange-400' : 'text-blue-400'}`}>
              {stats.burnRate > 500 ? 'High' : 'Normal'}
            </span>
          </div>
        </div>

        {/* Current Plan */}
        <div className="glass-card p-6 hover-lift glass-interactive" onClick={() => handleMetricClick('plan')}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">{stats.currentPlan}</div>
              <div className="text-sm text-neutral-400">Current Plan</div>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-400">Token limit</span>
            <span className="text-blue-400">{formatNumber(stats.tokenLimit)}</span>
          </div>
        </div>

        {/* This Week */}
        <div className="glass-card p-6 hover-lift glass-interactive" onClick={() => handleMetricClick('week')}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">{formatCurrency(stats.thisWeek.reduce((sum, day) => sum + day.totalCost, 0))}</div>
              <div className="text-sm text-neutral-400">This Week</div>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-400">7-day total</span>
            <span className="text-cyan-400">{stats.thisWeek.reduce((sum, day) => sum + day.totalTokens, 0).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Expanded Metric Details */}
      {selectedMetric === 'burnrate' && (
        <BurnRateIndicator
          burnRate={stats.burnRate}
          tokensRemaining={stats.tokensRemaining}
          timeRemaining={timeRemaining}
          onClose={() => setSelectedMetric(null)}
        />
      )}

      {/* Charts Section */}
      {viewMode === 'detailed' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          
          {/* Usage Trends Chart */}
          <div className="glass-card p-6 hover-lift">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Usage Trends</h3>
                <p className="text-neutral-400 text-sm">Token consumption over time</p>
              </div>
              
              <div className="flex gap-2">
                <button className="btn btn-ghost text-xs px-3 py-1">7D</button>
                <button className="btn btn-primary text-xs px-3 py-1">30D</button>
              </div>
            </div>
            
            <UsageChart
              data={stats.thisWeek}
              animationEnabled={preferences.animationsEnabled}
              height={300}
            />
          </div>

          {/* Model Breakdown */}
          <div className="glass-card p-6 hover-lift">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Model Usage</h3>
                <p className="text-neutral-400 text-sm">Distribution by model type</p>
              </div>
              
              <button className="btn btn-ghost text-xs px-3 py-1">
                View All
              </button>
            </div>
            
            <ModelBreakdown
              models={stats.today.models}
              animationEnabled={preferences.animationsEnabled}
            />
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="glass-card p-6">
        <h3 className="text-xl font-bold text-white mb-4">Quick Actions</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="btn btn-ghost p-4 text-left hover-lift">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <div className="font-medium text-white">View Analytics</div>
                <div className="text-sm text-neutral-400">Detailed usage insights</div>
              </div>
            </div>
          </button>
          
          <button className="btn btn-ghost p-4 text-left hover-lift">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 0v1m-2 0V6a2 2 0 00-2 0v1m2 0V6a2 2 0 00-2 0v1m2 0V6a2 2 0 112 0v1m-2 0V6a2 2 0 00-2 0v1" />
                </svg>
              </div>
              <div>
                <div className="font-medium text-white">Export Data</div>
                <div className="text-sm text-neutral-400">Download usage reports</div>
              </div>
            </div>
          </button>
          
          <button className="btn btn-ghost p-4 text-left hover-lift">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-orange-500 to-red-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <div className="font-medium text-white">Settings</div>
                <div className="text-sm text-neutral-400">Customize preferences</div>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};