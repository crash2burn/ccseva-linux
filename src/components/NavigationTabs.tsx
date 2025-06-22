import React from 'react';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';

type ViewType = 'dashboard' | 'live' | 'analytics' | 'terminal' | 'settings';

interface NavigationTabsProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  className?: string;
}

const HomeIcon = () => (
  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const BarChartIcon = () => (
  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const LiveIcon = () => (
  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const TerminalIcon = () => (
  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3" />
  </svg>
);

const tabs = [
  {
    id: 'dashboard' as ViewType,
    name: 'Dashboard',
    icon: HomeIcon,
    description: 'Overview and quick stats'
  },
  {
    id: 'live' as ViewType,
    name: 'Live',
    icon: LiveIcon,
    description: 'Real-time monitoring'
  },
  {
    id: 'analytics' as ViewType,
    name: 'Analytics', 
    icon: BarChartIcon,
    description: 'Usage trends and insights'
  },
  {
    id: 'terminal' as ViewType,
    name: 'Terminal',
    icon: TerminalIcon,
    description: 'Terminal-style interface'
  }
];

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  currentView,
  onNavigate,
  className = ''
}) => {
  return (
    <Tabs
      value={currentView}
      onValueChange={(value) => onNavigate(value as ViewType)}
      className={className}
    >
      <TabsList className="grid w-full grid-cols-4 h-8">
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          return (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="flex items-center gap-1 px-3 py-1 text-xs"
              title={tab.description}
            >
              <IconComponent />
              <span>{tab.name}</span>
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
};