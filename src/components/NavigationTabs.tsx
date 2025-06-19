import React from 'react';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { Home, BarChart3 } from 'lucide-react';

type ViewType = 'dashboard' | 'analytics' | 'models' | 'settings' | 'about';

interface NavigationTabsProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  className?: string;
}

const tabs = [
  {
    id: 'dashboard' as ViewType,
    name: 'Dashboard',
    icon: Home,
    description: 'Overview and quick stats'
  },
  {
    id: 'analytics' as ViewType,
    name: 'Analytics', 
    icon: BarChart3,
    description: 'Usage trends and insights'
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
      <TabsList className="grid w-full grid-cols-2 h-8">
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          return (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="flex items-center gap-1 px-3 py-1 text-xs"
              title={tab.description}
            >
              <IconComponent className="h-3 w-3" />
              <span>{tab.name}</span>
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
};