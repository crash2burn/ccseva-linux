# Advanced Claude Usage Monitor - Product Requirements Document

## Overview
This PRD outlines the implementation of advanced monitoring features to match and exceed the Python Claude Code Usage Monitor functionality, focusing on intelligent prediction, dynamic configuration, and enhanced user experience.

## Goals
- **Primary**: Implement sophisticated usage monitoring with accurate predictions
- **Secondary**: Provide intelligent auto-configuration and plan management
- **Tertiary**: Enable advanced burn rate analytics for better usage insights

## Features

### 1. Enhanced Reset Time System
**Priority**: P0 (Critical)

#### Requirements
- **Multiple Daily Resets**: Support 5-hour interval resets (4AM, 9AM, 2PM, 6PM, 11PM) like Python script
- **Configurable Timezone**: Full timezone support with DST handling
- **Custom Reset Hours**: Allow users to set custom reset schedules
- **Mixed Mode**: Support both 5-hour intervals and monthly billing cycles

#### Technical Specifications
```typescript
interface ResetSchedule {
  type: 'interval' | 'monthly' | 'custom';
  intervalHours?: number; // For interval mode (default: 5)
  resetHours?: number[]; // Custom hours for resets [4, 9, 14, 18, 23]
  timezone: string;
  monthlyResetDay?: number; // For monthly mode
}

interface ResetTimeInfo {
  nextResetTime: string;
  timeUntilReset: number;
  resetType: 'interval' | 'monthly';
  resetSchedule: number[]; // All reset hours for the day
  timeSinceLastReset: number;
  cycleDuration: number; // Total cycle length in ms
  cycleProgress: number; // 0-100 percentage through current cycle
}
```

#### User Stories
- As a user, I want to see when my tokens will reset based on Claude's 5-hour intervals
- As a user, I want to configure my timezone so reset times are accurate
- As a user, I want to choose between interval and monthly reset tracking

### 2. Auto Plan Switching
**Priority**: P0 (Critical)

#### Requirements
- **Dynamic Detection**: Automatically detect when token usage exceeds current plan limits
- **Seamless Switching**: Switch from Pro → Max5 → Max20 → Custom without user intervention
- **Usage History Analysis**: Use historical data to determine appropriate plan limits
- **User Notification**: Inform users when plan switching occurs
- **Manual Override**: Allow users to manually set plan preferences

#### Technical Specifications
```typescript
interface PlanManager {
  currentPlan: PlanType;
  detectedPlan: PlanType;
  autoSwitchEnabled: boolean;
  planLimits: Record<PlanType, number>;
  switchHistory: PlanSwitchEvent[];
}

interface PlanSwitchEvent {
  timestamp: string;
  fromPlan: PlanType;
  toPlan: PlanType;
  trigger: 'usage_exceeded' | 'user_manual' | 'history_analysis';
  tokensAtSwitch: number;
}

type PlanType = 'Pro' | 'Max5' | 'Max20' | 'Custom';
```

#### User Stories
- As a user, I want the app to automatically adjust my plan when I exceed limits
- As a user, I want to be notified when plan switching occurs
- As a user, I want to override automatic plan detection if needed

### 3. Advanced Burn Rate Calculation
**Priority**: P1 (High)

#### Requirements
- **Multi-Session Analysis**: Calculate burn rate across all sessions in the last hour
- **Weighted Calculation**: Account for session overlap and duration
- **Trend Analysis**: Track burn rate trends over time (increasing/decreasing/stable)
- **Peak Hour Detection**: Identify peak usage hours
- **Velocity Indicators**: Provide speed classifications (🐌🚀⚡)

#### Technical Specifications
```typescript
interface BurnRateAnalytics {
  current: number; // tokens per minute
  hourly: number; // tokens per hour
  trend: {
    direction: 'increasing' | 'decreasing' | 'stable';
    percentage: number; // % change from previous period
  };
  velocity: {
    classification: 'slow' | 'normal' | 'fast' | 'very_fast';
    emoji: string;
    threshold: number;
  };
  peakHour: number; // 0-23
  confidence: number; // 0-100
}

interface SessionOverlap {
  sessionId: string;
  startTime: Date;
  endTime: Date;
  actualEndTime?: Date;
  isActive: boolean;
  tokensUsed: number;
  overlapDuration: number; // ms overlap with analysis window
  weightedTokens: number; // tokens attributed to analysis window
}
```

#### User Stories
- As a user, I want accurate burn rate calculations that account for multiple sessions
- As a user, I want to see trends in my usage patterns
- As a user, I want visual indicators of my current usage speed

### 4. Prediction Engine
**Priority**: P1 (High)

