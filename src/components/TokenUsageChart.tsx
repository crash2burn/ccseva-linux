import React from 'react';
import { DailyUsage } from '../types/usage';

interface TokenUsageChartProps {
  data: DailyUsage[];
  className?: string;
}

export const TokenUsageChart: React.FC<TokenUsageChartProps> = ({
  data,
  className = ''
}) => {
  if (!data || data.length === 0) {
    return (
      <div className={`gradient-card rounded-lg p-4 ${className}`}>
        <h3 className="text-white/80 text-sm font-medium mb-4">Token Usage (7 days)</h3>
        <div className="text-white/60 text-center py-8">No data available</div>
      </div>
    );
  }

  const maxTokens = Math.max(...data.map(d => d.totalTokens), 1);
  const recentData = data.slice(-7); // Last 7 days

  return (
    <div className={`gradient-card rounded-lg p-4 ${className}`}>
      <h3 className="text-white/80 text-sm font-medium mb-4">Token Usage (7 days)</h3>
      
      <div className="space-y-2">
        {recentData.map((day, index) => {
          const percentage = (day.totalTokens / maxTokens) * 100;
          const date = new Date(day.date);
          const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
          
          return (
            <div key={day.date} className="flex items-center space-x-3">
              <div className="w-8 text-white/60 text-xs">
                {dayName}
              </div>
              
              <div className="flex-1">
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 transition-all duration-300"
                    style={{ width: `${Math.max(percentage, 2)}%` }}
                  />
                </div>
              </div>
              
              <div className="w-16 text-white/80 text-xs text-right">
                {day.totalTokens.toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 pt-3 border-t border-white/20">
        <div className="flex justify-between text-xs text-white/60">
          <span>Total: {recentData.reduce((sum, day) => sum + day.totalTokens, 0).toLocaleString()}</span>
          <span>Avg: {Math.round(recentData.reduce((sum, day) => sum + day.totalTokens, 0) / recentData.length).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};