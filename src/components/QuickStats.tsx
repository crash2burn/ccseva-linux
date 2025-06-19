import React from 'react';
import { UsageStats } from '../types/usage';

interface QuickStatsProps {
  stats: UsageStats;
  timeRemaining: string;
}

export const QuickStats: React.FC<QuickStatsProps> = ({ stats, timeRemaining }) => {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const quickStats = [
    {
      label: 'Tokens Left',
      value: formatNumber(stats.tokensRemaining),
      icon: '🎯',
      color: 'text-blue-400'
    },
    {
      label: 'Time Left',
      value: timeRemaining,
      icon: '⏱️',
      color: 'text-purple-400'
    },
    {
      label: 'Daily Spend',
      value: `$${stats.today.totalCost.toFixed(2)}`,
      icon: '💳',
      color: 'text-green-400'
    },
    {
      label: 'Burn Rate',
      value: `${stats.burnRate}/h`,
      icon: '🔥',
      color: stats.burnRate > 500 ? 'text-red-400' : 'text-orange-400'
    }
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {quickStats.map((stat, index) => (
        <div
          key={stat.label}
          className="bg-white/5 backdrop-blur rounded-xl p-4 hover:bg-white/10 transition-all duration-300 hover:scale-105 group"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className="flex items-center space-x-3">
            <div className="text-2xl group-hover:scale-110 transition-transform duration-200">
              {stat.icon}
            </div>
            <div>
              <div className="text-white/60 text-xs font-medium uppercase tracking-wider">
                {stat.label}
              </div>
              <div className={`text-lg font-bold ${stat.color} group-hover:text-white transition-colors`}>
                {stat.value}
              </div>
            </div>
          </div>
          
          {/* Subtle bottom border that lights up on hover */}
          <div className="h-0.5 bg-gradient-to-r from-transparent via-white/20 to-transparent mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
      ))}
    </div>
  );
};