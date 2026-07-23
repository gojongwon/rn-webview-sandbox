# 웹뷰 설정 구조

설정을 세 층으로 나눈다. 기준: **끌 이유가 없는 것 = 기본 내장, 웹 동작을 비교 테스트할 것 = 설정 화면, 런타임에 못 바꾸는 것 = 빌드 타임.**

## 1. 기본 내장 (항상 켜짐, App.tsx `Browser` 컴포넌트)

| 항목 | 코드 | 비고 |
|---|---|---|
| localStorage | `domStorageEnabled` | Android는 이거 없으면 localStorage 자체가 안 됨 |
| 쿠키 | `sharedCookiesEnabled`, `thirdPartyCookiesEnabled` | iOS 쿠키 동기화 지연 이슈 있음 → 로그인 세션 확인 필요 |
| 카메라 측정 (getUserMedia) | `allowsInlineMediaPlayback`, `mediaPlaybackRequiresUserAction={false}` | 이거 없으면 iOS에서 비디오가 전체화면으로 뜨거나 재생 안 됨 |
| Android 앱 권한 선요청 | `PermissionsAndroid.requestMultiple([CAMERA, RECORD_AUDIO])` | 앱 권한이 있어야 웹뷰 권한 요청이 자동 승인됨 |
| 웹뷰 디버깅 | `webviewDebuggingEnabled` | Android `chrome://inspect`, iOS Safari 개발자 메뉴 |
| 렌더러 크래시 복구 | `onContentProcessDidTerminate`(iOS), `onRenderProcessGone`(Android) → `reload()` | 미처리 시 흰 화면으로 멈춤 |
| Android 백버튼 | `BackHandler` + `canGoBack ? goBack() : 런처로` | 웹 히스토리 우선, 없으면 웹뷰 종료 |
| 외부 스킴 | `onShouldStartLoadWithRequest` → `Linking.openURL` | `tel:`, `mailto:`, `kakaotalk:` 등. **한계: Android `intent://`는 Linking으로 안 열림** (필요 시 intent URL 파싱 추가) |
| HTTP 에러 배너 | `onHttpError` (메인 문서 URL만 필터) | 탭하면 닫힘 |
| 로드 실패 화면 | `renderError` + 다시 시도 버튼 | 오프라인/DNS 실패 등 |
| 툴바 | 닫기 / 현재 호스트 / 초기화(clearCache+reload) / 새로고침 | iOS는 백버튼이 없어서 닫기 필수 |

## 2. 설정 페이지 (런처 우측 상단 "설정" 버튼, 세션 단위 — 앱 재시작하면 초기화됨)

공통 / iOS / Android 세 그룹으로 나뉜다. 플랫폼 전용 설정은 해당 플랫폼에서만 효과가 있고, 반대 플랫폼에서는 무시된다.

### 공통

| 설정 | prop | 기본값 | 테스트 목적 |
|---|---|---|---|
| 팝업 (window.open) | `setSupportMultipleWindows` + `onOpenWindow` | 현재 창 | PG 결제·OAuth 팝업 동작 비교. 현재 창/외부 브라우저/차단 |
| 커스텀 User-Agent | `applicationNameForUserAgent` | off | UA 끝에 `DeepCheckSandbox/1.0` 부착 → 웹의 앱 감지 로직 테스트 |
| 하단 Safe Area 앱 처리 | `SafeAreaView` edges에 `bottom` 포함 여부 | off(웹 처리) | 웹의 `viewport-fit=cover` + `env(safe-area-inset-bottom)` 테스트 |
| 시크릿 모드 | `incognito` | off | 쿠키/스토리지 미보존 상태로 첫 방문 시나리오 재현 |

### iOS

| 설정 | prop | 기본값 | 테스트 목적 |
|---|---|---|---|
| 카메라·마이크 자동 승인 | `mediaCapturePermissionGrantType` | on(grant) | off면 `prompt` — 실제 배포 앱 시나리오 재현 |
| 스와이프 백 | `allowsBackForwardNavigationGestures` | on | SPA 라우터와 충돌 여부 확인 |
| 당겨서 새로고침 | `pullToRefreshEnabled` | off | 웹 자체 스크롤 UI와 충돌 여부 확인 |

### Android

| 설정 | prop | 기본값 | 테스트 목적 |
|---|---|---|---|
| 텍스트 크기 100% 고정 | `textZoom={100}` | on | off면 시스템 폰트 크기 반영 → 레이아웃 깨짐 테스트 |
| 혼합 콘텐츠 허용 | `mixedContentMode` never/always | off(never) | dev 환경에서 http 리소스 섞일 때 |

주의:

- `incognito`는 마운트 시점에만 적용됨. 웹뷰 진입 전에 설정할 것 (현재 구조상 자동으로 보장됨).
- Android에서 팝업 "현재 창" 모드는 `setSupportMultipleWindows={false}`로 동작하는데, `about:blank`로 열고 `document.write` 하는 구형 PG 모듈은 URL이 없어 동작하지 않을 수 있음.

## 3. 빌드 타임 (app.json — 변경 시 재빌드 필요, EAS Update로는 반영 안 됨)

| 항목 | 위치 |
|---|---|
| iOS 권한 문구 (카메라/마이크/사진) | `ios.infoPlist.NS*UsageDescription` — 없으면 해당 기능 사용 시 **크래시** |
| iOS 외부 앱 스킴 조회 | `ios.infoPlist.LSApplicationQueriesSchemes` — 카카오/네이버 등 앱 전환용 |
| Android 권한 | `android.permissions` — CAMERA, RECORD_AUDIO, MODIFY_AUDIO_SETTINGS |
| 키보드 리사이즈 | Android `windowSoftInputMode` (Expo 기본 `adjustResize`) |

## 설정을 늘릴 때

`App.tsx`의 `Settings` 타입 + `DEFAULT_SETTINGS`에 추가하고 `SettingsScreen`의 해당 그룹(공통/iOS/Android)에 `SwitchRow`/`SegmentRow`로 UI를 붙이면 된다. 후보: `allowsLinkPreview`(iOS), 바운스(iOS), `geolocationEnabled`(Android, 위치 권한 추가 필요).
