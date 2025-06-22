import { BurnRateAnalytics } from './advancedBurnRateAnalyzer.js';
import { EnhancedResetTimeInfo } from './enhancedResetTimeService.js';

export interface PredictionScenarios {
  optimistic: string | null; // Slower usage assumption
  realistic: string | null; // Current rate assumption
  pessimistic: string | null; // Faster usage assumption
}

export interface PredictionRecommendations {
  dailyLimit: number;
  hourlyBudget: number;
  slowDownRequired: boolean;
  bufferDays: number;
  suggestedPacing: string;
}

export interface PredictionInfo {
  depletion: {
    estimatedTime: string | null;
    confidence: number;
    scenarios: PredictionScenarios;
  };
  recommendations: PredictionRecommendations;
  onTrackForReset: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  lastCalculated: string;
}

export interface PredictionModel {
  calculateDepletion(
    tokensRemaining: number,
    burnRate: BurnRateAnalytics,
    resetInfo: EnhancedResetTimeInfo
  ): PredictionInfo;
  
  getConfidence(
    historicalAccuracy: number,
    dataPoints: number,
    timeRange: number
  ): number;
}

export class PredictionEngine implements PredictionModel {
  private static instance: PredictionEngine;
  
  // Scenario multipliers for different usage patterns
  private readonly SCENARIO_MULTIPLIERS = {
    optimistic: 0.7,  // 30% slower usage
    realistic: 1.0,   // Current rate
    pessimistic: 1.4  // 40% faster usage
  };
  
  // Minimum confidence threshold for predictions
  private readonly MIN_CONFIDENCE = 30;
  
  // Risk level thresholds (percentage of time to reset)
  private readonly RISK_THRESHOLDS = {
    low: 50,      // > 50% time remaining
    medium: 25,   // 25-50% time remaining
    high: 10,     // 10-25% time remaining
    critical: 0   // < 10% time remaining
  };

  private constructor() {}

  static getInstance(): PredictionEngine {
    if (!PredictionEngine.instance) {
      PredictionEngine.instance = new PredictionEngine();
    }
    return PredictionEngine.instance;
  }

  /**
   * Calculate comprehensive depletion prediction
   */
  calculateDepletion(
    tokensRemaining: number,
    burnRate: BurnRateAnalytics,
    resetInfo: EnhancedResetTimeInfo
  ): PredictionInfo {
    const currentTime = new Date();
    
    // Calculate depletion scenarios
    const scenarios = this.calculateScenarios(tokensRemaining, burnRate, currentTime);
    
    // Calculate prediction confidence based on burn rate analytics
    const confidence = this.calculatePredictionConfidence(burnRate, resetInfo);
    
    // Determine if on track for reset
    const onTrackForReset = this.isOnTrackForReset(
      tokensRemaining, 
      burnRate, 
      resetInfo
    );
    
    // Calculate risk level
    const riskLevel = this.calculateRiskLevel(
      tokensRemaining,
      burnRate,
      resetInfo
    );
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(
      tokensRemaining,
      burnRate,
      resetInfo,
      riskLevel
    );
    
    return {
      depletion: {
        estimatedTime: scenarios.realistic,
        confidence,
        scenarios
      },
      recommendations,
      onTrackForReset,
      riskLevel,
      lastCalculated: currentTime.toISOString()
    };
  }

  /**
   * Calculate depletion scenarios (optimistic, realistic, pessimistic)
   */
  private calculateScenarios(
    tokensRemaining: number,
    burnRate: BurnRateAnalytics,
    currentTime: Date
  ): PredictionScenarios {
    if (tokensRemaining <= 0 || burnRate.current <= 0) {
      return {
        optimistic: null,
        realistic: null,
        pessimistic: null
      };
    }
    
    const scenarios: PredictionScenarios = {
      optimistic: null,
      realistic: null,
      pessimistic: null
    };
    
    // Calculate depletion time for each scenario
    Object.entries(this.SCENARIO_MULTIPLIERS).forEach(([scenario, multiplier]) => {
      const adjustedBurnRate = burnRate.current * multiplier;
      
      if (adjustedBurnRate > 0) {
        const minutesToDepletion = tokensRemaining / adjustedBurnRate;
        const depletionTime = new Date(currentTime.getTime() + (minutesToDepletion * 60 * 1000));
        scenarios[scenario as keyof PredictionScenarios] = depletionTime.toISOString();
      }
    });
    
    return scenarios;
  }

