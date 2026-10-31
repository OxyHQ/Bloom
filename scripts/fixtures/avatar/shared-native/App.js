import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { NativeAvatar, isRuntimeCompatible } from './node_modules/@oxy.so/bloom/src/agent-avatar/native';
import { probeColdFrame } from './NativeAudit';
import { bridge } from './node_modules/@oxy.so/bloom/src/agent-avatar/native/bridge';
const character = {
  preset: 'blue_beret',
  shape: 'six_lobed_flower',
  eyes: 'oval',
  eyewear: 'none',
  accessory: 'felipe_beret',
  paint: { color: 'blue' },
  authored: true,
};
export default function App() {
  const scroller = useRef(null);
  const [characters, setCharacters] = useState(null);
  const [count, setCount] = useState(8),
    [paused, setPaused] = useState(false),
    [workingKey, setWork] = useState(undefined),
    [reactionKey, setReaction] = useState(undefined),
    [ready, setReady] = useState(0),
    [error, setError] = useState(''),
    [size, setSize] = useState(112);
  useEffect(() => {
    let stopped = false,
      last;
    const tick = async () => {
      while (!stopped) {
        try {
          const command = await (await fetch('http://127.0.0.1:8099/control')).json();
          if (command.id && command.id !== last) {
            last = command.id;
            const api = global.__bloomNativeAdapterLab;
            if (command.characters !== undefined) api.setCharacters(command.characters);
            if (command.work !== undefined) api.setWork(command.work);
            if (command.reaction !== undefined) api.setReaction(command.reaction);
            if (command.scroll) api.scroll(command.scroll);
            if (command.count !== undefined) api.setCount(command.count);
            if (command.paused !== undefined) api.setPaused(command.paused);
            await new Promise((r) => setTimeout(r, command.warmup ?? 5000));
            const before = { time: performance.now(), ...api.stats() };
            await new Promise((r) => setTimeout(r, command.duration ?? 5000));
            const after = { time: performance.now(), ...api.stats() };
            const snapshot = command.snapshot ? await global.__captureNativeAvatar?.() : undefined;
            const coldFrame = command.coldFrame
              ? await probeColdFrame('http://127.0.0.1:6007/bloom-character/runtime.mjs')
              : undefined;
            const compatible = await isRuntimeCompatible(
              'http://127.0.0.1:6007/bloom-character/runtime.mjs',
            );
            await fetch('http://127.0.0.1:8099/result', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: command.id,
                command,
                before,
                after,
                snapshot,
                coldFrame,
                compatible,
              }),
            });
          }
        } catch (error) {
          console.log('BLOOM_NATIVE_AUDIT_ERROR', String(error));
        }
        await new Promise((r) => setTimeout(r, 500));
      }
    };
    tick();
    return () => {
      stopped = true;
    };
  }, []);
  global.__bloomNativeAdapterLab = {
    stats: () => bridge.stats(),
    setCount,
    setPaused,
    setWork,
    setReaction,
    setSize,
    setCharacters,
    scroll: (where) =>
      where === 'end'
        ? scroller.current?.scrollToEnd({ animated: false })
        : scroller.current?.scrollTo({ y: 0, animated: false }),
  };
  const value = {
    character,
    reduced: false,
    paused,
    interactive: true,
    workingKey,
    reactionKey,
    workingCycles: 100,
  };
  return (
    <ScrollView
      ref={scroller}
      style={{ flex: 1, backgroundColor: '#ece8f0' }}
      contentContainerStyle={{ paddingTop: 48, paddingBottom: 80 }}
    >
      <Text style={{ textAlign: 'center', fontSize: 17 }}>
        {ready} native presentations ready {error}
      </Text>
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12, padding: 12 }}>
        <Pressable onPress={() => setPaused(!paused)}>
          <Text>{paused ? 'Resume' : 'Pause'}</Text>
        </Pressable>
        <Pressable onPress={() => setWork((x) => (x ?? 0) + 1)}>
          <Text>Work</Text>
        </Pressable>
        <Pressable onPress={() => setReaction((x) => (x ?? 0) + 1)}>
          <Text>React</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            setCount(count ? 0 : 12);
            setReady(0);
          }}
        >
          <Text>Mount</Text>
        </Pressable>
        <Pressable onPress={() => setSize(size === 112 ? 64 : 112)}>
          <Text>Resize</Text>
        </Pressable>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
        {Array.from({ length: count }, (_, i) => (
          <View
            key={i}
            style={{
              width: size,
              height: size + 24,
              borderRadius: 20,
              overflow: 'hidden',
              backgroundColor: i % 2 ? '#202034' : '#fff',
              transform: [],
            }}
          >
            <View style={{ width: size, height: size }}>
              <NativeAvatar
                runtimeUrl="http://127.0.0.1:6007/bloom-character/runtime.mjs"
                value={{
                  ...value,
                  character: characters?.[i % characters.length] ?? {
                    ...character,
                    paint: {
                      bodyColor: '#' + (0x46719b + i * 10007).toString(16).padStart(6, '0'),
                    },
                  },
                }}
                onReady={() => setReady((x) => x + 1)}
                onError={() => {
                  setError('error');
                  console.log('BLOOM_NATIVE_ADAPTER_ERROR', i);
                }}
                observeSnapshot={
                  i === 0
                    ? (capture) => {
                        global.__captureNativeAvatar = capture;
                      }
                    : undefined
                }
              />
            </View>
            <Text style={{ textAlign: 'center', color: i % 2 ? '#fff' : '#222' }}>{i + 1}</Text>
          </View>
        ))}
      </View>
      <View style={{ height: 1400 }} />
      <Text>Scroll here to suspend all offscreen avatar cells.</Text>
    </ScrollView>
  );
}
