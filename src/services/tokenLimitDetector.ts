export interface TokenLimitDetection {
  detectedLimit: number;
  confidence: number;
  detectionMethod: 'historical_max' | 'plan_standard' | 'user_set';
  analysisData: {
    sessionsAnalyzed: number;
    maxSessionTokens: number;
    averageSessionTokens: number;
    detectionDate: string;
  };
  recommendations: {
    suggestedLimit: number;
    reasonCode: string;
    shouldUpdate: boolean;
  };
}

export interface LimitDetectionConfig {
  minimumSessions: number; // Minimum sessions needed for detection
  confidenceThreshold: number; // Minimum confidence to auto-apply
  maxLookbackDays: number; // How far back to analyze
  outlierThreshold: number; // Remove outlier sessions (percentile)
}

export interface SessionData {
  id: string;
  totalTokens: number;
  startTime: Date;
  endTime: Date;
  isActive: boolean;
  isGap?: boolean;
}

export class TokenLimitDetector {
  private static instance: TokenLimitDetector;
  
  // Standard plan limits for validation
  private readonly STANDARD_LIMITS = {
    Pro: 7000,
    Max5: 35000,
    Max20: 140000,
    Custom: 500000 // High default
  };
  
  // Default detection configuration
  private readonly DEFAULT_CONFIG: LimitDetectionConfig = {
    minimumSessions: 5,
    confidenceThreshold: 80,
    maxLookbackDays: 30,
    outlierThreshold: 95 // Remove top 5% outliers
  };
  
  private config: LimitDetectionConfig;
  private detectionHistory: Array<{
    timestamp: string;
    detectedLimit: number;
    confidence: number;
    method: string;
  }> = [];

  constructor(config?: Partial<LimitDetectionConfig>) {
    this.config = { ...this.DEFAULT_CONFIG, ...config };
  }

  static getInstance(config?: Partial<LimitDetectionConfig>): TokenLimitDetector {
    if (!TokenLimitDetector.instance) {
      TokenLimitDetector.instance = new TokenLimitDetector(config);
    } else if (config) {
      TokenLimitDetector.instance.updateConfig(config);
    }
    return TokenLimitDetector.instance;
  }

  /**
   * Update detection configuration
   */
  updateConfig(config: Partial<LimitDetectionConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Detect token limit from historical session data
   */
  detectLimit(sessions: SessionData[], currentPlan?: string): TokenLimitDetection {
    // Filter sessions for analysis
    const validSessions = this.filterSessionsForAnalysis(sessions);
    
    // Perform detection analysis
    const detection = this.performDetection(validSessions, currentPlan);
    
    // Store detection result
    this.detectionHistory.push({
      timestamp: new Date().toISOString(),
      detectedLimit: detection.detectedLimit,
      confidence: detection.confidence,
      method: detection.detectionMethod
    });
    
    // Keep only last 20 detection records
    if (this.detectionHistory.length > 20) {
      this.detectionHistory = this.detectionHistory.slice(-20);
    }
    
    return detection;
  }

  /**
   * Filter sessions for limit detection analysis
   */
  private filterSessionsForAnalysis(sessions: SessionData[]): SessionData[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.maxLookbackDays);
    
    return sessions.filter(session => {
      // Skip active sessions and gaps
      if (session.isActive || session.isGap) return false;
      
      // Skip sessions outside lookback window
      if (session.startTime < cutoffDate) return false;
      
      // Skip sessions with zero tokens
      if (session.totalTokens <= 0) return false;
      
      return true;
    });
  }

  /**
   * Perform the actual limit detection
   */
  private performDetection(
    sessions: SessionData[], 
    currentPlan?: string
  ): TokenLimitDetection {
    if (sessions.length < this.config.minimumSessions) {
      return this.getFallbackDetection(currentPlan);
    }
    
    // Remove outliers to get more accurate detection
    const cleanedSessions = this.removeOutliers(sessions);
    
    // Calculate detection metrics
    const maxTokens = Math.max(...cleanedSessions.map(s => s.totalTokens));
    const avgTokens = cleanedSessions.reduce((sum, s) => sum + s.totalTokens, 0) / cleanedSessions.length;
    
    // Determine detection method and limit
    const detectionResult = this.calculateDetectedLimit(
      maxTokens, 
      avgTokens, 
      cleanedSessions, 
      currentPlan
    );
    
    // Calculate confidence
    const confidence = this.calculateConfidence(cleanedSessions, detectionResult.limit);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(
      detectionResult.limit, 
      confidence, 
      maxTokens, 
      currentPlan
    );
    
    return {
      detectedLimit: detectionResult.limit,
      confidence,
      detectionMethod: detectionResult.method,
      analysisData: {
        sessionsAnalyzed: cleanedSessions.length,
        maxSessionTokens: maxTokens,
        averageSessionTokens: Math.round(avgTokens),
        detectionDate: new Date().toISOString()
      },
      recommendations
    };
  }