  /**
   * Calculate prediction confidence based on burn rate quality and trends
   */
  private calculatePredictionConfidence(
    burnRate: BurnRateAnalytics,
    resetInfo: EnhancedResetTimeInfo
  ): number {
    let confidence = burnRate.confidence; // Start with burn rate confidence
    
    // Adjust based on trend stability
    if (burnRate.trend.direction === 'stable') {
      confidence += 10; // More predictable
    } else if (Math.abs(burnRate.trend.percentage) > 50) {
      confidence -= 15; // Very volatile, less predictable
    }
    
    // Adjust based on time in cycle (more data = higher confidence)
    const cycleProgress = resetInfo.cycleProgress;
    if (cycleProgress > 75) {
      confidence += 5; // Lots of data from current cycle
    } else if (cycleProgress < 25) {
      confidence -= 10; // Early in cycle, less data
    }
    
    // Adjust based on velocity classification
    switch (burnRate.velocity.classification) {
      case 'slow':
        confidence += 5; // Slow and steady is predictable
        break;
      case 'very_fast':
        confidence -= 10; // Very fast usage is unpredictable
        break;
    }
    
    return Math.max(this.MIN_CONFIDENCE, Math.min(100, Math.round(confidence)));
  }

  /**
   * Check if current usage is on track to last until reset
   */
  private isOnTrackForReset(
    tokensRemaining: number,
    burnRate: BurnRateAnalytics,
    resetInfo: EnhancedResetTimeInfo
  ): boolean {
    if (burnRate.current <= 0) return true; // No usage, will last
    
    // Calculate time until tokens run out at current rate
    const minutesToDepletion = tokensRemaining / burnRate.current;
    const minutesUntilReset = resetInfo.timeUntilReset / (1000 * 60);
    
    // Add buffer for safety (10% buffer)
    const bufferMultiplier = 1.1;
    
    return (minutesToDepletion / bufferMultiplier) > minutesUntilReset;
  }

  /**
   * Calculate risk level based on time and usage patterns
   */
  private calculateRiskLevel(
    tokensRemaining: number,
    burnRate: BurnRateAnalytics,
    resetInfo: EnhancedResetTimeInfo
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (burnRate.current <= 0) return 'low';
    
    // Calculate percentage of time remaining until reset
    const minutesToDepletion = tokensRemaining / burnRate.current;
    const minutesUntilReset = resetInfo.timeUntilReset / (1000 * 60);
    const timeRemainingPercentage = minutesUntilReset > 0 
      ? (minutesToDepletion / minutesUntilReset) * 100 
      : 100;
    
    // Adjust based on trend
    let adjustedPercentage = timeRemainingPercentage;
    if (burnRate.trend.direction === 'increasing') {
      adjustedPercentage -= 20; // Higher risk if usage is increasing
    } else if (burnRate.trend.direction === 'decreasing') {
      adjustedPercentage += 10; // Lower risk if usage is decreasing
    }
    
    // Classify risk level
    if (adjustedPercentage > this.RISK_THRESHOLDS.low) {
      return 'low';
    } else if (adjustedPercentage > this.RISK_THRESHOLDS.medium) {
      return 'medium';
    } else if (adjustedPercentage > this.RISK_THRESHOLDS.high) {
      return 'high';
    } else {
      return 'critical';
    }
  }

  /**
   * Generate usage recommendations based on prediction analysis
   */
  private generateRecommendations(
    tokensRemaining: number,
    burnRate: BurnRateAnalytics,
    resetInfo: EnhancedResetTimeInfo,
    riskLevel: string
  ): PredictionRecommendations {
    const hoursUntilReset = resetInfo.timeUntilReset / (1000 * 60 * 60);
    const daysUntilReset = Math.max(1, hoursUntilReset / 24);
    
    // Calculate recommended daily limit to last until reset
    const recommendedDailyLimit = Math.floor(tokensRemaining / daysUntilReset);
    
    // Calculate hourly budget
    const hourlyBudget = Math.floor(recommendedDailyLimit / 24);
    
    // Determine if slowdown is required
    const currentDailyRate = burnRate.hourly * 24; // Current daily rate
    const slowDownRequired = currentDailyRate > recommendedDailyLimit;
    
    // Calculate buffer days (how many extra days the tokens would last)
    const bufferDays = burnRate.current > 0 
      ? Math.max(0, (tokensRemaining / (burnRate.current * 60 * 24)) - daysUntilReset)
      : 30; // Arbitrary high number if no usage
    
    // Generate pacing suggestion
    let suggestedPacing = '';
    switch (riskLevel) {
      case 'critical':
        suggestedPacing = 'Immediate usage reduction required';
        break;
      case 'high':
        suggestedPacing = 'Reduce usage significantly';
        break;
      case 'medium':
        suggestedPacing = 'Moderate usage reduction recommended';
        break;
      case 'low':
        suggestedPacing = 'Current pace is sustainable';
        break;
    }
    
    return {
      dailyLimit: recommendedDailyLimit,
      hourlyBudget,
      slowDownRequired,
      bufferDays: Math.round(bufferDays * 10) / 10,
      suggestedPacing
    };
  }