#### Requirements
- **Depletion Prediction**: Predict exact time when tokens will be depleted
- **Confidence Scoring**: Provide confidence levels for predictions
- **Multiple Scenarios**: Show best/worst/likely case scenarios
- **Reset Awareness**: Factor in upcoming resets when predicting
- **Recommendation System**: Suggest daily limits to last until reset

#### Technical Specifications
```typescript
interface PredictionEngine {
  depletion: {
    estimatedTime: string | null;
    confidence: number;
    scenarios: {
      optimistic: string; // slower usage
      realistic: string; // current rate
      pessimistic: string; // faster usage
    };
  };
  recommendations: {
    dailyLimit: number;
    hourlyBudget: number;
    slowDownRequired: boolean;
    bufferDays: number;
  };
  onTrackForReset: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

interface PredictionModel {
  calculateDepletion(
    tokensRemaining: number,
    burnRate: BurnRateAnalytics,
    resetInfo: ResetTimeInfo
  ): PredictionEngine;
  
  getConfidence(
    historicalAccuracy: number,
    dataPoints: number,
    timeRange: number
  ): number;
}
```

#### User Stories
- As a user, I want to know exactly when my tokens will run out
- As a user, I want to understand the confidence level of predictions
- As a user, I want recommendations on how to pace my usage

### 5. Token Limit Detection
**Priority**: P1 (High)

#### Requirements
- **Historical Analysis**: Analyze past sessions to detect maximum token usage
- **Adaptive Limits**: Automatically adjust token limits based on usage patterns
- **Plan Validation**: Verify detected limits against known plan capabilities
- **User Confirmation**: Allow users to confirm or override detected limits
- **Fallback Logic**: Handle cases where detection fails

#### Technical Specifications
```typescript
interface TokenLimitDetector {
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

interface LimitDetectionConfig {
  minimumSessions: number; // Minimum sessions needed for detection
  confidenceThreshold: number; // Minimum confidence to auto-apply
  maxLookbackDays: number; // How far back to analyze
  outlierThreshold: number; // Remove outlier sessions
}
```

#### User Stories
- As a user, I want the app to automatically detect my token limits
- As a user, I want to understand how limits were detected
- As a user, I want to override automatic detection if needed

## Technical Architecture

### Service Layer Enhancements
```typescript
// Enhanced service architecture
interface AdvancedMonitoringService {
  resetTimeService: EnhancedResetTimeService;
  planManager: AutoPlanManager;
  burnRateAnalyzer: AdvancedBurnRateAnalyzer;
  predictionEngine: PredictionEngine;
  limitDetector: TokenLimitDetector;
}
```

### Data Flow
1. **Session Data** → **Burn Rate Analyzer** → **Real-time metrics**
2. **Historical Data** → **Token Limit Detector** → **Plan recommendations**
3. **Current Usage + Predictions** → **Plan Manager** → **Auto-switching**
4. **All Data** → **Prediction Engine** → **User recommendations**

### Performance Requirements
- **Update Frequency**: 3-5 second intervals for real-time feel
- **Calculation Speed**: <100ms for all analytics
- **Memory Usage**: <50MB additional overhead
- **Battery Impact**: Minimal (efficient calculations)

## Implementation Phases

### Phase 1: Foundation (Week 1)
- Enhanced Reset Time Service
- Basic Auto Plan Switching
- Advanced Burn Rate calculation framework

### Phase 2: Intelligence (Week 2)
- Prediction Engine core
- Token Limit Detection
- Historical data analysis

### Phase 3: UI Integration (Week 3)
- New UI components for advanced features
- Settings panel enhancements
- Real-time status updates

### Phase 4: Polish (Week 4)
- Performance optimization
- Error handling and edge cases
- User testing and refinement

## Success Criteria
- ✅ Reset times accurate to within 1 minute of Python script
- ✅ Auto plan switching works seamlessly
- ✅ Burn rate calculations match Python implementation
- ✅ Predictions accurate within 15% of actual depletion
- ✅ Token limit detection 90%+ accurate
- ✅ No performance degradation in UI responsiveness

## Risks & Mitigations
- **Risk**: Complex calculations impact performance
  **Mitigation**: Web Workers for heavy calculations
- **Risk**: Prediction accuracy varies
  **Mitigation**: Multiple prediction models with confidence scoring
- **Risk**: Auto-switching confuses users
  **Mitigation**: Clear notifications and manual override options

## Dependencies
- Enhanced ccusage integration for historical data
- Date/time libraries for timezone handling
- Statistical libraries for prediction modeling
- UI framework updates for new components

---

*This PRD serves as the blueprint for implementing advanced monitoring features that will make the Electron app superior to the Python script while maintaining compatibility and user-friendliness.* 