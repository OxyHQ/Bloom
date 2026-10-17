import { useTemplateCopy } from '../template-copy';
import { useEffect, useId, useRef, useState } from 'react';
import type { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { StyledView } from '../styles/styled-primitives';
import { TextFieldInput } from '../text-field';
import { Slider } from '../slider';
import { GlossArt } from './GlossArt';
import { hexToHsv, hsvToHex, type Hsv } from './shared';
import { useTrackEvents } from './use-track-events';
const clamp = (n: number) => Math.min(1, Math.max(0, n));

export function CustomColorPicker({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  const localizeBloomCopy = useTemplateCopy();
  const fieldRef = useRef<View>(null);
  const id = useId().replace(/:/g, '');
  const [hsv, setHsv] = useState<Hsv>(() => hexToHsv(value) ?? { h: 220, s: .85, v: .95 });
  const lastEmitted = useRef(value);
  const [draft, setDraft] = useState(value);
  const [width, setWidth] = useState(228);
  const frame = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (value === lastEmitted.current) return;
    const next = hexToHsv(value);
    if (next) { setHsv(next); setDraft(value); lastEmitted.current = value; }
  }, [value]);
  useEffect(() => () => { if (frame.current !== undefined) cancelAnimationFrame(frame.current); }, []);
  const emit = (next: Hsv) => {
    setHsv(next);
    if (frame.current !== undefined) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const hex = hsvToHex(next);
      lastEmitted.current = hex; setDraft(hex); onChange(hex);
    });
  };
  const field = Gesture.Pan().minDistance(0).runOnJS(true).onBegin(event => emit({ ...hsv, s: clamp(event.x / width), v: 1 - clamp(event.y / (width * 2 / 3)) }))
    .onUpdate(event => emit({ ...hsv, s: clamp(event.x / width), v: 1 - clamp(event.y / (width * 2 / 3)) }));
  const commit = () => {
    const parsed = hexToHsv(draft);
    if (parsed) emit(parsed); else setDraft(lastEmitted.current);
  };
  useTrackEvents(fieldRef, undefined, key => {
    const next = key === 'ArrowLeft' ? { ...hsv, s: clamp(hsv.s - .02) } : key === 'ArrowRight' ? { ...hsv, s: clamp(hsv.s + .02) } : key === 'ArrowUp' ? { ...hsv, v: clamp(hsv.v + .02) } : key === 'ArrowDown' ? { ...hsv, v: clamp(hsv.v - .02) } : null;
    if (!next) return false;
    emit(next); return true;
  });
  const hue = hsvToHex({ h: hsv.h, s: 1, v: 1 });
  return localizeBloomCopy(<StyledView className="flex flex-col gap-2.5">
    <GestureDetector gesture={field}><StyledView ref={fieldRef} tabIndex={0} onLayout={event => setWidth(event.nativeEvent.layout.width)}
      role="slider" accessibilityLabel="Saturation and brightness" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(hsv.v * 100)} aria-valuetext={`saturation ${Math.round(hsv.s * 100)}%, brightness ${Math.round(hsv.v * 100)}%`}
      accessibilityActions={[{ name: 'increment', label: 'Increase brightness' }, { name: 'decrement', label: 'Decrease brightness' }]}
      onAccessibilityAction={event => emit({ ...hsv, v: clamp(hsv.v + (event.nativeEvent.actionName === 'increment' ? .02 : -.02)) })}
      className="relative aspect-[3/2] w-full overflow-hidden rounded-2xl">
      <Svg width="100%" height="100%" accessible={false}>
        <Defs><LinearGradient id={`${id}-sat`} x1="0" x2="1" y1="0" y2="0"><Stop offset="0" stopColor="#ffffff" /><Stop offset="1" stopColor={hue} /></LinearGradient><LinearGradient id={`${id}-value`} x1="0" x2="0" y1="0" y2="1"><Stop offset="0" stopColor="#000000" stopOpacity={0} /><Stop offset="1" stopColor="#000000" /></LinearGradient></Defs>
        <Rect width="100%" height="100%" fill={`url(#${id}-sat)`} /><Rect width="100%" height="100%" fill={`url(#${id}-value)`} />
      </Svg>
      <StyledView pointerEvents="none" style={{ position: 'absolute', left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, width: 16, height: 16, marginLeft: -8, marginTop: -8, borderRadius: 8, borderWidth: 2, borderColor: '#ffffff', backgroundColor: hsvToHex(hsv), boxShadow: '0 1px 3px rgba(0,0,0,.25)' }} />
    </StyledView></GestureDetector>
    <StyledView className="relative h-5 w-full justify-center">
      <Svg pointerEvents="none" width="100%" height={12} style={{ position: 'absolute' }} accessible={false}><Defs><LinearGradient id={`${id}-hue`} x1="0" x2="1" y1="0" y2="0">{['#ff0000','#ffff00','#00ff00','#00ffff','#0000ff','#ff00ff','#ff0000'].map((color, index) => <Stop key={index} offset={index / 6} stopColor={color} />)}</LinearGradient></Defs><Rect rx={6} width="100%" height={12} fill={`url(#${id}-hue)`} /></Svg>
      <Slider value={hsv.h} onValueChange={h => emit({ ...hsv, h: Math.min(h, 359.9) })} min={0} max={360} step={.1} showTooltip={false} accessibilityLabel="Hue" trackHeight={12} minimumTrackTintColor="transparent" maximumTrackTintColor="transparent" thumbSize={16} thumbTintColor={hue} />
    </StyledView>
    <StyledView className="flex flex-row items-center gap-2"><GlossArt center={hsvToHex(hsv)} edge={hsvToHex(hsv)} size={32} /><StyledView className="min-w-0 flex-1"><TextFieldInput label="Hex color" value={draft} onChangeText={setDraft} onBlur={commit} onSubmitEditing={commit} autoCapitalize="characters" autoCorrect={false} size="small" maxLength={7} /></StyledView></StyledView>
  </StyledView>);
}
