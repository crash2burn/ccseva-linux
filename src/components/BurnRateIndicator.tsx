import React from 'react';

interface BurnRateIndicatorProps {
  burnRate: number;
  tokensRemaining: number;
  timeRemaining: string;
  onClose: () => void;
}

export const BurnRateIndicator: React.FC<BurnRateIndicatorProps> = ({
  burnRate,
  tokensRemaining,
  timeRemaining,
  onClose
}) => {
  const getBurnRateStatus = () => {
    if (burnRate > 1000) return { status: 'critical', color: 'text-red-400', bg: 'bg-red-500/20' };
    if (burnRate > 500) return { status: 'warning', color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
    if (burnRate > 100) return { status: 'moderate', color: 'text-blue-400', bg: 'bg-blue-500/20' };
    return { status: 'low', color: 'text-green-400', bg: 'bg-green-500/20' };
  };

  const { status, color, bg } = getBurnRateStatus();

  const getEfficiencyTips = () => {
    if (burnRate > 1000) {
      return [
        'Consider reducing context length for simpler queries',
        'Use more specific prompts to avoid back-and-forth',
        'Batch similar requests when possible'
      ];
    }
    if (burnRate > 500) {
      return [
        'Monitor usage during peak activity periods',
        'Consider optimizing prompt efficiency',
        'Review conversation length and complexity'
      ];
    }
    return [
      'Current usage is within normal ranges',
      'Continue with current patterns',
      'Consider advanced features for better productivity'
    ];
  };

  const tips = getEfficiencyTips();

  return (
    <div className="glass-card p-6 hover-lift stagger-children">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-white text-xl font-bold text-shadow">Burn Rate Analysis</h3>
        <button
          onClick={onClose}
          className="btn p-2 hover-scale"
          title="Close Details"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Current Rate */}
        <div className={`${bg} rounded-xl p-4 border border-white/10`}>
          <div className="flex items-center space-x-3 mb-3">
            <div className="text-2xl">🔥</div>
            <div>
              <h4 className="text-white font-semibold">Current Rate</h4>
              <p className="text-white/60 text-sm">Tokens per hour</p>
            </div>
          </div>
          
          <div className={`text-3xl font-bold ${color} mb-2`}>
            {burnRate}
          </div>
          
          <div className="text-white/70 text-sm capitalize">
            {status} usage level
          </div>
        </div>

        {/* Time Projection */}
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="flex items-center space-x-3 mb-3">
            <div className="text-2xl">⏱️</div>
            <div>
              <h4 className="text-white font-semibold">Time Remaining</h4>
              <p className="text-white/60 text-sm">At current rate</p>
            </div>
          </div>
          
          <div className="text-2xl font-bold text-white mb-2">
            {timeRemaining}
          </div>
          
          <div className="text-white/70 text-sm">
            {tokensRemaining.toLocaleString()} tokens left
          </div>
        </div>

        {/* Efficiency Score */}
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="flex items-center space-x-3 mb-3">
            <div className="text-2xl">📈</div>
            <div>
              <h4 className="text-white font-semibold">Efficiency</h4>
              <p className="text-white/60 text-sm">Usage optimization</p>
            </div>
          </div>
          
          <div className="text-2xl font-bold text-white mb-2">
            {burnRate < 100 ? '95%' : burnRate < 500 ? '80%' : burnRate < 1000 ? '65%' : '45%'}
          </div>
          
          <div className="text-white/70 text-sm">
            {burnRate < 500 ? 'Excellent' : burnRate < 1000 ? 'Good' : 'Needs attention'}
          </div>
        </div>
      </div>

      {/* Burn Rate Timeline */}
      <div className="mt-6 bg-white/5 rounded-xl p-4">
        <h4 className="text-white font-semibold mb-4">24-Hour Projection</h4>
        
        <div className="space-y-3">
          {Array.from({ length: 4 }, (_, i) => {
            const hours = (i + 1) * 6;
            const projectedTokens = burnRate * hours;
            const percentage = Math.min((projectedTokens / tokensRemaining) * 100, 100);
            
            return (
              <div key={hours} className="flex items-center space-x-4">
                <div className="text-white/60 text-sm w-12">
                  {hours}h
                </div>
                
                <div className="flex-1">
                  <div className="progress-container h-2">
                    <div
                      className={`progress-bar transition-all duration-1000 ease-out ${
                        percentage > 90 ? 'progress-critical' :
                        percentage > 70 ? 'progress-warning' :
                        'progress-safe'
                      }`}
                      style={{ 
                        width: `${percentage}%`,
                        transitionDelay: `${i * 200}ms`
                      }}
                    />
                  </div>
                </div>
                
                <div className="text-white/70 text-sm w-20 text-right">
                  {projectedTokens.toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Optimization Tips */}
      <div className="mt-6 bg-white/5 rounded-xl p-4">
        <h4 className="text-white font-semibold mb-4 flex items-center space-x-2">
          <span>💡</span>
          <span>Optimization Tips</span>
        </h4>
        
        <div className="space-y-2">
          {tips.map((tip, index) => (
            <div
              key={index}
              className="flex items-start space-x-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
              <span className="text-white/80 text-sm">{tip}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex items-center justify-center space-x-3">
        <button className="btn btn-primary hover-lift">
          Set Usage Alert
        </button>
        <button className="btn hover-lift">
          View History
        </button>
        <button className="btn hover-lift">
          Export Data
        </button>
      </div>
    </div>
  );
};