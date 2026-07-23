import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

// 다운로드 파일은 캐시의 타임스탬프 하위 폴더에 저장 (원본 파일명 유지 + 중복 회피)
function newDownloadDir(): Directory {
  const dir = new Directory(Paths.cache, 'downloads', String(Date.now()));
  dir.create({ intermediates: true, idempotent: true });
  return dir;
}

function sanitizeName(name: string): string {
  const cleaned = name.replace(/[\\/:*?"<>|]+/g, '_').trim();
  return cleaned || 'download';
}

async function share(uri: string, mimeType?: string) {
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType, dialogTitle: '파일 저장/공유' });
  }
}

// 웹에서 넘어온 blob/data → base64 저장 후 공유 시트
export async function saveBase64AndShare(name: string, mime: string, base64: string) {
  const file = new File(newDownloadDir(), sanitizeName(name));
  file.write(base64, { encoding: 'base64' });
  await share(file.uri, mime);
  return file.uri;
}

// http(s) 직링크 다운로드 후 공유 시트
// 주의: 웹뷰 세션 쿠키가 붙지 않음 (Android 확실, iOS는 sharedCookiesEnabled 시 공유될 수 있음).
// 인증이 필요한 파일은 웹에서 blob으로 받아 AppBridge.saveFile로 넘기는 게 안전하다.
export async function downloadAndShare(url: string) {
  const out = await File.downloadFileAsync(url, newDownloadDir(), { idempotent: true });
  await share(out.uri);
  return out.uri;
}

// 확장자 기반 파일 다운로드 대상 판별 (문서류만 — 이미지는 일반 페이지 이동일 수 있어 제외)
const DOC_EXT_RE = /\.(xlsx?|csv|docx?|pptx?|zip|hwpx?)([?#]|$)/i;
const PDF_EXT_RE = /\.pdf([?#]|$)/i;

export function isDownloadUrl(url: string, platform: string): boolean {
  if (DOC_EXT_RE.test(url)) return true;
  // PDF: iOS는 인라인 렌더링 가능 → 통과, Android는 렌더링 불가 → 다운로드
  if (platform === 'android' && PDF_EXT_RE.test(url)) return true;
  return false;
}
