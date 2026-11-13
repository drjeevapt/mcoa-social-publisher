import { PublisherAdapter, PublishDestinationContext, PublishResult, PrePublishCheckResult, PlatformHealthStatus } from './types';

const META_GRAPH_VERSION = 'v21.0';
const GRAPH_BASE_URL = `https://graph.facebook.com/${META_GRAPH_VERSION}`;

export class MetaInstagramAdapter implements PublisherAdapter {
  platform: 'instagram' = 'instagram';

  /**
   * Publishes a photo to an Instagram Professional Account using the 2-step Content Publishing API
   */
  async publish(ctx: PublishDestinationContext): Promise<PublishResult> {
    const caption = (ctx.customCaption && ctx.customCaption.trim() !== '') ? ctx.customCaption : ctx.baseCaption;

    // 1. If previous attempt had an uncertain outcome, check if already published
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
        console.warn('[InstagramAdapter] Pre-publish check failed:', err);
      }
    }

    try {
      // Step 1: Create media container
      const containerEndpoint = `${GRAPH_BASE_URL}/${ctx.platformDestinationId}/media`;
      const containerRes = await fetch(containerEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: ctx.mediaUrl,
          caption: caption,
          access_token: ctx.accessToken,
        }),
      });

      const containerData = await containerRes.json();
      if (!containerRes.ok || containerData.error) {
        const err = containerData.error || {};
        return {
          success: false,
          errorCode: `IG_CONTAINER_${err.code || containerRes.status}`,
          errorMessage: err.message || 'Failed to create Instagram media container',
          errorDetails: err,
        };
      }

      const containerId = containerData.id;

      // Step 2: Poll container status until ready (max 30s)
      let isReady = false;
      const startTime = Date.now();
      while (!isReady && Date.now() - startTime < 30000) {
        await new Promise((r) => setTimeout(r, 2000));
        const statusRes = await fetch(
          `${GRAPH_BASE_URL}/${containerId}?fields=status_code,status&access_token=${encodeURIComponent(ctx.accessToken)}`
        );
        const statusData = await statusRes.json();

        if (statusData.status_code === 'FINISHED') {
          isReady = true;
          break;
        } else if (statusData.status_code === 'ERROR') {
          return {
            success: false,
            errorCode: 'IG_CONTAINER_ERROR',
            errorMessage: statusData.status || 'Instagram media processing failed',
            errorDetails: statusData,
          };
        }
      }

      if (!isReady) {
        return {
          success: false,
          errorCode: 'IG_PROCESSING_TIMEOUT',
          errorMessage: 'Instagram media container processing timed out',
          uncertainOutcome: false,
        };
      }

      // Step 3: Publish container
      const publishEndpoint = `${GRAPH_BASE_URL}/${ctx.platformDestinationId}/media_publish`;
      const publishRes = await fetch(publishEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: containerId,
          access_token: ctx.accessToken,
        }),
      });

      const publishData = await publishRes.json();
      if (!publishRes.ok || publishData.error) {
        const err = publishData.error || {};
        return {
          success: false,
          errorCode: `IG_PUBLISH_${err.code || publishRes.status}`,
          errorMessage: err.message || 'Failed to publish Instagram media container',
          errorDetails: err,
        };
      }

      const igMediaId = publishData.id;

      // Fetch permalink
      let permalink: string | undefined;
      try {
        const mediaDetailsRes = await fetch(
          `${GRAPH_BASE_URL}/${igMediaId}?fields=permalink&access_token=${encodeURIComponent(ctx.accessToken)}`
        );
        const mediaDetails = await mediaDetailsRes.json();
        permalink = mediaDetails.permalink;
      } catch {
        permalink = `https://www.instagram.com/p/${igMediaId}`;
      }

      return {
        success: true,
        platformPostId: igMediaId,
        permalink,
      };
    } catch (error: any) {
      const isTimeout = error.name === 'AbortError' || error.message?.includes('timeout');
      return {
        success: false,
        errorCode: isTimeout ? 'NETWORK_TIMEOUT' : 'NETWORK_ERROR',
        errorMessage: isTimeout
          ? 'Instagram API request timed out. Result is uncertain; status will be verified before retry.'
          : (error.message || 'Unknown network error'),
        uncertainOutcome: isTimeout,
      };
    }
  }

  /**
   * Checks recent media on the Instagram profile to prevent duplicate posts
   */
  async checkExistingPost(ctx: PublishDestinationContext): Promise<PrePublishCheckResult> {
    const targetCaption = (ctx.customCaption && ctx.customCaption.trim() !== '') ? ctx.customCaption : ctx.baseCaption;
    const endpoint = `${GRAPH_BASE_URL}/${ctx.platformDestinationId}/media?fields=id,caption,permalink,timestamp&limit=5&access_token=${encodeURIComponent(ctx.accessToken)}`;

    try {
      const res = await fetch(endpoint);
      if (!res.ok) return { alreadyPublished: false };
      const json = await res.json();
      if (!json.data || !Array.isArray(json.data)) return { alreadyPublished: false };

      const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;
      for (const item of json.data) {
        const postTime = new Date(item.timestamp).getTime();
        if (postTime >= fifteenMinutesAgo && item.caption && item.caption.trim() === targetCaption.trim()) {
          return {
            alreadyPublished: true,
            platformPostId: item.id,
            permalink: item.permalink,
          };
        }
      }
      return { alreadyPublished: false };
    } catch {
      return { alreadyPublished: false };
    }
  }

  /**
   * Validates access token and Instagram Professional Account connection
   */
  async checkHealth(accessToken: string, platformDestinationId: string): Promise<PlatformHealthStatus> {
    const endpoint = `${GRAPH_BASE_URL}/${platformDestinationId}?fields=id,username,name&access_token=${encodeURIComponent(accessToken)}`;

    try {
      const res = await fetch(endpoint);
      const json = await res.json();

      if (!res.ok || json.error) {
        const code = json.error?.code;
        const needsReauth = code === 190 || code === 102;
        return {
          healthy: false,
          needsReauth,
          message: json.error?.message || 'Failed to authenticate with Instagram Graph API',
        };
      }

      return {
        healthy: true,
        needsReauth: false,
        message: `Instagram Professional account @${json.username} is connected and active`,
      };
    } catch (err: any) {
      return {
        healthy: false,
        needsReauth: false,
        message: err.message || 'Could not reach Meta Instagram API',
      };
    }
  }
}
