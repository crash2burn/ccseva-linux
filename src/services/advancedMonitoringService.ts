import { EnhancedResetTimeService, EnhancedResetTimeInfo } from './enhancedResetTimeService.js';
import { AutoPlanManager, PlanType, PlanRecommendation } from './autoPlanManager.js';
import { AdvancedBurnRateAnalyzer, BurnRateAnalytics, SessionBlock } from './advancedBurnRateAnalyzer.js';
import { PredictionEngine, PredictionInfo } from './predictionEngine.js';
import { TokenLimitDetector, TokenLimitDetection } from './tokenLimitDetector.js';

export interface AdvancedMonitoringConfig {
  enableAutoSwitching: boolean;
  enableIntervalResets: boolean;
  resetSchedule: {
    type: 'interval' | 'monthly';
    timezone: string;
    intervalHours?: number[];
  };
  updateInterval: number; // milliseconds
  confidenceThresholds: {
    autoSwitch: number;
    limitDetection: number;
    predictions: number;
  };
}

export interface AdvancedUsageAnalytics {
  enhancedResetInfo: EnhancedResetTimeInfo;
  burnRateAnalytics: BurnRateAnalytics;
  planRecommendation: PlanRecommendation;
  predictionInfo: PredictionInfo;
  limitDetection: TokenLimitDetection;
  riskAssessment: {
    level: 'low' | 'medium' | 'high' | 'critical';
    factors: string[];
    recommendations: string[];
  };
  lastUpdated: string;
}

export class AdvancedMonitoringService {
  private static instance: AdvancedMonitoringService;
  
  private resetTimeService: EnhancedResetTimeService;
  private planManager: AutoPlanManager;
  private burnRateAnalyzer: AdvancedBurnRateAnalyzer;
  private predictionEngine: PredictionEngine;
  private limitDetector: TokenLimitDetector;
  
  private config: AdvancedMonitoringConfig = {
    enableAutoSwitching: true,
    enableIntervalResets: true,
    resetSchedule: {
      type: 'interval',
      timezone: 'America/Los_Angeles',
      intervalHours: [4, 9, 14, 18, 23]
    },
    updateInterval: 5000, // 5 seconds like Python script
    confidenceThresholds: {
      autoSwitch: 80,
      limitDetection: 75,
      predictions: 70
    }
  };

  private constructor(config?: Partial<AdvancedMonitoringConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    
    // Initialize services
    this.resetTimeService = EnhancedResetTimeService.getInstance({
      type: this.config.resetSchedule.type,
      timezone: this.config.resetSchedule.timezone,
      resetHours: this.config.resetSchedule.intervalHours
    });
    
    this.planManager = AutoPlanManager.getInstance();
    this.planManager.setAutoSwitchEnabled(this.config.enableAutoSwitching);
    
    this.burnRateAnalyzer = AdvancedBurnRateAnalyzer.getInstance();
    this.predictionEngine = PredictionEngine.getInstance();
    this.limitDetector = TokenLimitDetector.getInstance();
  }

  static getInstance(config?: Partial<AdvancedMonitoringConfig>): AdvancedMonitoringService {
    if (!AdvancedMonitoringService.instance) {
      AdvancedMonitoringService.instance = new AdvancedMonitoringService(config);
    }
    return AdvancedMonitoringService.instance;
  }

  /**
   * Perform comprehensive usage analysis
   */
  async analyzeUsage(
    sessionBlocks: SessionBlock[],
    currentTokens: number,
    currentTime: Date = new Date()
  ): Promise<AdvancedUsageAnalytics> {
    // Calculate enhanced reset information
    const enhancedResetInfo = this.resetTimeService.calculateEnhancedResetInfo(currentTime);
    
    // Perform advanced burn rate analysis
    const burnRateAnalytics = this.burnRateAnalyzer.calculateBurnRate(sessionBlocks, currentTime);
    
    // Analyze plan requirements and perform auto-switching if enabled
    const historicalSessions = sessionBlocks.map(block => ({
      totalTokens: this.getTotalTokensFromBlock(block),
      startTime: block.startTime,
      endTime: block.actualEndTime || block.endTime,
      isActive: block.isActive
    }));
    
    const planRecommendation = this.planManager.analyzePlan(currentTokens, historicalSessions);
    
    // Perform auto-switching if conditions are met
    if (this.config.enableAutoSwitching && 
        planRecommendation.confidence >= this.config.confidenceThresholds.autoSwitch) {
      const switchResult = this.planManager.autoSwitch(currentTokens, planRecommendation);
      if (switchResult.switched) {
        console.log(`Auto-switched plan: ${switchResult.event?.fromPlan} → ${switchResult.event?.toPlan}`);
      }
    }
    
    // Detect token limits
    const sessionData = sessionBlocks.map(block => ({
      id: block.id,
      totalTokens: this.getTotalTokensFromBlock(block),
      startTime: block.startTime,
      endTime: block.actualEndTime || block.endTime,
      isActive: block.isActive,
      isGap: block.isGap
    }));
    
    const limitDetection = this.limitDetector.detectLimit(
      sessionData, 
      this.planManager.getState().currentPlan
    );
    
    // Generate predictions
    const tokensRemaining = Math.max(0, this.planManager.getCurrentLimit() - currentTokens);
    const predictionInfo = this.predictionEngine.calculateDepletion(
      tokensRemaining,
      burnRateAnalytics,
      enhancedResetInfo
    );
    
    // Perform risk assessment
    const riskAssessment = this.performRiskAssessment(
      enhancedResetInfo,
      burnRateAnalytics,
      predictionInfo,
      planRecommendation
    );
    
    return {
      enhancedResetInfo,
      burnRateAnalytics,
      planRecommendation,
      predictionInfo,
      limitDetection,
      riskAssessment,
      lastUpdated: currentTime.toISOString()
    };
  }

