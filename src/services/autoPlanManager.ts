export type PlanType = 'Pro' | 'Max5' | 'Max20' | 'Custom';

export interface PlanSwitchEvent {
  timestamp: string;
  fromPlan: PlanType;
  toPlan: PlanType;
  trigger: 'usage_exceeded' | 'user_manual' | 'history_analysis';
  tokensAtSwitch: number;
  confidence: number;
}

export interface PlanManager {
  currentPlan: PlanType;
  detectedPlan: PlanType;
  autoSwitchEnabled: boolean;
  planLimits: Record<PlanType, number>;
  switchHistory: PlanSwitchEvent[];
  lastAnalysis: string;
  confidence: number;
}

export interface PlanRecommendation {
  recommendedPlan: PlanType;
  confidence: number;
  reasoning: string;
  tokenLimit: number;
  shouldSwitch: boolean;
  urgency: 'low' | 'medium' | 'high';
}

export class AutoPlanManager {
  private static instance: AutoPlanManager;
  
  private readonly PLAN_LIMITS: Record<PlanType, number> = {
    Pro: 7000,
    Max5: 35000,
    Max20: 140000,
    Custom: 500000 // High default for custom
  };

  private state: PlanManager = {
    currentPlan: 'Pro',
    detectedPlan: 'Pro',
    autoSwitchEnabled: true,
    planLimits: { ...this.PLAN_LIMITS },
    switchHistory: [],
    lastAnalysis: new Date().toISOString(),
    confidence: 0
  };

  private constructor() {}

  static getInstance(): AutoPlanManager {
    if (!AutoPlanManager.instance) {
      AutoPlanManager.instance = new AutoPlanManager();
    }
    return AutoPlanManager.instance;
  }

  /**
   * Analyze current usage and recommend plan
   */
  analyzePlan(
    currentTokens: number,
    historicalSessions: Array<{
      totalTokens: number;
      startTime: Date;
      endTime: Date;
      isActive: boolean;
    }>
  ): PlanRecommendation {
    // Filter out active sessions and gaps for analysis
    const completedSessions = historicalSessions.filter(session => !session.isActive);
    
    // Find maximum session tokens from history
    const maxHistoricalTokens = completedSessions.length > 0 
      ? Math.max(...completedSessions.map(s => s.totalTokens))
      : 0;
    
    // Determine recommended plan based on current usage and history
    const recommendation = this.calculateRecommendation(
      currentTokens, 
      maxHistoricalTokens, 
      completedSessions
    );
    
    // Update state
    this.state.detectedPlan = recommendation.recommendedPlan;
    this.state.confidence = recommendation.confidence;
    this.state.lastAnalysis = new Date().toISOString();
    
    // Update custom plan limit if detected
    if (recommendation.recommendedPlan === 'Custom') {
      this.state.planLimits.Custom = recommendation.tokenLimit;
    }
    
    return recommendation;
  }

  /**
   * Calculate plan recommendation based on usage patterns
   */
  private calculateRecommendation(
    currentTokens: number,
    maxHistoricalTokens: number,
    sessions: Array<{totalTokens: number; startTime: Date; endTime: Date}>
  ): PlanRecommendation {
    const maxTokensEverSeen = Math.max(currentTokens, maxHistoricalTokens);
    
    // Plan logic matching Python script behavior
    if (maxTokensEverSeen <= this.PLAN_LIMITS.Pro) {
      return {
        recommendedPlan: 'Pro',
        confidence: 95,
        reasoning: 'Usage fits within Pro plan limits',
        tokenLimit: this.PLAN_LIMITS.Pro,
        shouldSwitch: this.state.currentPlan !== 'Pro',
        urgency: 'low'
      };
    }
    
    if (maxTokensEverSeen <= this.PLAN_LIMITS.Max5) {
      return {
        recommendedPlan: 'Max5',
        confidence: 90,
        reasoning: 'Usage exceeds Pro but fits Max5 plan',
        tokenLimit: this.PLAN_LIMITS.Max5,
        shouldSwitch: this.state.currentPlan !== 'Max5',
        urgency: 'medium'
      };
    }
    
    if (maxTokensEverSeen <= this.PLAN_LIMITS.Max20) {
      return {
        recommendedPlan: 'Max20',
        confidence: 85,
        reasoning: 'Usage exceeds Max5 but fits Max20 plan',
        tokenLimit: this.PLAN_LIMITS.Max20,
        shouldSwitch: this.state.currentPlan !== 'Max20',
        urgency: 'high'
      };
    }
    
    // Custom plan - use highest usage + buffer
    const customLimit = Math.max(
      maxTokensEverSeen * 1.2, // 20% buffer
      this.PLAN_LIMITS.Max20 * 1.1 // At least 10% above Max20
    );
    
    return {
      recommendedPlan: 'Custom',
      confidence: 80,
      reasoning: 'Usage exceeds all standard plans',
      tokenLimit: Math.round(customLimit),
      shouldSwitch: this.state.currentPlan !== 'Custom' || 
                    this.state.planLimits.Custom < customLimit,
      urgency: 'high'
    };
  }

