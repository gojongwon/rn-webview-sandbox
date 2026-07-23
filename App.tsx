import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BrowserScreen } from './src/screens/BrowserScreen';
import { LauncherScreen } from './src/screens/LauncherScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { Settings } from './src/settings';
import { loadSettings, saveSettings } from './src/storage';

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
  // AsyncStorage에서 복원될 때까지 null (앱 재시작 후에도 설정 유지)
  const [settings, setSettingsState] = useState<Settings | null>(null);

  useEffect(() => {
    loadSettings().then(setSettingsState);
  }, []);

  const setSettings = (s: Settings) => {
    setSettingsState(s);
    saveSettings(s);
  };

  if (!settings) return null; // 복원 중 (수 ms)

  if (uri) {
    return (
      <BrowserScreen
        initialUri={uri}
        settings={settings}
        onClose={() => setUri(null)}
      />
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
    <LauncherScreen onGo={setUri} onOpenSettings={() => setShowSettings(true)} />
  );
}
