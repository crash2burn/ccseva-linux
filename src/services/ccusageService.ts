import { 
  UsageStats, 
  DailyUsage, 
  MenuBarData, 
  VelocityInfo, 
  PredictionInfo, 
  ResetTimeInfo,
  UserConfiguration 
} from '../types/usage';
import { ResetTimeService } from './resetTimeService';

export class CCUsageService {
  private static instance: CCUsageService;
  private cachedStats: UsageStats | null = null;
  private lastUpdate: number = 0;
  private readonly CACHE_DURATION = 30000; // 30 seconds
  private resetTimeService: ResetTimeService;
  private historicalData: any[] = []; // Store historical data for trend analysis

  constructor() {
    this.resetTimeService = ResetTimeService.getInstance();
  }

  static getInstance(): CCUsageService {
    if (!CCUsageService.instance) {
      CCUsageService.instance = new CCUsageService();
    }
    return CCUsageService.instance;
  }

  updateConfiguration(config: Partial<UserConfiguration>): void {
    this.resetTimeService.updateConfiguration(config);
    // Clear cache to force recalculation with new config
    this.cachedStats = null;
  }

  async getUsageStats(): Promise<UsageStats> {
    const now = Date.now();
    
    // Return cached data if it's still fresh
    if (this.cachedStats && (now - this.lastUpdate) < this.CACHE_DURATION) {
      return this.cachedStats;
    }

    try {
      // Get daily usage data using the ccusage data-loader API
      const { loadDailyUsageData } = await import('ccusage/data-loader');
      const dailyData = await loadDailyUsageData();
      
      const stats = this.parseUsageData(dailyData);
      
      this.cachedStats = stats;
      this.lastUpdate = now;
      
      return stats;
    } catch (error) {
      console.error('Error fetching usage stats:', error);
      console.log('Falling back to mock data for development/testing');
      
      // Return mock data for development/testing
      return this.getMockStats();
    }
  }

  async getMenuBarData(): Promise<MenuBarData> {
    const stats = await this.getUsageStats();
    
    return {
      tokensUsed: stats.tokensUsed,
      tokenLimit: stats.tokenLimit,
      percentageUsed: stats.percentageUsed,
      status: this.getUsageStatus(stats.percentageUsed),
      cost: stats.today.totalCost
    };
  }

  private getMockStats(): UsageStats {
    const today = new Date().toISOString().split('T')[0];
    const tokensUsed = 4200;
    const tokenLimit = 7000;
    const todayCost = 2.45;
    const burnRate = 35;
    
    // Create mock data for enhanced features
    const resetInfo = this.resetTimeService.calculateResetInfo();
    const velocity: VelocityInfo = {
      current: burnRate,
      average24h: 32,
      average7d: 28,
      trend: 'increasing',
      trendPercent: 12.5,
      peakHour: 14, // 2 PM
      isAccelerating: true
    };
    
    const prediction: PredictionInfo = {
      depletionTime: new Date(Date.now() + 80 * 60 * 60 * 1000).toISOString(),
      confidence: 85,
      daysRemaining: 3.3,
      recommendedDailyLimit: 950,
      onTrackForReset: true
    };
    
    return {
      today: {
        date: today,
        totalTokens: 850,
        totalCost: todayCost,
        models: {
          'claude-3-5-sonnet-20241022': { tokens: 650, cost: 1.95 },
          'claude-3-haiku-20240307': { tokens: 200, cost: 0.50 }
        }
      },
      thisWeek: this.generateMockWeekData(),
      thisMonth: this.generateMockMonthData(),
      burnRate, // legacy field
      velocity,
      prediction,
      resetInfo,
      predictedDepleted: prediction.depletionTime, // legacy field
      currentPlan: 'Pro',
      tokenLimit,
      tokensUsed,
      tokensRemaining: tokenLimit - tokensUsed,
      percentageUsed: (tokensUsed / tokenLimit) * 100
    };
  }

