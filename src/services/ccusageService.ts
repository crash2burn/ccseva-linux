import { spawn } from 'child_process';
import { UsageData, UsageStats, DailyUsage, MenuBarData } from '../types/usage';

export class CCUsageService {
  private static instance: CCUsageService;
  private cachedStats: UsageStats | null = null;
  private lastUpdate: number = 0;
  private readonly CACHE_DURATION = 30000; // 30 seconds

  static getInstance(): CCUsageService {
    if (!CCUsageService.instance) {
      CCUsageService.instance = new CCUsageService();
    }
    return CCUsageService.instance;
  }

  async getUsageStats(): Promise<UsageStats> {
    const now = Date.now();
    
    // Return cached data if it's still fresh
    if (this.cachedStats && (now - this.lastUpdate) < this.CACHE_DURATION) {
      return this.cachedStats;
    }

    try {
      const rawData = await this.executeCommand(['--json', '--days', '30']);
      const stats = this.parseUsageData(rawData);
      
      this.cachedStats = stats;
      this.lastUpdate = now;
      
      return stats;
    } catch (error) {
      console.error('Error fetching usage stats:', error);
      
      // Return default stats if error occurs
      return this.getDefaultStats();
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

  private async executeCommand(args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const ccusage = spawn('npx', ['ccusage', ...args]);
      let stdout = '';
      let stderr = '';

      ccusage.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      ccusage.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      ccusage.on('close', (code) => {
        if (code === 0) {
          resolve(stdout.trim());
        } else {
          reject(new Error(`ccusage failed with code ${code}: ${stderr}`));
        }
      });

      ccusage.on('error', (error) => {
        reject(error);
      });
    });
  }

  private parseUsageData(rawData: string): UsageStats {
    try {
      const data = JSON.parse(rawData);
      
      // Ensure data is an array
      const dataArray = Array.isArray(data) ? data : [];
      
      // Calculate totals and process data
      const totalTokens = dataArray.reduce((sum: number, item: any) => sum + (item.totalTokens || 0), 0);
      
      // Get today's usage
      const today = new Date().toISOString().split('T')[0];
      const todayData = dataArray.filter((item: any) => item.date === today);
      const todayTokens = todayData.reduce((sum: number, item: any) => sum + (item.totalTokens || 0), 0);
      const todayCost = todayData.reduce((sum: number, item: any) => sum + (item.estimatedCost || 0), 0);

      // Determine plan and limits
      const currentPlan = this.detectPlan(totalTokens);
      const tokenLimit = this.getTokenLimit(currentPlan);
      
      // Calculate burn rate (tokens per hour over last 24 hours)
      const burnRate = this.calculateBurnRate(dataArray);
      
      return {
        today: {
          date: today,
          totalTokens: todayTokens,
          totalCost: todayCost,
          models: this.groupByModel(todayData)
        },
        thisWeek: this.groupByDay(dataArray, 7),
        thisMonth: this.groupByDay(dataArray, 30),
        burnRate,
        predictedDepleted: this.calculatePredictedDepletion(totalTokens, tokenLimit, burnRate),
        currentPlan,
        tokenLimit,
        tokensUsed: totalTokens,
        tokensRemaining: Math.max(0, tokenLimit - totalTokens),
        percentageUsed: Math.min(100, (totalTokens / tokenLimit) * 100)
      };
    } catch (error) {
      console.error('Error parsing usage data:', error);
      return this.getDefaultStats();
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

    const totalTokens = last24Hours.reduce((sum, item) => sum + (item.totalTokens || 0), 0);
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
      if (!models[item.model]) {
        models[item.model] = { tokens: 0, cost: 0 };
      }
      models[item.model].tokens += item.totalTokens || 0;
      models[item.model].cost += item.estimatedCost || 0;
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
      const totalTokens = dayData.reduce((sum, item) => sum + (item.totalTokens || 0), 0);
      const totalCost = dayData.reduce((sum, item) => sum + (item.estimatedCost || 0), 0);
      
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
    
    return {
      today: {
        date: today,
        totalTokens: 0,
        totalCost: 0,
        models: {}
      },
      thisWeek: [],
      thisMonth: [],
      burnRate: 0,
      predictedDepleted: null,
      currentPlan: 'Pro',
      tokenLimit: 7000,
      tokensUsed: 0,
      tokensRemaining: 7000,
      percentageUsed: 0
    };
  }
}