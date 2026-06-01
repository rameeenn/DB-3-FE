import { resolvePublicMediaUrl } from './resolveMediaUrl';

export const DEFAULT_CARD_PROFILE_IMAGE = '/card-templates/defaultprofilepic.jpg';

/** Same-origin path for static card assets (SVG templates, default photo). */
export function getCardAssetUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${normalized}`;
  }
  return normalized;
}

/**
 * Profile / API media for card preview, table thumbnails, and html2canvas.
 * Always routes remote images through /api/proxy-image to avoid CORS in production.
 */
export function getProxiedCardImageUrl(url: string | null | undefined): string {
  const raw = String(url ?? '').trim();
  if (!raw) return getCardAssetUrl(DEFAULT_CARD_PROFILE_IMAGE);
  if (raw.startsWith('data:')) return raw;
  if (raw.startsWith('/api/proxy-image')) return raw;
  if (raw.startsWith('/card-templates/')) return getCardAssetUrl(raw);

  const absolute = /^https?:\/\//i.test(raw) ? raw : resolvePublicMediaUrl(raw);
  if (!absolute) return getCardAssetUrl(DEFAULT_CARD_PROFILE_IMAGE);

  return `/api/proxy-image?url=${encodeURIComponent(absolute)}`;
}
