import { describe, it, expect } from 'vitest';
import { normalizeJobUrl } from '../../server/utils/url.js';

describe('normalizeJobUrl', () => {
  it('returns null for null, undefined or empty strings', () => {
    expect(normalizeJobUrl(null)).toBeNull();
    expect(normalizeJobUrl(undefined)).toBeNull();
    expect(normalizeJobUrl('   ')).toBeNull();
  });

  it('removes query params such as utm_*, ref, trackingId', () => {
    const raw = 'https://www.linkedin.com/jobs/view/123456/?utm_source=share&utm_medium=member_desktop&refId=abc';
    expect(normalizeJobUrl(raw)).toBe('https://www.linkedin.com/jobs/view/123456');
  });

  it('removes URL fragments (#...)', () => {
    const raw = 'https://glints.com/id/opportunities/jobs/123#overview';
    expect(normalizeJobUrl(raw)).toBe('https://glints.com/id/opportunities/jobs/123');
  });

  it('removes trailing slashes', () => {
    const raw = 'https://jobstreet.co.id/job/987654/';
    expect(normalizeJobUrl(raw)).toBe('https://jobstreet.co.id/job/987654');
  });

  it('adds https protocol if missing', () => {
    const raw = 'linkedin.com/jobs/view/999';
    expect(normalizeJobUrl(raw)).toBe('https://linkedin.com/jobs/view/999');
  });
});