  /**
   * Perform automatic plan switching if enabled
   */
  autoSwitch(
    currentTokens: number,
    recommendation: PlanRecommendation,
    trigger: 'usage_exceeded' | 'history_analysis' = 'usage_exceeded'
  ): {switched: boolean, event?: PlanSwitchEvent} {
    if (!this.state.autoSwitchEnabled) {
      return {switched: false};
    }
    
    // Don't switch if confidence is too low
    if (recommendation.confidence < 70) {
      return {switched: false};
    }
    
    // Don't switch if already on recommended plan (unless custom limit changed)
    if (this.state.currentPlan === recommendation.recommendedPlan && 
        !(recommendation.recommendedPlan === 'Custom' && recommendation.shouldSwitch)) {
      return {switched: false};
    }
    
    // Create switch event
    const switchEvent: PlanSwitchEvent = {
      timestamp: new Date().toISOString(),
      fromPlan: this.state.currentPlan,
      toPlan: recommendation.recommendedPlan,
      trigger,
      tokensAtSwitch: currentTokens,
      confidence: recommendation.confidence
    };
    
    // Perform the switch
    const oldPlan = this.state.currentPlan;
    this.state.currentPlan = recommendation.recommendedPlan;
    
    // Update custom limit if needed
    if (recommendation.recommendedPlan === 'Custom') {
      this.state.planLimits.Custom = recommendation.tokenLimit;
    }
    
    // Add to history
    this.state.switchHistory.push(switchEvent);
    
    // Keep only last 10 switch events
    if (this.state.switchHistory.length > 10) {
      this.state.switchHistory = this.state.switchHistory.slice(-10);
    }
    
    return {switched: true, event: switchEvent};
  }

  /**
   * Manual plan override by user
   */
  manualSwitch(
    toPlan: PlanType, 
    currentTokens: number,
    customLimit?: number
  ): PlanSwitchEvent {
    const switchEvent: PlanSwitchEvent = {
      timestamp: new Date().toISOString(),
      fromPlan: this.state.currentPlan,
      toPlan,
      trigger: 'user_manual',
      tokensAtSwitch: currentTokens,
      confidence: 100 // User choice is always 100% confident
    };
    
    this.state.currentPlan = toPlan;
    
    // Set custom limit if provided
    if (toPlan === 'Custom' && customLimit) {
      this.state.planLimits.Custom = customLimit;
    }
    
    this.state.switchHistory.push(switchEvent);
    
    // Keep only last 10 switch events
    if (this.state.switchHistory.length > 10) {
      this.state.switchHistory = this.state.switchHistory.slice(-10);
    }
    
    return switchEvent;
  }

  /**
   * Get current plan manager state
   */
  getState(): PlanManager {
    return { ...this.state };
  }

  /**
   * Get current plan limit
   */
  getCurrentLimit(): number {
    return this.state.planLimits[this.state.currentPlan];
  }

  /**
   * Enable/disable auto switching
   */
  setAutoSwitchEnabled(enabled: boolean): void {
    this.state.autoSwitchEnabled = enabled;
  }

  /**
   * Get plan progression path
   */
  getPlanProgression(): PlanType[] {
    return ['Pro', 'Max5', 'Max20', 'Custom'];
  }

  /**
   * Check if current usage exceeds current plan
   */
  isUsageExceeded(currentTokens: number): boolean {
    return currentTokens > this.getCurrentLimit();
  }

  /**
   * Get usage percentage for current plan
   */
  getUsagePercentage(currentTokens: number): number {
    const limit = this.getCurrentLimit();
    return limit > 0 ? Math.min(100, (currentTokens / limit) * 100) : 0;
  }

  /**
   * Get switch history for analytics
   */
  getSwitchHistory(): PlanSwitchEvent[] {
    return [...this.state.switchHistory];
  }

  /**
   * Get plan statistics
   */
  getPlanStats(): {
    totalSwitches: number;
    autoSwitches: number;
    manualSwitches: number;
    mostUsedPlan: PlanType;
    averageConfidence: number;
  } {
    const history = this.state.switchHistory;
    const totalSwitches = history.length;
    const autoSwitches = history.filter(e => e.trigger !== 'user_manual').length;
    const manualSwitches = history.filter(e => e.trigger === 'user_manual').length;
    
    // Calculate most used plan by counting switches TO each plan
    const planCounts: Record<PlanType, number> = {
      Pro: 0, Max5: 0, Max20: 0, Custom: 0
    };
    
    history.forEach(event => {
      planCounts[event.toPlan]++;
    });
    
    const mostUsedPlan = Object.entries(planCounts)
      .reduce((a, b) => planCounts[a[0] as PlanType] > planCounts[b[0] as PlanType] ? a : b)[0] as PlanType;
    
    const averageConfidence = totalSwitches > 0 
      ? history.reduce((sum, event) => sum + event.confidence, 0) / totalSwitches 
      : 0;
    
    return {
      totalSwitches,
      autoSwitches,
      manualSwitches,
      mostUsedPlan,
      averageConfidence
    };
  }

  /**
   * Reset plan manager state (for testing)
   */
  reset(): void {
    this.state = {
      currentPlan: 'Pro',
      detectedPlan: 'Pro',
      autoSwitchEnabled: true,
      planLimits: { ...this.PLAN_LIMITS },
      switchHistory: [],
      lastAnalysis: new Date().toISOString(),
      confidence: 0
    };
  }

  /**
   * Get plan display information
   */
  getPlanInfo(plan: PlanType): {
    name: string;
    limit: number;
    description: string;
    color: string;
  } {
    const info = {
      Pro: {
        name: 'Pro',
        limit: this.PLAN_LIMITS.Pro,
        description: 'Standard usage limit',
        color: '#10B981'
      },
      Max5: {
        name: 'Max 5K',
        limit: this.PLAN_LIMITS.Max5,
        description: 'Enhanced usage limit',
        color: '#3B82F6'
      },
      Max20: {
        name: 'Max 20K',
        limit: this.PLAN_LIMITS.Max20,
        description: 'High usage limit',
        color: '#8B5CF6'
      },
      Custom: {
        name: 'Custom',
        limit: this.state.planLimits.Custom,
        description: 'Unlimited usage',
        color: '#F59E0B'
      }
    };
    
    return info[plan];
  }
} 