  /**
   * Get confidence score for prediction accuracy
   */
  getConfidence(
    historicalAccuracy: number,
    dataPoints: number,
    timeRange: number
  ): number {
    // Base confidence on historical accuracy
    let confidence = historicalAccuracy;
    
    // Adjust based on data points (more data = higher confidence)
    const dataPointsBonus = Math.min(20, dataPoints * 2);
    confidence += dataPointsBonus;
    
    // Adjust based on time range (recent data is more reliable)
    const timeRangePenalty = Math.max(0, (timeRange - 7) * 2); // Penalty for data older than 7 days
    confidence -= timeRangePenalty;
    
    return Math.max(this.MIN_CONFIDENCE, Math.min(100, Math.round(confidence)));
  }

  /**
   * Format depletion time for display
   */
  formatDepletionTime(depletionTime: string | null): string {
    if (!depletionTime) return 'No depletion predicted';
    
    try {
      const now = new Date();
      const depletion = new Date(depletionTime);
      const diffMs = depletion.getTime() - now.getTime();
      
      if (diffMs <= 0) return 'Already depleted';
      
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffDays > 0) {
        const remainingHours = diffHours % 24;
        return remainingHours > 0 
          ? `${diffDays}d ${remainingHours}h`
          : `${diffDays} days`;
      } else if (diffHours > 0) {
        const remainingMinutes = diffMinutes % 60;
        return remainingMinutes > 0 
          ? `${diffHours}h ${remainingMinutes}m`
          : `${diffHours} hours`;
      } else {
        return `${diffMinutes} minutes`;
      }
    } catch (error) {
      return 'Invalid prediction';
    }
  }

  /**
   * Get risk level color for UI
   */
  getRiskLevelColor(riskLevel: string): string {
    switch (riskLevel) {
      case 'low': return '#10B981';      // Green
      case 'medium': return '#F59E0B';   // Yellow
      case 'high': return '#EF4444';     // Red
      case 'critical': return '#DC2626'; // Dark Red
      default: return '#6B7280';         // Gray
    }
  }

  /**
   * Get risk level icon for UI
   */
  getRiskLevelIcon(riskLevel: string): string {
    switch (riskLevel) {
      case 'low': return '🟢';
      case 'medium': return '🟡';
      case 'high': return '🟠';
      case 'critical': return '🔴';
      default: return '⚪';
    }
  }

  /**
   * Analyze prediction accuracy over time (for model improvement)
   */
  analyzePredictionAccuracy(
    historicalPredictions: Array<{
      timestamp: string;
      predictedDepletion: string | null;
      actualDepletion?: string | null;
    }>
  ): {
    accuracy: number;
    totalPredictions: number;
    accuratePredictions: number;
    averageError: number; // in hours
  } {
    let accurateCount = 0;
    let totalError = 0;
    let evaluatedPredictions = 0;
    
    for (const prediction of historicalPredictions) {
      if (!prediction.predictedDepletion || !prediction.actualDepletion) continue;
      
      try {
        const predicted = new Date(prediction.predictedDepletion);
        const actual = new Date(prediction.actualDepletion);
        const errorMs = Math.abs(predicted.getTime() - actual.getTime());
        const errorHours = errorMs / (1000 * 60 * 60);
        
        totalError += errorHours;
        evaluatedPredictions++;
        
        // Consider prediction accurate if within 2 hours
        if (errorHours <= 2) {
          accurateCount++;
        }
      } catch (error) {
        // Skip invalid predictions
        continue;
      }
    }
    
    const accuracy = evaluatedPredictions > 0 
      ? (accurateCount / evaluatedPredictions) * 100 
      : 0;
    
    const averageError = evaluatedPredictions > 0 
      ? totalError / evaluatedPredictions 
      : 0;
    
    return {
      accuracy: Math.round(accuracy * 10) / 10,
      totalPredictions: historicalPredictions.length,
      accuratePredictions: accurateCount,
      averageError: Math.round(averageError * 10) / 10
    };
  }
} 