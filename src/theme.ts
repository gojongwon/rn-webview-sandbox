import { StyleSheet } from 'react-native';

// 화면 공통 스타일 (기존 App.tsx 스타일 이관)
export const ui = StyleSheet.create({
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

  // 설정 행
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

  toolBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },

  // 브라우저: 우하단 브릿지 로그 버튼
  floatingLog: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(17,17,17,0.55)',
    paddingHorizontal: 14,
    paddingVertical: 9,
    zIndex: 10,
    elevation: 4,
  },
  floatingLogText: { fontSize: 12, color: '#FFFFFF', fontWeight: '600' },

  // 브릿지 로그 패널
  logPanel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '45%',
    backgroundColor: '#0B0B0F',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    zIndex: 20,
    elevation: 8,
    paddingBottom: 12,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  logTitle: { fontSize: 13, fontWeight: '600', color: '#FFFFFF' },
  logAction: { fontSize: 12, color: '#9CA3AF', paddingHorizontal: 8, paddingVertical: 4 },
  logRow: { paddingHorizontal: 16, paddingVertical: 5 },
  logMeta: { fontSize: 11, color: '#9CA3AF', fontVariant: ['tabular-nums'] },
  logPreview: { fontSize: 12, color: '#E5E7EB' },
  logEmpty: { fontSize: 12, color: '#6B7280', padding: 16 },

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
