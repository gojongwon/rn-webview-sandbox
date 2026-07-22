# rn-webview-sandbox

Expo Go에서 URL을 열어 네이티브 WebView 동작을 확인하는 샌드박스입니다.

## 테스터

랜딩 페이지에서 APK를 설치하세요 (한 번만). 이후 앱 내용은 자동 갱신(OTA)됩니다.  
→ https://gojongwon.github.io/rn-webview-sandbox/

> 참고: Expo Go QR 방식은 현재 Expo Go 57 버그([expo/expo#47731](https://github.com/expo/expo/issues/47731))로 동작하지 않아 APK 방식으로 전환했습니다.

## Android APK 빌드 (최초 1회 / SDK 업그레이드 시)

```bash
npx eas build -p android --profile preview
```

빌드 완료 후:

1. 빌드 페이지에서 APK 다운로드 → 파일명을 `rn-webview-sandbox.apk`로 변경
2. GitHub Releases에 새 릴리스를 만들고 APK 첨부 (EAS 링크는 약 2주 뒤 만료되므로 반드시 Releases에 업로드)
3. 랜딩 페이지 버튼은 `releases/latest/download/rn-webview-sandbox.apk` 고정 URL을 사용하므로 별도 수정 불필요

## 배포자 (앱 내용 갱신)

코드 수정 후 preview 채널에 올립니다. 랜딩 URL·QR은 그대로입니다.

```bash
npm run publish:preview
```

최초/수동 EAS 배포:

```bash
npx eas update --channel preview --message "설명"
```

배포가 실제로 서버에 반영됐는지 확인:

```bash
npx eas update:list --branch preview
npx eas channel:view preview
```

## 로컬 개발

```bash
npm start
```
