import React, { useEffect, useState } from 'react';

interface ModelData {
  tokens: number;
  cost: number;
}

interface ModelBreakdownProps {
  models: { [key: string]: ModelData };
  animationEnabled?: boolean;
  className?: string;
}

export const ModelBreakdown: React.FC<ModelBreakdownProps> = ({
  models,
  animationEnabled = true,
  className = ''
}) => {
  const [animatedPercentages, setAnimatedPercentages] = useState<{ [key: string]: number }>({});
  
  // Calculate total tokens and percentages
  const totalTokens = Object.values(models).reduce((sum, model) => sum + model.tokens, 0);
  const modelEntries = Object.entries(models).map(([name, data]) => ({
    name: name.replace('claude-', '').replace('-20250514', ''), // Clean up model names
    ...data,
    percentage: totalTokens > 0 ? (data.tokens / totalTokens) * 100 : 0
  })).sort((a, b) => b.tokens - a.tokens);

  useEffect(() => {
    if (animationEnabled) {
      const timer = setTimeout(() => {
        const newPercentages: { [key: string]: number } = {};
        modelEntries.forEach(model => {
          newPercentages[model.name] = model.percentage;
        });
        setAnimatedPercentages(newPercentages);
      }, 200);
      return () => clearTimeout(timer);
    } else {
      const percentages: { [key: string]: number } = {};
      modelEntries.forEach(model => {
        percentages[model.name] = model.percentage;
      });
      setAnimatedPercentages(percentages);
    }
  }, [JSON.stringify(models), animationEnabled]);

  const getModelColor = (index: number) => {
    const colors = [
      'from-blue-500 to-blue-600',
      'from-purple-500 to-purple-600',
      'from-green-500 to-green-600',
      'from-yellow-500 to-yellow-600',
      'from-red-500 to-red-600',
      'from-indigo-500 to-indigo-600'
    ];
    return colors[index % colors.length];
  };

  const getModelIcon = (modelName: string) => {
    if (modelName.toLowerCase().includes('sonnet')) return '🎵';
    if (modelName.toLowerCase().includes('opus')) return '🎭';
    if (modelName.toLowerCase().includes('haiku')) return '🌸';
    return '🤖';
  };

  const formatTokens = (tokens: number) => {
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
    return tokens.toString();
  };

  if (modelEntries.length === 0) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-center h-48 text-white/60">
          <div className="text-center">
            <div className="text-4xl mb-2">📊</div>
            <p>No model data available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      
      {/* Model List */}
      <div className="space-y-3">
        {modelEntries.map((model, index) => (
          <div
            key={model.name}
            className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-all duration-300 group cursor-pointer"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <div className="text-xl group-hover:scale-110 transition-transform duration-200">
                  {getModelIcon(model.name)}
                </div>
                <div>
                  <h4 className="text-white font-medium capitalize">{model.name}</h4>
                  <p className="text-white/60 text-sm">{formatTokens(model.tokens)} tokens</p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-white font-bold">
                  {(animatedPercentages[model.name] || 0).toFixed(1)}%
                </div>
                <div className="text-white/60 text-sm">
                  ${model.cost.toFixed(3)}
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="progress-container h-2">
              <div
                className={`progress-bar bg-gradient-to-r ${getModelColor(index)} transition-all duration-1000 ease-out`}
                style={{ 
                  width: `${animatedPercentages[model.name] || 0}%`,
                  transitionDelay: `${index * 200}ms`
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="bg-white/5 rounded-lg p-3 text-center">
          <div className="text-white/60 mb-1">Most Used</div>
          <div className="text-white font-medium flex items-center justify-center space-x-1">
            <span>{getModelIcon(modelEntries[0]?.name || '')}</span>
            <span>{modelEntries[0]?.name || 'N/A'}</span>
          </div>
        </div>
        
        <div className="bg-white/5 rounded-lg p-3 text-center">
          <div className="text-white/60 mb-1">Total Cost</div>
          <div className="text-white font-medium">
            ${Object.values(models).reduce((sum, model) => sum + model.cost, 0).toFixed(3)}
          </div>
        </div>
      </div>
    </div>
  );
};