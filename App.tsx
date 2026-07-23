import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BackHandler,
  KeyboardAvoidingView,
  Linking,
  PermissionsAndroid,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import type {
  ShouldStartLoadRequest,
  WebViewHttpErrorEvent,
  WebViewNavigation,
  WebViewOpenWindowEvent,
} from 'react-native-webview/lib/WebViewTypes';

const START_URL = 'https://example.com';
const CUSTOM_UA_SUFFIX = 'DeepCheckSandbox/1.0';

const PRESETS = [
  {
    name: 'DEV',
    host: 'dev.deepcheck.deep-medi.com',
    url: 'https://dev.deepcheck.deep-medi.com/m/login',
    color: '#F59E0B',
  },
  {
    name: 'WEB',
    host: 'deepcheck-web.deep-medi.com',
    url: 'https://deepcheck-web.deep-medi.com/m/login',
    color: '#10B981',
  },
];

// ─── 설정 (docs/configuration.md 참고) ────────────────────────────
type PopupMode = 'same' | 'external' | 'block';

type Settings = {
  // 공통
  customUA: boolean; //        UA에 CUSTOM_UA_SUFFIX 부착 (웹의 앱 감지 테스트)
  popupMode: PopupMode; //     window.open / target=_blank 처리
  bottomSafeArea: boolean; //  하단 safe area를 앱이 처리 (off = 웹이 처리)
  incognito: boolean; //       쿠키/스토리지 미보존
  // iOS
  cameraAutoGrant: boolean; // getUserMedia 권한 자동 승인 vs 웹뷰가 묻기
  swipeBack: boolean; //       스와이프 백 제스처
  pullToRefresh: boolean; //   당겨서 새로고침
  // Android
  fixedTextZoom: boolean; //   시스템 폰트 크기 무시(100 고정)
  mixedContent: boolean; //    https 페이지에서 http 리소스 허용
};

const DEFAULT_SETTINGS: Settings = {
  customUA: false,
  popupMode: 'same',
  bottomSafeArea: false,
  incognito: false,
  cameraAutoGrant: true,
  swipeBack: true,
  pullToRefresh: false,
  fixedTextZoom: true,
  mixedContent: false,
};

const POPUP_OPTIONS: { value: PopupMode; label: string }[] = [
  { value: 'same', label: '현재 창' },
  { value: 'external', label: '외부 브라우저' },
  { value: 'block', label: '차단' },
];

export default function App() {
  return (
    <SafeAreaProvider>
      <Root />
    </SafeAreaProvider>
  );
}

function Root() {
  const [uri, setUri] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  if (uri) {
    return (
      <Browser initialUri={uri} settings={settings} onClose={() => setUri(null)} />
    );
  }
  if (showSettings) {
    return (
      <SettingsScreen
        settings={settings}
        onChange={setSettings}
        onBack={() => setShowSettings(false)}
      />
    );
  }
  return (
    <Launcher onGo={setUri} onOpenSettings={() => setShowSettings(true)} />
  );
}

// ─── 브라우저 화면 ─────────────────────────────────────────────
function Browser({
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
  const [host, setHost] = useState(() => hostOf(initialUri));
  const [httpError, setHttpError] = useState<string | null>(null);
  const currentUrlRef = useRef(initialUri);

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
    setHost(hostOf(nav.url));
  }, []);

  // [기본] 외부 스킴(tel:, intent:, kakao 등)은 OS로 위임
  const onShouldStart = useCallback((req: ShouldStartLoadRequest) => {
    if (/^https?:\/\//.test(req.url) || req.url === 'about:blank') return true;
    Linking.openURL(req.url).catch(() => {});
    return false;
  }, []);

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

  const clearAndReload = useCallback(() => {
    webRef.current?.clearCache?.(true);
    webRef.current?.reload();
  }, []);

  const edges =
    settings.bottomSafeArea
      ? (['top', 'left', 'right', 'bottom'] as const)
      : (['top', 'left', 'right'] as const);

  return (
    <SafeAreaView style={styles.fill} edges={[...edges]}>
      <StatusBar style="auto" />

      {/* 툴바: 닫기 / 현재 호스트 / 초기화·새로고침 */}
      <View style={styles.toolbar}>
        <Pressable onPress={onClose} hitSlop={8} style={styles.toolBtn}>
          <Text style={styles.toolBtnText}>✕</Text>
        </Pressable>
        <Text style={styles.toolHost} numberOfLines={1}>
          {host}
        </Text>
        <Pressable onPress={clearAndReload} hitSlop={8} style={styles.toolBtn}>
          <Text style={styles.toolBtnSmall}>초기화</Text>
        </Pressable>
        <Pressable
          onPress={() => webRef.current?.reload()}
          hitSlop={8}
          style={styles.toolBtn}
        >
          <Text style={styles.toolBtnText}>↻</Text>
        </Pressable>
      </View>

      {httpError && (
        <Pressable style={styles.errorBanner} onPress={() => setHttpError(null)}>
          <Text style={styles.errorBannerText} numberOfLines={2}>
            {httpError} (탭하여 닫기)
          </Text>
        </Pressable>
      )}

      <WebView
        ref={webRef}
        source={{ uri: initialUri }}
        style={styles.fill}
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
        onHttpError={onHttpError}
        renderError={(_domain, code, desc) => (
          <ErrorView
            code={code}
            desc={desc}
            onRetry={() => webRef.current?.reload()}
          />
        )}
        // ── [설정] ──
        applicationNameForUserAgent={
          settings.customUA ? CUSTOM_UA_SUFFIX : undefined
        }
        setSupportMultipleWindows={settings.popupMode !== 'same' ? true : false}
        onOpenWindow={onOpenWindow}
        mediaCapturePermissionGrantType={
          settings.cameraAutoGrant ? 'grant' : 'prompt'
        }
        allowsBackForwardNavigationGestures={settings.swipeBack}
        pullToRefreshEnabled={settings.pullToRefresh}
        textZoom={settings.fixedTextZoom ? 100 : undefined}
        mixedContentMode={settings.mixedContent ? 'always' : 'never'}
        incognito={settings.incognito}
      />
    </SafeAreaView>
  );
}