  /**
   * Remove outlier sessions for more accurate detection
   */
  private removeOutliers(sessions: SessionData[]): SessionData[] {
    if (sessions.length < 5) return sessions; // Not enough data to remove outliers
    
    const sortedByTokens = [...sessions].sort((a, b) => a.totalTokens - b.totalTokens);
    const outlierIndex = Math.floor(sortedByTokens.length * (this.config.outlierThreshold / 100));
    
    return sortedByTokens.slice(0, outlierIndex);
  }

  /**
   * Calculate the detected limit based on historical data
   */
  private calculateDetectedLimit(
    maxTokens: number,
    avgTokens: number,
    sessions: SessionData[],
    currentPlan?: string
  ): { limit: number; method: 'historical_max' | 'plan_standard' } {
    // If we have a current plan and max usage fits within it, use plan limit
    if (currentPlan && this.STANDARD_LIMITS[currentPlan as keyof typeof this.STANDARD_LIMITS]) {
      const planLimit = this.STANDARD_LIMITS[currentPlan as keyof typeof this.STANDARD_LIMITS];
      if (maxTokens <= planLimit * 0.95) { // 95% of plan limit
        return { limit: planLimit, method: 'plan_standard' };
      }
    }
    
    // Check if max tokens fits within any standard plan
    for (const [plan, limit] of Object.entries(this.STANDARD_LIMITS)) {
      if (plan === 'Custom') continue; // Skip custom for this check
      
      if (maxTokens <= limit * 0.95) {
        return { limit, method: 'plan_standard' };
      }
    }
    
    // Use historical max with buffer for custom limit
    const buffer = Math.max(1000, maxTokens * 0.1); // 10% buffer, minimum 1000 tokens
    const customLimit = Math.round((maxTokens + buffer) / 1000) * 1000; // Round to nearest 1000
    
    return { limit: customLimit, method: 'historical_max' };
  }

  /**
   * Calculate confidence in the detection
   */
  private calculateConfidence(sessions: SessionData[], detectedLimit: number): number {
    let confidence = 50; // Base confidence
    
    // Boost confidence based on number of sessions
    const sessionBonus = Math.min(30, sessions.length * 3);
    confidence += sessionBonus;
    
    // Calculate consistency of sessions
    const tokenCounts = sessions.map(s => s.totalTokens);
    const maxTokens = Math.max(...tokenCounts);
    const minTokens = Math.min(...tokenCounts);
    const consistency = minTokens > 0 ? (1 - (maxTokens - minTokens) / maxTokens) : 0;
    
    // Boost confidence for consistent usage patterns
    confidence += consistency * 20;
    
    // Check if sessions span multiple days (more reliable)
    const sessionDates = sessions.map(s => s.startTime.toDateString());
    const uniqueDays = new Set(sessionDates).size;
    if (uniqueDays > 1) {
      confidence += Math.min(15, uniqueDays * 3);
    }
    
    // Penalize if we had to use historical max (less certain)
    if (detectedLimit > this.STANDARD_LIMITS.Max20) {
      confidence -= 10;
    }
    
    return Math.max(20, Math.min(100, Math.round(confidence)));
  }

  /**
   * Generate recommendations based on detection results
   */
  private generateRecommendations(
    detectedLimit: number,
    confidence: number,
    maxTokens: number,
    currentPlan?: string
  ): TokenLimitDetection['recommendations'] {
    let reasonCode = '';
    let shouldUpdate = false;
    let suggestedLimit = detectedLimit;
    
    // Determine if we should recommend updating
    if (confidence >= this.config.confidenceThreshold) {
      shouldUpdate = true;
      reasonCode = 'high_confidence_detection';
    } else if (currentPlan && maxTokens > this.STANDARD_LIMITS[currentPlan as keyof typeof this.STANDARD_LIMITS]) {
      shouldUpdate = true;
      reasonCode = 'current_plan_exceeded';
      suggestedLimit = Math.max(detectedLimit, maxTokens * 1.1);
    } else {
      reasonCode = 'low_confidence_keep_current';
    }
    
    // Special handling for different scenarios
    if (detectedLimit <= this.STANDARD_LIMITS.Pro && currentPlan !== 'Pro') {
      reasonCode = 'can_downgrade_to_pro';
      suggestedLimit = this.STANDARD_LIMITS.Pro;
      shouldUpdate = true;
    } else if (detectedLimit <= this.STANDARD_LIMITS.Max5 && 
               ['Max20', 'Custom'].includes(currentPlan || '')) {
      reasonCode = 'can_downgrade_to_max5';
      suggestedLimit = this.STANDARD_LIMITS.Max5;
      shouldUpdate = true;
    }
    
    return {
      suggestedLimit: Math.round(suggestedLimit),
      reasonCode,
      shouldUpdate
    };
  }

