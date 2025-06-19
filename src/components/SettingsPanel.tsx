import React, { useState } from 'react';
import { UsageStats } from '../types/usage';

interface SettingsPanelProps {
  preferences: {
    autoRefresh: boolean;
    refreshInterval: number;
    theme: 'auto' | 'light' | 'dark';
    notifications: boolean;
    animationsEnabled: boolean;
  };
  onUpdatePreferences: (preferences: any) => void;
  stats: UsageStats;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  preferences,
  onUpdatePreferences,
  stats
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'advanced'>('general');

  const tabs = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'advanced', label: 'Advanced', icon: '🔧' }
  ];

  const handlePreferenceChange = (key: string, value: any) => {
    onUpdatePreferences({ [key]: value });
  };

  const refreshIntervalOptions = [
    { value: 15000, label: '15 seconds' },
    { value: 30000, label: '30 seconds' },
    { value: 60000, label: '1 minute' },
    { value: 300000, label: '5 minutes' },
  ];

  return (
    <div className="space-y-6 stagger-children">
      
      {/* Header */}
      <div className="glass-card p-6 hover-lift">
        <h2 className="text-white text-2xl font-bold mb-3 text-shadow">Settings</h2>
        <p className="text-white/70">Customize your Claude Code Monitor experience</p>
      </div>

      {/* Tabs */}
      <div className="glass-card p-2">
        <div className="flex space-x-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                nav-item flex-1 flex items-center justify-center space-x-2 py-3 px-4
                ${activeTab === tab.id ? 'active' : ''}
              `}
            >
              <span className="text-lg">{tab.icon}</span>
              <span className="text-white font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <div className="glass-card p-6 hover-lift space-y-6">
          
          {/* Auto Refresh */}
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🔄</span>
                <div>
                  <div className="text-white font-medium">Auto Refresh</div>
                  <div className="text-white/60 text-sm">Automatically update usage data</div>
                </div>
              </div>
              
              <div className="relative">
                <input
                  type="checkbox"
                  checked={preferences.autoRefresh}
                  onChange={(e) => handlePreferenceChange('autoRefresh', e.target.checked)}
                  className="sr-only"
                />
                <div
                  onClick={() => handlePreferenceChange('autoRefresh', !preferences.autoRefresh)}
                  className={`
                    w-12 h-6 rounded-full cursor-pointer transition-colors duration-300
                    ${preferences.autoRefresh ? 'bg-blue-500' : 'bg-white/20'}
                  `}
                >
                  <div
                    className={`
                      w-5 h-5 bg-white rounded-full transition-transform duration-300 mt-0.5
                      ${preferences.autoRefresh ? 'transform translate-x-6 ml-0.5' : 'ml-0.5'}
                    `}
                  />
                </div>
              </div>
            </label>

            {preferences.autoRefresh && (
              <div className="ml-11 space-y-2">
                <div className="text-white/70 text-sm">Refresh interval</div>
                <select
                  value={preferences.refreshInterval}
                  onChange={(e) => handlePreferenceChange('refreshInterval', parseInt(e.target.value))}
                  className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-400 focus:outline-none"
                >
                  {refreshIntervalOptions.map((option) => (
                    <option key={option.value} value={option.value} className="bg-gray-800">
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Theme Selection */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🎨</span>
              <div>
                <div className="text-white font-medium">Theme</div>
                <div className="text-white/60 text-sm">Choose your preferred appearance</div>
              </div>
            </div>

            <div className="ml-11 grid grid-cols-3 gap-3">
              {['auto', 'light', 'dark'].map((theme) => (
                <button
                  key={theme}
                  onClick={() => handlePreferenceChange('theme', theme)}
                  className={`
                    p-3 rounded-lg border text-sm font-medium transition-all duration-300 hover-scale
                    ${preferences.theme === theme 
                      ? 'border-blue-400 bg-blue-500/20 text-white' 
                      : 'border-white/20 bg-white/5 text-white/70 hover:border-white/40'
                    }
                  `}
                >
                  {theme === 'auto' && '🌓'} {theme === 'light' && '☀️'} {theme === 'dark' && '🌙'}
                  <div className="capitalize mt-1">{theme}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Animations */}
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">✨</span>
                <div>
                  <div className="text-white font-medium">Animations</div>
                  <div className="text-white/60 text-sm">Enable smooth transitions and effects</div>
                </div>
              </div>
              
              <div className="relative">
                <input
                  type="checkbox"
                  checked={preferences.animationsEnabled}
                  onChange={(e) => handlePreferenceChange('animationsEnabled', e.target.checked)}
                  className="sr-only"
                />
                <div
                  onClick={() => handlePreferenceChange('animationsEnabled', !preferences.animationsEnabled)}
                  className={`
                    w-12 h-6 rounded-full cursor-pointer transition-colors duration-300
                    ${preferences.animationsEnabled ? 'bg-blue-500' : 'bg-white/20'}
                  `}
                >
                  <div
                    className={`
                      w-5 h-5 bg-white rounded-full transition-transform duration-300 mt-0.5
                      ${preferences.animationsEnabled ? 'transform translate-x-6 ml-0.5' : 'ml-0.5'}
                    `}
                  />
                </div>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* Notification Settings */}
      {activeTab === 'notifications' && (
        <div className="glass-card p-6 hover-lift space-y-6">
          
          {/* Enable Notifications */}
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🔔</span>
                <div>
                  <div className="text-white font-medium">Push Notifications</div>
                  <div className="text-white/60 text-sm">Get alerts for usage milestones</div>
                </div>
              </div>
              
              <div className="relative">
                <input
                  type="checkbox"
                  checked={preferences.notifications}
                  onChange={(e) => handlePreferenceChange('notifications', e.target.checked)}
                  className="sr-only"
                />
                <div
                  onClick={() => handlePreferenceChange('notifications', !preferences.notifications)}
                  className={`
                    w-12 h-6 rounded-full cursor-pointer transition-colors duration-300
                    ${preferences.notifications ? 'bg-blue-500' : 'bg-white/20'}
                  `}
                >
                  <div
                    className={`
                      w-5 h-5 bg-white rounded-full transition-transform duration-300 mt-0.5
                      ${preferences.notifications ? 'transform translate-x-6 ml-0.5' : 'ml-0.5'}
                    `}
                  />
                </div>
              </div>
            </label>
          </div>

          {preferences.notifications && (
            <div className="ml-11 space-y-4">
              
              {/* Notification Types */}
              <div className="space-y-3">
                <h4 className="text-white font-medium">Alert Types</h4>
                
                {[
                  { id: 'usage70', label: '70% Usage Warning', icon: '⚠️', enabled: true },
                  { id: 'usage90', label: '90% Usage Critical', icon: '🚨', enabled: true },
                  { id: 'dailyUsage', label: 'Daily Usage Summary', icon: '📊', enabled: false },
                  { id: 'highBurnRate', label: 'High Burn Rate Alert', icon: '🔥', enabled: true },
                ].map((alert) => (
                  <label key={alert.id} className="flex items-center justify-between py-2">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{alert.icon}</span>
                      <span className="text-white/80 text-sm">{alert.label}</span>
                    </div>
                    
                    <div className="relative">
                      <div
                        className={`
                          w-10 h-5 rounded-full cursor-pointer transition-colors duration-300
                          ${alert.enabled ? 'bg-green-500' : 'bg-white/20'}
                        `}
                      >
                        <div
                          className={`
                            w-4 h-4 bg-white rounded-full transition-transform duration-300 mt-0.5
                            ${alert.enabled ? 'transform translate-x-5 ml-0.5' : 'ml-0.5'}
                          `}
                        />
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Advanced Settings */}
      {activeTab === 'advanced' && (
        <div className="glass-card p-6 hover-lift space-y-6">
          
          {/* Data Export */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">📤</span>
              <div>
                <div className="text-white font-medium">Data Export</div>
                <div className="text-white/60 text-sm">Export your usage data</div>
              </div>
            </div>

            <div className="ml-11 flex space-x-3">
              <button className="btn btn-primary hover-lift">
                Export CSV
              </button>
              <button className="btn hover-lift">
                Export JSON
              </button>
            </div>
          </div>

          {/* Reset Settings */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🔄</span>
              <div>
                <div className="text-white font-medium">Reset</div>
                <div className="text-white/60 text-sm">Restore default settings</div>
              </div>
            </div>

            <div className="ml-11">
              <button className="btn btn-danger hover-lift">
                Reset All Settings
              </button>
            </div>
          </div>

          {/* Cache Management */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🗄️</span>
              <div>
                <div className="text-white font-medium">Cache</div>
                <div className="text-white/60 text-sm">Manage cached data</div>
              </div>
            </div>

            <div className="ml-11">
              <button className="btn hover-lift">
                Clear Cache
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="glass-card p-6 hover-lift">
        <h3 className="text-white font-semibold mb-4">Quick Stats</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-white font-bold text-lg">{stats.tokensUsed.toLocaleString()}</div>
            <div className="text-white/60">Tokens Used</div>
          </div>
          <div className="text-center">
            <div className="text-white font-bold text-lg">${stats.today.totalCost.toFixed(2)}</div>
            <div className="text-white/60">Today's Cost</div>
          </div>
          <div className="text-center">
            <div className="text-white font-bold text-lg">{stats.burnRate}/hr</div>
            <div className="text-white/60">Burn Rate</div>
          </div>
          <div className="text-center">
            <div className="text-white font-bold text-lg">{Math.round(stats.percentageUsed)}%</div>
            <div className="text-white/60">Usage</div>
          </div>
        </div>
      </div>
    </div>
  );
};