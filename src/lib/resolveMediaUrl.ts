function getApiMediaOrigin(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (apiUrl) {
    try {
      return new URL(apiUrl).origin;
    } catch {
      // fall through
    }
  }
  return "https://sdga-apistagging.dhakarachi.org";
}

/** Use absolute media URLs from the API; prefix API origin for relative paths. */
export function resolvePublicMediaUrl(url: string | null | undefined): string {
  const s = String(url ?? "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("//")) return `https:${s}`;
  const path = s.startsWith("/") ? s : `/${s}`;
  return `${getApiMediaOrigin()}${path}`;
}

/** Heuristic: image extensions, or https URLs unless they look like common non-image documents. */
export function isLikelyImageUrl(url: string | null | undefined): boolean {
  const s = String(url ?? "").trim();
  if (!s) return false;
  const path = s.split("?")[0]?.split("#")[0]?.toLowerCase() ?? "";
  if (/\.(pdf|doc|docx|xls|xlsx|zip|txt|csv)(\?|#|$)/.test(path)) return false;
  if (/\.(jpe?g|png|gif|webp|bmp|svg)(\?|#|$)/.test(path)) return true;
  if (/^https?:\/\//i.test(s)) return true;
  return false;
}
