# rn-webview-sandbox

Expo Go에서 URL을 열어 네이티브 WebView 동작을 확인하는 샌드박스입니다.

## 테스터

1. 스마트폰에 [Expo Go SDK 57](https://expo.dev/go?sdkVersion=57) 설치
2. 랜딩 페이지를 열고 QR 스캔  
   → https://gojongwon.github.io/rn-webview-sandbox/

Something went wrong가 뜨면 Expo Go 버전이 프로젝트(SDK 57)와 다른 경우입니다. 위 링크로 SDK 57용 Expo Go를 설치한 뒤 다시 시도하세요.

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
