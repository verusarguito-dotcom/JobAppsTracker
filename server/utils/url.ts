export function normalizeJobUrl(rawUrl: string | null | undefined): string | null {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return null;
  }

  const trimmed = rawUrl.trim();
  if (trimmed.length === 0) {
    return null;
  }

  let withProtocol = trimmed;
  if (!/^https?:\/\//i.test(withProtocol)) {
    withProtocol = `https://${withProtocol}`;
  }

  try {
    const parsed = new URL(withProtocol);
    const trackingKeys = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'ref', 'refid', 'trackingid', 'origin', 'trk', 'midToken',
    ];

    for (const key of Array.from(parsed.searchParams.keys())) {
      if (trackingKeys.includes(key.toLowerCase()) || key.toLowerCase().startsWith('utm_')) {
        parsed.searchParams.delete(key);
      }
    }

    parsed.hash = '';

    let clean = parsed.toString();
    if (parsed.search === '') {
      clean = `${parsed.protocol}//${parsed.host}${parsed.pathname}`;
    }

    if (clean.endsWith('/') && parsed.pathname !== '/') {
      clean = clean.slice(0, -1);
    }

    return clean;
  } catch {
    return trimmed;
  }
}
