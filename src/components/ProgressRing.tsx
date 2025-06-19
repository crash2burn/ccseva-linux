import React, { useEffect, useState } from 'react';

interface ProgressRingProps {
  percentage: number;
  status: 'safe' | 'warning' | 'critical';
  size?: number;
  strokeWidth?: number;
  showAnimation?: boolean;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  percentage,
  status,
  size = 100,
  strokeWidth = 6,
  showAnimation = true
}) => {
  const [animatedPercentage, setAnimatedPercentage] = useState(0);
  
  const center = size / 2;
  const radius = center - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  
  useEffect(() => {
    if (showAnimation) {
      const timer = setTimeout(() => {
        setAnimatedPercentage(percentage);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setAnimatedPercentage(percentage);
    }
  }, [percentage, showAnimation]);

  const getStrokeColor = () => {
    switch (status) {
      case 'critical': return '#ef4444'; // red-500
      case 'warning': return '#f59e0b'; // amber-500
      default: return '#10b981'; // emerald-500
    }
  };

  const getGlowColor = () => {
    switch (status) {
      case 'critical': return '#fee2e2'; // red-100
      case 'warning': return '#fef3c7'; // amber-100
      default: return '#d1fae5'; // emerald-100
    }
  };

  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (animatedPercentage / 100) * circumference;

  return (
    <div className="relative group">
      <svg
        width={size}
        height={size}
        className="transform -rotate-90 transition-transform group-hover:scale-105 duration-300"
      >
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        
        {/* Glow effect */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke={getGlowColor()}
          strokeWidth={strokeWidth / 2}
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className="opacity-30 blur-sm"
          style={{
            transition: showAnimation ? 'stroke-dashoffset 2s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
          }}
        />
        
        {/* Progress circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke={getStrokeColor()}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          style={{
            transition: showAnimation ? 'stroke-dashoffset 2s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
          }}
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-lg font-bold">
            {Math.round(animatedPercentage)}%
          </div>
          {status === 'critical' && (
            <div className="text-red-400 text-xs animate-pulse">Critical</div>
          )}
          {status === 'warning' && (
            <div className="text-yellow-400 text-xs animate-pulse">Warning</div>
          )}
        </div>
      </div>
      
      {/* Floating particles effect */}
      {showAnimation && status === 'critical' && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-red-400 rounded-full animate-ping"></div>
          <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-red-400 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
        </div>
      )}
    </div>
  );
};