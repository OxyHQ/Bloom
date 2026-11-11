import { useEffect, useMemo, useRef, useState } from 'react';
import { useMessages } from '../locale/messages';
import { VectorStaticPortrait } from './VectorStaticPortrait';
import { AGENT_AVATAR_MESSAGES } from './messages';
import { useVectorAssetLoader } from './default-catalog';
import { loadVectorPortrait, peekVectorPortrait, vectorPortraitKey } from './vector-portrait';
import type { AgentAvatarProps } from './types';
import type { VectorFrame } from './vector-types';

export function VectorCharacterPortrait(props: AgentAvatarProps) {
  const { messages } = useMessages(AGENT_AVATAR_MESSAGES, props.locale);
  const key = useMemo(() => vectorPortraitKey(props.character), [props.character]);
  const [loaded, setLoaded] = useState<{ key: string; frame: VectorFrame }>();
  const catalog = useVectorAssetLoader(props.catalog);
  const latest = useRef(props.character);
  latest.current = props.character;
  const cached = peekVectorPortrait(key);
  useEffect(() => {
    if (cached) return;
    let active = true;
    void loadVectorPortrait(latest.current, catalog)
      .then((frame) => {
        if (active) setLoaded({ key, frame });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [key, cached, catalog]);
  const frame = cached ?? (loaded?.key === key ? loaded.frame : undefined);
  return <VectorStaticPortrait {...props} label={props.label ?? messages.label} frame={frame} />;
}
