# 웹뷰 고려사항 체크리스트

실서비스 웹뷰 앱 전환 시 검증할 항목 전체 목록. 이 샌드박스에 구현된 항목은 ✅, 설정 화면에서 토글 가능한 항목은 ⚙️, 미구현(실서비스에서 필요)은 ⬜.

## 뒤로가기 / 내비게이션

- [x] ✅ Android 하드웨어 백버튼: `canGoBack ? goBack() : 웹뷰 종료`
- [x] ⚙️ iOS 스와이프 백 제스처 — SPA 라우터 히스토리와 충돌 여부 확인
- [ ] ⬜ SPA 라우터와 네이티브 back 불일치 시 → 브릿지로 웹 라우터에 위임하는 방식 검토

## 카메라 / 마이크 / 위치 (getUserMedia)

- [x] ✅ iOS: `allowsInlineMediaPlayback`, `mediaPlaybackRequiresUserAction={false}`
- [x] ⚙️ iOS 권한: `mediaCapturePermissionGrantType` grant/prompt 토글
- [x] ✅ Android: 앱 CAMERA/RECORD_AUDIO 권한 선요청 → 웹뷰 권한 자동 승인
- [x] ✅ 빌드 타임: Info.plist 문구, Android 매니페스트 권한
- [ ] ⬜ 측정 중 화면 꺼짐 방지 (`expo-keep-awake`)
- [ ] ⬜ 위치 사용 시 Android `geolocationEnabled` + 앱 권한

## 쿠키 / 세션 / 스토리지

- [x] ✅ `domStorageEnabled`, `sharedCookiesEnabled`, `thirdPartyCookiesEnabled`
- [x] ⚙️ 시크릿 모드 (`incognito`)
- [x] ✅ 쿠키/캐시 초기화 (툴바 "초기화" 버튼)
- [ ] ⬜ 앱 재시작 후 로그인 세션 유지 검증 (iOS 쿠키 동기화 지연 이슈)
- [ ] ⬜ SameSite/Secure 쿠키 동작 검증

## 외부 스킴 / 새 창

- [x] ⚙️ `window.open` / `target=_blank`: 현재 창 / 외부 브라우저 / 차단
- [x] ✅ `tel:`, `mailto:`, 카카오 등 커스텀 스킴 → `Linking.openURL`
- [x] ✅ iOS `LSApplicationQueriesSchemes` 등록
- [ ] ⬜ Android `intent://` URL 파싱 (Linking으로는 안 열림 — PG 결제 필요 시 구현)
- [ ] ⬜ 구글 OAuth: 웹뷰 UA 차단(`disallowed_useragent`) → 외부 브라우저/ASWebAuthenticationSession 우회

## 파일 다운로드

- [ ] ⬜ blob 다운로드: 웹뷰에서 기본 동작 안 함 → JS로 base64 변환 후 postMessage 브릿지
- [ ] ⬜ iOS(WKWebView): 다운로드 수동 처리 → 저장 후 공유 시트/QuickLook
- [ ] ⬜ Android: `DownloadManager` 연동 (react-native-webview 기본 다운로드는 제한적)
- [ ] ⬜ PDF: iOS는 인라인 표시됨(저장은 별도), Android는 표시 자체가 안 됨 → 뷰어/다운로드 처리
- [ ] ⬜ `Content-Disposition: attachment` 응답 처리

## 파일 업로드

- [x] ✅ iOS `<input type="file">` 자동 동작 (Info.plist 권한 문구 3종 필수 — 없으면 크래시)
- [ ] ⬜ Android 카메라 촬영 업로드: CAMERA 권한 + FileProvider 확인
- [ ] ⬜ 엑셀 MIME(`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`)이 Android 파일 피커에서 필터링되는지 확인
- [ ] ⬜ `accept="image/*"` + `capture` 속성 동작 확인

## 브릿지 (postMessage)

- [ ] ⬜ `onMessage` ↔ `window.ReactNativeWebView.postMessage` 프로토콜(타입/버전) 정의
- [ ] ⬜ 토큰·앱 정보 주입: `injectedJavaScriptBeforeContentLoaded`
- [x] ⚙️ 웹의 앱 감지용 커스텀 UA (`applicationNameForUserAgent`)

## 에러 / 복구

- [x] ✅ `onError`(renderError) + 재시도 UI
- [x] ✅ `onHttpError` 배너 (메인 문서만)
- [x] ✅ 렌더러 크래시 복구: `onContentProcessDidTerminate` / `onRenderProcessGone` → reload
- [ ] ⬜ 오프라인 감지 후 자동 재시도
- [ ] ⬜ dev 자체서명 인증서 SSL 에러 처리

## UI / UX

- [x] ✅ 키보드: iOS `KeyboardAvoidingView`, Android `adjustResize`
- [x] ⚙️ 하단 Safe Area: 앱 처리 vs 웹 처리(`viewport-fit=cover` + `env()`)
- [x] ⚙️ 시스템 폰트 크기: `textZoom` 100 고정 vs 반영
- [x] ⚙️ pull-to-refresh
- [ ] ⬜ 롱프레스 링크 프리뷰(`allowsLinkPreview`), 스크롤 바운스 정책
- [ ] ⬜ 스플래시 ↔ 웹 로딩 전환 (로딩 인디케이터 커스텀)

## 보안 / 심사

- [ ] ⬜ `originWhitelist` 자사 도메인 제한 + 외부 링크는 외부 브라우저 (샌드박스라 현재 전체 허용)
- [x] ⚙️ Android `mixedContentMode` (설정 > Android > 혼합 콘텐츠 허용)
- [ ] ⬜ Apple 심사 4.2(최소 기능): 순수 웹뷰 래퍼 리젝 대비 — 네이티브 기능(푸시, 카메라 브릿지 등) 확보

## 디버깅

- [x] ✅ `webviewDebuggingEnabled`: Android `chrome://inspect`, iOS Safari 개발자 메뉴
- [x] ✅ 툴바: 현재 호스트 표시, 새로고침, 캐시 초기화
