import { z } from 'zod';

export interface PlatformConstraints {
  platform: 'facebook' | 'instagram' | 'google_business';
  maxCaptionLength: number;
  maxHashtags?: number;
  allowedMediaTypes: string[];
  maxMediaSizeBytes: number;
  supportedAspectRatios?: {
    min: number; // e.g. 0.8 (4:5)
    max: number; // e.g. 1.91 (1.91:1)
  };
  requiresLiveApiApproval?: boolean;
}

export const PLATFORM_CONSTRAINTS: Record<string, PlatformConstraints> = {
  facebook: {
    platform: 'facebook',
    maxCaptionLength: 63206,
    allowedMediaTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    maxMediaSizeBytes: 10 * 1024 * 1024, // 10MB
    requiresLiveApiApproval: false,
  },
  instagram: {
    platform: 'instagram',
    maxCaptionLength: 2200,
    maxHashtags: 30,
    allowedMediaTypes: ['image/jpeg', 'image/png'],
    maxMediaSizeBytes: 8 * 1024 * 1024, // 8MB
    supportedAspectRatios: {
      min: 0.8, // 4:5 vertical
      max: 1.91, // 1.91:1 horizontal landscape
    },
    requiresLiveApiApproval: false,
  },
  google_business: {
    platform: 'google_business',
    maxCaptionLength: 1500,
    allowedMediaTypes: ['image/jpeg', 'image/png'],
    maxMediaSizeBytes: 5 * 1024 * 1024, // 5MB
    requiresLiveApiApproval: true, // MUST remain disabled until Google Cloud project receives API approval
  },
};

export const createPostSchema = z.object({
  workspaceId: z.string().uuid(),
  baseCaption: z.string().min(1, 'Caption cannot be empty').max(63206),
  mediaUrl: z.string().url('A valid image URL is required'),
  mediaType: z.string().default('image/jpeg'),
  mediaSizeBytes: z.number().optional(),
  destinations: z.array(
    z.object({
      destinationId: z.string().uuid(),
      platform: z.enum(['facebook', 'instagram', 'google_business']),
      customCaption: z.string().optional(),
    })
  ).min(1, 'Please select at least one publishing destination'),
  scheduleType: z.enum(['now', 'schedule', 'draft']),
  scheduledAt: z.string().optional(), // ISO string
});

export type CreatePostInput = z.infer<typeof createPostSchema>;

export interface ValidationErrorItem {
  platform: string;
  field: string;
  message: string;
}

/**
 * Validates a post and its customized captions against platform-specific constraints
 */
export function validatePostForPlatforms(
  baseCaption: string,
  destinations: { platform: 'facebook' | 'instagram' | 'google_business'; customCaption?: string }[],
  mediaType?: string,
  mediaSizeBytes?: number
): { isValid: boolean; errors: ValidationErrorItem[] } {
  const errors: ValidationErrorItem[] = [];

  for (const dest of destinations) {
    const config = PLATFORM_CONSTRAINTS[dest.platform];
    const caption = (dest.customCaption && dest.customCaption.trim() !== '') ? dest.customCaption : baseCaption;

    if (!caption || caption.trim().length === 0) {
      errors.push({
        platform: dest.platform,
        field: 'caption',
        message: `${dest.platform} caption cannot be empty`,
      });
    }

    if (caption.length > config.maxCaptionLength) {
      errors.push({
        platform: dest.platform,
        field: 'caption',
        message: `Caption exceeds maximum allowed length of ${config.maxCaptionLength} characters for ${dest.platform} (currently ${caption.length})`,
      });
    }

    if (config.maxHashtags) {
      const hashtags = (caption.match(/#[a-zA-Z0-9_]+/g) || []).length;
      if (hashtags > config.maxHashtags) {
        errors.push({
          platform: dest.platform,
          field: 'caption',
          message: `Instagram allows a maximum of ${config.maxHashtags} hashtags (currently ${hashtags})`,
        });
      }
    }

    if (mediaType && !config.allowedMediaTypes.includes(mediaType.toLowerCase())) {
      errors.push({
        platform: dest.platform,
        field: 'media',
        message: `${dest.platform} does not support media type ${mediaType}. Supported types: ${config.allowedMediaTypes.join(', ')}`,
      });
    }

    if (mediaSizeBytes && mediaSizeBytes > config.maxMediaSizeBytes) {
      const maxMb = config.maxMediaSizeBytes / (1024 * 1024);
      errors.push({
        platform: dest.platform,
        field: 'media',
        message: `Media file size exceeds maximum ${maxMb}MB limit for ${dest.platform}`,
      });
    }

    if (config.requiresLiveApiApproval) {
      // Flag note for GBP
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
