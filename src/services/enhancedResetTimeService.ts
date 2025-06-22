import { 
  addHours, 
  addDays, 
  addMonths,
  startOfDay, 
  differenceInMilliseconds,
  differenceInMinutes,
  differenceInHours,
  format,
  setHours,
  setMinutes,
  setSeconds,
  setMilliseconds,
  isAfter,
  isBefore,
  startOfHour,
  endOfHour
} from 'date-fns';
import { toZonedTime, fromZonedTime, format as formatTz } from 'date-fns-tz';

export interface ResetSchedule {
  type: 'interval' | 'monthly' | 'custom';
  intervalHours?: number; // For interval mode (default: 5)
  resetHours?: number[]; // Custom hours for resets [4, 9, 14, 18, 23]
  timezone: string;
  monthlyResetDay?: number; // For monthly mode
}

export interface EnhancedResetTimeInfo {
  nextResetTime: string;
  timeUntilReset: number;
  resetType: 'interval' | 'monthly';
  resetSchedule: number[]; // All reset hours for the day
  timeSinceLastReset: number;
  cycleDuration: number; // Total cycle length in ms
  cycleProgress: number; // 0-100 percentage through current cycle
  formattedTimeUntilReset: string;
  formattedNextResetTime: string;
  lastResetTime: string;
  isInCriticalPeriod: boolean; // Last 20% of cycle
}

export class EnhancedResetTimeService {
  private static instance: EnhancedResetTimeService;
  
  // Default configuration matching Python script
  private defaultSchedule: ResetSchedule = {
    type: 'interval',
    intervalHours: 5,
    resetHours: [4, 9, 14, 18, 23], // Claude's 5-hour intervals
    timezone: 'America/Los_Angeles', // Pacific Time (Claude's default)
    monthlyResetDay: 1
  };

  private currentSchedule: ResetSchedule;

  constructor(schedule?: Partial<ResetSchedule>) {
    this.currentSchedule = { ...this.defaultSchedule, ...schedule };
  }

  static getInstance(schedule?: Partial<ResetSchedule>): EnhancedResetTimeService {
    if (!EnhancedResetTimeService.instance) {
      EnhancedResetTimeService.instance = new EnhancedResetTimeService(schedule);
    } else if (schedule) {
      EnhancedResetTimeService.instance.updateSchedule(schedule);
    }
    return EnhancedResetTimeService.instance;
  }

  updateSchedule(schedule: Partial<ResetSchedule>): void {
    this.currentSchedule = { ...this.currentSchedule, ...schedule };
  }

  getSchedule(): ResetSchedule {
    return { ...this.currentSchedule };
  }

  /**
   * Calculate enhanced reset time information
   * Supports both 5-hour intervals and monthly resets
   */
  calculateEnhancedResetInfo(currentDate: Date = new Date()): EnhancedResetTimeInfo {
    const { type, timezone } = this.currentSchedule;
    
    // Convert current time to configured timezone
    const zonedNow = toZonedTime(currentDate, timezone);
    
    if (type === 'interval') {
      return this.calculateIntervalResetInfo(zonedNow, currentDate, timezone);
    } else if (type === 'monthly') {
      return this.calculateMonthlyResetInfo(zonedNow, currentDate, timezone);
    } else {
      return this.calculateCustomResetInfo(zonedNow, currentDate, timezone);
    }
  }

