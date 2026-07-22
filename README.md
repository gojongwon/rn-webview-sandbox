# rn-webview-sandbox

Expo Go에서 URL을 열어 네이티브 WebView 동작을 확인하는 샌드박스입니다.

## 테스터

1. 스마트폰에 [Expo Go](https://expo.dev/go) 설치 (SDK 54 호환 버전)
2. 랜딩 페이지를 열고 QR 스캔  
   → https://gojongwon.github.io/rn-webview-sandbox/

## 배포자 (앱 내용 갱신)

코드 수정 후 preview 채널에 올립니다. 랜딩 URL·QR은 그대로입니다.

```bash
npm run publish:preview
```

최초/수동 EAS 배포:

```bash
npx eas update --branch preview --message "설명"
```

## 로컬 개발

```bash
npm start
```
