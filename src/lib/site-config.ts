const DEFAULT_SITE_URL = "https://aegisflood.tanisheesh.in";

export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!configured) {
    return DEFAULT_SITE_URL;
  }

  try {
    const parsed = new URL(configured);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") {
      return parsed.origin;
    }
  } catch {
    return DEFAULT_SITE_URL;
  }

  return DEFAULT_SITE_URL;
}
