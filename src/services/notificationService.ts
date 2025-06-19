import { Notification } from 'electron';
import { MenuBarData } from '../types/usage';

export class NotificationService {
  private static instance: NotificationService;
  private lastNotificationTime: number = 0;
  private readonly NOTIFICATION_COOLDOWN = 300000; // 5 minutes
  private lastWarningLevel: 'safe' | 'warning' | 'critical' = 'safe';

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  checkAndNotify(data: MenuBarData): void {
    const now = Date.now();
    const timeSinceLastNotification = now - this.lastNotificationTime;

    // Only notify if enough time has passed and status has worsened
    if (timeSinceLastNotification < this.NOTIFICATION_COOLDOWN) {
      return;
    }

    // Check if we should send a notification
    let shouldNotify = false;
    let title = '';
    let body = '';

    if (data.status === 'critical' && this.lastWarningLevel !== 'critical') {
      shouldNotify = true;
      title = '🚨 Claude Code Usage Critical';
      body = `You've used ${Math.round(data.percentageUsed)}% of your tokens. Consider upgrading your plan.`;
    } else if (data.status === 'warning' && this.lastWarningLevel === 'safe') {
      shouldNotify = true;
      title = '⚠️ Claude Code Usage Warning';
      body = `You've used ${Math.round(data.percentageUsed)}% of your tokens. Monitor your usage carefully.`;
    }

    if (shouldNotify) {
      this.sendNotification(title, body);
      this.lastNotificationTime = now;
      this.lastWarningLevel = data.status;
    }
  }

  private sendNotification(title: string, body: string): void {
    try {
      if (Notification.isSupported()) {
        new Notification({
          title,
          body,
          silent: false
        }).show();
      }
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  // Send a daily summary notification
  sendDailySummary(tokensUsed: number, cost: number): void {
    if (!Notification.isSupported()) return;

    const title = '📊 Daily Claude Code Summary';
    const body = `Today: ${tokensUsed.toLocaleString()} tokens used, $${cost.toFixed(3)} spent`;
    
    this.sendNotification(title, body);
  }
}