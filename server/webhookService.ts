import crypto from 'crypto';
import { storage } from './storage';
// Import types from schema
import type { Webhook, ActivityLog } from './schema';

export interface WebhookPayload {
  event: string;
  timestamp: string;
  application_id: number;
  user_data?: {
    id: number;
    username: string;
    email?: string;
    hwid?: string;
    ip_address?: string;
    user_agent?: string;
    location?: string;
  };
  metadata?: any;
  success: boolean;
  error_message?: string;
}

export class WebhookService {
  private static instance: WebhookService;
  
  static getInstance(): WebhookService {
    if (!WebhookService.instance) {
      WebhookService.instance = new WebhookService();
    }
    return WebhookService.instance;
  }

  private generateSignature(payload: string, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }

  private formatDiscordWebhook(payload: WebhookPayload): any {
    const color = payload.success ? 0x00ff00 : 0xff0000; // Green for success, red for failure
    const eventEmoji: Record<string, string> = {
      'user_login': '🔐',
      'login_failed': '❌',
      'user_register': '👤',
      'account_expired': '⏰',
      'hwid_mismatch': '🔒',
      'version_mismatch': '🔄',
      'account_disabled': '🚫',
      'login_blocked_ip': '🚫',
      'login_blocked_username': '🚫',
      'login_blocked_hwid': '🚫'
    };

    interface DiscordEmbedField {
      name: string;
      value: string;
      inline: boolean;
    }

    const fields: DiscordEmbedField[] = [];

    const embed = {
      title: `${eventEmoji[payload.event as keyof typeof eventEmoji] || '📊'} ${payload.event.replace('_', ' ').toUpperCase()}`,
      color: color,
      timestamp: payload.timestamp,
      fields: fields,
      footer: {
        text: `Application ID: ${payload.application_id}`
      }
    };

    if (payload.user_data) {
      fields.push({
        name: 'User Information',
        value: `**Username:** ${payload.user_data.username}\n${payload.user_data.email ? `**Email:** ${payload.user_data.email}\n` : ''}${payload.user_data.ip_address ? `**IP:** ${payload.user_data.ip_address}\n` : ''}${payload.user_data.hwid ? `**HWID:** ${payload.user_data.hwid}\n` : ''}`,
        inline: true
      });
    }

    if (payload.error_message) {
      fields.push({
        name: 'Error Details',
        value: payload.error_message,
        inline: false
      });
    }

    if (payload.metadata) {
      fields.push({
        name: 'Additional Information',
        value: Object.entries(payload.metadata).map(([key, value]) => `**${key}:** ${value}`).join('\n'),
        inline: false
      });
    }

    return {
      embeds: [embed]
    };
  }

