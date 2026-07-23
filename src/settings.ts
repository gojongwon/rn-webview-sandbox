// 설정 구조 — docs/configuration.md 참고
export type PopupMode = 'same' | 'external' | 'block';

export type Settings = {
  // 공통
  customUA: boolean; //        UA에 CUSTOM_UA_SUFFIX 부착 (웹의 앱 감지 테스트)
  popupMode: PopupMode; //     window.open / target=_blank 처리
  bottomSafeArea: boolean; //  하단 safe area를 앱이 처리 (off = 웹이 처리)
  incognito: boolean; //       쿠키/스토리지 미보존
  keepAwake: boolean; //       화면 꺼짐 방지 (웹에서 screen.keepAwake로도 제어 가능)
  // iOS
  cameraAutoGrant: boolean; // getUserMedia 권한 자동 승인 vs 웹뷰가 묻기
  swipeBack: boolean; //       스와이프 백 제스처
  pullToRefresh: boolean; //   당겨서 새로고침
  // Android
  fixedTextZoom: boolean; //   시스템 폰트 크기 무시(100 고정)
  mixedContent: boolean; //    https 페이지에서 http 리소스 허용
};

export const DEFAULT_SETTINGS: Settings = {
  customUA: false,
  popupMode: 'same',
  bottomSafeArea: false,
  incognito: false,
  keepAwake: false,
  cameraAutoGrant: true,
  swipeBack: true,
  pullToRefresh: false,
  fixedTextZoom: true,
  mixedContent: false,
};

export const POPUP_OPTIONS: { value: PopupMode; label: string }[] = [
  { value: 'same', label: '현재 창' },
  { value: 'external', label: '외부 브라우저' },
  { value: 'block', label: '차단' },
];
