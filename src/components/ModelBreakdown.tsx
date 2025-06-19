import React from 'react';

interface ModelBreakdownProps {
  models: { [key: string]: { tokens: number; cost: number } };
  className?: string;
}

export const ModelBreakdown: React.FC<ModelBreakdownProps> = ({
  models,
  className = ''
}) => {
  const modelEntries = Object.entries(models);
  
  if (modelEntries.length === 0) {
    return (
      <div className={`gradient-card rounded-lg p-4 ${className}`}>
        <h3 className="text-white/80 text-sm font-medium mb-4">Model Usage</h3>
        <div className="text-white/60 text-center py-4">No model data available</div>
      </div>
    );
  }

  const totalTokens = modelEntries.reduce((sum, [, data]) => sum + data.tokens, 0);
  const totalCost = modelEntries.reduce((sum, [, data]) => sum + data.cost, 0);

  const getModelColor = (model: string) => {
    const colors = {
      'opus': 'from-purple-500 to-pink-500',
      'sonnet': 'from-blue-500 to-cyan-500',
      'haiku': 'from-green-500 to-teal-500',
    };
    
    const modelLower = model.toLowerCase();
    for (const [key, color] of Object.entries(colors)) {
      if (modelLower.includes(key)) {
        return color;
      }
    }
    
    return 'from-gray-500 to-gray-600';
  };

  const getModelDisplayName = (model: string) => {
    if (model.includes('opus')) return 'Claude Opus';
    if (model.includes('sonnet')) return 'Claude Sonnet';
    if (model.includes('haiku')) return 'Claude Haiku';
    return model;
  };

  return (
    <div className={`gradient-card rounded-lg p-4 ${className}`}>
      <h3 className="text-white/80 text-sm font-medium mb-4">Model Usage Today</h3>
      
      <div className="space-y-3">
        {modelEntries.map(([model, data]) => {
          const percentage = totalTokens > 0 ? (data.tokens / totalTokens) * 100 : 0;
          const colorClass = getModelColor(model);
          
          return (
            <div key={model} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-white text-sm font-medium">
                  {getModelDisplayName(model)}
                </span>
                <span className="text-white/60 text-xs">
                  {Math.round(percentage)}%
                </span>
              </div>
              
              <div className="w-full bg-white/20 rounded-full h-2">
                <div
                  className={`h-2 rounded-full bg-gradient-to-r ${colorClass} transition-all duration-300`}
                  style={{ width: `${Math.max(percentage, 2)}%` }}
                />
              </div>
              
              <div className="flex justify-between text-xs text-white/60">
                <span>{data.tokens.toLocaleString()} tokens</span>
                <span>${data.cost.toFixed(3)}</span>
              </div>
            </div>
          );
        })}
      </div>
      
      {totalCost > 0 && (
        <div className="mt-4 pt-3 border-t border-white/20">
          <div className="flex justify-between text-sm">
            <span className="text-white/80">Total Cost:</span>
            <span className="text-white font-medium">${totalCost.toFixed(3)}</span>
          </div>
        </div>
      )}
    </div>
  );
};