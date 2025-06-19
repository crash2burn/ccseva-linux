export interface UsageData {
  date: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheTokens: number;
  totalTokens: number;
  estimatedCost: number;
}

export interface DailyUsage {
  date: string;
  totalTokens: number;
  totalCost: number;
  models: {
    [key: string]: {
      tokens: number;
      cost: number;
    };
  };
}

export interface UsageStats {
  today: DailyUsage;
  thisWeek: DailyUsage[];
  thisMonth: DailyUsage[];
  burnRate: number; // tokens per hour
  predictedDepleted: string | null; // when tokens will run out
  currentPlan: 'Pro' | 'Max5' | 'Max20' | 'Custom';
  tokenLimit: number;
  tokensUsed: number;
  tokensRemaining: number;
  percentageUsed: number;
}

export interface MenuBarData {
  tokensUsed: number;
  tokenLimit: number;
  percentageUsed: number;
  status: 'safe' | 'warning' | 'critical';
  cost: number;
}