function ErrorView({
  code,
  desc,
  onRetry,
}: {
  code: number;
  desc: string;
  onRetry: () => void;
}) {
  return (
    <View style={styles.errorView}>
      <Text style={styles.errorTitle}>페이지를 불러올 수 없어요</Text>
      <Text style={styles.errorDesc}>
        {desc} (code {code})
      </Text>
      <Pressable onPress={onRetry} style={styles.primary}>
        <Text style={styles.primaryText}>다시 시도</Text>
      </Pressable>
    </View>
  );
}

// ─── 런처 화면 ─────────────────────────────────────────────────
function Launcher({
  onGo,
  onOpenSettings,
}: {
  onGo: (uri: string) => void;
  onOpenSettings: () => void;
}) {
  const [input, setInput] = useState(START_URL);
  const [focused, setFocused] = useState(false);

  const go = () => {
    onGo(/^https?:\/\//.test(input) ? input : `https://${input}`);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.titleRow}>
            <Text style={styles.title}>웹뷰 테스트</Text>
            <Pressable
              onPress={onOpenSettings}
              hitSlop={8}
              style={({ pressed }) => [styles.settingsBtn, pressed && styles.pressed]}
            >
              <Text style={styles.settingsBtnText}>설정</Text>
            </Pressable>
          </View>
          <Text style={styles.subtitle}>URL을 입력하거나 아래에서 선택하세요</Text>

          <TextInput
            style={[styles.input, focused && styles.inputFocused]}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={go}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            placeholder="https://..."
            placeholderTextColor="#9CA3AF"
            returnKeyType="go"
          />

          <Pressable
            onPress={go}
            style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
          >
            <Text style={styles.primaryText}>이동</Text>
          </Pressable>

          <Text style={styles.section}>자주 쓰는 주소</Text>

          {PRESETS.map((p) => (
            <Pressable
              key={p.url}
              onPress={() => onGo(p.url)}
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            >
              <View style={[styles.badge, { backgroundColor: p.color + '22' }]}>
                <Text style={[styles.badgeText, { color: p.color }]}>{p.name}</Text>
              </View>
              <Text style={styles.host} numberOfLines={1}>
                {p.host}
              </Text>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ))}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── 설정 화면 ─────────────────────────────────────────────────
function SettingsScreen({
  settings,
  onChange,
  onBack,
}: {
  settings: Settings;
  onChange: (s: Settings) => void;
  onBack: () => void;
}) {
  const set = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    onChange({ ...settings, [key]: value });

  // Android 하드웨어 백버튼 → 런처로
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true;
    });
    return () => sub.remove();
  }, [onBack]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />

      <View style={styles.settingsHeader}>
        <Pressable onPress={onBack} hitSlop={12} style={styles.toolBtn}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.settingsTitle}>설정</Text>
        <View style={styles.toolBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.section}>공통</Text>

        <SegmentRow
          label="팝업 (window.open)"
          options={POPUP_OPTIONS}
          value={settings.popupMode}
          onSelect={(v) => set('popupMode', v)}
        />
        <SwitchRow
          label="커스텀 User-Agent"
          sub={`UA 끝에 ${CUSTOM_UA_SUFFIX} 부착`}
          value={settings.customUA}
          onChange={(v) => set('customUA', v)}
        />
        <SwitchRow
          label="하단 Safe Area 앱에서 처리"
          sub="끄면 웹이 env(safe-area-inset-bottom)로 처리"
          value={settings.bottomSafeArea}
          onChange={(v) => set('bottomSafeArea', v)}
        />
        <SwitchRow
          label="시크릿 모드"
          sub="쿠키/스토리지를 보존하지 않음"
          value={settings.incognito}
          onChange={(v) => set('incognito', v)}
        />

        <Text style={styles.section}>iOS</Text>

        <SwitchRow
          label="카메라·마이크 자동 승인"
          sub="끄면 웹뷰가 권한을 물어봄"
          value={settings.cameraAutoGrant}
          onChange={(v) => set('cameraAutoGrant', v)}
        />
        <SwitchRow
          label="스와이프 백 제스처"
          value={settings.swipeBack}
          onChange={(v) => set('swipeBack', v)}
        />
        <SwitchRow
          label="당겨서 새로고침"
          value={settings.pullToRefresh}
          onChange={(v) => set('pullToRefresh', v)}
        />

        <Text style={styles.section}>Android</Text>

        <SwitchRow
          label="텍스트 크기 100% 고정"
          sub="끄면 시스템 폰트 크기 반영"
          value={settings.fixedTextZoom}
          onChange={(v) => set('fixedTextZoom', v)}
        />
        <SwitchRow
          label="혼합 콘텐츠 허용"
          sub="https 페이지에서 http 리소스 로드 허용"
          value={settings.mixedContent}
          onChange={(v) => set('mixedContent', v)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function SwitchRow({
  label,
  sub,
  value,
  onChange,
}: {
  label: string;
  sub?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.fill}>
        <Text style={styles.settingLabel}>{label}</Text>
        {sub ? <Text style={styles.settingSub}>{sub}</Text> : null}
      </View>
      <Switch value={value} onValueChange={onChange} />
    </View>
  );
}

