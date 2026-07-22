# rn-webview-sandbox

Android 프리뷰 APK로 URL을 열어 네이티브 WebView 동작을 확인하는 샌드박스입니다. Expo Go는 필요 없습니다.

## 테스터

1. Android 폰에서 랜딩 페이지 열기  
   → https://gojongwon.github.io/rn-webview-sandbox/
2. QR을 스캔해 APK 설치 (처음 한 번)
3. 앱 실행 → 웹뷰 테스트 화면

이미 설치했다면 앱만 다시 실행하면 `preview` 채널의 최신 JS를 받습니다.  
“알 수 없는 앱 설치” 허용이 필요할 수 있습니다.

## 배포자

### JS만 변경했을 때

```bash
npm run publish:preview
```

APK 재빌드 없이 반영됩니다. (앱을 한 번 종료 후 다시 실행)

### 네이티브/의존성 변경 시

```bash
npm run build:preview:android
```

빌드가 끝나면 랜딩의 설치 URL을 새 빌드 링크로 갱신하세요.

## 로컬 개발

```bash
npm start
```
