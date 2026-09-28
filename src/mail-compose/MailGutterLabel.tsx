import React, { useContext } from 'react';

import { Text } from '../typography';
import { MailGutterContext } from './context';
import { MAIL_COMPOSE_GEOMETRY } from './shared';

/**
 * A row's gutter label at the header's shared width. Inside the header it also
 * renders an invisible, unconstrained copy whose layout reports the label's
 * natural width, so the gutter can grow to the widest label; the copy is hidden
 * from assistive technology and takes no touches. Outside a header it is the
 * fixed-width label it always was.
 */
export function MailGutterLabel({
  id,
  color,
  paddingTop,
  testID,
  children,
}: {
  id: string;
  color: string;
  paddingTop?: number;
  testID?: string;
  children: string;
}) {
  const gutter = useContext(MailGutterContext);
  const width = gutter?.width ?? MAIL_COMPOSE_GEOMETRY.labelWidth;
  return (
    <>
      <Text variant="body-regular" numberOfLines={1} style={{ width, color, paddingTop, flexShrink: 0 }} testID={testID}>
        {children}
      </Text>
      {gutter ? (
        <Text
          variant="body-regular"
          numberOfLines={1}
          aria-hidden
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          pointerEvents="none"
          onLayout={(event) => gutter.report(id, event.nativeEvent.layout.width)}
          style={{ position: 'absolute', left: 0, top: 0, opacity: 0 }}
        >
          {children}
        </Text>
      ) : null}
    </>
  );
}
