import type React from 'react';
import { useState, useEffect, useRef } from 'react';
import type { UsageStats } from '../types/usage';
import { Button } from './ui/button';

interface LiveMonitoringProps {
  stats: UsageStats;
  onRefresh: () => void;
}

interface LogEntry {
  id: string;
  timestamp: Date;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  emoji: string;
}

export const LiveMonitoring: React.FC<LiveMonitoringProps> = ({ stats, onRefresh }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLiveMode, setIsLiveMode] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const logContainerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Auto-scroll to bottom when new logs are added
  useEffect(() => {
    if (logContainerRef.current && isLiveMode) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, isLiveMode]);

  // Real-time updates every 3 seconds (like Python script)
  useEffect(() => {
    if (isLiveMode) {
      intervalRef.current = setInterval(() => {
        onRefresh();
        setLastUpdate(new Date());
        addLogEntry('info', 'Data refreshed', '🔄');
      }, 3000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isLiveMode, onRefresh]);

  // Add status-based log entries
  useEffect(() => {
    const status = getUsageStatus(stats.percentageUsed);
    const timeUntilReset = stats.resetInfo?.timeUntilReset;

    if (stats.percentageUsed >= 95) {
      addLogEntry('error', `Critical: ${stats.percentageUsed.toFixed(1)}% usage detected`, '🚨');
    } else if (stats.percentageUsed >= 80) {
      addLogEntry('warning', `High usage: ${stats.percentageUsed.toFixed(1)}%`, '⚠️');
    }

    if (timeUntilReset && timeUntilReset < 3600000) {
      // Less than 1 hour
      addLogEntry('info', `Reset in ${formatTimeRemaining(timeUntilReset)}`, '⏰');
    }
  }, [stats.percentageUsed, stats.resetInfo?.timeUntilReset]);

  const addLogEntry = (type: LogEntry['type'], message: string, emoji: string) => {
    const newEntry: LogEntry = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
      timestamp: new Date(),
      type,
      message,
      emoji,
    };

    setLogs((prev) => {
      const updated = [newEntry, ...prev];
      return updated.slice(0, 50); // Keep only last 50 entries
    });
  };

  const getUsageStatus = (percentage: number): 'safe' | 'warning' | 'critical' => {
    if (percentage >= 90) return 'critical';
    if (percentage >= 70) return 'warning';
    return 'safe';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical':
        return 'from-red-500 to-red-600';
      case 'warning':
        return 'from-yellow-500 to-orange-500';
      default:
        return 'from-green-500 to-emerald-500';
    }
  };

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case 'critical':
        return '🔴';
      case 'warning':
        return '🟡';
      default:
        return '🟢';
    }
  };

  const formatTimeRemaining = (milliseconds: number): string => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const currentStatus = getUsageStatus(stats.percentageUsed);
  const tokensPercentage = Math.min(stats.percentageUsed, 100);

  // Calculate time progress (assuming reset info exists)
  const timeProgress = stats.resetInfo
    ? Math.max(
        0,
        Math.min(
          100,
          ((24 * 60 * 60 * 1000 - stats.resetInfo.timeUntilReset) / (24 * 60 * 60 * 1000)) * 100
        )
      )
    : 0;

  return (
    <div className="space-y-4">
      {/* Header with Controls */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gradient mb-1">Live Monitoring</h2>
            <p className="text-sm text-neutral-400">Real-time terminal-style usage tracking</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="glass px-3 py-1 rounded-lg">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${isLiveMode ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}
                />
                <span className="text-xs text-neutral-300">{isLiveMode ? 'LIVE' : 'PAUSED'}</span>
              </div>
            </div>

            <Button
              onClick={() => setIsLiveMode(!isLiveMode)}
              variant={isLiveMode ? 'secondary' : 'default'}
              size="sm"
              className={`text-sm px-3 py-1 transition-all duration-200 ${
                isLiveMode
                  ? 'bg-gray-600 hover:bg-gray-700 text-white'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/20'
              }`}
            >
              {isLiveMode ? 'Pause' : 'Resume'}
            </Button>
          </div>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-2 gap-4">
          <div className="glass p-4 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-neutral-400">Token Usage</span>
              <span className="text-lg">{getStatusEmoji(currentStatus)}</span>
            </div>
            <div className="text-2xl font-bold text-white mb-2">{tokensPercentage.toFixed(1)}%</div>
            <div className="w-full bg-neutral-800 rounded-full h-3 mb-2">
              <div
                className={`h-3 rounded-full bg-gradient-to-r ${getStatusColor(currentStatus)} transition-all duration-1000`}
                style={{ width: `${tokensPercentage}%` }}
              />
            </div>
            <div className="text-xs text-neutral-400">
              {formatNumber(stats.tokensUsed)} / {formatNumber(stats.tokenLimit)}
            </div>
          </div>

          <div className="glass p-4 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-neutral-400">Time Progress</span>
              <span className="text-lg">⏰</span>
            </div>
            <div className="text-2xl font-bold text-white mb-2">{timeProgress.toFixed(1)}%</div>
            <div className="w-full bg-neutral-800 rounded-full h-3 mb-2">
              <div
                className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-1000"
                style={{ width: `${timeProgress}%` }}
              />
            </div>
            <div className="text-xs text-neutral-400">
              {stats.resetInfo
                ? formatTimeRemaining(stats.resetInfo.timeUntilReset)
                : 'No reset info'}{' '}
              until reset
            </div>
          </div>
        </div>
      </div>

      {/* Terminal-style Output */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-white">Live Feed</h3>
            <div className="flex gap-1">
              <div className="w-3 h-3 bg-red-500 rounded-full" />
              <div className="w-3 h-3 bg-yellow-500 rounded-full" />
              <div className="w-3 h-3 bg-green-500 rounded-full" />
            </div>
          </div>

          <div className="text-xs text-neutral-400">
            Last update: {lastUpdate.toLocaleTimeString()}
          </div>
        </div>

        {/* Terminal Window */}
        <div className="bg-black/50 rounded-lg border border-white/10 p-4 font-mono text-sm">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
            <span className="text-green-400">●</span>
            <span className="text-white">ccmonitor@live</span>
            <span className="text-neutral-400">~</span>
          </div>

          <div
            ref={logContainerRef}
            className="h-60 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
          >
            {logs.length === 0 ? (
              <div className="text-neutral-400">
                <span className="text-green-400">$</span> Waiting for events...
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className={`flex items-start gap-2 ${
                    log.type === 'error'
                      ? 'text-red-400'
                      : log.type === 'warning'
                        ? 'text-yellow-400'
                        : log.type === 'success'
                          ? 'text-green-400'
                          : 'text-neutral-300'
                  }`}
                >
                  <span className="text-neutral-500 text-xs w-16 flex-shrink-0">
                    {log.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                  <span className="text-sm">{log.emoji}</span>
                  <span className="flex-1">{log.message}</span>
                </div>
              ))
            )}
          </div>

          {/* Command Line */}
          <div className="mt-3 pt-2 border-t border-white/10">
            <div className="flex items-center gap-2 text-neutral-400">
              <span className="text-green-400">$</span>
              <span className="animate-pulse">█</span>
            </div>
          </div>
        </div>
      </div>

      {/* Current Session Info */}
      <div className="glass-card p-5">
        <h3 className="text-lg font-bold text-white mb-4">Current Session</h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-1">{formatNumber(stats.burnRate)}</div>
            <div className="text-sm text-neutral-400">Tokens/Hour</div>
            <div className="text-xs text-neutral-500 mt-1">
              🔥 {stats.burnRate > 1000 ? 'High' : stats.burnRate > 500 ? 'Moderate' : 'Normal'}
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-1">{stats.currentPlan}</div>
            <div className="text-sm text-neutral-400">Current Plan</div>
            <div className="text-xs text-neutral-500 mt-1">📊 Auto-detected</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-1">
              {stats.velocity?.trend === 'increasing'
                ? '📈'
                : stats.velocity?.trend === 'decreasing'
                  ? '📉'
                  : '➡️'}
            </div>
            <div className="text-sm text-neutral-400">Trend</div>
            <div className="text-xs text-neutral-500 mt-1">{stats.velocity?.trend || 'stable'}</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-1">
              {stats.prediction?.confidence || 0}%
            </div>
            <div className="text-sm text-neutral-400">Confidence</div>
            <div className="text-xs text-neutral-500 mt-1">🎯 Prediction</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="glass-card p-4">
        <div className="grid grid-cols-3 gap-3">
          <Button
            onClick={onRefresh}
            variant="ghost"
            className="flex items-center justify-center gap-2 py-3 h-auto hover:bg-white/10 transition-all duration-200"
          >
            <span>🔄</span>
            Force Refresh
          </Button>

          <Button
            onClick={() => addLogEntry('info', 'Manual checkpoint created', '📍')}
            variant="ghost"
            className="flex items-center justify-center gap-2 py-3 h-auto hover:bg-white/10 transition-all duration-200"
          >
            <span>📍</span>
            Checkpoint
          </Button>

          <Button
            onClick={() => setLogs([])}
            variant="ghost"
            className="flex items-center justify-center gap-2 py-3 h-auto hover:bg-white/10 transition-all duration-200"
          >
            <span>🗑️</span>
            Clear Logs
          </Button>
        </div>
      </div>
    </div>
  );
};