  /**
   * Calculate reset info for 5-hour interval mode (like Python script)
   */
  private calculateIntervalResetInfo(
    zonedNow: Date, 
    utcNow: Date, 
    timezone: string
  ): EnhancedResetTimeInfo {
    const { resetHours } = this.currentSchedule;
    const scheduleHours = resetHours || [4, 9, 14, 18, 23];
    
    // Find next reset hour
    const currentHour = zonedNow.getHours();
    const currentMinute = zonedNow.getMinutes();
    
    let nextResetHour = scheduleHours.find(hour => 
      hour > currentHour || (hour === currentHour && currentMinute === 0)
    );
    
    let nextResetDate = zonedNow;
    
    // If no reset hour found today, use first one tomorrow
    if (nextResetHour === undefined) {
      nextResetHour = scheduleHours[0];
      nextResetDate = addDays(zonedNow, 1);
    }
    
    // Create next reset time in timezone
    const zonedNextReset = setMilliseconds(
      setSeconds(
        setMinutes(
          setHours(startOfDay(nextResetDate), nextResetHour),
          0
        ),
        0
      ),
      0
    );
    
    // Find last reset time
    const lastResetHour = this.findLastResetHour(scheduleHours, currentHour, currentMinute);
    let lastResetDate = zonedNow;
    
    if (lastResetHour > currentHour || (lastResetHour === currentHour && currentMinute === 0)) {
      lastResetDate = addDays(zonedNow, -1);
    }
    
    const zonedLastReset = setMilliseconds(
      setSeconds(
        setMinutes(
          setHours(startOfDay(lastResetDate), lastResetHour),
          0
        ),
        0
      ),
      0
    );
    
    // Convert to UTC
    const utcNextReset = fromZonedTime(zonedNextReset, timezone);
    const utcLastReset = fromZonedTime(zonedLastReset, timezone);
    
    // Calculate metrics
    const timeUntilReset = Math.max(0, differenceInMilliseconds(utcNextReset, utcNow));
    const timeSinceLastReset = Math.max(0, differenceInMilliseconds(utcNow, utcLastReset));
    const cycleDuration = differenceInMilliseconds(utcNextReset, utcLastReset);
    const cycleProgress = cycleDuration > 0 ? (timeSinceLastReset / cycleDuration) * 100 : 0;
    
    return {
      nextResetTime: utcNextReset.toISOString(),
      timeUntilReset,
      resetType: 'interval',
      resetSchedule: scheduleHours,
      timeSinceLastReset,
      cycleDuration,
      cycleProgress: Math.min(100, Math.max(0, cycleProgress)),
      formattedTimeUntilReset: this.formatDuration(timeUntilReset),
      formattedNextResetTime: this.formatResetTime(utcNextReset, timezone),
      lastResetTime: utcLastReset.toISOString(),
      isInCriticalPeriod: cycleProgress > 80 // Last 20% of cycle
    };
  }

  /**
   * Calculate reset info for monthly mode
   */
  private calculateMonthlyResetInfo(
    zonedNow: Date, 
    utcNow: Date, 
    timezone: string
  ): EnhancedResetTimeInfo {
    const { monthlyResetDay } = this.currentSchedule;
    const resetDay = monthlyResetDay || 1;
    
    // Calculate next monthly reset
    let nextReset = setMilliseconds(
      setSeconds(
        setMinutes(
          setHours(startOfDay(zonedNow), 9), // 9 AM reset
          0
        ),
        0
      ),
      0
    );
    
    // Set to reset day of month
    nextReset = setMilliseconds(
      setSeconds(
        setMinutes(
          setHours(
            new Date(nextReset.getFullYear(), nextReset.getMonth(), resetDay),
            9
          ),
          0
        ),
        0
      ),
      0
    );
    
    // If this month's reset has passed, move to next month
    if (isBefore(nextReset, zonedNow)) {
      nextReset = addMonths(nextReset, 1);
    }
    
    // Calculate last reset
    const lastReset = addMonths(nextReset, -1);
    
    // Convert to UTC
    const utcNextReset = fromZonedTime(nextReset, timezone);
    const utcLastReset = fromZonedTime(lastReset, timezone);
    
    // Calculate metrics
    const timeUntilReset = Math.max(0, differenceInMilliseconds(utcNextReset, utcNow));
    const timeSinceLastReset = Math.max(0, differenceInMilliseconds(utcNow, utcLastReset));
    const cycleDuration = differenceInMilliseconds(utcNextReset, utcLastReset);
    const cycleProgress = cycleDuration > 0 ? (timeSinceLastReset / cycleDuration) * 100 : 0;
    
    return {
      nextResetTime: utcNextReset.toISOString(),
      timeUntilReset,
      resetType: 'monthly',
      resetSchedule: [9], // Monthly resets at 9 AM
      timeSinceLastReset,
      cycleDuration,
      cycleProgress: Math.min(100, Math.max(0, cycleProgress)),
      formattedTimeUntilReset: this.formatDuration(timeUntilReset),
      formattedNextResetTime: this.formatResetTime(utcNextReset, timezone),
      lastResetTime: utcLastReset.toISOString(),
      isInCriticalPeriod: cycleProgress > 90 // Last 10% of monthly cycle
    };
  }