  /**
   * Get fallback detection when not enough data is available
   */
  private getFallbackDetection(currentPlan?: string): TokenLimitDetection {
    const fallbackLimit = currentPlan 
      ? this.STANDARD_LIMITS[currentPlan as keyof typeof this.STANDARD_LIMITS] || this.STANDARD_LIMITS.Pro
      : this.STANDARD_LIMITS.Pro;
    
    return {
      detectedLimit: fallbackLimit,
      confidence: 30, // Low confidence for fallback
      detectionMethod: 'plan_standard',
      analysisData: {
        sessionsAnalyzed: 0,
        maxSessionTokens: 0,
        averageSessionTokens: 0,
        detectionDate: new Date().toISOString()
      },
      recommendations: {
        suggestedLimit: fallbackLimit,
        reasonCode: 'insufficient_data_fallback',
        shouldUpdate: false
      }
    };
  }

  /**
   * Get recommended plan based on detected limit
   */
  getRecommendedPlan(detectedLimit: number): string {
    if (detectedLimit <= this.STANDARD_LIMITS.Pro) return 'Pro';
    if (detectedLimit <= this.STANDARD_LIMITS.Max5) return 'Max5';
    if (detectedLimit <= this.STANDARD_LIMITS.Max20) return 'Max20';
    return 'Custom';
  }

  /**
   * Validate if a specific limit makes sense for the given sessions
   */
  validateLimit(sessions: SessionData[], proposedLimit: number): {
    isValid: boolean;
    reason: string;
    utilizationRate: number;
  } {
    const validSessions = this.filterSessionsForAnalysis(sessions);
    
    if (validSessions.length === 0) {
      return {
        isValid: true,
        reason: 'no_data_to_validate',
        utilizationRate: 0
      };
    }
    
    const maxTokens = Math.max(...validSessions.map(s => s.totalTokens));
    const utilizationRate = proposedLimit > 0 ? (maxTokens / proposedLimit) * 100 : 0;
    
    if (proposedLimit < maxTokens) {
      return {
        isValid: false,
        reason: 'limit_too_low_for_historical_usage',
        utilizationRate
      };
    }
    
    if (utilizationRate < 50) {
      return {
        isValid: true,
        reason: 'limit_provides_good_buffer',
        utilizationRate
      };
    }
    
    if (utilizationRate < 80) {
      return {
        isValid: true,
        reason: 'limit_adequate_for_usage',
        utilizationRate
      };
    }
    
    return {
      isValid: true,
      reason: 'limit_tight_but_sufficient',
      utilizationRate
    };
  }

  /**
   * Get detection history for analysis
   */
  getDetectionHistory(): Array<{
    timestamp: string;
    detectedLimit: number;
    confidence: number;
    method: string;
  }> {
    return [...this.detectionHistory];
  }

  /**
   * Get current detection configuration
   */
  getConfig(): LimitDetectionConfig {
    return { ...this.config };
  }

  /**
   * Reset detection history (for testing)
   */
  resetHistory(): void {
    this.detectionHistory = [];
  }

  /**
   * Get detection statistics
   */
  getDetectionStats(): {
    totalDetections: number;
    averageConfidence: number;
    mostCommonMethod: string;
    confidenceDistribution: Record<string, number>;
  } {
    const history = this.detectionHistory;
    
    if (history.length === 0) {
      return {
        totalDetections: 0,
        averageConfidence: 0,
        mostCommonMethod: 'none',
        confidenceDistribution: {}
      };
    }
    
    const totalDetections = history.length;
    const averageConfidence = history.reduce((sum, h) => sum + h.confidence, 0) / totalDetections;
    
    // Find most common method
    const methodCounts: Record<string, number> = {};
    history.forEach(h => {
      methodCounts[h.method] = (methodCounts[h.method] || 0) + 1;
    });
    
    const mostCommonMethod = Object.entries(methodCounts)
      .reduce((a, b) => methodCounts[a[0]] > methodCounts[b[0]] ? a : b)[0];
    
    // Calculate confidence distribution
    const confidenceDistribution: Record<string, number> = {
      'low (0-50)': 0,
      'medium (51-80)': 0,
      'high (81-100)': 0
    };
    
    history.forEach(h => {
      if (h.confidence <= 50) confidenceDistribution['low (0-50)']++;
      else if (h.confidence <= 80) confidenceDistribution['medium (51-80)']++;
      else confidenceDistribution['high (81-100)']++;
    });
    
    return {
      totalDetections,
      averageConfidence: Math.round(averageConfidence * 10) / 10,
      mostCommonMethod,
      confidenceDistribution
    };
  }
} 