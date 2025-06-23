import React, { useState } from 'react';
import { UsageStats } from '../types/usage';

interface DashboardProps {
  stats: UsageStats;
  status: 'safe' | 'warning' | 'critical';
  timeRemaining: string;
  onRefresh: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  stats,
  status,
  timeRemaining,
  onRefresh
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    onRefresh();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const getStatusColor = () => {
    switch (status) {
      case 'critical': return 'from-red-600 to-red-700';
      case 'warning': return 'from-orange-500 to-orange-600';
      default: return 'from-green-600 to-emerald-600';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'critical': return '🔴';
      case 'warning': return '🟡';
      default: return '🟢';
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Calculate time progress through reset cycle (like Python script)
  const getTimeProgress = (): number => {
    if (!stats.resetInfo?.timeUntilReset) return 0;
    
    // Assuming a 24-hour cycle for daily resets
    const totalCycleDuration = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const timeElapsed = totalCycleDuration - stats.resetInfo.timeUntilReset;
    
    return Math.max(0, Math.min(100, (timeElapsed / totalCycleDuration) * 100));
  };

  // Format time until reset
  const formatTimeUntilReset = (): string => {
    if (!stats.resetInfo?.timeUntilReset) return 'No reset info';
    
    const milliseconds = stats.resetInfo.timeUntilReset;
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="space-y-4">
      {/* Hero Section */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gradient mb-2 font-primary">
              Usage Dashboard
            </h2>
            <p className="text-neutral-400 text-sm font-primary">
              Real-time monitoring of your Claude API usage
            </p>
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`btn btn-primary flex items-center gap-2 ${
              isRefreshing ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <svg 
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
              />
            </svg>
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Dual Progress Display - Token and Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Token Usage Circle */}
          <div className="flex items-center justify-center">
            <div className="relative">
              <svg width="180" height="180" className="transform -rotate-90">
                {/* Background circle */}
                <circle
                  cx="90"
                  cy="90"
                  r="75"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.1)"
                  strokeWidth="8"
                />
                {/* Progress circle */}
                <circle
                  cx="90"
                  cy="90"
                  r="75"
                  fill="none"
                  stroke={`url(#gradient-token-${status})`}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 75}`}
                  strokeDashoffset={`${2 * Math.PI * 75 * (1 - stats.percentageUsed / 100)}`}
                  className="transition-all duration-1000 ease-out"
                />
                <defs>
                  <linearGradient id={`gradient-token-${status}`} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={status === 'critical' ? '#ef4444' : status === 'warning' ? '#f59e0b' : '#10b981'} />
                    <stop offset="100%" stopColor={status === 'critical' ? '#dc2626' : status === 'warning' ? '#d97706' : '#059669'} />
                  </linearGradient>
                </defs>
              </svg>
              
              {/* Center content */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl font-bold text-neutral-100 mb-1 font-primary">
                    {Math.round(stats.percentageUsed)}%
                  </div>
                  <div className="text-sm text-neutral-400 uppercase tracking-wide font-primary">
                    Tokens
                  </div>
                  <div className="text-xs text-neutral-500 mt-1 font-primary">
                    {getStatusIcon()} {status}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Time Progress Circle */}
          <div className="flex items-center justify-center">
            <div className="relative">
              <svg width="180" height="180" className="transform -rotate-90">
                {/* Background circle */}
                <circle
                  cx="90"
                  cy="90"
                  r="75"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.1)"
                  strokeWidth="8"
                />
                {/* Time progress circle */}
                <circle
                  cx="90"
                  cy="90"
                  r="75"
                  fill="none"
                  stroke="url(#gradient-time)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 75}`}
                  strokeDashoffset={`${2 * Math.PI * 75 * (1 - getTimeProgress() / 100)}`}
                  className="transition-all duration-1000 ease-out"
                />
                <defs>
                  <linearGradient id="gradient-time" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgba(204, 120, 92, 1)" />
                    <stop offset="100%" stopColor="rgba(255, 107, 53, 1)" />
                  </linearGradient>
                </defs>
              </svg>
              
              {/* Center content */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl font-bold text-neutral-100 mb-1 font-primary">
                    {Math.round(getTimeProgress())}%
                  </div>
                  <div className="text-sm text-neutral-400 uppercase tracking-wide font-primary">
                    Time
                  </div>
                  <div className="text-xs text-neutral-500 mt-1 font-primary">
                    {formatTimeUntilReset()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics Row */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-2">
            <div className="text-2xl font-bold text-neutral-100 font-primary">
              {formatNumber(stats.tokensUsed)}
            </div>
            <div className="text-sm text-neutral-400 font-primary">Tokens Used</div>
            <div className="text-xs text-neutral-500 font-primary">
              of {formatNumber(stats.tokenLimit)}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="text-2xl font-bold text-neutral-100 font-primary">
              {formatCurrency(stats.today.totalCost)}
            </div>
            <div className="text-sm text-neutral-warm-400 font-primary">Cost Today</div>
            <div className="text-xs text-neutral-500 font-primary">
              {stats.today.totalTokens.toLocaleString()} tokens
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="text-2xl font-bold text-neutral-100 font-primary">
              {formatNumber(stats.tokensRemaining)}
            </div>
            <div className="text-sm text-neutral-warm-400 font-primary">Remaining</div>
            <div className="text-xs text-neutral-500 font-primary">
              {timeRemaining}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Current Plan */}
        <div className="glass-card p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${getStatusColor()} flex items-center justify-center shadow-lg`}>
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-neutral-100 font-primary">
                {stats.currentPlan}
              </h3>
              <p className="text-sm text-neutral-400 font-primary">Current Plan</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-400 font-primary">Daily Limit</span>
              <span className="text-neutral-100 font-medium font-primary">{formatNumber(stats.tokenLimit)}</span>
            </div>
            <div className="w-full bg-neutral-800 rounded-full h-2">
              <div 
                className={`h-2 rounded-full bg-gradient-to-r ${getStatusColor()} transition-all duration-1000`}
                style={{ width: `${Math.min(stats.percentageUsed, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Burn Rate */}
        <div className="glass-card p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-neutral-100 font-primary">
                {formatNumber(stats.burnRate)}
              </h3>
              <p className="text-sm text-neutral-400 font-primary">Tokens/Hour</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-400 font-primary">Depletion Time</span>
              <span className="text-neutral-100 font-medium font-primary">{timeRemaining}</span>
            </div>
            <div className={`px-2 py-1 rounded-full text-xs font-medium text-center font-primary ${
              stats.burnRate > 1000 
                ? 'bg-red-600/20 text-red-300' 
                : stats.burnRate > 500 
                  ? 'bg-orange-500/20 text-orange-300'
                  : 'bg-green-600/20 text-green-300'
            }`}>
              {stats.burnRate > 1000 ? 'High Usage' : stats.burnRate > 500 ? 'Moderate Usage' : 'Normal Usage'}
            </div>
          </div>
        </div>

        {/* Today's Usage */}
        <div className="glass-card p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Today</h3>
              <p className="text-sm text-neutral-400">Usage Summary</p>
            </div>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-400">Tokens</span>
              <span className="text-white font-medium">{stats.today.totalTokens.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Cost</span>
              <span className="text-white font-medium">{formatCurrency(stats.today.totalCost)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Models</span>
              <span className="text-white font-medium">{Object.keys(stats.today.models).length}</span>
            </div>
          </div>
        </div>

        {/* This Week */}
        <div className="glass-card p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-green-500 to-teal-500 flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">This Week</h3>
              <p className="text-sm text-neutral-400">7-Day Summary</p>
            </div>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-400">Total Cost</span>
              <span className="text-white font-medium">
                {formatCurrency(stats.thisWeek.reduce((sum, day) => sum + day.totalCost, 0))}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Total Tokens</span>
              <span className="text-white font-medium">
                {stats.thisWeek.reduce((sum, day) => sum + day.totalTokens, 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Avg Daily</span>
              <span className="text-white font-medium">
                {formatCurrency(stats.thisWeek.reduce((sum, day) => sum + day.totalCost, 0) / 7)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Model Breakdown */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white">Model Usage</h3>
            <p className="text-sm text-neutral-400">Today's distribution by model</p>
          </div>
        </div>
        
        <div className="space-y-3">
          {stats.today.models && Object.keys(stats.today.models).length > 0 ? (
            Object.entries(stats.today.models).map(([modelName, modelData], index) => {
              const percentage = stats.today.totalTokens > 0 
                ? (modelData.tokens / stats.today.totalTokens) * 100 
                : 0;
              
              return (
                <div key={modelName} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    index === 0 ? 'bg-purple-500' : 
                    index === 1 ? 'bg-blue-500' : 
                    'bg-green-500'
                  }`} />
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-white">{modelName}</span>
                      <span className="text-sm text-neutral-400">
                        {formatNumber(modelData.tokens)} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    
                    <div className="w-full bg-neutral-800 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full transition-all duration-1000 ${
                          index === 0 ? 'bg-purple-500' : 
                          index === 1 ? 'bg-blue-500' : 
                          'bg-green-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-neutral-400">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm">No model usage data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      {/* <div className="glass-card p-4">
        <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
        
        <div className="grid grid-cols-2 gap-3">
          <button className="btn btn-ghost flex items-center justify-center gap-2 py-3">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            View Analytics
          </button>
          
          <button className="btn btn-ghost flex items-center justify-center gap-2 py-3">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export Data
          </button>
        </div>
      </div> */}
    </div>
  );
};