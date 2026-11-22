import { useEffect, useRef, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { useProjectBoardPlatform } from './context';
/** Source's 200ms hover delay, composed on Bloom's existing tooltip surface. */
export function BoardTooltip({ label, children }: { label: string; children: ReactNode }) {
  const { Tooltip, TooltipTrigger, TooltipContent } = useProjectBoardPlatform();
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const leave = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setVisible(false);
  };
  return (
    <Tooltip visible={visible} onVisibleChange={setVisible} position="bottom">
      <TooltipTrigger>
        <View
          onPointerEnter={() => {
            timer.current = setTimeout(() => setVisible(true), 200);
          }}
          onPointerLeave={leave}
        >
          {children}
        </View>
      </TooltipTrigger>
      <TooltipContent label={label}>{label}</TooltipContent>
    </Tooltip>
  );
}
