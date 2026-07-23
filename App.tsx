import { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BrowserScreen } from './src/screens/BrowserScreen';
import { LauncherScreen } from './src/screens/LauncherScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { DEFAULT_SETTINGS, Settings } from './src/settings';

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
