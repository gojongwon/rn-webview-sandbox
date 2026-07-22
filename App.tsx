import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

const START_URL = 'https://example.com';

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

export default function App() {
  return (
    <SafeAreaProvider>
      <Browser />
    </SafeAreaProvider>
  );
}

function Browser() {
  const [input, setInput] = useState(START_URL);
  const [focused, setFocused] = useState(false);
  const [uri, setUri] = useState<string | null>(null);

  const go = () => {
    setUri(/^https?:\/\//.test(input) ? input : `https://${input}`);
  };

  if (uri) {
    return (
      <SafeAreaView style={styles.fill} edges={['top', 'left', 'right']}>
        <StatusBar style="auto" />
        <WebView
          source={{ uri }}
          originWhitelist={['*']}
          startInLoadingState
          style={styles.fill}
        />
      </SafeAreaView>
    );
  }

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
          <Text style={styles.title}>웹뷰 테스트</Text>
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
              onPress={() => setUri(p.url)}
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

const styles = StyleSheet.create({
  fill: { flex: 1 },
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 14 },

  title: { fontSize: 28, fontWeight: '700', color: '#0B0B0F', letterSpacing: -0.5 },
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
});
