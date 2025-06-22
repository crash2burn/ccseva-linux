export interface BurnRateAnalytics {
  current: number; // tokens per minute (current rate)
  hourly: number; // tokens per hour (current rate * 60)
  trend: {
    direction: 'increasing' | 'decreasing' | 'stable';
    percentage: number; // % change from previous period
  };
  velocity: {
    classification: 'slow' | 'normal' | 'fast' | 'very_fast';
    emoji: string;
    threshold: number;
  };
  peakHour: number; // 0-23 hour with highest usage
  confidence: number; // 0-100 confidence in calculation
  lastCalculated: string;
}

export interface SessionOverlap {
  sessionId: string;
  startTime: Date;
  endTime: Date;
  actualEndTime?: Date;
  isActive: boolean;
  tokensUsed: number;
  overlapDuration: number; // ms overlap with analysis window
  weightedTokens: number; // tokens attributed to analysis window
}

export interface SessionBlock {
  id: string;
  startTime: Date;
  endTime: Date;
  actualEndTime?: Date;
  isActive: boolean;
  isGap?: boolean;
  totalTokens: number;
  tokenCounts: {
    inputTokens: number;
    outputTokens: number;
    cacheCreationInputTokens?: number;
    cacheReadInputTokens?: number;
  };
}

export class AdvancedBurnRateAnalyzer {
  private static instance: AdvancedBurnRateAnalyzer;
  
  // Analysis window duration (1 hour like Python script)
  private readonly ANALYSIS_WINDOW_MS = 60 * 60 * 1000; // 1 hour
  
  // Velocity thresholds (tokens per minute)
  private readonly VELOCITY_THRESHOLDS = {
    slow: 50,    // < 50 tokens/min
    normal: 150, // 50-150 tokens/min
    fast: 300,   // 150-300 tokens/min
    very_fast: Infinity // > 300 tokens/min
  };

  private constructor() {}

  static getInstance(): AdvancedBurnRateAnalyzer {
    if (!AdvancedBurnRateAnalyzer.instance) {
      AdvancedBurnRateAnalyzer.instance = new AdvancedBurnRateAnalyzer();
    }
    return AdvancedBurnRateAnalyzer.instance;
  }

  /**
   * Calculate advanced burn rate analytics
   * Matches Python script's calculateHourlyBurnRate function
   */
  calculateBurnRate(
    sessionBlocks: SessionBlock[],
    currentTime: Date = new Date()
  ): BurnRateAnalytics {
    // Calculate current burn rate (last hour)
    const currentRate = this.calculateHourlyBurnRateFromSessions(sessionBlocks, currentTime);
    
    // Calculate trend analysis
    const trend = this.calculateTrend(sessionBlocks, currentTime, currentRate);
    
    // Classify velocity
    const velocity = this.classifyVelocity(currentRate);
    
    // Find peak usage hour
    const peakHour = this.calculatePeakHour(sessionBlocks);
    
    // Calculate confidence based on data quality
    const confidence = this.calculateConfidence(sessionBlocks, currentTime);
    
    return {
      current: currentRate,
      hourly: currentRate * 60, // Convert to hourly rate
      trend,
      velocity,
      peakHour,
      confidence,
      lastCalculated: new Date().toISOString()
    };
  }

  /**
   * Calculate hourly burn rate from sessions (matching Python implementation)
   */
  private calculateHourlyBurnRateFromSessions(
    blocks: SessionBlock[],
    currentTime: Date
  ): number {
    if (!blocks || blocks.length === 0) return 0;
    
    const oneHourAgo = new Date(currentTime.getTime() - this.ANALYSIS_WINDOW_MS);
    let totalTokens = 0;
    
    for (const block of blocks) {
      // Skip gaps
      if (block.isGap) continue;
      
      const startTime = block.startTime;
      
      // Determine session end time
      let sessionEnd: Date;
      if (block.isActive) {
        sessionEnd = currentTime;
      } else if (block.actualEndTime) {
        sessionEnd = block.actualEndTime;
      } else {
        sessionEnd = block.endTime;
      }
      
      // Skip if session ended before the analysis window
      if (sessionEnd < oneHourAgo) continue;
      
      // Calculate overlap with analysis window
      const sessionStartInWindow = startTime > oneHourAgo ? startTime : oneHourAgo;
      const sessionEndInWindow = sessionEnd < currentTime ? sessionEnd : currentTime;
      
      if (sessionEndInWindow <= sessionStartInWindow) continue;
      
      // Calculate portion of tokens used in the analysis window
      const totalSessionDuration = (sessionEnd.getTime() - startTime.getTime()) / (1000 * 60); // minutes
      const windowDuration = (sessionEndInWindow.getTime() - sessionStartInWindow.getTime()) / (1000 * 60); // minutes
      
      if (totalSessionDuration > 0) {
        const sessionTokens = this.getTotalTokensFromBlock(block);
        const tokensInWindow = sessionTokens * (windowDuration / totalSessionDuration);
        totalTokens += tokensInWindow;
      }
    }
    
    // Return tokens per minute (like Python script)
    return totalTokens / 60;
  }

