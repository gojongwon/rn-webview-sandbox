import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PRESETS, START_URL } from '../config';
import { ui } from '../theme';

export function LauncherScreen({
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
    <SafeAreaView style={ui.safe}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={ui.fill}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={ui.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={ui.titleRow}>
            <Text style={ui.title}>웹뷰 테스트</Text>
            <Pressable
              onPress={onOpenSettings}
              hitSlop={8}
              style={({ pressed }) => [ui.settingsBtn, pressed && ui.pressed]}
            >
              <Text style={ui.settingsBtnText}>설정</Text>
            </Pressable>
          </View>
          <Text style={ui.subtitle}>URL을 입력하거나 아래에서 선택하세요</Text>

          <TextInput
            style={[ui.input, focused && ui.inputFocused]}
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
            style={({ pressed }) => [ui.primary, pressed && ui.pressed]}
          >
            <Text style={ui.primaryText}>이동</Text>
          </Pressable>

          <Text style={ui.section}>자주 쓰는 주소</Text>

          {PRESETS.map((p) => (
            <Pressable
              key={p.url}
              onPress={() => onGo(p.url)}
              style={({ pressed }) => [ui.card, pressed && ui.cardPressed]}
            >
              <View style={[ui.badge, { backgroundColor: p.color + '22' }]}>
                <Text style={[ui.badgeText, { color: p.color }]}>{p.name}</Text>
              </View>
              <Text style={ui.host} numberOfLines={1}>
                {p.host}
              </Text>
              <Text style={ui.chevron}>›</Text>
            </Pressable>
          ))}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
