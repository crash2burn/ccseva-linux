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
    <div className={`space-y-3 ${preferences.animationsEnabled ? 'stagger-children' : ''}`} key={animationKey}>
      
      {/* Compact Hero Section */}
      <Card variant="glass" className="p-3">
        <CardHeader className="pb-2 p-0 mb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-gradient mb-1">Usage Overview</CardTitle>
              <CardDescription className="text-xs">
                Real-time API monitoring
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-1">
              <Badge variant="glass" className="px-2 py-0.5 text-xs">
                <div className={`w-1.5 h-1.5 rounded-full mr-1 animate-pulse ${
                  status === 'critical' ? 'bg-red-500' :
                  status === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                }`} />
                Live
              </Badge>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode(viewMode === 'overview' ? 'detailed' : 'overview')}
                className="h-6 px-2 text-xs"
              >
                <Eye className="w-3 h-3 mr-1" />
                {viewMode === 'overview' ? 'Details' : 'Overview'}
              </Button>
              
              <Button
                variant="primary"
                size="sm"
                onClick={onRefresh}
                className="h-6 px-2 text-xs"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Compact Progress Display */}
        <div className="flex items-center gap-4">
          {/* Smaller Progress Ring */}
          <div className="flex items-center justify-center relative">
            <ProgressRing
              percentage={stats.percentageUsed}
              status={status}
              size={120}
              strokeWidth={8}
              showAnimation={preferences.animationsEnabled}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-white mb-0.5">
                  {Math.round(stats.percentageUsed)}%
                </div>
                <div className="text-xs text-neutral-400 uppercase tracking-wider">
                  Used
                </div>
              </div>
            </div>
          </div>
          
          {/* Compact Stats */}
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${getStatusColor(status)} flex items-center justify-center text-sm shadow-lg`}>
                {getStatusIcon(status)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  {stats.currentPlan}
                </h3>
                <p className="text-xs text-neutral-400">
                  {formatNumber(stats.tokenLimit)} limit
                </p>
              </div>
            </div>
            
            <div className={`glass p-3 rounded-xl bg-gradient-to-r ${getStatusColor(status)} bg-opacity-10 border border-white/10`}>
              <div className="grid grid-cols-2 gap-3 text-center mb-3">
                <div className="space-y-1">
                  <div className="text-lg font-bold text-white">{formatNumber(stats.tokensUsed)}</div>
                  <div className="text-xs text-neutral-300 uppercase">Used</div>
                  <Progress 
                    value={stats.percentageUsed} 
                    variant={getProgressVariant(status)} 
                    className="h-1 mt-1"
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-lg font-bold text-white">{formatNumber(stats.tokensRemaining)}</div>
                  <div className="text-xs text-neutral-300 uppercase">Remaining</div>
                  <Progress 
                    value={100 - stats.percentageUsed} 
                    variant="default" 
                    className="h-1 mt-1"
                  />
                </div>
              </div>
              
              <div className="pt-2 border-t border-white/20">
                <div className="text-center">
                  <div className="text-sm font-bold text-white">{timeRemaining}</div>
                  <div className="text-xs text-neutral-300">at {formatNumber(stats.burnRate)}/hr</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Compact Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-2">
        
        {/* Today's Cost */}
        <Card variant="interactive" onClick={() => handleMetricClick('cost')}>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
                <DollarSign className="w-3 h-3 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-white">{formatCurrency(stats.today.totalCost)}</div>
                <div className="text-xs text-neutral-400">Today's Cost</div>
              </div>
            </div>
            <div className="text-xs text-neutral-400">
              {stats.today.totalTokens.toLocaleString()} tokens
            </div>
          </CardContent>
        </Card>

        {/* Burn Rate */}
        <Card variant="interactive" onClick={() => handleMetricClick('burnrate')}>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-orange-500 to-red-600 flex items-center justify-center">
                <Flame className="w-3 h-3 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-white">{formatNumber(stats.burnRate)}</div>
                <div className="text-xs text-neutral-400">Tokens/Hour</div>
              </div>
            </div>
            <Badge variant={stats.burnRate > 500 ? 'warning' : 'glass'} className="text-xs px-1.5 py-0.5">
              {stats.burnRate > 500 ? 'High' : 'Normal'}
            </Badge>
          </CardContent>
        </Card>

        {/* Current Plan */}
        <Card variant="interactive" onClick={() => handleMetricClick('plan')}>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center">
                <Shield className="w-3 h-3 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-white">{stats.currentPlan}</div>
                <div className="text-xs text-neutral-400">Current Plan</div>
              </div>
            </div>
            <div className="text-xs text-neutral-400">
              {formatNumber(stats.tokenLimit)} limit
            </div>
          </CardContent>
        </Card>

        {/* This Week */}
        <Card variant="interactive" onClick={() => handleMetricClick('week')}>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-600 flex items-center justify-center">
                <TrendingUp className="w-3 h-3 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-white">{formatCurrency(stats.thisWeek.reduce((sum, day) => sum + day.totalCost, 0))}</div>
                <div className="text-xs text-neutral-400">This Week</div>
              </div>
            </div>
            <div className="text-xs text-neutral-400">
              {stats.thisWeek.reduce((sum, day) => sum + day.totalTokens, 0).toLocaleString()}
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

      {/* Compact Charts Section */}
      {viewMode === 'detailed' && (
        <div className="space-y-3">
          
          {/* Usage Trends Chart */}
          <Card variant="glass">
            <CardHeader className="pb-2 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-white">Usage Trends</CardTitle>
                  <CardDescription className="text-xs">Token consumption over time</CardDescription>
                </div>
                
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-5 px-2 text-xs">7D</Button>
                  <Button variant="primary" size="sm" className="h-5 px-2 text-xs">30D</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="h-32">
                <UsageChart
                  data={stats.thisWeek}
                  animationEnabled={preferences.animationsEnabled}
                  height={128}
                />
              </div>
            </CardContent>
          </Card>

          {/* Model Breakdown */}
          <Card variant="glass">
            <CardHeader className="pb-2 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-white">Model Usage</CardTitle>
                  <CardDescription className="text-xs">Distribution by model type</CardDescription>
                </div>
                
                <Button variant="ghost" size="sm" className="h-5 px-2 text-xs">
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="h-24">
                <ModelBreakdown
                  models={stats.today.models}
                  animationEnabled={preferences.animationsEnabled}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Compact Quick Actions */}
      <Card variant="glass">
        <CardHeader className="pb-2 p-3">
          <CardTitle className="text-sm">Quick Actions</CardTitle>
          <CardDescription className="text-xs">Key features</CardDescription>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="grid grid-cols-3 gap-2">
            <Button variant="ghost" className="p-2 h-auto text-left justify-start group flex-col">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform mb-1">
                <Eye className="w-3 h-3 text-white" />
              </div>
              <div className="text-xs font-medium text-white">Analytics</div>
            </Button>
            
            <Button variant="ghost" className="p-2 h-auto text-left justify-start group flex-col">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform mb-1">
                <Download className="w-3 h-3 text-white" />
              </div>
              <div className="text-xs font-medium text-white">Export</div>
            </Button>
            
            <Button variant="ghost" className="p-2 h-auto text-left justify-start group flex-col">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-orange-500 to-red-600 flex items-center justify-center group-hover:scale-110 transition-transform mb-1">
                <Settings className="w-3 h-3 text-white" />
              </div>
              <div className="text-xs font-medium text-white">Settings</div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};