# 웹 ↔ 앱 브릿지 규격 (v1)

웹 페이지가 앱(웹뷰)과 통신하는 프로토콜. 앱이 모든 페이지에 `window.AppBridge`를 주입한다(`src/bridge.ts`).

## 웹에서 앱 감지

```js
if (window.AppBridge?.isApp) {
  console.log(window.AppBridge.platform); // 'ios' | 'android'
}
// 주입 시점 이슈가 있으면:
window.addEventListener('AppBridgeReady', () => { /* ... */ });
```

`AppBridge`는 `injectedJavaScriptBeforeContentLoaded`로 주입되므로 웹 코드 실행 시점엔 이미 존재하는 게 정상. UA로도 감지 가능(설정에서 커스텀 UA 켠 경우 `DeepCheckSandbox/1.0` 포함).

## 메시지 형식

```ts
{ v: 1, type: string, id?: string, payload?: unknown }
```

`id`가 있으면 요청-응답 쌍으로 처리된다. 앱의 에러 응답은 `type: 'error'`, `payload`에 메시지.

## 웹 API

| 메서드 | 설명 |
|---|---|
| `AppBridge.send(type, payload)` | 단방향 전송 |
| `AppBridge.request(type, payload, timeoutMs?)` | 응답을 Promise로 수신 (기본 타임아웃 5초) |
| `AppBridge.on(type, handler)` | 앱 → 웹 푸시 수신. 해제 함수 반환 |
| `AppBridge.saveFile(name, mime, base64)` | 파일 저장/공유 시트 (아래 참고) |

## 앱이 처리하는 메시지 타입

### `app.info` (request)

```js
const info = await AppBridge.request('app.info');
// { platform, osVersion, appVersion, bridgeVersion, uaSuffix }
```

### `log` (send)

브라우저 화면 우하단 "브릿지" 버튼의 로그 패널에 기록된다. 실기기에서 콘솔 없이 디버깅할 때 사용.

```js
AppBridge.send('log', { level: 'info', message: '측정 시작' });
```

### `download.blob` (send 또는 request)

base64 파일을 앱이 저장하고 OS 공유 시트를 띄운다. `AppBridge.saveFile()`이 이걸 래핑한 것.

```js
// 권장: 인증 필요한 파일은 웹에서 받고 base64로 넘긴다
const res = await fetch('/api/report.xlsx');  // 세션 쿠키 포함됨
const blob = await res.blob();
const base64 = await new Promise((ok) => {
  const r = new FileReader();
  r.onload = () => ok(String(r.result).split(',')[1]);
  r.readAsDataURL(blob);
});
AppBridge.saveFile('report.xlsx', blob.type, base64);

// 응답이 필요하면:
const { ok, uri } = await AppBridge.request('download.blob', { name, mime, base64 });
```

정의되지 않은 type을 `request`로 보내면 `error` 응답이 온다.

## 자동 다운로드 처리 (웹 수정 없이 동작)

| 케이스 | 처리 |
|---|---|
| `<a href="blob:..." download>` 클릭 | 주입 스크립트가 가로채 blob → base64 → 저장/공유 |
| `<a href="data:...">` 클릭 | 동일 |
| https 직링크 (xlsx/csv/docx/pptx/zip/hwp) | 네이티브가 URL 직접 다운로드 → 공유 시트 |
| https 직링크 PDF | Android만 다운로드 (iOS는 인라인 렌더링) |
| `Content-Disposition: attachment` (iOS) | `onFileDownload` → 다운로드 → 공유 시트 |

**주의(중요):** 네이티브 직다운로드에는 웹뷰 세션 쿠키가 붙지 않는다(Android 확실). 로그인이 필요한 파일은 반드시 웹에서 fetch(쿠키 포함)한 뒤 `AppBridge.saveFile()`로 넘길 것.

**한계:** Android에서 `window.open()`으로 여는 blob(구형 패턴)과 `about:blank`+`document.write` 팝업은 인터셉트하지 못한다. `<a download>` 또는 `saveFile()` 사용 권장.

## 타입 추가 방법

1. `src/screens/BrowserScreen.tsx`의 `onMessage` switch에 케이스 추가
2. 이 문서에 규격 추가
3. 응답이 필요하면 `reply({ v, id: msg.id, type, payload })` 호출