  /**
   * Perform comprehensive risk assessment
   */
  private performRiskAssessment(
    resetInfo: EnhancedResetTimeInfo,
    burnRate: BurnRateAnalytics,
    prediction: PredictionInfo,
    planRecommendation: PlanRecommendation
  ): AdvancedUsageAnalytics['riskAssessment'] {
    const factors: string[] = [];
    const recommendations: string[] = [];
    let level: 'low' | 'medium' | 'high' | 'critical' = 'low';
    
    // Assess time-based risk
    if (resetInfo.isInCriticalPeriod) {
      factors.push('Approaching reset deadline');
      if (level < 'medium') level = 'medium';
    }
    
    // Assess burn rate risk
    if (burnRate.velocity.classification === 'very_fast') {
      factors.push('Very high token consumption rate');
      if (level < 'high') level = 'high';
    } else if (burnRate.velocity.classification === 'fast') {
      factors.push('High token consumption rate');
      if (level < 'medium') level = 'medium';
    }
    
    // Assess trend risk
    if (burnRate.trend.direction === 'increasing' && burnRate.trend.percentage > 25) {
      factors.push('Usage rate is increasing rapidly');
      if (level < 'medium') level = 'medium';
    }
    
    // Assess prediction risk
    if (prediction.riskLevel === 'critical') {
      factors.push('Critical depletion risk');
      level = 'critical';
    } else if (prediction.riskLevel === 'high' && level < 'high') {
      factors.push('High depletion risk');
      level = 'high';
    }
    
    // Assess plan risk
    if (planRecommendation.urgency === 'high') {
      factors.push('Plan upgrade urgently needed');
      if (level < 'high') level = 'high';
    }
    
    // Generate recommendations based on risk level
    switch (level) {
      case 'critical':
        recommendations.push('Immediate action required - stop non-essential usage');
        recommendations.push('Consider upgrading plan if available');
        break;
      case 'high':
        recommendations.push('Reduce token usage significantly');
        recommendations.push('Monitor usage closely');
        break;
      case 'medium':
        recommendations.push('Consider moderating usage pace');
        recommendations.push('Review usage patterns');
        break;
      case 'low':
        recommendations.push('Current usage is sustainable');
        break;
    }
    
    // Add specific recommendations from prediction engine
    if (prediction.recommendations.slowDownRequired) {
      recommendations.push(`Recommended daily limit: ${prediction.recommendations.dailyLimit} tokens`);
    }
    
    // Add plan recommendations
    if (planRecommendation.shouldSwitch) {
      recommendations.push(`Consider switching to ${planRecommendation.recommendedPlan} plan`);
    }
    
    return { level, factors, recommendations };
  }

  /**
   * Get current configuration
   */
  getConfig(): AdvancedMonitoringConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<AdvancedMonitoringConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Update service configurations
    if (newConfig.resetSchedule) {
      this.resetTimeService.updateSchedule({
        type: newConfig.resetSchedule.type,
        timezone: newConfig.resetSchedule.timezone,
        resetHours: newConfig.resetSchedule.intervalHours
      });
    }
    
