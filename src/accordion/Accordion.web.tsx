import { CollapsibleFrame } from '../collapsible/CollapsibleFrame.web';
import { useCollapsibleMotion } from '../collapsible/use-collapsible-motion';
import { BloomScope, useBloomAppearance } from '../appearance';
import type React from 'react';
import { memo, useContext, useState } from 'react';
import { Animated } from 'react-native';
import { RiArrowDownSLine } from '../icons/remix/RiArrowDownSLine';
import { resolveNativeWebStyle } from '../styles/resolve-native-web-style';
import { useInteractiveWebCss } from '../styles/interactive-web-css';
import { useTouchInput } from '../styles/pointer';
import { useTheme } from '../theme/use-theme';
import { DISABLED_OPACITY } from '../styles/tokens';
import { useSurfacePresence } from '../surface/use-surface-presence';
import { AccordionContext, AccordionItemContext } from './context';
import { resolveAccordionGeometry } from './geometry';
import { useAccordionState, useAccordionItem, useAccordionMotion } from './use-accordion';
import type {
  AccordionProps,
  AccordionItemProps,
  AccordionTriggerProps,
  AccordionContentProps,
} from './types';

const CSS = `@layer base {
.bloom-accordion-root,.bloom-accordion-item,.bloom-accordion-panel,.bloom-accordion-body { box-sizing:border-box; display:flex; flex-direction:column; flex-shrink:0; min-width:0; }
.bloom-accordion-item { border:0 solid var(--bloom-accordion-border); border-bottom-width:1px; }
.bloom-accordion-trigger { box-sizing:border-box; flex-shrink:0; min-width:0; min-height:var(--bloom-accordion-min-height,0px); display:flex; align-items:center; gap:var(--bloom-accordion-gap,8px); padding:var(--bloom-accordion-padding-y,12px) 4px; border:0; margin:0; background:transparent; color:var(--bloom-accordion-text); text-align:start; font-family:var(--bloom-font-sans); line-height:normal; font-size:var(--bloom-accordion-font-size,15px); font-weight:600; cursor:pointer; }
.bloom-accordion-trigger:disabled { cursor:default; }
.bloom-accordion-label { white-space:pre-wrap; overflow-wrap:break-word; flex-grow:1; flex-shrink:1; min-width:0; }
.bloom-accordion-panel { overflow:hidden; }
.bloom-accordion-body { padding:0 4px 12px; }
.bloom-accordion-body--xs { padding-bottom:8px; }
.bloom-accordion-body--sm { padding-bottom:10px; }
.bloom-accordion-body--lg { padding-bottom:14px; }
}`;
function useStyles() {
  useInteractiveWebCss('bloom-accordion', CSS);
}

export const Accordion = memo(function Accordion(props: AccordionProps) {
  useStyles();
  const state = useAccordionState(props);
  return (
    <AccordionContext.Provider value={state}>
      <BloomScope size={props.size}>
        <div
          className={['bloom-accordion-root', props.className].filter(Boolean).join(' ')}
          style={resolveNativeWebStyle(props.style)}
          data-testid={props.testID}
        >
          {props.children}
        </div>
      </BloomScope>
    </AccordionContext.Provider>
  );
});

export const AccordionItem = memo(function AccordionItem({
  value,
  disabled = false,
  children,
  style,
  className,
}: AccordionItemProps) {
  useStyles();
  const state = useAccordionItem(value, disabled);
  const theme = useTheme();
  const vars = { '--bloom-accordion-border': theme.colors.borderLight } as React.CSSProperties;
  return (
    <AccordionItemContext.Provider value={state}>
      <div
        className={['bloom-accordion-item', className].filter(Boolean).join(' ')}
        style={{ ...vars, ...resolveNativeWebStyle(style) }}
      >
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
});

export const AccordionTrigger = memo(function AccordionTrigger({
  children,
  icon,
  style,
  textStyle,
  className,
}: AccordionTriggerProps) {
  useStyles();
  const { size } = useBloomAppearance({}, { size: 'md', tone: 'neutral' });
  const geometry = resolveAccordionGeometry(size);
  const touch = useTouchInput();
  const theme = useTheme();
  const { toggle } = useContext(AccordionContext);
  const { value, isExpanded, disabled, triggerId, contentId } = useContext(AccordionItemContext);
  const progress = useAccordionMotion(isExpanded, 'trigger', false);
  const rotation = progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const vars = {
    '--bloom-accordion-text': theme.colors.text,
    '--bloom-accordion-font-size': `${geometry.fontSize}px`,
    '--bloom-accordion-padding-y': `${geometry.paddingVertical}px`,
    '--bloom-accordion-gap': `${geometry.gap}px`,
    '--bloom-accordion-min-height': `${touch ? 44 : 0}px`,
  } as React.CSSProperties;
  // Pressed (0.7) and disabled (0.5) dim through presence: a label can hold a
  // material badge, and an opacity on the trigger would be its backdrop root.
  const [pressed, setPressed] = useState(false);
  const dim = useSurfacePresence(disabled ? DISABLED_OPACITY : pressed ? 0.7 : 1);
  const release = () => setPressed(false);
  return (
    <button
      ref={dim.ref}
      onPointerDown={() => setPressed(true)}
      onPointerUp={release}
      onPointerLeave={release}
      onPointerCancel={release}
      type="button"
      id={triggerId}
      aria-expanded={isExpanded}
      aria-controls={contentId}
      disabled={disabled}
      className={['bloom-accordion-trigger', className].filter(Boolean).join(' ')}
      style={{ ...vars, ...(dim.style as React.CSSProperties), ...resolveNativeWebStyle(style) }}
      onClick={() => toggle(value)}
    >
      {icon}
      <span
        className="bloom-accordion-label"
        data-testid="accordion-trigger-label"
        style={resolveNativeWebStyle(textStyle)}
      >
        {children}
      </span>
      <Animated.View aria-hidden style={{ transform: [{ rotate: rotation }] }}>
        <RiArrowDownSLine size={geometry.chevronSize} fill={theme.colors.textSecondary} />
      </Animated.View>
    </button>
  );
});

export const AccordionContent = memo(function AccordionContent({
  children,
  style,
  className,
  contentClassName,
}: AccordionContentProps) {
  useStyles();
  const { size } = useBloomAppearance({}, { size: 'md', tone: 'neutral' });
  const { isExpanded, triggerId, contentId } = useContext(AccordionItemContext);
  const { transition } = useContext(AccordionContext);
  const motion = useCollapsibleMotion(isExpanded, transition);
  return (
    <CollapsibleFrame
      open={isExpanded}
      {...motion}
      nativeID={contentId}
      region
      labelledBy={triggerId}
      returnFocusId={triggerId}
      className={['bloom-accordion-panel', className].filter(Boolean).join(' ')}
      contentClassName={['bloom-accordion-body', `bloom-accordion-body--${size}`, contentClassName]
        .filter(Boolean)
        .join(' ')}
      style={style}
    >
      {children}
    </CollapsibleFrame>
  );
});
