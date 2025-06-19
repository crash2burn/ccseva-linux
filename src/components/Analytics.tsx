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
    <div className="space-y-3">
      {/* Compact Analytics Header */}
      <Card variant="glass">
        <CardHeader className="pb-2 p-3">
          <div className="flex flex-col gap-3">
            <div>
              <CardTitle className="text-base font-bold text-gradient mb-1">Usage Analytics</CardTitle>
              <CardDescription className="text-xs">
                Deep insights into your API consumption
              </CardDescription>
            </div>
            
            <div className="flex flex-wrap gap-1">
              {/* Time Range Toggle */}
              <div className="flex bg-white/5 backdrop-blur-lg border border-white/20 rounded-lg p-0.5">
                {(['7d', '30d'] as ChartTimeRange[]).map((range) => (
                  <Button
                    key={range}
                    variant={timeRange === range ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => setTimeRange(range)}
                    className="h-5 px-2 text-xs"
                  >
                    <Calendar className="w-2 h-2 mr-1" />
                    {range === '7d' ? '7D' : '30D'}
                  </Button>
                ))}
              </div>

              {/* Chart Type Toggle */}
              <div className="flex bg-white/5 backdrop-blur-lg border border-white/20 rounded-lg p-0.5">
                {([
                  { type: 'area', icon: Activity, label: 'Area' },
                  { type: 'line', icon: LineChartIcon, label: 'Line' },
                  { type: 'bar', icon: BarChart3, label: 'Bar' }
                ] as { type: ChartType; icon: any; label: string }[]).map(({ type, icon: Icon, label }) => (
                  <Button
                    key={type}
                    variant={chartType === type ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setChartType(type)}
                    className="h-5 px-2 text-xs"
                  >
                    <Icon className="w-2 h-2 mr-1" />
                    {label}
                  </Button>
                ))}
              </div>

              {/* Metric Toggle */}
              <div className="flex bg-white/5 backdrop-blur-lg border border-white/20 rounded-lg p-0.5">
                {([
                  { metric: 'tokens', icon: TrendingUp, label: 'Tokens' },
                  { metric: 'cost', icon: DollarSign, label: 'Cost' }
                ] as { metric: 'tokens' | 'cost'; icon: any; label: string }[]).map(({ metric, icon: Icon, label }) => (
                  <Button
                    key={metric}
                    variant={selectedMetric === metric ? "success" : "ghost"}
                    size="sm"
                    onClick={() => setSelectedMetric(metric)}
                    className="h-5 px-2 text-xs"
                  >
                    <Icon className="w-2 h-2 mr-1" />
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-3 pt-0">
          <div className="grid grid-cols-2 gap-2">
            <div className="glass p-2 rounded-lg text-center">
              <div className="text-sm font-bold text-white">{totalWeekTokens.toLocaleString()}</div>
              <div className="text-xs text-neutral-400">Total Tokens (7d)</div>
            </div>
            <div className="glass p-2 rounded-lg text-center">
              <div className="text-sm font-bold text-white">${totalWeekCost.toFixed(3)}</div>
              <div className="text-xs text-neutral-400">Total Cost (7d)</div>
            </div>
            <div className="glass p-2 rounded-lg text-center">
              <div className="text-sm font-bold text-white">{Math.round(avgDailyTokens).toLocaleString()}</div>
              <div className="text-xs text-neutral-400">Avg Daily Tokens</div>
            </div>
            <div className="glass p-2 rounded-lg text-center">
              <div className="text-sm font-bold text-white">${avgDailyCost.toFixed(3)}</div>
              <div className="text-xs text-neutral-400">Avg Daily Cost</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compact Main Chart */}
      <Card variant="glass">
        <CardHeader className="pb-2 p-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm flex items-center gap-1">
                {selectedMetric === 'tokens' ? <TrendingUp className="w-3 h-3" /> : <DollarSign className="w-3 h-3" />}
                {selectedMetric === 'tokens' ? 'Token Usage' : 'Cost'} Trends
              </CardTitle>
              <CardDescription className="text-xs">
                {timeRange === '7d' ? 'Last 7 days' : 'Last 30 days'} • {chartType} chart
              </CardDescription>
            </div>
            <Badge variant="glass" className="px-2 py-0.5 text-xs">
              <Activity className="w-2 h-2 mr-1" />
              {preferences.animationsEnabled ? 'Live' : 'Static'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="h-48 chart-container">
            {renderChart()}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-3">
        {/* Model Breakdown */}
        <Card variant="glass">
          <CardHeader className="pb-2 p-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm flex items-center gap-1">
                  <PieChartIcon className="w-3 h-3" />
                  Model Distribution
                </CardTitle>
                <CardDescription className="text-xs">Today's usage by model</CardDescription>
              </div>
              <Badge variant="glass" className="px-2 py-0.5 text-xs">
                {modelBreakdownData.length} models
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-3 pt-0">
          
          <div className="flex items-center gap-3">
            <div className="h-24 w-24">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={modelBreakdownData}
                    cx="50%"
                    cy="50%"
                    innerRadius={20}
                    outerRadius={35}
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

            <div className="flex-1 space-y-1">
              {modelBreakdownData.map((model, index) => (
                <div key={model.name} className="flex items-center justify-between p-1.5 glass rounded text-xs">
                  <div className="flex items-center gap-1.5">
                    <div 
                      className="w-2 h-2 rounded-full"
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
          </div>
          </CardContent>
        </Card>

        {/* Compact Performance Metrics */}
        <Card variant="glass">
          <CardHeader className="pb-2 p-3">
            <CardTitle className="text-sm flex items-center gap-1">
              <Activity className="w-3 h-3" />
              Performance Metrics
            </CardTitle>
            <CardDescription className="text-xs">Key insights and trends</CardDescription>
          </CardHeader>
          <CardContent className="p-3 pt-0">

          <div className="grid grid-cols-2 gap-2">
            {/* Burn Rate Trend */}
            <div className="glass p-2 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-neutral-300">Burn Rate</span>
                <span className="text-sm font-bold text-white">{stats.burnRate.toLocaleString()}</span>
              </div>
              <div className="text-xs text-neutral-400 mb-1">tokens/hour</div>
              <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
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
            <div className="glass p-2 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-neutral-300">Efficiency</span>
                <span className="text-sm font-bold text-white">
                  {((stats.tokensUsed / stats.tokenLimit) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="text-xs text-neutral-400 mb-1">plan utilized</div>
              <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${stats.percentageUsed}%` }}
                />
              </div>
            </div>

            {/* Predicted Depletion */}
            {stats.predictedDepleted && (
              <div className="glass p-2 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-neutral-300">Depletion</span>
                  <span className="text-xs font-bold text-orange-400">
                    {new Date(stats.predictedDepleted).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-xs text-neutral-400">current rate</div>
              </div>
            )}

            {/* Cost Per Token */}
            <div className="glass p-2 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-neutral-300">Avg Cost</span>
                <span className="text-sm font-bold text-white">
                  ${(stats.today.totalCost / stats.today.totalTokens * 1000).toFixed(3)}
                </span>
              </div>
              <div className="text-xs text-neutral-400">per 1k tokens</div>
            </div>
          </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};