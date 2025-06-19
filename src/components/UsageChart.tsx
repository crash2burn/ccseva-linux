import React, { useEffect, useState } from 'react';
import { DailyUsage } from '../types/usage';

interface UsageChartProps {
  data: DailyUsage[];
  animationEnabled?: boolean;
  height?: number;
}

export const UsageChart: React.FC<UsageChartProps> = ({
  data,
  animationEnabled = true,
  height = 200
}) => {
  const [animatedData, setAnimatedData] = useState<number[]>([]);
  
  // Prepare chart data
  const chartData = data.slice(-7).map(day => day.totalTokens);
  const maxValue = Math.max(...chartData, 1000);
  const labels = data.slice(-7).map(day => 
    new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })
  );

  useEffect(() => {
    if (animationEnabled) {
      // Animate data points
      const timer = setTimeout(() => {
        setAnimatedData(chartData);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setAnimatedData(chartData);
    }
  }, [JSON.stringify(chartData), animationEnabled]);

  const getBarHeight = (value: number, index: number) => {
    const targetHeight = (value / maxValue) * (height - 40);
    return animationEnabled ? 
      (animatedData[index] ? (animatedData[index] / maxValue) * (height - 40) : 0) :
      targetHeight;
  };

  const formatValue = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  return (
    <div className="relative">
      {/* Chart Container */}
      <div className="relative" style={{ height: `${height}px` }}>
        
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-white/40 text-xs">
          <span>{formatValue(maxValue)}</span>
          <span>{formatValue(maxValue * 0.75)}</span>
          <span>{formatValue(maxValue * 0.5)}</span>
          <span>{formatValue(maxValue * 0.25)}</span>
          <span>0</span>
        </div>

        {/* Grid lines */}
        <div className="absolute left-8 right-0 top-0 bottom-8">
          {[0, 25, 50, 75, 100].map((percent) => (
            <div
              key={percent}
              className="absolute w-full border-t border-white/5"
              style={{ top: `${percent}%` }}
            />
          ))}
        </div>

        {/* Bars */}
        <div className="absolute left-8 right-0 bottom-8 flex items-end justify-between space-x-1">
          {chartData.map((value, index) => (
            <div key={index} className="flex-1 flex flex-col items-center group">
              
              {/* Bar */}
              <div className="relative w-full max-w-8 mb-2">
                <div
                  className="w-full bg-gradient-to-t from-blue-500/50 to-blue-400/50 rounded-t-lg transition-all duration-1000 ease-out hover:from-blue-400 hover:to-blue-300 cursor-pointer relative overflow-hidden"
                  style={{ 
                    height: `${getBarHeight(value, index)}px`,
                    transitionDelay: `${index * 100}ms`
                  }}
                >
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  
                  {/* Value tooltip */}
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {formatValue(value)}
                  </div>
                </div>
                
                {/* Glow effect */}
                <div
                  className="absolute bottom-0 left-0 right-0 bg-blue-400/20 rounded-t-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ height: `${getBarHeight(value, index) * 0.3}px` }}
                />
              </div>

              {/* Label */}
              <span className="text-white/60 text-xs font-medium group-hover:text-white transition-colors">
                {labels[index]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Chart insights */}
      <div className="mt-4 flex items-center justify-between text-xs text-white/60">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <span>Token Usage</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            <span>
              {chartData.length > 1 && chartData[chartData.length - 1] > chartData[chartData.length - 2] ? 
                'Trending up' : 'Stable usage'}
            </span>
          </div>
        </div>
        
        <div>
          Peak: {formatValue(Math.max(...chartData))}
        </div>
      </div>
    </div>
  );
};