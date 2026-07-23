import { Platform } from 'react-native';
import { BRIDGE_VERSION } from './config';

// ─── 메시지 규격 (docs/bridge.md 참고) ─────────────────────────
// 웹 → 앱: window.ReactNativeWebView.postMessage(JSON.stringify(msg))
// 앱 → 웹: window.AppBridge._receive(msg)  (injectJavaScript로 호출)
export type BridgeMessage = {
  v: number; //       프로토콜 버전
  type: string; //    'app.info' | 'log' | 'download.blob' | 'error' | ...
  id?: string; //     request-response 매칭용 (있으면 응답 필요)
  payload?: unknown;
};

export type BridgeLogEntry = {
  dir: 'web→app' | 'app→web';
  type: string;
  at: number;
  preview: string;
};

export function parseBridgeMessage(data: string): BridgeMessage | null {
  try {
    const msg = JSON.parse(data);
    if (msg && typeof msg === 'object' && typeof msg.type === 'string') {
      return msg as BridgeMessage;
    }
  } catch {
    // 브릿지 규격이 아닌 postMessage는 무시
  }
  return null;
}

// 앱 → 웹 전송용 스크립트 (U+2028/2029는 JS 소스에서 개행으로 해석되므로 이스케이프)
export function bridgeReplyScript(msg: BridgeMessage): string {
  const json = JSON.stringify(msg)
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
  return `window.AppBridge && window.AppBridge._receive(${json}); true;`;
}

export function payloadPreview(payload: unknown, max = 120): string {
  try {
    const s = payload === undefined ? '' : JSON.stringify(payload) ?? '';
    return s.length > max ? s.slice(0, max) + '…' : s;
  } catch {
    return String(payload);
  }
}

// ─── 주입 스크립트 ─────────────────────────────────────────────
// injectedJavaScriptBeforeContentLoaded로 주입되어 window.AppBridge를 노출하고,
// <a download> / blob: / data: 클릭을 가로채 download.blob 메시지로 변환한다.
export const INJECTED_BRIDGE_JS = `
(function () {
  if (window.AppBridge) return;
  var V = ${BRIDGE_VERSION};
  var pending = {};
  var listeners = {};
  var seq = 0;

  function post(msg) {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify(msg));
    }
  }

  window.AppBridge = {
    isApp: true,
    platform: '${Platform.OS}',
    version: V,
    send: function (type, payload) {
      post({ v: V, type: type, payload: payload });
    },
    request: function (type, payload, timeoutMs) {
      var id = 'r' + (++seq) + '-' + Date.now();
      return new Promise(function (resolve, reject) {
        pending[id] = { resolve: resolve, reject: reject };
        setTimeout(function () {
          if (pending[id]) {
            delete pending[id];
            reject(new Error('bridge timeout: ' + type));
          }
        }, timeoutMs || 5000);
        post({ v: V, id: id, type: type, payload: payload });
      });
    },
    on: function (type, handler) {
      (listeners[type] = listeners[type] || []).push(handler);
      return function () {
        listeners[type] = (listeners[type] || []).filter(function (h) {
          return h !== handler;
        });
      };
    },
    saveFile: function (name, mime, base64) {
      post({ v: V, type: 'download.blob', payload: { name: name, mime: mime, base64: base64 } });
    },
    _receive: function (msg) {
      if (msg && msg.id && pending[msg.id]) {
        var p = pending[msg.id];
        delete pending[msg.id];
        if (msg.type === 'error') p.reject(new Error(String(msg.payload)));
        else p.resolve(msg.payload);
        return;
      }
      var hs = (msg && listeners[msg.type]) || [];
      for (var i = 0; i < hs.length; i++) {
        try { hs[i](msg.payload); } catch (e) {}
      }
    }
  };

  function blobToBase64(blob) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onerror = reject;
      r.onload = function () { resolve(String(r.result).split(',')[1] || ''); };
      r.readAsDataURL(blob);
    });
  }

  // blob:/data: 앵커 클릭 인터셉트 (http(s) 직링크는 네이티브에서 처리)
  document.addEventListener('click', function (e) {
    var t = e.target;
    var a = t && t.closest ? t.closest('a') : null;
    if (!a) return;
    var href = a.getAttribute('href') || '';
    var isBlob = href.indexOf('blob:') === 0;
    var isData = href.indexOf('data:') === 0;
    if (!isBlob && !isData) return;
    e.preventDefault();
    e.stopPropagation();
    var name = a.getAttribute('download') || 'download';
    if (isData) {
      var m = href.match(/^data:([^;,]*)/);
      var mime = (m && m[1]) || 'application/octet-stream';
      var body = href.split(',')[1] || '';
      var b64 = href.indexOf(';base64,') > -1 ? body : btoa(unescape(body));
      window.AppBridge.saveFile(name, mime, b64);
      return;
    }
    fetch(href)
      .then(function (res) { return res.blob(); })
      .then(function (blob) {
        return blobToBase64(blob).then(function (b64) {
          window.AppBridge.saveFile(name, blob.type || 'application/octet-stream', b64);
        });
      })
      .catch(function (err) {
        window.AppBridge.send('log', { level: 'error', message: 'blob download failed: ' + String(err) });
      });
  }, true);

  window.dispatchEvent(new Event('AppBridgeReady'));
})();
true;
`;
