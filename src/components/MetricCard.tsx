import React from 'react';

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: string;
  trend?: 'up' | 'down' | 'stable';
  percentage?: number;
  onClick?: () => void;
  selected?: boolean;
  status?: 'safe' | 'warning' | 'critical';
  detailed?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend = 'stable',
  percentage = 0,
  onClick,
  selected = false,
  status = 'safe',
  detailed = false
}) => {
  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-green-400';
      case 'down': return 'text-red-400';
      default: return 'text-white/60';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return '↗️';
      case 'down': return '↘️';
      default: return '➡️';
    }
  };

  const getStatusBorderColor = () => {
    switch (status) {
      case 'critical': return 'border-red-400/30';
      case 'warning': return 'border-yellow-400/30';
      default: return 'border-green-400/30';
    }
  };

  const getStatusGlow = () => {
    switch (status) {
      case 'critical': return 'hover:shadow-red-500/20';
      case 'warning': return 'hover:shadow-yellow-500/20';
      default: return 'hover:shadow-green-500/20';
    }
  };

  return (
    <div
      className={`
        metric-card group relative
        ${selected ? `border-white/40 bg-white/15 ${getStatusBorderColor()}` : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${getStatusGlow()}
        ${detailed ? 'col-span-full' : ''}
      `}
      onClick={onClick}
    >
      {/* Background Gradient Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
      
      {/* Content */}
      <div className="relative z-10">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="text-2xl group-hover:scale-110 transition-transform duration-200">
              {icon}
            </div>
            <div>
              <h3 className="text-white/80 text-sm font-medium">{title}</h3>
              {selected && (
                <div className="text-white/60 text-xs mt-1">Click to collapse</div>
              )}
            </div>
          </div>
          
          {/* Trend Indicator */}
          <div className={`flex items-center space-x-1 ${getTrendColor()}`}>
            <span className="text-xs">{getTrendIcon()}</span>
            <span className="text-xs font-medium">{trend}</span>
          </div>
        </div>

        {/* Value */}
        <div className="mb-3">
          <div className="text-white text-2xl font-bold mb-1 group-hover:text-white transition-colors">
            {value}
          </div>
          {subtitle && (
            <div className="text-white/60 text-sm">
              {subtitle}
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {percentage > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-white/60">
              <span>Progress</span>
              <span>{Math.round(percentage)}%</span>
            </div>
            <div className="progress-container h-2">
              <div
                className={`progress-bar transition-all duration-1000 ease-out ${
                  status === 'critical' ? 'progress-critical' :
                  status === 'warning' ? 'progress-warning' :
                  'progress-safe'
                }`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Detailed View */}
        {detailed && selected && (
          <div className="mt-6 pt-4 border-t border-white/10 space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-white/60 mb-1">Current Rate</div>
                <div className="text-white font-medium">Active</div>
              </div>
              <div>
                <div className="text-white/60 mb-1">Last Updated</div>
                <div className="text-white font-medium">{new Date().toLocaleTimeString()}</div>
              </div>
            </div>
            
            {/* Mini Chart Placeholder */}
            <div className="h-16 bg-white/5 rounded-lg flex items-center justify-center">
              <span className="text-white/40 text-xs">📈 Trend visualization</span>
            </div>
          </div>
        )}

        {/* Selection Indicator */}
        {selected && (
          <div className="absolute top-2 right-2 w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
        )}

        {/* Hover Glow Effect */}
        <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
      </div>
    </div>
  );
};