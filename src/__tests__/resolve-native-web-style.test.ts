import { resolveNativeWebStyle } from '../styles/resolve-native-web-style';
it('preserves nested RN overrides, axis spacing, logical edges and numeric text line height on DOM hosts', () => {
  expect(
    resolveNativeWebStyle([
      { paddingHorizontal: 8, paddingLeft: 4 },
      false,
      [{ paddingVertical: 16, lineHeight: 20, marginStart: 12 }],
    ]),
  ).toEqual({
    paddingLeft: 4,
    paddingRight: 8,
    paddingTop: 16,
    paddingBottom: 16,
    lineHeight: '20px',
    marginInlineStart: 12,
  });
});
it('preserves native transforms and font variant arrays without mutating caller styles', () => {
  const style = {
    transform: [{ translateX: 10 }, { scale: 0.99 }, { rotate: '20deg' }],
    fontVariant: ['tabular-nums'],
  } as const;
  expect(resolveNativeWebStyle(style)).toEqual({
    transform: 'translateX(10px) scale(0.99) rotate(20deg)',
    fontVariant: 'tabular-nums',
  });
  expect(style.transform[0]).toEqual({ translateX: 10 });
});
