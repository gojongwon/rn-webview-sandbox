# 웹뷰 설정 구조

설정을 세 층으로 나눈다. 기준: **끌 이유가 없는 것 = 기본 내장, 웹 동작을 비교 테스트할 것 = 설정 화면, 런타임에 못 바꾸는 것 = 빌드 타임.**

## 파일 구조

```
App.tsx                        # 라우팅만 (런처/설정/브라우저 전환)
src/
  config.ts                    # 상수 (URL 프리셋, UA 접미사, 버전)
  settings.ts                  # Settings 타입 + 기본값
  theme.ts                     # 공용 스타일
  bridge.ts                    # 브릿지 규격 + 주입 스크립트 (docs/bridge.md)
  download.ts                  # 파일 저장/공유 (expo-file-system, expo-sharing)
  intent.ts                    # Android intent:// URL 파싱·처리
  storage.ts                   # 설정 영구 저장 (AsyncStorage)
  components.tsx               # SwitchRow, SegmentRow, ErrorView, BridgeLogPanel
  screens/
    LauncherScreen.tsx
    SettingsScreen.tsx
    BrowserScreen.tsx          # 웹뷰 본체 + 브릿지 핸들러
```

## 1. 기본 내장 (항상 켜짐, `src/screens/BrowserScreen.tsx`)

| 항목 | 코드 | 비고 |
|---|---|---|
| localStorage | `domStorageEnabled` | Android는 이거 없으면 localStorage 자체가 안 됨 |
| 쿠키 | `sharedCookiesEnabled`, `thirdPartyCookiesEnabled` | iOS 쿠키 동기화 지연 이슈 있음 → 로그인 세션 확인 필요 |
| 카메라 측정 (getUserMedia) | `allowsInlineMediaPlayback`, `mediaPlaybackRequiresUserAction={false}` | 이거 없으면 iOS에서 비디오가 전체화면으로 뜨거나 재생 안 됨 |
| Android 앱 권한 선요청 | `PermissionsAndroid.requestMultiple([CAMERA, RECORD_AUDIO])` | 앱 권한이 있어야 웹뷰 권한 요청이 자동 승인됨 |
| 웹뷰 디버깅 | `webviewDebuggingEnabled` | Android `chrome://inspect`, iOS Safari 개발자 메뉴 |
| 렌더러 크래시 복구 | `onContentProcessDidTerminate`(iOS), `onRenderProcessGone`(Android) → `reload()` | 미처리 시 흰 화면으로 멈춤 |
| Android 백버튼 | `BackHandler` + `canGoBack ? goBack() : 런처로` | 웹 히스토리 우선, 없으면 웹뷰 종료 |
| 외부 스킴 | `onShouldStartLoadWithRequest` → `Linking.openURL` | `tel:`, `mailto:`, `kakaotalk:` 등 |
| intent:// 처리 | `src/intent.ts` — 앱 스킴 실행 → `S.browser_fallback_url` → 마켓 이동 | Android PG 결제·앱 전환 |
| HTTP 에러 배너 | `onHttpError` (메인 문서 URL만 필터) | 탭하면 닫힘 |
| 로드 실패 화면 | `renderError` + 다시 시도 버튼 | 오프라인/DNS 실패 등 |
| 플로팅 백 버튼 | 좌상단 반투명 ← | iOS는 백버튼이 없어서 런처 복귀용 |
| 브릿지 | `injectedJavaScriptBeforeContentLoaded` + `onMessage` | `window.AppBridge` 주입. 규격은 docs/bridge.md |
| 파일 다운로드 | blob/data 클릭 인터셉트, 직링크 다운로드, iOS `onFileDownload` | 저장 후 OS 공유 시트. 상세는 docs/bridge.md |
| 브릿지 로그 | 우하단 "브릿지 N" 버튼 → 로그 패널 | 웹↔앱 메시지 실시간 확인 |

