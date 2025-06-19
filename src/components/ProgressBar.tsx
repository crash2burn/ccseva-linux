import React from 'react';

interface ProgressBarProps {
  percentage: number;
  status?: 'safe' | 'warning' | 'critical';
  showText?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  percentage,
  status = 'safe',
  showText = true,
  className = ''
}) => {
  const getProgressColor = () => {
    switch (status) {
      case 'critical': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  };

  const getTextColor = () => {
    switch (status) {
      case 'critical': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      default: return 'text-green-400';
    }
  };

  return (
    <div className={`${className}`}>
      <div className="flex justify-between items-center mb-2">
        {showText && (
          <span className={`text-sm font-medium ${getTextColor()}`}>
            {Math.round(percentage)}%
          </span>
        )}
      </div>
      
      <div className="w-full bg-white/20 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full transition-all duration-300 ${getProgressColor()}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
};