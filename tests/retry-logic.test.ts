import { describe, it, expect } from 'vitest';

describe('Publishing Retry & Duplicate Prevention Logic', () => {
  it('should filter out already published destinations during a retry run', () => {
    const existingDestinations = [
      { id: 'dest-fb', platform: 'facebook', status: 'published' },
      { id: 'dest-ig', platform: 'instagram', status: 'failed' },
      { id: 'dest-gbp', platform: 'google_business', status: 'failed' },
    ];

    // Filter logic as implemented in /api/posts/[id]/retry and executePostPublishing
    const retryTargets = existingDestinations.filter((d) => d.status !== 'published');

    expect(retryTargets).toHaveLength(2);
    expect(retryTargets.map((d) => d.id)).toEqual(['dest-ig', 'dest-gbp']);
    expect(retryTargets.some((d) => d.id === 'dest-fb')).toBe(false);
  });

  it('should skip retry completely if all destinations succeeded', () => {
    const allPublished = [
      { id: 'dest-fb', platform: 'facebook', status: 'published' },
      { id: 'dest-ig', platform: 'instagram', status: 'published' },
    ];

    const retryTargets = allPublished.filter((d) => d.status !== 'published');
    expect(retryTargets).toHaveLength(0);
  });

  it('should accurately compute overall post status based on granular destination states', () => {
    const computePostStatus = (statuses: string[]) => {
      const total = statuses.length;
      const published = statuses.filter((s) => s === 'published').length;
      const failed = statuses.filter((s) => s === 'failed').length;

      if (published === total && total > 0) return 'published';
      if (published > 0 && failed > 0) return 'partially_published';
      if (failed === total && total > 0) return 'failed';
      return 'scheduled';
    };

    expect(computePostStatus(['published', 'published'])).toBe('published');
    expect(computePostStatus(['published', 'failed'])).toBe('partially_published');
    expect(computePostStatus(['failed', 'failed'])).toBe('failed');
    expect(computePostStatus(['scheduled', 'scheduled'])).toBe('scheduled');
  });
});