## 2. 설정 페이지 (런처 우측 상단 "설정" 버튼, AsyncStorage에 저장 — 앱 재시작 후에도 유지)

공통 / iOS / Android 세 그룹으로 나뉜다. 플랫폼 전용 설정은 해당 플랫폼에서만 효과가 있고, 반대 플랫폼에서는 무시된다.

### 공통

| 설정 | prop | 기본값 | 테스트 목적 |
|---|---|---|---|
| 팝업 (window.open) | `setSupportMultipleWindows` + `onOpenWindow` | 현재 창 | PG 결제·OAuth 팝업 동작 비교. 현재 창/외부 브라우저/차단 |
| 커스텀 User-Agent | `applicationNameForUserAgent` | off | UA 끝에 `DeepCheckSandbox/1.0` 부착 → 웹의 앱 감지 로직 테스트 |
| 하단 Safe Area 앱 처리 | `SafeAreaView` edges에 `bottom` 포함 여부 | off(웹 처리) | 웹의 `viewport-fit=cover` + `env(safe-area-inset-bottom)` 테스트 |
| 시크릿 모드 | `incognito` | off | 쿠키/스토리지 미보존 상태로 첫 방문 시나리오 재현 |
| 화면 꺼짐 방지 | `expo-keep-awake` | off | 측정 등 장시간 화면 유지. 웹의 `screen.keepAwake` 브릿지가 우선 |

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
| 네이티브 모듈 | `expo-file-system`, `expo-sharing`, `expo-keep-awake`, `@react-native-async-storage/async-storage` — 추가/변경 시 재빌드 필요 (EAS Update 불가) |

## 빌드·배포 방법

**Android APK**: GitHub Actions의 **build-apk-release** 워크플로우 수동 실행 (EAS `preview` 프로필 → Release에 APK 첨부, `EXPO_TOKEN` 시크릿 필요). `npm ci`를 쓰므로 package-lock.json 변경분까지 커밋할 것. JS만 바뀐 경우엔 `npm run publish:preview`(EAS Update)로 충분.

**iOS (Expo Go, 개발자 계정 불필요)**: 로컬 서버 없이 배포 환경에서 검증하는 경로.

1. `npm run publish:preview`로 업데이트 게시
2. 아이폰 Expo Go에서 아래 QR/링크로 열기 (expo.dev 대시보드의 해당 업데이트 페이지 QR도 동일)

```
https://qr.expo.dev/eas-update?projectId=4eaf7758-b15c-4e58-bd65-17a94c5476e2&runtimeVersion=exposdk:57.0.0&channel=preview
```

동작 원리: runtimeVersion 정책이 플랫폼별로 분리되어 있다 — Android는 `fingerprint`(APK 빌드와 정확 매칭), **iOS는 `sdkVersion`**(`exposdk:57.0.0` → Expo Go가 로드 가능). 주의:

- Expo Go는 최신 SDK만 지원하므로 SDK 업그레이드 시 Expo Go도 업데이트 필요
- Expo Go는 무료 Expo 계정 로그인 필요 (아무 계정이나 가능 — 프로젝트 권한 불필요). 업데이트 자체는 URL만 알면 누구나 로드 가능하므로 번들에 시크릿을 넣지 말 것
- Info.plist 기반 기능(카카오 스킴, 권한 문구)은 Expo Go에서 테스트 불가
- 나중에 실제 iOS 빌드(TestFlight)를 시작하면 `ios.runtimeVersion`도 `fingerprint`로 되돌리는 게 안전

## 설정을 늘릴 때

`App.tsx`의 `Settings` 타입 + `DEFAULT_SETTINGS`에 추가하고 `SettingsScreen`의 해당 그룹(공통/iOS/Android)에 `SwitchRow`/`SegmentRow`로 UI를 붙이면 된다. 후보: `allowsLinkPreview`(iOS), 바운스(iOS), `geolocationEnabled`(Android, 위치 권한 추가 필요).
