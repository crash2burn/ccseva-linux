import React, { useState, useEffect } from 'react';
import { UsageStats } from '../types/usage';
import { ProgressRing } from './ProgressRing';
import { UsageChart } from './UsageChart';
import { ModelBreakdown } from './ModelBreakdown';
import { BurnRateIndicator } from './BurnRateIndicator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { formatNumber, formatCurrency, getStatusColor, getStatusIcon } from '../lib/utils';
import { RefreshCw, DollarSign, Flame, Shield, TrendingUp, Eye, Download, Settings } from 'lucide-react';

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

  const getProgressVariant = (status: string): "default" | "success" | "warning" | "destructive" => {
    switch (status) {
      case 'critical': return 'destructive';
      case 'warning': return 'warning';
      default: return 'success';
    }
  };

  const getBadgeVariant = (status: string): "default" | "success" | "warning" | "destructive" => {
    switch (status) {
      case 'critical': return 'destructive';
      case 'warning': return 'warning';
      default: return 'success';
    }
  };

  return (
    <div className={`space-y-8 ${preferences.animationsEnabled ? 'stagger-children' : ''}`} key={animationKey}>
      
      {/* Hero Section - Main Usage Overview */}
      <Card variant="glass" className="p-8">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl font-bold text-gradient mb-2">Usage Overview</CardTitle>
              <CardDescription className="text-lg">
                Monitor your Claude API consumption in real-time
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="glass" className="px-3 py-1">
                <div className={`w-2 h-2 rounded-full mr-2 animate-pulse ${
                  status === 'critical' ? 'bg-red-500' :
                  status === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                }`} />
                Live
              </Badge>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode(viewMode === 'overview' ? 'detailed' : 'overview')}
              >
                <Eye className="w-4 h-4 mr-2" />
                {viewMode === 'overview' ? 'Detailed' : 'Overview'}
              </Button>
              
              <Button
                variant="primary"
                size="sm"
                onClick={onRefresh}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Main Progress Display */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="flex items-center justify-center relative">
            <ProgressRing
              percentage={stats.percentageUsed}
              status={status}
              size={240}
              strokeWidth={16}
              showAnimation={preferences.animationsEnabled}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-5xl font-bold text-white mb-1">
                  {Math.round(stats.percentageUsed)}%
                </div>
                <div className="text-sm text-neutral-400 uppercase tracking-wider">
                  Used
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${getStatusColor(status)} flex items-center justify-center text-3xl shadow-lg`}>
                  {getStatusIcon(status)}
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-white mb-1">
                    {stats.currentPlan} Plan
                  </h3>
                  <p className="text-neutral-400">
                    {formatNumber(stats.tokenLimit)} tokens available
                  </p>
                </div>
              </div>
            </div>
            
            <div className={`glass p-6 rounded-2xl bg-gradient-to-r ${getStatusColor(status)} bg-opacity-10 border border-white/10`}>
              <div className="grid grid-cols-2 gap-6 text-center mb-6">
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-white">{formatNumber(stats.tokensUsed)}</div>
                  <div className="text-sm text-neutral-300 uppercase tracking-wide">Tokens Used</div>
                  <Progress 
                    value={stats.percentageUsed} 
                    variant={getProgressVariant(status)} 
                    className="h-2 mt-2"
                  />
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-white">{formatNumber(stats.tokensRemaining)}</div>
                  <div className="text-sm text-neutral-300 uppercase tracking-wide">Remaining</div>
                  <Progress 
                    value={100 - stats.percentageUsed} 
                    variant="default" 
                    className="h-2 mt-2"
                  />
                </div>
              </div>
              
              <div className="pt-4 border-t border-white/20">
                <div className="text-center">
                  <div className="text-xl font-bold text-white mb-1">{timeRemaining}</div>
                  <div className="text-sm text-neutral-300">at current burn rate of {formatNumber(stats.burnRate)}/hr</div>
                </div>
              </div>
            </div>

            {/* Real-time Status Indicator */}
            <Badge variant="glass" className="justify-center gap-3 p-4 w-full">
              <div className={`w-3 h-3 rounded-full animate-pulse ${
                status === 'critical' ? 'bg-red-500' :
                status === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
              }`} />
              <span className="text-sm">
                Live monitoring • Updated every 30s
              </span>
            </Badge>
          </div>
        </div>
      </Card>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Today's Cost */}
        <Card variant="interactive" onClick={() => handleMetricClick('cost')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">{formatCurrency(stats.today.totalCost)}</div>
                <div className="text-sm text-neutral-400">Today's Cost</div>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-400">Current session</span>
              <Badge variant="success" className="text-xs">
                {stats.today.totalTokens.toLocaleString()} tokens
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Burn Rate */}
        <Card variant="interactive" onClick={() => handleMetricClick('burnrate')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 flex items-center justify-center">
                <Flame className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">{formatNumber(stats.burnRate)}</div>
                <div className="text-sm text-neutral-400">Tokens/Hour</div>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-400">Burn rate</span>
              <Badge variant={stats.burnRate > 500 ? 'warning' : 'glass'} className="text-xs">
                {stats.burnRate > 500 ? 'High' : 'Normal'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Current Plan */}
        <Card variant="interactive" onClick={() => handleMetricClick('plan')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">{stats.currentPlan}</div>
                <div className="text-sm text-neutral-400">Current Plan</div>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-400">Token limit</span>
              <Badge variant="glass" className="text-xs">
                {formatNumber(stats.tokenLimit)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* This Week */}
        <Card variant="interactive" onClick={() => handleMetricClick('week')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">{formatCurrency(stats.thisWeek.reduce((sum, day) => sum + day.totalCost, 0))}</div>
                <div className="text-sm text-neutral-400">This Week</div>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-400">7-day total</span>
              <Badge variant="glass" className="text-xs">
                {stats.thisWeek.reduce((sum, day) => sum + day.totalTokens, 0).toLocaleString()}
              </Badge>
            </div>
          </CardContent>
        </Card>
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
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="text-xl">Quick Actions</CardTitle>
          <CardDescription>Access key features and settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="ghost" className="p-6 h-auto text-left justify-start group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Eye className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-medium text-white">View Analytics</div>
                  <div className="text-sm text-neutral-400">Detailed usage insights</div>
                </div>
              </div>
            </Button>
            
            <Button variant="ghost" className="p-6 h-auto text-left justify-start group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Download className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-medium text-white">Export Data</div>
                  <div className="text-sm text-neutral-400">Download usage reports</div>
                </div>
              </div>
            </Button>
            
            <Button variant="ghost" className="p-6 h-auto text-left justify-start group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-orange-500 to-red-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-medium text-white">Settings</div>
                  <div className="text-sm text-neutral-400">Customize preferences</div>
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};