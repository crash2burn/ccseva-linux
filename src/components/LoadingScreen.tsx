import type React from 'react';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="h-screen w-full gradient-bg flex items-center justify-center">
      <div className="glass-card p-8 text-center max-w-sm w-full">
        
        {/* Animated Logo */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center floating">
              <span className="text-white text-2xl font-bold">CC</span>
            </div>
            
            {/* Orbital rings */}
            <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-spin" style={{ animationDuration: '3s' }}></div>
            <div className="absolute inset-2 rounded-full border border-white/10 animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }}></div>
          </div>
        </div>

        {/* Loading Text */}
        <h2 className="text-white text-xl font-bold mb-3 text-shadow">
          CCSeva
        </h2>
        <p className="text-white/80 text-sm mb-6">
          Initializing usage tracking...
        </p>

        {/* Loading Spinner */}
        <div className="flex justify-center mb-6">
          <div className="loading-spinner"></div>
        </div>

        {/* Loading Steps */}
        <div className="space-y-2 text-left">
          <div className="flex items-center space-x-3 text-sm">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-white/70">Connecting to Claude Code...</span>
          </div>
          <div className="flex items-center space-x-3 text-sm">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <span className="text-white/70">Loading usage data...</span>
          </div>
          <div className="flex items-center space-x-3 text-sm">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            <span className="text-white/70">Preparing dashboard...</span>
          </div>
        </div>

        {/* Progress Dots */}
        <div className="loading-dots mt-6 justify-center">
          <div className="loading-dot"></div>
          <div className="loading-dot"></div>
          <div className="loading-dot"></div>
        </div>
      </div>
    </div>
  );
};