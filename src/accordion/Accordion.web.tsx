import { CollapsibleFrame } from '../collapsible/CollapsibleFrame.web';
import { useCollapsibleMotion } from '../collapsible/use-collapsible-motion';
import React, { memo, useContext } from 'react';
import { Animated } from 'react-native';
import { RiArrowDownSLine } from '../icons/remix/RiArrowDownSLine';
import { resolveNativeWebStyle } from '../styles/resolve-native-web-style';
import { useInteractiveWebCss } from '../styles/interactive-web-css';
import { useTheme } from '../theme/use-theme';
import { AccordionContext, AccordionItemContext } from './context';
import { useAccordionState, useAccordionItem, useAccordionMotion } from './use-accordion';
import type { AccordionProps, AccordionItemProps, AccordionTriggerProps, AccordionContentProps } from './types';

const CSS = `@layer base {
.bloom-accordion-root,.bloom-accordion-item,.bloom-accordion-panel,.bloom-accordion-body { box-sizing:border-box; display:flex; flex-direction:column; flex-shrink:0; min-width:0; }
.bloom-accordion-item { border:0 solid var(--bloom-accordion-border); border-bottom-width:1px; }
.bloom-accordion-trigger { box-sizing:border-box; flex-shrink:0; min-width:0; display:flex; align-items:center; gap:8px; padding:12px 4px; border:0; margin:0; background:transparent; color:var(--bloom-accordion-text); text-align:start; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; line-height:normal; font-size:15px; font-weight:600; cursor:pointer; }
.bloom-accordion-trigger:active:not(:disabled) { opacity:.7; }
.bloom-accordion-trigger:disabled { opacity:.5; cursor:default; }
.bloom-accordion-label { white-space:pre-wrap; overflow-wrap:break-word; flex-grow:1; flex-shrink:1; min-width:0; }
.bloom-accordion-panel { overflow:hidden; }
.bloom-accordion-body { padding:0 4px 12px; }
}`;
function useStyles() { useInteractiveWebCss('bloom-accordion', CSS); }

export const Accordion = memo(function Accordion(props: AccordionProps) {
  useStyles();
  const state = useAccordionState(props);
  return <AccordionContext.Provider value={state}>
    <div className={['bloom-accordion-root', props.className].filter(Boolean).join(' ')} style={resolveNativeWebStyle(props.style)} data-testid={props.testID}>{props.children}</div>
  </AccordionContext.Provider>;
});

export const AccordionItem = memo(function AccordionItem({ value, disabled = false, children, style, className }: AccordionItemProps) {
  useStyles();
  const state = useAccordionItem(value, disabled);
  const theme = useTheme();
  const vars = { '--bloom-accordion-border': theme.colors.borderLight } as React.CSSProperties;
  return <AccordionItemContext.Provider value={state}>
    <div className={['bloom-accordion-item', className].filter(Boolean).join(' ')} style={{ ...vars, ...resolveNativeWebStyle(style) }}>{children}</div>
  </AccordionItemContext.Provider>;
});

export const AccordionTrigger = memo(function AccordionTrigger({ children, icon, style, textStyle, className }: AccordionTriggerProps) {
  useStyles();
  const theme = useTheme();
  const { toggle } = useContext(AccordionContext);
  const { value, isExpanded, disabled, triggerId, contentId } = useContext(AccordionItemContext);
  const progress = useAccordionMotion(isExpanded, 'trigger', false);
  const rotation = progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const vars = { '--bloom-accordion-text': theme.colors.text } as React.CSSProperties;
  return <button type="button" id={triggerId} aria-expanded={isExpanded} aria-controls={contentId} disabled={disabled}
    className={['bloom-accordion-trigger', className].filter(Boolean).join(' ')} style={{ ...vars, ...resolveNativeWebStyle(style) }}
    onClick={() => toggle(value)}>
    {icon}
    <span className="bloom-accordion-label" data-testid="accordion-trigger-label" style={resolveNativeWebStyle(textStyle)}>{children}</span>
    <Animated.View aria-hidden style={{ transform: [{ rotate: rotation }] }}><RiArrowDownSLine size="sm" fill={theme.colors.textSecondary} /></Animated.View>
  </button>;
});

export const AccordionContent = memo(function AccordionContent({ children, style, className, contentClassName }: AccordionContentProps) {
  useStyles();
  const { isExpanded, triggerId, contentId } = useContext(AccordionItemContext);
  const { transition } = useContext(AccordionContext);
  const motion = useCollapsibleMotion(isExpanded, transition);
  return <CollapsibleFrame open={isExpanded} {...motion} nativeID={contentId} region labelledBy={triggerId} returnFocusId={triggerId}
    className={['bloom-accordion-panel',className].filter(Boolean).join(' ')} contentClassName={['bloom-accordion-body',contentClassName].filter(Boolean).join(' ')} style={style}>{children}</CollapsibleFrame>;
});
