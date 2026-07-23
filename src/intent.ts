import { Linking } from 'react-native';

// Android intent:// URL 처리 (PG 결제, 앱 전환 등)
// 형식: intent://path#Intent;scheme=xxx;package=com.xxx;S.browser_fallback_url=...;end
export type ParsedIntent = {
  targetUrl: string | null; //   scheme://path — 실제 앱 스킴
  packageName: string | null; // 미설치 시 마켓 이동용
  fallbackUrl: string | null; // 앱 실행 실패 시 웹뷰에서 열 URL
};

export function parseIntentUrl(url: string): ParsedIntent | null {
  const m = url.match(/^intent:(?:\/\/)?([^#]*)#Intent;(.*?);?end/i);
  if (!m) return null;

  const params: Record<string, string> = {};
  for (const part of m[2].split(';')) {
    const eq = part.indexOf('=');
    if (eq > 0) params[part.slice(0, eq)] = part.slice(eq + 1);
  }

  let fallbackUrl: string | null = null;
  if (params['S.browser_fallback_url']) {
    try {
      fallbackUrl = decodeURIComponent(params['S.browser_fallback_url']);
    } catch {
      fallbackUrl = params['S.browser_fallback_url'];
    }
  }

  return {
    targetUrl: params['scheme'] ? `${params['scheme']}://${m[1]}` : null,
    packageName: params['package'] ?? null,
    fallbackUrl,
  };
}

// 처리 순서: 앱 스킴 실행 → 실패 시 fallback URL 반환(웹뷰에서 열기) → 마켓 이동
// 반환값: 웹뷰에서 로드해야 할 URL, 없으면 null
export async function openIntentUrl(url: string): Promise<string | null> {
  const parsed = parseIntentUrl(url);
  if (!parsed) return null;

  if (parsed.targetUrl) {
    try {
      await Linking.openURL(parsed.targetUrl);
      return null;
    } catch {
      // 앱 미설치 → fallback으로
    }
  }
  if (parsed.fallbackUrl && /^https?:\/\//.test(parsed.fallbackUrl)) {
    return parsed.fallbackUrl;
  }
  if (parsed.packageName) {
    Linking.openURL(`market://details?id=${parsed.packageName}`).catch(() => {});
  }
  return null;
}