  /**
   * Calculate reset info for custom mode
   */
  private calculateCustomResetInfo(
    zonedNow: Date, 
    utcNow: Date, 
    timezone: string
  ): EnhancedResetTimeInfo {
    // For custom mode, fall back to interval mode with custom hours
    return this.calculateIntervalResetInfo(zonedNow, utcNow, timezone);
  }

  /**
   * Find the last reset hour that occurred
   */
  private findLastResetHour(scheduleHours: number[], currentHour: number, currentMinute: number): number {
    // Sort hours in descending order
    const sortedHours = [...scheduleHours].sort((a, b) => b - a);
    
    // Find the last hour that has passed
    for (const hour of sortedHours) {
      if (hour < currentHour || (hour === currentHour && currentMinute > 0)) {
        return hour;
      }
    }
    
    // If no hour has passed today, use the last hour from yesterday
    return sortedHours[0];
  }

  /**
   * Format duration in human-readable format
   */
  private formatDuration(milliseconds: number): string {
    const totalMinutes = Math.floor(milliseconds / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return `${days}d ${remainingHours}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return 'Soon';
    }
  }

  /**
   * Format reset time in user's timezone
   */
  private formatResetTime(utcDate: Date, timezone: string): string {
    try {
      const zonedDate = toZonedTime(utcDate, timezone);
      return formatTz(zonedDate, 'MMM d \'at\' h:mm a zzz', { timeZone: timezone });
    } catch (error) {
      return format(utcDate, 'MMM d \'at\' h:mm a \'UTC\'');
    }
  }

  /**
   * Check if current time is in critical period (approaching reset)
   */
  isInCriticalPeriod(resetInfo: EnhancedResetTimeInfo): boolean {
    return resetInfo.isInCriticalPeriod;
  }

  /**
   * Get time progress bar data for UI
   */
  getProgressBarData(resetInfo: EnhancedResetTimeInfo): {
    percentage: number;
    timeElapsed: string;
    timeRemaining: string;
    status: 'normal' | 'warning' | 'critical';
  } {
    const percentage = resetInfo.cycleProgress;
    const status = percentage > 90 ? 'critical' : percentage > 70 ? 'warning' : 'normal';
    
    return {
      percentage,
      timeElapsed: this.formatDuration(resetInfo.timeSinceLastReset),
      timeRemaining: resetInfo.formattedTimeUntilReset,
      status
    };
  }

  /**
   * Get velocity emoji based on time progress (like Python script)
   */
  getVelocityEmoji(resetInfo: EnhancedResetTimeInfo): string {
    const progress = resetInfo.cycleProgress;
    
    if (progress < 25) return '🐌'; // Slow start
    if (progress < 50) return '➡️'; // Normal
    if (progress < 75) return '🚀'; // Fast
    return '⚡'; // Very fast (critical)
  }

  /**
   * Get all available timezones
   */
  static getAvailableTimezones(): Array<{label: string, value: string}> {
    return [
      { label: 'Pacific Time (Los Angeles)', value: 'America/Los_Angeles' },
      { label: 'Mountain Time (Denver)', value: 'America/Denver' },
      { label: 'Central Time (Chicago)', value: 'America/Chicago' },
      { label: 'Eastern Time (New York)', value: 'America/New_York' },
      { label: 'GMT (London)', value: 'Europe/London' },
      { label: 'CET (Paris)', value: 'Europe/Paris' },
      { label: 'JST (Tokyo)', value: 'Asia/Tokyo' },
      { label: 'AEST (Sydney)', value: 'Australia/Sydney' },
      { label: 'UTC', value: 'UTC' }
    ];
  }

  /**
   * Get Claude's default 5-hour schedule
   */
  static getClaudeDefaultSchedule(): ResetSchedule {
    return {
      type: 'interval',
      intervalHours: 5,
      resetHours: [4, 9, 14, 18, 23],
      timezone: 'America/Los_Angeles',
    };
  }
} 