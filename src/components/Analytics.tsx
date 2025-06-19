import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { UsageStats } from '../types/usage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { formatNumber, formatCurrency } from '../lib/utils';
import { Calendar, BarChart3, LineChart as LineChartIcon, Activity, DollarSign, TrendingUp, PieChart as PieChartIcon } from 'lucide-react';

interface AnalyticsProps {
  stats: UsageStats;
  preferences: {
    animationsEnabled: boolean;
  };
}

type ChartTimeRange = '7d' | '30d';
type ChartType = 'area' | 'line' | 'bar';

const modelColors = {
  'claude-3-5-sonnet': '#3B82F6',
  'claude-3-opus': '#8B5CF6',
  'claude-3-haiku': '#10B981',
  'other': '#6B7280'
};

export const Analytics: React.FC<AnalyticsProps> = ({ stats, preferences }) => {
  const [timeRange, setTimeRange] = useState<ChartTimeRange>('7d');
  const [chartType, setChartType] = useState<ChartType>('area');
  const [selectedMetric, setSelectedMetric] = useState<'tokens' | 'cost'>('tokens');

  const chartData = useMemo(() => {
    const rawData = timeRange === '7d' ? stats.thisWeek : stats.thisMonth;
    
    return rawData.map((day, index) => {
      const totalTokens = day.totalTokens;
      const totalCost = day.totalCost;
      
      const modelData = Object.entries(day.models).reduce((acc, [model, data]) => {
        const cleanModel = model.replace('claude-3-5-', '').replace('claude-3-', '');
        acc[cleanModel] = data.tokens;
        acc[`${cleanModel}_cost`] = data.cost;
        return acc;
      }, {} as Record<string, number>);

      return {
        date: new Date(day.date).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        }),
        fullDate: day.date,
        totalTokens,
        totalCost,
        dayIndex: index,
        ...modelData
      };
    });
  }, [stats, timeRange]);

  const modelBreakdownData = useMemo(() => {
    const today = stats.today;
    return Object.entries(today.models).map(([model, data]) => ({
      name: model.replace('claude-3-5-', '').replace('claude-3-', ''),
      value: data.tokens,
      cost: data.cost,
      percentage: (data.tokens / today.totalTokens) * 100
    }));
  }, [stats]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;

    return (
      <div className="glass-card p-4 shadow-2xl border border-white/20">
        <p className="text-white font-semibold mb-2">{label}</p>
        {payload.map((item: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: item.color }}
            />
            <span className="text-neutral-300">{item.dataKey}:</span>
            <span className="text-white font-medium">
              {item.dataKey.includes('cost') || item.dataKey === 'totalCost' 
                ? `$${item.value.toFixed(3)}`
                : `${item.value.toLocaleString()} tokens`
              }
            </span>
          </div>
        ))}
      </div>
    );
  };

  const formatYAxis = (value: number) => {
    if (selectedMetric === 'cost') {
      return `$${value.toFixed(2)}`;
    }
    return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toString();
  };

  const totalWeekTokens = stats.thisWeek.reduce((sum, day) => sum + day.totalTokens, 0);
  const totalWeekCost = stats.thisWeek.reduce((sum, day) => sum + day.totalCost, 0);
  const avgDailyTokens = totalWeekTokens / 7;
  const avgDailyCost = totalWeekCost / 7;

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      height: 400,
      className: preferences.animationsEnabled ? 'animate-fade-in' : ''
    };

    if (chartType === 'area') {
      return (
        <ResponsiveContainer {...commonProps}>
          <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <defs>
              <linearGradient id="tokensGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05}/>
              </linearGradient>
              <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis 
              dataKey="date" 
              stroke="#9CA3AF" 
              fontSize={12}
              tickLine={false}
            />
            <YAxis 
              stroke="#9CA3AF" 
              fontSize={12}
              tickLine={false}
              tickFormatter={formatYAxis}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey={selectedMetric === 'tokens' ? 'totalTokens' : 'totalCost'}
              stroke={selectedMetric === 'tokens' ? '#3B82F6' : '#10B981'}
              fillOpacity={1}
              fill={selectedMetric === 'tokens' ? 'url(#tokensGradient)' : 'url(#costGradient)'}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === 'bar') {
      return (
        <ResponsiveContainer {...commonProps}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis 
              dataKey="date" 
              stroke="#9CA3AF" 
              fontSize={12}
              tickLine={false}
            />
            <YAxis 
              stroke="#9CA3AF" 
              fontSize={12}
              tickLine={false}
              tickFormatter={formatYAxis}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey={selectedMetric === 'tokens' ? 'totalTokens' : 'totalCost'}
              fill={selectedMetric === 'tokens' ? '#3B82F6' : '#10B981'}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer {...commonProps}>
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis 
            dataKey="date" 
            stroke="#9CA3AF" 
            fontSize={12}
            tickLine={false}
          />
          <YAxis 
            stroke="#9CA3AF" 
            fontSize={12}
            tickLine={false}
            tickFormatter={formatYAxis}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey={selectedMetric === 'tokens' ? 'totalTokens' : 'totalCost'}
            stroke={selectedMetric === 'tokens' ? '#3B82F6' : '#10B981'}
            strokeWidth={3}
            dot={{ fill: selectedMetric === 'tokens' ? '#3B82F6' : '#10B981', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: selectedMetric === 'tokens' ? '#3B82F6' : '#10B981', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="space-y-8">
      {/* Analytics Header */}
      <Card variant="glass">
        <CardHeader className="pb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <CardTitle className="text-3xl font-bold text-gradient mb-2">Usage Analytics</CardTitle>
              <CardDescription className="text-lg">
                Deep insights into your Claude API consumption patterns
              </CardDescription>
            </div>
            
            <div className="flex flex-wrap gap-3">
              {/* Time Range Toggle */}
              <div className="flex bg-white/5 backdrop-blur-lg border border-white/20 rounded-xl p-1">
                {(['7d', '30d'] as ChartTimeRange[]).map((range) => (
                  <Button
                    key={range}
                    variant={timeRange === range ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => setTimeRange(range)}
                  >
                    <Calendar className="w-3 h-3 mr-1" />
                    {range === '7d' ? '7 Days' : '30 Days'}
                  </Button>
                ))}
              </div>

              {/* Chart Type Toggle */}
              <div className="flex bg-white/5 backdrop-blur-lg border border-white/20 rounded-xl p-1">
                {([
                  { type: 'area', icon: Activity },
                  { type: 'line', icon: LineChartIcon },
                  { type: 'bar', icon: BarChart3 }
                ] as { type: ChartType; icon: any }[]).map(({ type, icon: Icon }) => (
                  <Button
                    key={type}
                    variant={chartType === type ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setChartType(type)}
                  >
                    <Icon className="w-3 h-3 mr-1" />
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Button>
                ))}
              </div>

              {/* Metric Toggle */}
              <div className="flex bg-white/5 backdrop-blur-lg border border-white/20 rounded-xl p-1">
                {([
                  { metric: 'tokens', icon: TrendingUp },
                  { metric: 'cost', icon: DollarSign }
                ] as { metric: 'tokens' | 'cost'; icon: any }[]).map(({ metric, icon: Icon }) => (
                  <Button
                    key={metric}
                    variant={selectedMetric === metric ? "success" : "ghost"}
                    size="sm"
                    onClick={() => setSelectedMetric(metric)}
                  >
                    <Icon className="w-3 h-3 mr-1" />
                    {metric.charAt(0).toUpperCase() + metric.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass p-4 rounded-xl text-center">
              <div className="text-2xl font-bold text-white">{totalWeekTokens.toLocaleString()}</div>
              <div className="text-sm text-neutral-400">Total Tokens (7d)</div>
            </div>
            <div className="glass p-4 rounded-xl text-center">
              <div className="text-2xl font-bold text-white">${totalWeekCost.toFixed(3)}</div>
              <div className="text-sm text-neutral-400">Total Cost (7d)</div>
            </div>
            <div className="glass p-4 rounded-xl text-center">
              <div className="text-2xl font-bold text-white">{Math.round(avgDailyTokens).toLocaleString()}</div>
              <div className="text-sm text-neutral-400">Avg Daily Tokens</div>
            </div>
            <div className="glass p-4 rounded-xl text-center">
              <div className="text-2xl font-bold text-white">${avgDailyCost.toFixed(3)}</div>
              <div className="text-sm text-neutral-400">Avg Daily Cost</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Chart */}
      <Card variant="glass">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                {selectedMetric === 'tokens' ? <TrendingUp className="w-5 h-5" /> : <DollarSign className="w-5 h-5" />}
                {selectedMetric === 'tokens' ? 'Token Usage' : 'Cost'} Trends
              </CardTitle>
              <CardDescription>
                {timeRange === '7d' ? 'Last 7 days' : 'Last 30 days'} • {chartType} chart
              </CardDescription>
            </div>
            <Badge variant="glass" className="px-3 py-1">
              <Activity className="w-3 h-3 mr-1" />
              {preferences.animationsEnabled ? 'Animated' : 'Static'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-96 chart-container">
            {renderChart()}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Model Breakdown */}
        <Card variant="glass">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5" />
                  Model Distribution
                </CardTitle>
                <CardDescription>Today's usage by model</CardDescription>
              </div>
              <Badge variant="glass" className="px-3 py-1">
                {modelBreakdownData.length} models
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
          
          <div className="h-64 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={modelBreakdownData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {modelBreakdownData.map((item, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={Object.values(modelColors)[index] || '#6B7280'} 
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3">
            {modelBreakdownData.map((model, index) => (
              <div key={model.name} className="flex items-center justify-between p-3 glass rounded-lg">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: Object.values(modelColors)[index] || '#6B7280' }}
                  />
                  <span className="text-white font-medium capitalize">{model.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-white font-semibold">{model.value.toLocaleString()}</div>
                  <div className="text-xs text-neutral-400">{model.percentage.toFixed(1)}%</div>
                </div>
              </div>
            ))}
          </div>
          </CardContent>
        </Card>

        {/* Detailed Metrics */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Performance Metrics
            </CardTitle>
            <CardDescription>Key insights and trends</CardDescription>
          </CardHeader>
          <CardContent>

          <div className="space-y-6">
            {/* Burn Rate Trend */}
            <div className="glass p-4 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-neutral-300">Current Burn Rate</span>
                <span className="text-2xl font-bold text-white">{stats.burnRate.toLocaleString()}</span>
              </div>
              <div className="text-sm text-neutral-400">tokens per hour</div>
              <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    stats.burnRate > 1000 ? 'bg-red-500' : 
                    stats.burnRate > 500 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min((stats.burnRate / 2000) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Usage Efficiency */}
            <div className="glass p-4 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-neutral-300">Usage Efficiency</span>
                <span className="text-2xl font-bold text-white">
                  {((stats.tokensUsed / stats.tokenLimit) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="text-sm text-neutral-400">of plan utilized</div>
              <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${stats.percentageUsed}%` }}
                />
              </div>
            </div>

            {/* Predicted Depletion */}
            {stats.predictedDepleted && (
              <div className="glass p-4 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-neutral-300">Predicted Depletion</span>
                  <span className="text-lg font-bold text-orange-400">
                    {new Date(stats.predictedDepleted).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-sm text-neutral-400">at current usage rate</div>
              </div>
            )}

            {/* Cost Per Token */}
            <div className="glass p-4 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-neutral-300">Avg Cost/Token</span>
                <span className="text-2xl font-bold text-white">
                  ${(stats.today.totalCost / stats.today.totalTokens * 1000).toFixed(3)}
                </span>
              </div>
              <div className="text-sm text-neutral-400">per 1k tokens today</div>
            </div>
          </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};