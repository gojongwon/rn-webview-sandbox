import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { BackHandler, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SegmentRow, SwitchRow } from '../components';
import { CUSTOM_UA_SUFFIX } from '../config';
import { POPUP_OPTIONS, Settings } from '../settings';
import { ui } from '../theme';

export function SettingsScreen({
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
    <SafeAreaView style={ui.safe}>
      <StatusBar style="dark" />

      <View style={ui.settingsHeader}>
        <Pressable onPress={onBack} hitSlop={12} style={ui.toolBtn}>
          <Text style={ui.backText}>‹</Text>
        </Pressable>
        <Text style={ui.settingsTitle}>설정</Text>
        <View style={ui.toolBtn} />
      </View>

      <ScrollView contentContainerStyle={ui.scroll}>
        <Text style={ui.section}>공통</Text>

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
        <SwitchRow
          label="화면 꺼짐 방지"
          sub="측정 등 장시간 화면 유지 (웹에서 screen.keepAwake로 제어 가능)"
          value={settings.keepAwake}
          onChange={(v) => set('keepAwake', v)}
        />

        <Text style={ui.section}>iOS</Text>

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

        <Text style={ui.section}>Android</Text>

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
