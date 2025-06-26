import type React from 'react';
import { useState } from 'react';
import type { UsageStats } from '../types/usage';
import { Button } from './ui/button';

interface SettingsPanelProps {
  preferences: {
    autoRefresh: boolean;
    refreshInterval: number;
    theme: 'auto' | 'light' | 'dark';
    notifications: boolean;
    animationsEnabled: boolean;
    timezone?: string;
    resetHour?: number;
  };
  onUpdatePreferences: (preferences: Partial<SettingsPanelProps['preferences']>) => void;
  stats: UsageStats;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  preferences,
  onUpdatePreferences,
  stats,
}) => {
  const handlePreferenceChange = (key: string, value: boolean | number | string) => {
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
        <p className="text-white/70">Customize your CCSeva experience</p>
      </div>

      {/* General Settings */}
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handlePreferenceChange('autoRefresh', !preferences.autoRefresh);
                  }
                }}
                tabIndex={0}
                role="switch"
                aria-checked={preferences.autoRefresh}
                aria-label="Auto refresh toggle"
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
                onChange={(e) =>
                  handlePreferenceChange('refreshInterval', Number.parseInt(e.target.value))
                }
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
              <Button
                key={theme}
                onClick={() => handlePreferenceChange('theme', theme)}
                variant="outline"
                className={`
                    p-3 h-auto flex-col text-sm font-medium transition-all duration-300 hover:scale-105
                    ${
                      preferences.theme === theme
                        ? 'border-blue-400 bg-blue-500/20 text-white hover:bg-blue-500/30'
                        : 'border-white/20 bg-white/5 text-white/70 hover:border-white/40 hover:bg-white/10'
                    }
                  `}
              >
                {theme === 'auto' && '🌓'} {theme === 'light' && '☀️'} {theme === 'dark' && '🌙'}
                <div className="capitalize mt-1">{theme}</div>
              </Button>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div className="space-y-3">
          <label className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🔔</span>
              <div>
                <div className="text-white font-medium">Notifications</div>
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handlePreferenceChange('notifications', !preferences.notifications);
                  }
                }}
                tabIndex={0}
                role="switch"
                aria-checked={preferences.notifications}
                aria-label="Notifications toggle"
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
                onClick={() =>
                  handlePreferenceChange('animationsEnabled', !preferences.animationsEnabled)
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handlePreferenceChange('animationsEnabled', !preferences.animationsEnabled);
                  }
                }}
                tabIndex={0}
                role="switch"
                aria-checked={preferences.animationsEnabled}
                className={`
                    w-12 h-6 rounded-full cursor-pointer transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400
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

        {/* Timezone Configuration */}
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🌍</span>
            <div>
              <div className="text-white font-medium">Timezone</div>
              <div className="text-white/60 text-sm">
                Set your timezone for accurate reset times
              </div>
            </div>
          </div>

          <div className="ml-11 space-y-3">
            <select
              value={preferences.timezone || 'America/Los_Angeles'}
              onChange={(e) => handlePreferenceChange('timezone', e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-400 focus:outline-none"
            >
              <optgroup label="US Timezones" className="bg-gray-800">
                <option value="America/Los_Angeles" className="bg-gray-800">
                  Pacific Time (PT)
                </option>
                <option value="America/Denver" className="bg-gray-800">
                  Mountain Time (MT)
                </option>
                <option value="America/Chicago" className="bg-gray-800">
                  Central Time (CT)
                </option>
                <option value="America/New_York" className="bg-gray-800">
                  Eastern Time (ET)
                </option>
              </optgroup>
              <optgroup label="International" className="bg-gray-800">
                <option value="Europe/London" className="bg-gray-800">
                  London (GMT)
                </option>
                <option value="Europe/Paris" className="bg-gray-800">
                  Paris (CET)
                </option>
                <option value="Asia/Tokyo" className="bg-gray-800">
                  Tokyo (JST)
                </option>
                <option value="Asia/Shanghai" className="bg-gray-800">
                  Shanghai (CST)
                </option>
                <option value="Australia/Sydney" className="bg-gray-800">
                  Sydney (AEDT)
                </option>
                <option value="UTC" className="bg-gray-800">
                  UTC
                </option>
              </optgroup>
            </select>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-white/70 text-sm mb-1">Reset Hour</div>
                <select
                  value={preferences.resetHour || 0}
                  onChange={(e) =>
                    handlePreferenceChange('resetHour', Number.parseInt(e.target.value))
                  }
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-400 focus:outline-none"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={`reset-hour-${i.toString().padStart(2, '0')}`} value={i} className="bg-gray-800">
                      {i.toString().padStart(2, '0')}:00
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="text-white/70 text-sm mb-1">Current Time</div>
                <div className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
                  {new Date().toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: preferences.timezone || 'America/Los_Angeles',
                  })}
                </div>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <div className="text-blue-300 text-sm">
                <span className="text-lg mr-2">ℹ️</span>
                Next reset:{' '}
                {stats.resetInfo
                  ? new Date(stats.resetInfo.nextResetTime).toLocaleString([], {
                      timeZone: preferences.timezone || 'America/Los_Angeles',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Not available'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
