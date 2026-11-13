export interface PublishResult {
  success: boolean;
  platformPostId?: string;
  permalink?: string;
  errorCode?: string;
  errorMessage?: string;
  errorDetails?: any;
  uncertainOutcome?: boolean;
}

export interface PublishDestinationContext {
  destinationId: string;
  platform: 'facebook' | 'instagram' | 'google_business';
  platformDestinationId: string; // Facebook Page ID, Instagram IG User ID, or Google Location Name
  accessToken: string;
  customCaption?: string;
  baseCaption: string;
  mediaUrl: string;
  mediaType: string;
  idempotentKey: string;
  uncertainOutcome?: boolean;
}

export interface PrePublishCheckResult {
  alreadyPublished: boolean;
  platformPostId?: string;
  permalink?: string;
}

export interface PlatformHealthStatus {
  healthy: boolean;
  needsReauth: boolean;
  message?: string;
  requiresApiApproval?: boolean;
}

export interface PublisherAdapter {
  platform: 'facebook' | 'instagram' | 'google_business';
  publish(ctx: PublishDestinationContext): Promise<PublishResult>;
  checkExistingPost(ctx: PublishDestinationContext): Promise<PrePublishCheckResult>;
  checkHealth(accessToken: string, platformDestinationId: string): Promise<PlatformHealthStatus>;
}
