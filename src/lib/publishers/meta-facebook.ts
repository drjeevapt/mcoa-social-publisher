import { PublisherAdapter, PublishDestinationContext, PublishResult, PrePublishCheckResult, PlatformHealthStatus } from './types';

const META_GRAPH_VERSION = 'v21.0';
const GRAPH_BASE_URL = `https://graph.facebook.com/${META_GRAPH_VERSION}`;

export class MetaFacebookAdapter implements PublisherAdapter {
  platform: 'facebook' = 'facebook';

  /**
   * Publishes an image post to an authorized Facebook Page
   */
  async publish(ctx: PublishDestinationContext): Promise<PublishResult> {
    const caption = (ctx.customCaption && ctx.customCaption.trim() !== '') ? ctx.customCaption : ctx.baseCaption;

    // 1. If previous attempt resulted in an uncertain outcome (e.g. timeout), check if it actually succeeded
    if (ctx.uncertainOutcome) {
      try {
        const check = await this.checkExistingPost(ctx);
        if (check.alreadyPublished) {
          return {
            success: true,
            platformPostId: check.platformPostId,
            permalink: check.permalink,
          };
        }
      } catch (err) {
        console.warn('[FacebookAdapter] Pre-publish check failed, proceeding cautiously:', err);
      }
    }

    // 2. Publish image photo post to the Page photos edge
    const endpoint = `${GRAPH_BASE_URL}/${ctx.platformDestinationId}/photos`;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: ctx.mediaUrl,
          caption: caption,
          access_token: ctx.accessToken,
          published: true,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (!response.ok || data.error) {
        const err = data.error || {};
        return {
          success: false,
          errorCode: `FB_${err.code || response.status}`,
          errorMessage: err.message || `Facebook API request failed with status ${response.status}`,
          errorDetails: err,
          uncertainOutcome: false,
        };
      }

      const postId = data.post_id || data.id;
      const permalink = `https://www.facebook.com/${postId}`;

      return {
        success: true,
        platformPostId: postId,
        permalink: permalink,
      };
    } catch (error: any) {
      // If network aborted or timed out, the request might have reached Meta
      const isTimeout = error.name === 'AbortError' || error.message?.includes('timeout');
      return {
        success: false,
        errorCode: isTimeout ? 'NETWORK_TIMEOUT' : 'NETWORK_ERROR',
        errorMessage: isTimeout
          ? 'Facebook API request timed out. Result is uncertain; status will be verified before any retry.'
          : (error.message || 'Unknown network error occurred'),
        uncertainOutcome: isTimeout,
      };
    }
  }

  /**
   * Checks recent posts on the page to prevent duplicate posts if a previous publish was uncertain
   */
  async checkExistingPost(ctx: PublishDestinationContext): Promise<PrePublishCheckResult> {
    const targetCaption = (ctx.customCaption && ctx.customCaption.trim() !== '') ? ctx.customCaption : ctx.baseCaption;
    const endpoint = `${GRAPH_BASE_URL}/${ctx.platformDestinationId}/feed?fields=id,message,permalink_url,created_time&limit=5&access_token=${encodeURIComponent(ctx.accessToken)}`;

    try {
      const res = await fetch(endpoint);
      if (!res.ok) return { alreadyPublished: false };
      const json = await res.json();
      if (!json.data || !Array.isArray(json.data)) return { alreadyPublished: false };

      // Look for a post within the last 15 minutes with matching caption
      const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;
      for (const item of json.data) {
        const postTime = new Date(item.created_time).getTime();
        if (postTime >= fifteenMinutesAgo && item.message && item.message.trim() === targetCaption.trim()) {
          return {
            alreadyPublished: true,
            platformPostId: item.id,
            permalink: item.permalink_url,
          };
        }
      }
      return { alreadyPublished: false };
    } catch {
      return { alreadyPublished: false };
    }
  }

  /**
   * Validates access token and page permissions
   */
  async checkHealth(accessToken: string, platformDestinationId: string): Promise<PlatformHealthStatus> {
    const endpoint = `${GRAPH_BASE_URL}/${platformDestinationId}?fields=id,name,is_published&access_token=${encodeURIComponent(accessToken)}`;

    try {
      const res = await fetch(endpoint);
      const json = await res.json();

      if (!res.ok || json.error) {
        const code = json.error?.code;
        // Error code 190 = invalid or expired token
        const needsReauth = code === 190 || code === 102;
        return {
          healthy: false,
          needsReauth,
          message: json.error?.message || 'Failed to authenticate with Facebook Page API',
        };
      }

      return {
        healthy: true,
        needsReauth: false,
        message: 'Facebook Page connection is active and healthy',
      };
    } catch (err: any) {
      return {
        healthy: false,
        needsReauth: false,
        message: err.message || 'Could not reach Meta Graph API',
      };
    }
  }
}