  async sendWebhook(webhook: Webhook, payload: WebhookPayload, retryCount: number = 0): Promise<boolean> {
    const maxRetries = 5; // Increased for Vietnam server connectivity
    const baseRetryDelay = 2000; // Base delay increased for international latency
    const retryDelay = Math.min(baseRetryDelay * Math.pow(2, retryCount), 30000); // Cap at 30 seconds
    
    try {
      // Check if this is a Discord webhook URL
      const isDiscordWebhook = webhook.url.includes('discord.com/api/webhooks');
      
      let webhookPayload;
      if (isDiscordWebhook) {
        webhookPayload = this.formatDiscordWebhook(payload);
      } else {
        webhookPayload = payload;
      }

      const payloadString = JSON.stringify(webhookPayload);
      const signature = webhook.secret 
        ? this.generateSignature(payloadString, webhook.secret)
        : undefined;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'AdiCheats-Webhook/1.0 (Vietnam-Optimized)',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache',
        'X-Forwarded-For': process.env.REPLIT_DEPLOYMENT_REGION || 'unknown',
        'X-Server-Region': 'Vietnam-Optimized',
      };

      // Only add custom headers for non-Discord webhooks
      if (!isDiscordWebhook) {
        headers['X-Webhook-Timestamp'] = payload.timestamp;
        headers['X-Webhook-Event'] = payload.event;
        headers['X-Webhook-Retry-Count'] = retryCount.toString();
        headers['X-Webhook-Server-Time'] = new Date().toISOString();
        
        if (signature) {
          headers['X-Webhook-Signature'] = `sha256=${signature}`;
        }
      }

      // Extended timeout optimized for Vietnam server connectivity
      const timeout = 45000 + (retryCount * 5000); // Increase timeout with retries
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      console.log(`🌐 Sending webhook to: ${webhook.url} (attempt ${retryCount + 1}/${maxRetries + 1}) - Timeout: ${timeout}ms`);
      console.log(`📍 Server region: ${process.env.REPLIT_DEPLOYMENT_REGION || 'unknown'}`);
      
      const startTime = Date.now();
      
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: payloadString,
        signal: controller.signal,
        // Vietnam server optimized settings
        keepalive: true,
        redirect: 'follow',
        cache: 'no-cache',
        mode: 'cors',
        referrerPolicy: 'no-referrer',
        // Additional performance optimizations
        priority: 'high',
        duplex: 'half'
      } as RequestInit);
      
      clearTimeout(timeoutId);

      const responseTime = Date.now() - startTime;
      const serverRegion = response.headers.get('cf-ray') || response.headers.get('server') || 'unknown';
      
      console.log(`✅ Webhook response: ${response.status} | Time: ${responseTime}ms | Server: ${serverRegion}`);
      
      if (!response.ok) {
        let errorText = '';
        let isJsonResponse = false;
        
        try {
          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            isJsonResponse = true;
            const jsonError = await response.json();
            errorText = JSON.stringify(jsonError);
          } else {
            errorText = await response.text();
            // Check if response is HTML (common error indicator)
            if (errorText.includes('<!DOCTYPE') || errorText.includes('<html>')) {
              errorText = `Webhook endpoint returned HTML page instead of JSON. Status: ${response.status}. This usually means the URL is incorrect or the endpoint doesn't accept POST requests.`;
            }
          }
        } catch (e) {
          errorText = `Unable to read response. Content-Type: ${response.headers.get('content-type') || 'unknown'}`;
        }
        
        console.error(`❌ Webhook error (${response.status}):`, errorText);
        console.error(`🔍 Details: URL=${webhook.url}, Event=${payload.event}, User=${payload.user_data?.id || 'unknown'}`);
        console.error(`📄 Response type: ${isJsonResponse ? 'JSON' : 'Non-JSON'}`);
        
        // Enhanced retry logic optimized for Vietnam server connectivity
        const shouldRetry = retryCount < maxRetries && (
          response.status >= 500 || // Server errors
          response.status === 429 || // Rate limiting
          response.status === 0 ||   // Network errors
          response.status === 408 || // Request timeout
          response.status === 502 || // Bad gateway
          response.status === 503 || // Service unavailable
          response.status === 504    // Gateway timeout
        );
        
        if (shouldRetry) {
          const jitter = Math.random() * 3000; // Up to 3 seconds jitter
          const adjustedDelay = retryDelay + jitter;
          console.log(`🔄 Retrying webhook in ${Math.round(adjustedDelay)}ms... (Status: ${response.status})`);
          await new Promise(resolve => setTimeout(resolve, adjustedDelay));
          return this.sendWebhook(webhook, payload, retryCount + 1);
        }
      } else {
        console.log(`🎉 Webhook delivered successfully in ${responseTime}ms to ${serverRegion}`);
      }

      return response.ok;
    } catch (error) {
      const errorName = error instanceof Error ? error.name : 'Unknown';
      const errorMessage = error instanceof Error ? error.message : String(error);
      const duration = Date.now() - (Date.now() - 1000); // Approximate duration
      
      console.error(`💥 Webhook delivery failed (${errorName}):`, errorMessage);
      console.error(`🔍 Details: URL=${webhook.url}, Event=${payload.event}, Attempt=${retryCount + 1}/${maxRetries + 1}`);
      
      // Enhanced retry logic for Vietnam server connectivity issues
      const isRetryableError = error instanceof Error && (
        error.name === 'AbortError' ||
        error.name === 'TypeError' ||
        error.name === 'TimeoutError' ||
        error.name === 'NetworkError' ||
        error.message.includes('fetch') ||
        error.message.includes('network') ||
        error.message.includes('timeout') ||
        error.message.includes('ENOTFOUND') ||
        error.message.includes('ECONNRESET') ||
        error.message.includes('ETIMEDOUT') ||
        error.message.includes('ECONNREFUSED') ||
        error.message.includes('EHOSTUNREACH') ||
        error.message.includes('socket hang up') ||
        error.message.includes('getaddrinfo') ||
        error.message.includes('DNS')
      );
      
      if (retryCount < maxRetries && isRetryableError) {
        const jitter = Math.random() * 5000; // Up to 5 seconds jitter for network issues
        const adjustedDelay = retryDelay + jitter;
        console.log(`🔄 Retrying webhook in ${Math.round(adjustedDelay)}ms due to ${errorName}: ${errorMessage}`);
        await new Promise(resolve => setTimeout(resolve, adjustedDelay));
        return this.sendWebhook(webhook, payload, retryCount + 1);
      }
      
      console.error(`❌ Final webhook delivery failure after ${retryCount + 1} attempts`);
      return false;
    }
  }

  async deliverWebhooks(userId: string, event: string, payload: WebhookPayload): Promise<void> {
    try {
      const webhooks = await storage.getUserWebhooks(userId);
      console.log(`Attempting to deliver webhook for event: ${event}`);
      console.log(`Found ${webhooks.length} webhooks for user ${userId}`);
      console.log(`Request origin: IP=${payload.user_data?.ip_address || 'unknown'}, Location=${payload.user_data?.location || 'unknown'}`);
      
      const activeWebhooks = webhooks.filter(w => 
        w.isActive && w.events && w.events.includes(event)
      );
      
      console.log(`Active webhooks for event ${event}:`, activeWebhooks.length);
      activeWebhooks.forEach(w => {
        console.log(`Webhook ${w.id} events:`, w.events);
      });

      // Send webhooks with enhanced monitoring and sequential delivery for better reliability
      const deliveryResults = [];
      
      for (const webhook of activeWebhooks) {
        console.log(`Delivering webhook ${webhook.id} to: ${webhook.url}`);
        const startTime = Date.now();
        
        try {
          const success = await this.sendWebhook(webhook, payload);
          const duration = Date.now() - startTime;
          
          deliveryResults.push({
            webhookId: webhook.id,
            url: webhook.url,
            success,
            duration,
            error: null
          });
          
          console.log(`Webhook ${webhook.id} delivery ${success ? 'succeeded' : 'failed'} in ${duration}ms`);
        } catch (error) {
          const duration = Date.now() - startTime;
          const errorMessage = error instanceof Error ? error.message : String(error);
          
          deliveryResults.push({
            webhookId: webhook.id,
            url: webhook.url,
            success: false,
            duration,
            error: errorMessage
          });
          
          console.error(`Webhook ${webhook.id} delivery failed after ${duration}ms:`, errorMessage);
        }
        
        // Add small delay between webhook deliveries to prevent overwhelming
        if (activeWebhooks.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      // Log comprehensive delivery summary
      const successCount = deliveryResults.filter(r => r.success).length;
      const failureCount = deliveryResults.length - successCount;
      console.log(`Webhook delivery summary: ${successCount} succeeded, ${failureCount} failed out of ${deliveryResults.length} total`);
      
      if (failureCount > 0) {
        console.log('Failed deliveries:', deliveryResults.filter(r => !r.success));
      }
    } catch (error) {
      console.error('Failed to deliver webhooks:', error);
    }
  }

  async logActivity(activityData: {
    applicationId: number;
    appUserId?: number;
    event: string;
    ipAddress?: string;
    hwid?: string;
    userAgent?: string;
    metadata?: any;
    success?: boolean;
    errorMessage?: string;
  }): Promise<void> {
    try {
      // Only include appUserId if it's a valid number and the user exists
      const logData = {
        ...activityData,
        success: activityData.success ?? true,
      };
      
      // Remove appUserId if it doesn't exist or is invalid
      if (activityData.appUserId && activityData.appUserId > 0) {
        try {
          const userExists = await storage.getAppUser(activityData.appUserId);
          if (!userExists) {
            delete logData.appUserId;
          }
        } catch {
          delete logData.appUserId;
        }
      } else {
        delete logData.appUserId;
      }
      
      await storage.createActivityLog(logData);
    } catch (error) {
      console.error('Failed to log activity:', error);
      // Don't throw the error - continue with webhook delivery even if logging fails
    }
  }

  async logAndNotify(
    userId: string,
    applicationId: number,
    event: string,
    userData?: any,
    options: {
      success?: boolean;
      errorMessage?: string;
      metadata?: any;
      ipAddress?: string;
      hwid?: string;
      userAgent?: string;
    } = {}
  ): Promise<void> {
    // Log the activity
    await this.logActivity({
      applicationId,
      appUserId: userData?.id,
      event,
      ipAddress: options.ipAddress,
      hwid: options.hwid,
      userAgent: options.userAgent,
      metadata: options.metadata,
      success: options.success ?? true,
      errorMessage: options.errorMessage,
    });

    // Prepare webhook payload
    const webhookPayload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      application_id: applicationId,
      success: options.success ?? true,
      error_message: options.errorMessage,
      metadata: options.metadata,
    };

    if (userData) {
      webhookPayload.user_data = {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        hwid: userData.hwid || options.hwid,
        ip_address: options.ipAddress,
        user_agent: options.userAgent,
      };
    }

    // Deliver webhooks
    await this.deliverWebhooks(userId, event, webhookPayload);
  }
}

export const webhookService = WebhookService.getInstance();