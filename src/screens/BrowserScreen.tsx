import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BackHandler,
  Linking,
  PermissionsAndroid,
  Platform,
  Pressable,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import type {
  FileDownloadEvent,
  ShouldStartLoadRequest,
  WebViewHttpErrorEvent,
  WebViewMessageEvent,
  WebViewNavigation,
  WebViewOpenWindowEvent,
} from 'react-native-webview/lib/WebViewTypes';
import {
  BridgeLogEntry,
  BridgeMessage,
  INJECTED_BRIDGE_JS,
  bridgeReplyScript,
  parseBridgeMessage,
  payloadPreview,
} from '../bridge';
import { BridgeLogPanel, ErrorView } from '../components';
import { APP_VERSION, BRIDGE_VERSION, CUSTOM_UA_SUFFIX } from '../config';
import { downloadAndShare, isDownloadUrl, saveBase64AndShare } from '../download';
import { Settings } from '../settings';
import { ui } from '../theme';

const MAX_LOGS = 50;

export function BrowserScreen({
  initialUri,
  settings,
  onClose,
}: {
  initialUri: string;
  settings: Settings;
  onClose: () => void;
}) {
  const webRef = useRef<WebView>(null);
  const canGoBackRef = useRef(false);
  const currentUrlRef = useRef(initialUri);
  const [httpError, setHttpError] = useState<string | null>(null);
  const [logs, setLogs] = useState<BridgeLogEntry[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  const pushLog = useCallback((entry: BridgeLogEntry) => {
    setLogs((prev) => [...prev.slice(-(MAX_LOGS - 1)), entry]);
  }, []);

  // ─── 기본 내장 동작 ─────────────────────────────────────────

  // [기본] Android: 카메라/마이크 앱 권한 선요청 (웹뷰 getUserMedia용)
  useEffect(() => {
    if (Platform.OS === 'android') {
      PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      ]).catch(() => {});
    }
  }, []);

  // [기본] Android 하드웨어 백버튼: 웹 히스토리 back → 없으면 런처로
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBackRef.current) {
        webRef.current?.goBack();
      } else {
        onClose();
      }
      return true;
    });
    return () => sub.remove();
  }, [onClose]);

  const onNavChange = useCallback((nav: WebViewNavigation) => {
    canGoBackRef.current = nav.canGoBack;
    currentUrlRef.current = nav.url;
  }, []);

  // [기본] 외부 스킴(tel:, intent:, kakao 등)은 OS로 위임 + 파일 직링크는 다운로드
  const onShouldStart = useCallback(
    (req: ShouldStartLoadRequest) => {
      if (/^https?:\/\//.test(req.url)) {
        if (isDownloadUrl(req.url, Platform.OS)) {
          pushLog({
            dir: 'web→app',
            type: 'download.url',
            at: Date.now(),
            preview: req.url.slice(0, 120),
          });
          downloadAndShare(req.url).catch((err) =>
            pushLog({
              dir: 'app→web',
              type: 'download.error',
              at: Date.now(),
              preview: String(err).slice(0, 120),
            })
          );
          return false;
        }
        return true;
      }
      if (req.url === 'about:blank' || req.url.startsWith('blob:') || req.url.startsWith('data:')) {
        return true; // blob/data 내비게이션은 주입 스크립트가 클릭 단계에서 처리
      }
      Linking.openURL(req.url).catch(() => {});
      return false;
    },
    [pushLog]
  );

  // [기본] iOS: 렌더링 불가 응답(Content-Disposition 등) → 다운로드로 위임
  const onFileDownload = useCallback(
    (e: FileDownloadEvent) => {
      const url = e.nativeEvent.downloadUrl;
      if (!url) return;
      downloadAndShare(url).catch((err) =>
        pushLog({
          dir: 'app→web',
          type: 'download.error',
          at: Date.now(),
          preview: String(err).slice(0, 120),
        })
      );
    },
    [pushLog]
  );

  // [설정] window.open / target=_blank 처리
  const onOpenWindow = useCallback(
    (e: WebViewOpenWindowEvent) => {
      const url = e.nativeEvent.targetUrl;
      if (!url) return;
      if (settings.popupMode === 'external') {
        Linking.openURL(url).catch(() => {});
      } else if (settings.popupMode === 'same') {
        webRef.current?.injectJavaScript(
          `window.location.href=${JSON.stringify(url)};true;`
        );
      }
      // 'block': 무시
    },
    [settings.popupMode]
  );

  // [기본] 메인 문서 HTTP 에러만 배너로 표시
  const onHttpError = useCallback((e: WebViewHttpErrorEvent) => {
    const { url, statusCode } = e.nativeEvent;
    if (url === currentUrlRef.current) {
      setHttpError(`HTTP ${statusCode} — ${url}`);
    }
  }, []);

  // ─── 브릿지 (웹 ↔ 앱) ───────────────────────────────────────

  const reply = useCallback(
    (msg: BridgeMessage) => {
      webRef.current?.injectJavaScript(bridgeReplyScript(msg));
      pushLog({
        dir: 'app→web',
        type: msg.type,
        at: Date.now(),
        preview: payloadPreview(msg.payload),
      });
    },
    [pushLog]
  );

  const onMessage = useCallback(
    (e: WebViewMessageEvent) => {
      const msg = parseBridgeMessage(e.nativeEvent.data);
      if (!msg) return;
      pushLog({
        dir: 'web→app',
        type: msg.type,
        at: Date.now(),
        preview: payloadPreview(msg.payload),
      });

      switch (msg.type) {
        case 'app.info': {
          if (msg.id) {
            reply({
              v: BRIDGE_VERSION,
              id: msg.id,
              type: 'app.info',
              payload: {
                platform: Platform.OS,
                osVersion: String(Platform.Version),
                appVersion: APP_VERSION,
                bridgeVersion: BRIDGE_VERSION,
                uaSuffix: settings.customUA ? CUSTOM_UA_SUFFIX : null,
              },
            });
          }
          break;
        }
        case 'log':
          break; // 로그 패널에만 기록
        case 'download.blob': {
          const p = (msg.payload ?? {}) as {
            name?: string;
            mime?: string;
            base64?: string;
          };
          if (typeof p.base64 !== 'string' || !p.base64) {
            if (msg.id) {
              reply({ v: BRIDGE_VERSION, id: msg.id, type: 'error', payload: 'base64 누락' });
            }
            break;
          }
          saveBase64AndShare(
            String(p.name || 'download'),
            String(p.mime || 'application/octet-stream'),
            p.base64
          )
            .then((uri) => {
              if (msg.id) {
                reply({ v: BRIDGE_VERSION, id: msg.id, type: 'download.blob', payload: { ok: true, uri } });
              }
            })
            .catch((err) => {
              pushLog({
                dir: 'app→web',
                type: 'download.error',
                at: Date.now(),
                preview: String(err).slice(0, 120),
              });
              if (msg.id) {
                reply({ v: BRIDGE_VERSION, id: msg.id, type: 'error', payload: String(err) });
              }
            });
          break;
        }
        default: {
          if (msg.id) {
            reply({
              v: BRIDGE_VERSION,
              id: msg.id,
              type: 'error',
              payload: `unknown type: ${msg.type}`,
            });
          }
        }
      }
    },
    [pushLog, reply, settings.customUA]
  );

  const edges = settings.bottomSafeArea
    ? (['top', 'left', 'right', 'bottom'] as const)
    : (['top', 'left', 'right'] as const);

  return (
    <SafeAreaView style={ui.fill} edges={[...edges]}>
      <StatusBar style="auto" />

      {httpError && (
        <Pressable style={ui.errorBanner} onPress={() => setHttpError(null)}>
          <Text style={ui.errorBannerText} numberOfLines={2}>
            {httpError} (탭하여 닫기)
          </Text>
        </Pressable>
      )}

      <WebView
        ref={webRef}
        source={{ uri: initialUri }}
        style={ui.fill}
        startInLoadingState
        // ── [기본 내장] 스토리지/쿠키 ──
        domStorageEnabled
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        // ── [기본 내장] 카메라 측정(getUserMedia) ──
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        // ── [기본 내장] 디버깅 (chrome://inspect, Safari 개발자 메뉴) ──
        webviewDebuggingEnabled
        // ── [기본 내장] 렌더러 크래시 복구 ──
        onContentProcessDidTerminate={() => webRef.current?.reload()}
        onRenderProcessGone={() => webRef.current?.reload()}
        // ── [기본 내장] 내비게이션/에러 ──
        onNavigationStateChange={onNavChange}
        onShouldStartLoadWithRequest={onShouldStart}
        onFileDownload={onFileDownload}
        onHttpError={onHttpError}
        renderError={(_domain, code, desc) => (
          <ErrorView code={code} desc={desc} onRetry={() => webRef.current?.reload()} />
        )}
        // ── [기본 내장] 브릿지 ──
        injectedJavaScriptBeforeContentLoaded={INJECTED_BRIDGE_JS}
        onMessage={onMessage}
        // ── [설정] ──
        applicationNameForUserAgent={settings.customUA ? CUSTOM_UA_SUFFIX : undefined}
        setSupportMultipleWindows={settings.popupMode !== 'same' ? true : false}
        onOpenWindow={onOpenWindow}
        mediaCapturePermissionGrantType={settings.cameraAutoGrant ? 'grant' : 'prompt'}
        allowsBackForwardNavigationGestures={settings.swipeBack}
        pullToRefreshEnabled={settings.pullToRefresh}
        textZoom={settings.fixedTextZoom ? 100 : undefined}
        mixedContentMode={settings.mixedContent ? 'always' : 'never'}
        incognito={settings.incognito}
      />

      {/* 우하단: 브릿지 로그 토글 */}
      <Pressable
        onPress={() => setShowLogs((v) => !v)}
        hitSlop={10}
        style={ui.floatingLog}
      >
        <Text style={ui.floatingLogText}>브릿지 {logs.length}</Text>
      </Pressable>

      {showLogs && (
        <BridgeLogPanel
          logs={logs}
          onClear={() => setLogs([])}
          onClose={() => setShowLogs(false)}
        />
      )}
    </SafeAreaView>
  );
}
