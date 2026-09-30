import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { PREVIEW_TEXT } from './constants';
import type { AgentCreatorProps, AgentPreferences, AgentVoice } from './types';

/** Browser speech is read behind a platform boundary; native speech belongs to the host. */
export function useAgentVoices({
  voices: suppliedVoices,
  onPreviewVoice,
}: Pick<AgentCreatorProps, 'voices' | 'onPreviewVoice'>) {
  const [voices, setVoices] = useState<AgentVoice[]>([]);
  const [browserVoices, setBrowserVoices] = useState<SpeechSynthesisVoice[]>(
    [],
  );
  const [canPreview, setCanPreview] = useState(false);
  useEffect(() => {
    if (
      Platform.OS !== 'web' ||
      typeof window === 'undefined' ||
      !('speechSynthesis' in window)
    )
      return;
    const synth = window.speechSynthesis;
    const refresh = () => {
      const local = synth.getVoices().filter((voice) => voice.localService);
      setBrowserVoices(local);
      setVoices(
        local.map((voice) => ({
          id: voice.voiceURI,
          name: voice.name,
          language: voice.lang,
        })),
      );
      setCanPreview(true);
    };
    refresh();
    synth.addEventListener('voiceschanged', refresh);
    return () => {
      synth.removeEventListener('voiceschanged', refresh);
      synth.cancel();
    };
  }, []);
  const preview = (preferences: AgentPreferences) => {
    if (onPreviewVoice) {
      onPreviewVoice(PREVIEW_TEXT[preferences.language], preferences);
      return;
    }
    if (!canPreview || !preferences.voice) return;
    const voice = browserVoices.find((voice) =>
      preferences.voice === 'alice'
        ? voice.name.toLowerCase() === 'alice'
        : voice.voiceURI === preferences.voice,
    );
    const utterance = new SpeechSynthesisUtterance(
      PREVIEW_TEXT[preferences.language],
    );
    if (voice) utterance.voice = voice;
    utterance.rate = preferences.speed;
    utterance.lang =
      preferences.language === 'auto'
        ? (voice?.lang ?? navigator.language)
        : preferences.language;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };
  return {
    voices: suppliedVoices ?? voices,
    canPreview: !!onPreviewVoice || canPreview,
    canSelect: suppliedVoices !== undefined || canPreview,
    preview,
  };
}