  /**
   * Calculate trend analysis comparing current rate to historical rates
   */
  private calculateTrend(
    blocks: SessionBlock[],
    currentTime: Date,
    currentRate: number
  ): BurnRateAnalytics['trend'] {
    // Calculate previous hour rate for comparison
    const twoHoursAgo = new Date(currentTime.getTime() - (2 * this.ANALYSIS_WINDOW_MS));
    const oneHourAgo = new Date(currentTime.getTime() - this.ANALYSIS_WINDOW_MS);
    
    let previousHourTokens = 0;
    
    for (const block of blocks) {
      if (block.isGap) continue;
      
      const startTime = block.startTime;
      let sessionEnd: Date;
      
      if (block.isActive) {
        sessionEnd = currentTime;
      } else if (block.actualEndTime) {
        sessionEnd = block.actualEndTime;
      } else {
        sessionEnd = block.endTime;
      }
      
      // Skip if session doesn't overlap with previous hour window
      if (sessionEnd < twoHoursAgo || startTime > oneHourAgo) continue;
      
      // Calculate overlap with previous hour
      const sessionStartInWindow = startTime > twoHoursAgo ? startTime : twoHoursAgo;
      const sessionEndInWindow = sessionEnd < oneHourAgo ? sessionEnd : oneHourAgo;
      
      if (sessionEndInWindow <= sessionStartInWindow) continue;
      
      const totalSessionDuration = (sessionEnd.getTime() - startTime.getTime()) / (1000 * 60);
      const windowDuration = (sessionEndInWindow.getTime() - sessionStartInWindow.getTime()) / (1000 * 60);
      
      if (totalSessionDuration > 0) {
        const sessionTokens = this.getTotalTokensFromBlock(block);
        const tokensInWindow = sessionTokens * (windowDuration / totalSessionDuration);
        previousHourTokens += tokensInWindow;
      }
    }
    
    const previousRate = previousHourTokens / 60; // tokens per minute
    
    // Calculate percentage change
    let percentage = 0;
    let direction: 'increasing' | 'decreasing' | 'stable' = 'stable';
    
    if (previousRate > 0) {
      percentage = ((currentRate - previousRate) / previousRate) * 100;
      
      if (Math.abs(percentage) > 15) { // 15% threshold for significant change
        direction = percentage > 0 ? 'increasing' : 'decreasing';
      }
    } else if (currentRate > 0) {
      percentage = 100; // Infinite increase from 0
      direction = 'increasing';
    }
    
    return {
      direction,
      percentage: Math.round(percentage * 10) / 10 // Round to 1 decimal
    };
  }

  /**
   * Classify velocity with emoji (matching Python script style)
   */
  private classifyVelocity(tokensPerMinute: number): BurnRateAnalytics['velocity'] {
    if (tokensPerMinute < this.VELOCITY_THRESHOLDS.slow) {
      return {
        classification: 'slow',
        emoji: '🐌',
        threshold: this.VELOCITY_THRESHOLDS.slow
      };
    } else if (tokensPerMinute < this.VELOCITY_THRESHOLDS.normal) {
      return {
        classification: 'normal',
        emoji: '➡️',
        threshold: this.VELOCITY_THRESHOLDS.normal
      };
    } else if (tokensPerMinute < this.VELOCITY_THRESHOLDS.fast) {
      return {
        classification: 'fast',
        emoji: '🚀',
        threshold: this.VELOCITY_THRESHOLDS.fast
      };
    } else {
      return {
        classification: 'very_fast',
        emoji: '⚡',
        threshold: this.VELOCITY_THRESHOLDS.very_fast
      };
    }
  }

  /**
   * Calculate peak usage hour from historical data
   */
  private calculatePeakHour(blocks: SessionBlock[]): number {
    const hourlyUsage: number[] = new Array(24).fill(0);
    
    for (const block of blocks) {
      if (block.isGap || block.isActive) continue;
      
      const hour = block.startTime.getHours();
      const tokens = this.getTotalTokensFromBlock(block);
      hourlyUsage[hour] += tokens;
    }
    
    // Find hour with maximum usage
    let maxHour = 0;
    let maxUsage = hourlyUsage[0];
    
    for (let i = 1; i < 24; i++) {
      if (hourlyUsage[i] > maxUsage) {
        maxUsage = hourlyUsage[i];
        maxHour = i;
      }
    }
    
    return maxHour;
  }

