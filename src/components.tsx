import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import type { BridgeLogEntry } from './bridge';
import { ui } from './theme';

export function SwitchRow({
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
    <View style={ui.settingRow}>
      <View style={ui.fill}>
        <Text style={ui.settingLabel}>{label}</Text>
        {sub ? <Text style={ui.settingSub}>{sub}</Text> : null}
      </View>
      <Switch value={value} onValueChange={onChange} />
    </View>
  );
}

export function SegmentRow<T extends string>({
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
    <View style={ui.settingRowCol}>
      <Text style={ui.settingLabel}>{label}</Text>
      <View style={ui.segment}>
        {options.map((o) => {
          const active = o.value === value;
          return (
            <Pressable
              key={o.value}
              onPress={() => onSelect(o.value)}
              style={[ui.segmentItem, active && ui.segmentItemActive]}
            >
              <Text style={[ui.segmentText, active && ui.segmentTextActive]}>
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function ErrorView({
  code,
  desc,
  onRetry,
}: {
  code: number;
  desc: string;
  onRetry: () => void;
}) {
  return (
    <View style={ui.errorView}>
      <Text style={ui.errorTitle}>페이지를 불러올 수 없어요</Text>
      <Text style={ui.errorDesc}>
        {desc} (code {code})
      </Text>
      <Pressable onPress={onRetry} style={ui.primary}>
        <Text style={ui.primaryText}>다시 시도</Text>
      </Pressable>
    </View>
  );
}

export function BridgeLogPanel({
  logs,
  onClear,
  onClose,
}: {
  logs: BridgeLogEntry[];
  onClear: () => void;
  onClose: () => void;
}) {
  return (
    <View style={ui.logPanel}>
      <View style={ui.logHeader}>
        <Text style={ui.logTitle}>브릿지 로그 ({logs.length})</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable onPress={onClear} hitSlop={6}>
            <Text style={ui.logAction}>비우기</Text>
          </Pressable>
          <Pressable onPress={onClose} hitSlop={6}>
            <Text style={ui.logAction}>닫기</Text>
          </Pressable>
        </View>
      </View>
      <ScrollView>
        {logs.length === 0 ? (
          <Text style={ui.logEmpty}>
            아직 메시지가 없어요. 웹에서 window.AppBridge.send(...)를 호출해보세요.
          </Text>
        ) : (
          [...logs].reverse().map((l, i) => (
            <View key={`${l.at}-${i}`} style={ui.logRow}>
              <Text style={ui.logMeta}>
                {new Date(l.at).toLocaleTimeString()} {l.dir} · {l.type}
              </Text>
              {l.preview ? <Text style={ui.logPreview}>{l.preview}</Text> : null}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
