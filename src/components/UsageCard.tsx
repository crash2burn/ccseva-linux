import React from 'react';

interface UsageCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  status?: 'safe' | 'warning' | 'critical';
  className?: string;
}

export const UsageCard: React.FC<UsageCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  status,
  className = ''
}) => {
  const statusClass = status ? `status-${status}` : '';

  return (
    <div className={`gradient-card rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-white/80 text-sm font-medium">{title}</h3>
        {icon && <span className="text-lg">{icon}</span>}
      </div>
      
      <div className={`text-2xl font-bold text-white ${statusClass}`}>
        {value}
      </div>
      
      {subtitle && (
        <div className="text-white/60 text-xs mt-1">
          {subtitle}
        </div>
      )}
    </div>
  );
};