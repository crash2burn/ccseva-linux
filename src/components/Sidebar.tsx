import React from 'react';
import { UsageStats } from '../types/usage';

interface SidebarProps {
  currentView: string;
  expanded: boolean;
  onNavigate: (view: 'dashboard' | 'analytics' | 'models' | 'settings' | 'about') => void;
  onToggle: () => void;
  stats: UsageStats;
  status: 'safe' | 'warning' | 'critical';
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  expanded,
  onNavigate,
  onToggle,
  stats,
  status
}) => {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: '📊',
      shortcut: '⌘1'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: '📈',
      shortcut: '⌘2'
    },
    {
      id: 'models',
      label: 'Models',
      icon: '🤖',
      shortcut: '⌘3'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: '⚙️',
      shortcut: '⌘,'
    },
    {
      id: 'about',
      label: 'About',
      icon: 'ℹ️',
      shortcut: ''
    }
  ];

  const getStatusColor = () => {
    switch (status) {
      case 'critical': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  };

  return (
    <div className={`
      fixed left-0 top-0 h-full glass-card rounded-none border-l-0 border-t-0 border-b-0
      transition-all duration-300 z-20
      ${expanded ? 'w-64' : 'w-16'}
    `}>
      
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        {expanded ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">CC</span>
              </div>
              <div>
                <h2 className="text-white font-bold text-sm">Claude Monitor</h2>
                <p className="text-white/60 text-xs">v1.0.0</p>
              </div>
            </div>
            <button
              onClick={onToggle}
              className="btn p-1 hover-scale"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              onClick={onToggle}
              className="btn p-2 hover-scale"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Status Indicator */}
      <div className="p-4 border-b border-white/10">
        {expanded ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-white/80 text-sm font-medium">Usage Status</span>
              <div className={`w-3 h-3 rounded-full ${getStatusColor()} animate-pulse`}></div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-white/60">Used</span>
                <span className="text-white font-medium">{Math.round(stats.percentageUsed)}%</span>
              </div>
              
              <div className="progress-container h-2">
                <div
                  className={`progress-bar ${
                    status === 'critical' ? 'progress-critical' :
                    status === 'warning' ? 'progress-warning' :
                    'progress-safe'
                  }`}
                  style={{ width: `${stats.percentageUsed}%` }}
                />
              </div>
              
              <div className="text-white/60 text-xs">
                {stats.tokensUsed.toLocaleString()} / {stats.tokenLimit.toLocaleString()}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2">
            <div className={`w-3 h-3 rounded-full ${getStatusColor()} animate-pulse`}></div>
            <div className="text-white text-xs font-bold">
              {Math.round(stats.percentageUsed)}%
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as any)}
              className={`
                nav-item w-full text-left flex items-center space-x-3
                ${currentView === item.id ? 'active' : ''}
                ${expanded ? 'px-3 py-3' : 'px-2 py-3 justify-center'}
                group
              `}
              title={expanded ? '' : item.label}
            >
              <span className="text-lg group-hover:scale-110 transition-transform duration-200">
                {item.icon}
              </span>
              
              {expanded && (
                <>
                  <span className="text-white font-medium flex-1">{item.label}</span>
                  {item.shortcut && (
                    <span className="text-white/40 text-xs">{item.shortcut}</span>
                  )}
                </>
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        {expanded ? (
          <div className="space-y-3">
            <div className="text-white/60 text-xs">
              <div className="flex justify-between mb-1">
                <span>Today's Cost</span>
                <span className="text-white font-medium">${stats.today.totalCost.toFixed(3)}</span>
              </div>
              <div className="flex justify-between">
                <span>Burn Rate</span>
                <span className="text-white font-medium">{stats.burnRate}/hr</span>
              </div>
            </div>
            
            <button className="btn btn-primary w-full text-xs py-2 hover-lift">
              🔄 Refresh
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2">
            <div className="text-white/60 text-xs text-center">
              ${stats.today.totalCost.toFixed(1)}
            </div>
            <button className="btn p-2 hover-scale" title="Refresh">
              🔄
            </button>
          </div>
        )}
      </div>
    </div>
  );
};