  private generateMockWeekData(): DailyUsage[] {
    const result: DailyUsage[] = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const tokens = Math.floor(Math.random() * 1000) + 200;
      const cost = tokens * 0.003; // Mock cost calculation
      
      result.push({
        date: dateStr,
        totalTokens: tokens,
        totalCost: cost,
        models: {
          'claude-3-5-sonnet-20241022': { 
            tokens: Math.floor(tokens * 0.7), 
            cost: cost * 0.7 
          },
          'claude-3-haiku-20240307': { 
            tokens: Math.floor(tokens * 0.3), 
            cost: cost * 0.3 
          }
        }
      });
    }
    
    return result;
  }

  private generateMockMonthData(): DailyUsage[] {
    const result: DailyUsage[] = [];
    const now = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const tokens = Math.floor(Math.random() * 800) + 100;
      const cost = tokens * 0.003;
      
      result.push({
        date: dateStr,
        totalTokens: tokens,
        totalCost: cost,
        models: {
          'claude-3-5-sonnet-20241022': { 
            tokens: Math.floor(tokens * 0.6), 
            cost: cost * 0.6 
          },
          'claude-3-haiku-20240307': { 
            tokens: Math.floor(tokens * 0.4), 
            cost: cost * 0.4 
          }
        }
      });
    }
    
    return result;
  }

  private parseUsageData(dailyData: any): UsageStats {
    try {
      // The API returns structured data, no need to parse JSON
      const dailyArray = Array.isArray(dailyData) ? dailyData : [];
      
      // Get today's data from the daily array
      const todayStr = new Date().toISOString().split('T')[0];
      const todayArray = dailyArray.filter((item: any) => item.date === todayStr);
      
      // Calculate totals
      const totalTokens = dailyArray.reduce((sum: number, item: any) => {
        return sum + (item.inputTokens || 0) + (item.outputTokens || 0) + (item.cacheCreationTokens || 0);
      }, 0);
      
      const totalCost = dailyArray.reduce((sum: number, item: any) => {
        return sum + (item.totalCost || item.cost || 0);
      }, 0);
      
      // Today's usage
      const todayTokens = todayArray.reduce((sum: number, item: any) => {
        return sum + (item.inputTokens || 0) + (item.outputTokens || 0) + (item.cacheCreationTokens || 0);
      }, 0);
      
      const todayCost = todayArray.reduce((sum: number, item: any) => {
        return sum + (item.totalCost || item.cost || 0);
      }, 0);

      // Determine plan and limits based on current month usage
      const currentPlan = this.detectPlan(totalTokens);
      const tokenLimit = this.getTokenLimit(currentPlan);
      
      // Calculate enhanced metrics
      const burnRate = this.calculateBurnRate(dailyArray);
      const velocity = this.calculateVelocityInfo(dailyArray);
      const resetInfo = this.resetTimeService.calculateResetInfo();
      const prediction = this.calculatePredictionInfo(totalTokens, tokenLimit, velocity, resetInfo);
      
      const todayDate = new Date().toISOString().split('T')[0];
      
      return {
        today: {
          date: todayDate,
          totalTokens: todayTokens,
          totalCost: todayCost,
          models: this.groupByModel(todayArray)
        },
        thisWeek: this.groupByDay(dailyArray, 7),
        thisMonth: this.groupByDay(dailyArray, 30),
        burnRate, // legacy field
        velocity,
        prediction,
        resetInfo,
        predictedDepleted: prediction.depletionTime, // legacy field
        currentPlan,
        tokenLimit,
        tokensUsed: totalTokens,
        tokensRemaining: Math.max(0, tokenLimit - totalTokens),
        percentageUsed: Math.min(100, (totalTokens / tokenLimit) * 100)
      };
    } catch (error) {
      console.error('Error parsing usage data:', error);
      return this.getMockStats();
    }
  }

  private detectPlan(totalTokens: number): 'Pro' | 'Max5' | 'Max20' | 'Custom' {
    if (totalTokens <= 7000) return 'Pro';
    if (totalTokens <= 35000) return 'Max5';
    if (totalTokens <= 140000) return 'Max20';
    return 'Custom';
  }

  private getTokenLimit(plan: string): number {
    switch (plan) {
      case 'Pro': return 7000;
      case 'Max5': return 35000;
      case 'Max20': return 140000;
      default: return 500000; // Custom high limit
    }
  }

  private calculateBurnRate(data: any[]): number {
    const last24Hours = data.filter(item => {
      const itemDate = new Date(item.date);
      const now = new Date();
      const hoursDiff = (now.getTime() - itemDate.getTime()) / (1000 * 60 * 60);
      return hoursDiff <= 24;
    });

    const totalTokens = last24Hours.reduce((sum, item) => {
      return sum + (item.inputTokens || 0) + (item.outputTokens || 0) + (item.cacheCreationTokens || 0);
    }, 0);
    return Math.round(totalTokens / 24); // tokens per hour
  }

  private calculatePredictedDepletion(tokensUsed: number, tokenLimit: number, burnRate: number): string | null {
    if (burnRate <= 0) return null;
    
    const tokensRemaining = tokenLimit - tokensUsed;
    if (tokensRemaining <= 0) return 'Depleted';
    
    const hoursRemaining = tokensRemaining / burnRate;
    const depletionDate = new Date(Date.now() + hoursRemaining * 60 * 60 * 1000);
    
    return depletionDate.toISOString();
  }

  private groupByModel(data: any[]): { [key: string]: { tokens: number; cost: number } } {
    const models: { [key: string]: { tokens: number; cost: number } } = {};
    
    data.forEach(item => {
      if (item.modelBreakdowns && Array.isArray(item.modelBreakdowns)) {
        item.modelBreakdowns.forEach((breakdown: any) => {
          const modelName = breakdown.modelName || 'unknown';
          if (!models[modelName]) {
            models[modelName] = { tokens: 0, cost: 0 };
          }
          models[modelName].tokens += (breakdown.inputTokens || 0) + (breakdown.outputTokens || 0) + (breakdown.cacheCreationTokens || 0);
          models[modelName].cost += breakdown.cost || 0;
        });
      }
    });
    
    return models;
  }

  private groupByDay(data: any[], days: number): DailyUsage[] {
    const result: DailyUsage[] = [];
    const now = new Date();
    
    for (let i = 0; i < days; i++) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayData = data.filter(item => item.date === dateStr);
      const totalTokens = dayData.reduce((sum, item) => {
        return sum + (item.inputTokens || 0) + (item.outputTokens || 0) + (item.cacheCreationTokens || 0);
      }, 0);
      const totalCost = dayData.reduce((sum, item) => {
        return sum + (item.totalCost || item.cost || 0);
      }, 0);
      
      result.push({
        date: dateStr,
        totalTokens,
        totalCost,
        models: this.groupByModel(dayData)
      });
    }
    
    return result.reverse();
  }

  private getUsageStatus(percentageUsed: number): 'safe' | 'warning' | 'critical' {
    if (percentageUsed >= 90) return 'critical';
    if (percentageUsed >= 70) return 'warning';
    return 'safe';
  }

  private getDefaultStats(): UsageStats {
    const today = new Date().toISOString().split('T')[0];
    const resetInfo = this.resetTimeService.calculateResetInfo();
    
    const velocity: VelocityInfo = {
      current: 0,
      average24h: 0,
      average7d: 0,
      trend: 'stable',
      trendPercent: 0,
      peakHour: 12,
      isAccelerating: false
    };
    
    const prediction: PredictionInfo = {
      depletionTime: null,
      confidence: 0,
      daysRemaining: 0,
      recommendedDailyLimit: 0,
      onTrackForReset: true
    };
    
    return {
      today: {
        date: today,
        totalTokens: 0,
        totalCost: 0,
        models: {}
      },
      thisWeek: [],
      thisMonth: [],
      burnRate: 0, // legacy field
      velocity,
      prediction,
      resetInfo,
      predictedDepleted: null, // legacy field
      currentPlan: 'Pro',
      tokenLimit: 7000,
      tokensUsed: 0,
      tokensRemaining: 7000,
      percentageUsed: 0
    };
  }

  /**
   * Calculate enhanced velocity information based on Python implementation
   */
  private calculateVelocityInfo(data: any[]): VelocityInfo {
    const now = new Date();
    
    // Current burn rate (last 24 hours)
    const current = this.calculateBurnRate(data);
    
    // 24-hour average
    const last24Hours = data.filter(item => {
      const itemDate = new Date(item.date);
      const hoursDiff = (now.getTime() - itemDate.getTime()) / (1000 * 60 * 60);
      return hoursDiff <= 24;
    });
    const average24h = this.calculateAverageBurnRate(last24Hours);
    
    // 7-day average
    const last7Days = data.filter(item => {
      const itemDate = new Date(item.date);
      const daysDiff = (now.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 7;
    });
    const average7d = this.calculateAverageBurnRate(last7Days);
    
    // Trend analysis
    const trendPercent = average24h > 0 ? ((current - average24h) / average24h) * 100 : 0;
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    
    if (Math.abs(trendPercent) > 15) { // 15% threshold for trend detection
      trend = trendPercent > 0 ? 'increasing' : 'decreasing';
    }
    
    // Peak hour analysis
    const peakHour = this.calculatePeakUsageHour(data);
    
    return {
      current,
      average24h,
      average7d,
      trend,
      trendPercent: Math.round(trendPercent * 10) / 10,
      peakHour,
      isAccelerating: trend === 'increasing' && trendPercent > 20
    };
  }

  /**
   * Calculate prediction information with confidence levels
   */
  private calculatePredictionInfo(
    tokensUsed: number,
    tokenLimit: number,
    velocity: VelocityInfo,
    resetInfo: ResetTimeInfo
  ): PredictionInfo {
    const tokensRemaining = Math.max(0, tokenLimit - tokensUsed);
    
    // Calculate confidence based on data availability and consistency
    let confidence = 50; // Base confidence
    if (velocity.current > 0 && velocity.average24h > 0) {
      confidence = Math.min(95, confidence + 30);
      
      // Reduce confidence if trend is highly volatile
      if (Math.abs(velocity.trendPercent) > 50) {
        confidence -= 20;
      }
    }
    
    // Predicted depletion time
    let depletionTime: string | null = null;
    let daysRemaining = 0;
    
    if (velocity.current > 0) {
      const hoursRemaining = tokensRemaining / velocity.current;
      daysRemaining = hoursRemaining / 24;
      depletionTime = new Date(Date.now() + hoursRemaining * 60 * 60 * 1000).toISOString();
    }
    
    // Recommended daily limit to last until reset
    const recommendedDailyLimit = this.resetTimeService.calculateRecommendedDailyLimit(
      tokensRemaining, 
      resetInfo
    );
    
    // Check if on track for reset
    const onTrackForReset = this.resetTimeService.isOnTrackForReset(
      tokensUsed,
      tokenLimit,
      resetInfo
    );
    
    return {
      depletionTime,
      confidence: Math.round(confidence),
      daysRemaining: Math.round(daysRemaining * 10) / 10,
      recommendedDailyLimit,
      onTrackForReset
    };
  }

  /**
   * Calculate average burn rate for a given dataset
   */
  private calculateAverageBurnRate(data: any[]): number {
    if (data.length === 0) return 0;
    
    const totalTokens = data.reduce((sum, item) => {
      return sum + (item.inputTokens || 0) + (item.outputTokens || 0) + (item.cacheCreationTokens || 0);
    }, 0);
    
    const totalHours = data.length * 24; // Assuming daily data points
    return totalHours > 0 ? Math.round(totalTokens / totalHours) : 0;
  }

  /**
   * Calculate peak usage hour (simplified version)
   */
  private calculatePeakUsageHour(data: any[]): number {
    // Simplified: assume afternoon hours are peak usage
    // In a real implementation, this would analyze hourly usage patterns
    return 14; // 2 PM
  }

  /**
   * Enhanced menu bar data with reset time information
   */
  async getEnhancedMenuBarData(): Promise<MenuBarData> {
    const stats = await this.getUsageStats();
    
    return {
      tokensUsed: stats.tokensUsed,
      tokenLimit: stats.tokenLimit,
      percentageUsed: stats.percentageUsed,
      status: this.getUsageStatus(stats.percentageUsed),
      cost: stats.today.totalCost,
      timeUntilReset: this.resetTimeService.formatTimeUntilReset(stats.resetInfo.timeUntilReset),
      resetInfo: stats.resetInfo
    };
  }
}