  /**
   * Calculate confidence in burn rate calculation
   */
  private calculateConfidence(blocks: SessionBlock[], currentTime: Date): number {
    const oneHourAgo = new Date(currentTime.getTime() - this.ANALYSIS_WINDOW_MS);
    
    // Count sessions and data points in analysis window
    let sessionsInWindow = 0;
    let totalDurationInWindow = 0;
    
    for (const block of blocks) {
      if (block.isGap) continue;
      
      const startTime = block.startTime;
      let sessionEnd = block.isActive ? currentTime : (block.actualEndTime || block.endTime);
      
      // Check if session overlaps with analysis window
      if (sessionEnd < oneHourAgo || startTime > currentTime) continue;
      
      sessionsInWindow++;
      
      const sessionStartInWindow = startTime > oneHourAgo ? startTime : oneHourAgo;
      const sessionEndInWindow = sessionEnd < currentTime ? sessionEnd : currentTime;
      const durationInWindow = sessionEndInWindow.getTime() - sessionStartInWindow.getTime();
      totalDurationInWindow += durationInWindow;
    }
    
    // Calculate confidence based on data coverage
    const windowCoverage = Math.min(100, (totalDurationInWindow / this.ANALYSIS_WINDOW_MS) * 100);
    const sessionCount = Math.min(100, sessionsInWindow * 20); // Up to 5 sessions = 100%
    
    // Combine factors for overall confidence
    const confidence = Math.round((windowCoverage * 0.7) + (sessionCount * 0.3));
    
    return Math.max(0, Math.min(100, confidence));
  }

  /**
   * Get total tokens from a session block
   */
  private getTotalTokensFromBlock(block: SessionBlock): number {
    if (block.totalTokens) return block.totalTokens;
    
    const counts = block.tokenCounts;
    return counts.inputTokens + counts.outputTokens + 
           (counts.cacheCreationInputTokens || 0) + 
           (counts.cacheReadInputTokens || 0);
  }

  /**
   * Get session overlaps for detailed analysis
   */
  getSessionOverlaps(
    blocks: SessionBlock[],
    analysisWindow: Date = new Date()
  ): SessionOverlap[] {
    const windowStart = new Date(analysisWindow.getTime() - this.ANALYSIS_WINDOW_MS);
    const overlaps: SessionOverlap[] = [];
    
    for (const block of blocks) {
      if (block.isGap) continue;
      
      const startTime = block.startTime;
      const endTime = block.isActive ? analysisWindow : (block.actualEndTime || block.endTime);
      
      // Check for overlap
      if (endTime <= windowStart || startTime >= analysisWindow) continue;
      
      // Calculate overlap
      const overlapStart = startTime > windowStart ? startTime : windowStart;
      const overlapEnd = endTime < analysisWindow ? endTime : analysisWindow;
      const overlapDuration = overlapEnd.getTime() - overlapStart.getTime();
      
      // Calculate weighted tokens
      const totalDuration = endTime.getTime() - startTime.getTime();
      const totalTokens = this.getTotalTokensFromBlock(block);
      const weightedTokens = totalDuration > 0 ? (totalTokens * overlapDuration / totalDuration) : 0;
      
      overlaps.push({
        sessionId: block.id,
        startTime,
        endTime,
        actualEndTime: block.actualEndTime,
        isActive: block.isActive,
        tokensUsed: totalTokens,
        overlapDuration,
        weightedTokens
      });
    }
    
    return overlaps;
  }

  /**
   * Get detailed burn rate breakdown for analysis
   */
  getDetailedBreakdown(
    blocks: SessionBlock[],
    currentTime: Date = new Date()
  ): {
    totalSessions: number;
    activeSessions: number;
    analysisWindowStart: string;
    analysisWindowEnd: string;
    overlaps: SessionOverlap[];
    totalWeightedTokens: number;
    averageTokensPerSession: number;
  } {
    const windowStart = new Date(currentTime.getTime() - this.ANALYSIS_WINDOW_MS);
    const overlaps = this.getSessionOverlaps(blocks, currentTime);
    
    const totalWeightedTokens = overlaps.reduce((sum, overlap) => sum + overlap.weightedTokens, 0);
    const activeSessions = overlaps.filter(overlap => overlap.isActive).length;
    const averageTokensPerSession = overlaps.length > 0 ? totalWeightedTokens / overlaps.length : 0;
    
    return {
      totalSessions: overlaps.length,
      activeSessions,
      analysisWindowStart: windowStart.toISOString(),
      analysisWindowEnd: currentTime.toISOString(),
      overlaps,
      totalWeightedTokens,
      averageTokensPerSession
    };
  }

  /**
   * Check if burn rate is accelerating (increasing trend)
   */
  isAccelerating(analytics: BurnRateAnalytics): boolean {
    return analytics.trend.direction === 'increasing' && 
           analytics.trend.percentage > 20; // 20% increase threshold
  }

  /**
   * Get formatted burn rate for display
   */
  formatBurnRate(tokensPerMinute: number): string {
    if (tokensPerMinute < 1) {
      return `${Math.round(tokensPerMinute * 60)}/hr`;
    } else if (tokensPerMinute < 10) {
      return `${Math.round(tokensPerMinute * 10) / 10}/min`;
    } else {
      return `${Math.round(tokensPerMinute)}/min`;
    }
  }
} 