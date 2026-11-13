import { describe, it, expect } from 'vitest';
import { validatePostForPlatforms, PLATFORM_CONSTRAINTS } from '../src/lib/validation/post-validation';

describe('Platform Constraints & Content Validation', () => {
  it('should accept valid post inputs for Facebook, Instagram, and Google Profile', () => {
    const baseCaption = 'Exciting CPC Coding workshop coming soon to MCOA! #MedicalCoding #Healthcare';
    const destinations = [
      { platform: 'facebook' as const },
      { platform: 'instagram' as const },
      { platform: 'google_business' as const },
    ];

    const result = validatePostForPlatforms(
      baseCaption,
      destinations,
      'image/jpeg',
      2 * 1024 * 1024 // 2MB
    );

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject empty captions', () => {
    const result = validatePostForPlatforms('', [{ platform: 'facebook' }]);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.field === 'caption')).toBe(true);
  });

  it('should reject captions exceeding Instagram 2,200 character limit', () => {
    const longCaption = 'A'.repeat(2250);
    const result = validatePostForPlatforms(longCaption, [{ platform: 'instagram' }]);

    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.message.includes('maximum allowed length'))).toBe(true);
  });

  it('should reject captions with more than 30 hashtags on Instagram', () => {
    let captionWithHashtags = 'Coding Class ';
    for (let i = 1; i <= 35; i++) {
      captionWithHashtags += `#tag${i} `;
    }

    const result = validatePostForPlatforms(captionWithHashtags, [{ platform: 'instagram' }]);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.message.includes('maximum of 30 hashtags'))).toBe(true);
  });

  it('should reject unsupported media formats for Instagram (e.g. SVG or PDF)', () => {
    const result = validatePostForPlatforms('Valid caption', [{ platform: 'instagram' }], 'application/pdf');
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.field === 'media')).toBe(true);
  });

  it('should reject media exceeding Instagram 8MB size limit', () => {
    const oversizedBytes = 9 * 1024 * 1024; // 9MB
    const result = validatePostForPlatforms(
      'Valid caption',
      [{ platform: 'instagram' }],
      'image/jpeg',
      oversizedBytes
    );

    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.message.includes('8MB'))).toBe(true);
  });
});
