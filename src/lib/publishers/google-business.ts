import { PublisherAdapter, PublishDestinationContext, PublishResult, PrePublishCheckResult, PlatformHealthStatus } from './types';

export class GoogleBusinessProfileAdapter implements PublisherAdapter {
  platform: 'google_business' = 'google_business';

  /**
   * Publishes a local post to a Google Business Profile location.
   * NOTE: As mandated by MCOA policy and Google API requirements, live publishing
   * MUST remain disabled until the Google Cloud project receives approved API access.
   */
  async publish(ctx: PublishDestinationContext): Promise<PublishResult> {
    const isLivePublishingEnabled = process.env.ENABLE_GOOGLE_BUSINESS_LIVE_PUBLISHING === 'true';

    if (!isLivePublishingEnabled) {
      return {
        success: false,
        errorCode: 'GBP_API_APPROVAL_PENDING',
        errorMessage: 'Google Business Profile live publishing is currently disabled awaiting Google Cloud Project API approval. The post has been preserved safely without fake submission.',
        errorDetails: {
          documentationUrl: 'https://developers.google.com/my-business/content/prereqs',
          requiredScope: 'https://www.googleapis.com/auth/business.manage',
          status: 'pending_api_approval',
        },
        uncertainOutcome: false,
      };
    }

    const caption = (ctx.customCaption && ctx.customCaption.trim() !== '') ? ctx.customCaption : ctx.baseCaption;

    try {
      // Endpoint format: https://mybusiness.googleapis.com/v4/{name=accounts/*/locations/*}/localPosts
      const endpoint = `https://mybusiness.googleapis.com/v4/${ctx.platformDestinationId}/localPosts`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ctx.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          languageCode: 'en-US',
          summary: caption,
          callToAction: {
            actionType: 'LEARN_MORE',
            url: 'https://medicalcodingofficers.com',
          },
          media: [
            {
              mediaFormat: 'PHOTO',
              sourceUrl: ctx.mediaUrl,
            },
          ],
          topicType: 'STANDARD',
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        const err = data.error || {};
        return {
          success: false,
          errorCode: `GBP_${err.code || response.status}`,
          errorMessage: err.message || 'Google Business Profile API call failed',
          errorDetails: err,
        };
      }

      const postId = data.name || data.localPostId;
      const permalink = data.searchUrl || `https://business.google.com/`;

      return {
        success: true,
        platformPostId: postId,
        permalink,
      };
    } catch (error: any) {
      const isTimeout = error.name === 'AbortError' || error.message?.includes('timeout');
      return {
        success: false,
        errorCode: isTimeout ? 'NETWORK_TIMEOUT' : 'NETWORK_ERROR',
        errorMessage: isTimeout
          ? 'Google API request timed out. Result is uncertain.'
          : (error.message || 'Unknown network error'),
        uncertainOutcome: isTimeout,
      };
    }
  }

  async checkExistingPost(_ctx: PublishDestinationContext): Promise<PrePublishCheckResult> {
    return { alreadyPublished: false };
  }

  async checkHealth(accessToken: string, _platformDestinationId: string): Promise<PlatformHealthStatus> {
    const isLivePublishingEnabled = process.env.ENABLE_GOOGLE_BUSINESS_LIVE_PUBLISHING === 'true';

    if (!isLivePublishingEnabled) {
      return {
        healthy: false,
        needsReauth: false,
        requiresApiApproval: true,
        message: 'Google Cloud Project requires Google Business Profile API approval before live location publishing can be enabled.',
      };
    }

    // Check token info
    try {
      const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`);
      if (!res.ok) {
        return {
          healthy: false,
          needsReauth: true,
          message: 'Google OAuth token expired or revoked. Reconnection required.',
        };
      }
      return {
        healthy: true,
        needsReauth: false,
        message: 'Google Business Profile OAuth connection is active',
      };
    } catch (err: any) {
      return {
        healthy: false,
        needsReauth: false,
        message: err.message || 'Could not verify Google OAuth token',
      };
    }
  }
}
