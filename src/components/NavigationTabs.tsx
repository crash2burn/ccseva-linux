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
      <TabsList className="grid w-fit grid-cols-2">
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          return (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="flex items-center gap-2 px-6 py-3"
              title={tab.description}
            >
              <IconComponent className="h-4 w-4" />
              <span className="hidden sm:block">{tab.name}</span>
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
};