function SegmentRow<T extends string>({
  label,
  options,
  value,
  onSelect,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onSelect: (v: T) => void;
}) {
  return (
    <View style={styles.settingRowCol}>
      <Text style={styles.settingLabel}>{label}</Text>
      <View style={styles.segment}>
        {options.map((o) => {
          const active = o.value === value;
          return (
            <Pressable
              key={o.value}
              onPress={() => onSelect(o.value)}
              style={[styles.segmentItem, active && styles.segmentItemActive]}
            >
              <Text
                style={[styles.segmentText, active && styles.segmentTextActive]}
              >
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function hostOf(url: string) {
  const m = url.match(/^https?:\/\/([^/]+)/);
  return m ? m[1] : url;
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { flexGrow: 1, padding: 24, gap: 14 },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 28, fontWeight: '700', color: '#0B0B0F', letterSpacing: -0.5 },
  settingsBtn: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  settingsBtnText: { fontSize: 13, fontWeight: '600', color: '#374151' },

  settingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  settingsTitle: { fontSize: 16, fontWeight: '600', color: '#0B0B0F' },
  backText: { fontSize: 26, color: '#111827', marginTop: -3 },
  subtitle: { fontSize: 14, color: '#6B7280', marginBottom: 8 },

  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#0B0B0F',
  },
  inputFocused: { borderColor: '#0B0B0F', backgroundColor: '#FFFFFF' },

  primary: {
    backgroundColor: '#0B0B0F',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  primaryText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  pressed: { opacity: 0.85 },

  section: {
    marginTop: 12,
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#EEF0F3',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  cardPressed: { backgroundColor: '#F0F1F4' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  host: { flex: 1, fontSize: 14, fontWeight: '500', color: '#111827' },
  chevron: { fontSize: 22, color: '#C4C9D2', marginTop: -2 },

  // 설정
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#EEF0F3',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  settingRowCol: {
    gap: 10,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#EEF0F3',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingLabel: { fontSize: 14, fontWeight: '500', color: '#111827' },
  settingSub: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },

  segment: {
    flexDirection: 'row',
    backgroundColor: '#EEF0F3',
    borderRadius: 10,
    padding: 3,
    gap: 3,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  segmentItemActive: { backgroundColor: '#FFFFFF' },
  segmentText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  segmentTextActive: { color: '#0B0B0F', fontWeight: '600' },

  // 브라우저 툴바
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  toolBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  toolBtnText: { fontSize: 18, color: '#111827' },
  toolBtnSmall: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  toolHost: { flex: 1, fontSize: 13, color: '#6B7280', textAlign: 'center' },

  // 에러
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#FECACA',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  errorBannerText: { fontSize: 12, color: '#B91C1C' },
  errorView: {
    flex: 1,
    justifyContent: 'center',
    padding: 32,
    gap: 12,
    backgroundColor: '#FFFFFF',
  },
  errorTitle: { fontSize: 18, fontWeight: '700', color: '#0B0B0F' },
  errorDesc: { fontSize: 13, color: '#6B7280', marginBottom: 8 },
});
