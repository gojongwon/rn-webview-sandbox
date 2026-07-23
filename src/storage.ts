import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_SETTINGS, Settings } from './settings';

const KEY = 'sandbox.settings.v1';

// 저장된 설정과 기본값 병합 (새 설정 키가 추가돼도 안전)
export async function loadSettings(): Promise<Settings> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    // 파싱 실패 시 기본값
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: Settings): void {
  AsyncStorage.setItem(KEY, JSON.stringify(settings)).catch(() => {});
}
