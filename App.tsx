import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Button,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

const START_URL = 'https://example.com';

export default function App() {
  return (
    <SafeAreaProvider>
      <Browser />
    </SafeAreaProvider>
  );
}

function Browser() {
  const webRef = useRef<WebView>(null);
  const [input, setInput] = useState(START_URL);
  const [uri, setUri] = useState(START_URL);

  const go = () => {
    const url = /^https?:\/\//.test(input) ? input : `https://${input}`;
    setInput(url);
    setUri(url);
  };

  return (
    <SafeAreaView style={styles.fill} edges={['top', 'left', 'right']}>
      <StatusBar style="auto" />
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.bar}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={go}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            placeholder="https://..."
            returnKeyType="go"
          />
          <Button title="이동" onPress={go} />
        </View>
        <View style={styles.navRow}>
          <Button title="←" onPress={() => webRef.current?.goBack()} />
          <Button title="↻" onPress={() => webRef.current?.reload()} />
        </View>
        <WebView
          ref={webRef}
          source={{ uri }}
          originWhitelist={['*']}
          startInLoadingState
          renderLoading={() => (
            <ActivityIndicator style={StyleSheet.absoluteFill} size="large" />
          )}
          style={styles.fill}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  bar: { flexDirection: 'row', alignItems: 'center', padding: 8, gap: 8 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  navRow: { flexDirection: 'row', gap: 16, paddingHorizontal: 8, paddingBottom: 4 },
});