    if (newConfig.enableAutoSwitching !== undefined) {
      this.planManager.setAutoSwitchEnabled(newConfig.enableAutoSwitching);
    }
  }

  /**
   * Get plan manager state
   */
  getPlanManagerState() {
    return this.planManager.getState();
  }

  /**
   * Manually switch plan
   */
  manualPlanSwitch(toPlan: PlanType, currentTokens: number, customLimit?: number) {
    return this.planManager.manualSwitch(toPlan, currentTokens, customLimit);
  }

  /**
   * Get notification message based on analysis
   */
  getNotificationMessage(analytics: AdvancedUsageAnalytics): {
    type: 'info' | 'warning' | 'error';
    title: string;
    message: string;
  } | null {
    const { riskAssessment, predictionInfo, burnRateAnalytics } = analytics;
    
    // Critical notifications
    if (riskAssessment.level === 'critical') {
      return {
        type: 'error',
        title: 'Critical Usage Alert',
        message: 'Tokens will be depleted soon. Immediate action required.'
      };
    }
    
    // High risk notifications
    if (riskAssessment.level === 'high') {
      return {
        type: 'warning',
        title: 'High Usage Warning',
        message: `Usage rate is ${burnRateAnalytics.velocity.emoji} ${burnRateAnalytics.velocity.classification}. Consider reducing usage.`
      };
    }
    
    // Plan switch notifications
    if (analytics.planRecommendation.shouldSwitch && analytics.planRecommendation.urgency === 'high') {
      return {
        type: 'warning',
        title: 'Plan Upgrade Recommended',
        message: `Consider upgrading to ${analytics.planRecommendation.recommendedPlan} plan for better limits.`
      };
    }
    
    // Positive notifications
    if (predictionInfo.onTrackForReset && riskAssessment.level === 'low') {
      return {
        type: 'info',
        title: 'Usage On Track',
        message: 'Current usage pace is sustainable until next reset.'
      };
    }
    
    return null;
  }

  /**
   * Get formatted status for display
   */
  getStatusSummary(analytics: AdvancedUsageAnalytics): {
    emoji: string;
    status: string;
    details: string;
  } {
    const { burnRateAnalytics, riskAssessment, predictionInfo } = analytics;
    
    // Use velocity emoji and risk level to determine status
    const emoji = burnRateAnalytics.velocity.emoji;
    
    let status = '';
    let details = '';
    
    switch (riskAssessment.level) {
      case 'critical':
        status = 'Critical';
        details = 'Immediate attention required';
        break;
      case 'high':
        status = 'High Risk';
        details = 'Monitor usage closely';
        break;
      case 'medium':
        status = 'Moderate';
        details = 'Usage trending up';
        break;
      case 'low':
        status = 'Stable';
        details = predictionInfo.onTrackForReset ? 'On track for reset' : 'Usage within limits';
        break;
    }
    
    return { emoji, status, details };
  }

  /**
   * Helper to get total tokens from session block
   */
  private getTotalTokensFromBlock(block: SessionBlock): number {
    if (block.totalTokens) return block.totalTokens;
    
    const counts = block.tokenCounts;
    return counts.inputTokens + counts.outputTokens + 
           (counts.cacheCreationInputTokens || 0) + 
           (counts.cacheReadInputTokens || 0);
  }

  /**
   * Generate progress bar data for Python script style display
   */
  getProgressBarData(analytics: AdvancedUsageAnalytics): {
    tokenProgressBar: string;
    timeProgressBar: string;
    statusLine: string;
  } {
    const { burnRateAnalytics, enhancedResetInfo } = analytics;
    
    // Token progress bar (like Python script)
    const tokenProgress = analytics.planRecommendation.recommendedPlan === 'Custom' 
      ? (analytics.limitDetection.detectedLimit > 0 
          ? (this.planManager.getState().planLimits.Custom / analytics.limitDetection.detectedLimit) * 100 
          : 0)
      : (this.planManager.getCurrentLimit() > 0 
          ? (this.planManager.getCurrentLimit() / this.planManager.getCurrentLimit()) * 100 
          : 0);
    
    const tokenBar = this.createProgressBar(tokenProgress, '🟢');
    
    // Time progress bar
    const timeProgress = enhancedResetInfo.cycleProgress;
    const timeBar = this.createProgressBar(timeProgress, '⏰');
    
    // Status line
    const statusSummary = this.getStatusSummary(analytics);
    const statusLine = `${statusSummary.emoji} ${statusSummary.status} | ${statusSummary.details}`;
    
    return {
      tokenProgressBar: tokenBar,
      timeProgressBar: timeBar,
      statusLine
    };
  }

  /**
   * Create ASCII-style progress bar like Python script
   */
  private createProgressBar(percentage: number, icon: string, width: number = 30): string {
    const filled = Math.round((percentage / 100) * width);
    const empty = width - filled;
    
    const greenBar = '█'.repeat(filled);
    const redBar = '░'.repeat(empty);
    
    return `${icon} [${greenBar}${redBar}] ${percentage.toFixed(1)}%`;
  }
} 