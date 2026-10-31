import { memo } from 'react';

import { ButtonGroup, ButtonGroupItem } from '../button-group';
import { useIsRtl } from '../hooks/use-is-rtl';
import { RiArrowLeftSLine } from '../icons/remix/RiArrowLeftSLine';
import { RiArrowRightSLine } from '../icons/remix/RiArrowRightSLine';
import { matchesChord, parseChord, type Chord } from '../kbd/chord';
import { useWindowKeys } from '../kbd/use-window-keys';
import { useCommonMessages } from '../locale/common-messages';
import type { ScreenHostValue } from '../screen/context';

type History = NonNullable<ScreenHostValue['navigation']>;

const BACK_KEY = parseChord('Mod+[') as Chord;
const FORWARD_KEY = parseChord('Mod+]') as Chord;

/**
 * A window toolbar's back and forward: ONE group, as a Mac's toolbar draws
 * them (Finder, System Settings), never a lone back capsule. Each item is
 * disabled while its direction has nowhere to go, and `Mod+[` / `Mod+]` move
 * through the same history while the screen is in front. A menu declaring the
 * same chords hears them first (`kbd/window-keys`), so an application's Go
 * menu keeps them.
 */
export const PageHeaderHistory = memo(function PageHeaderHistory({
  navigation,
  active,
  backLabel,
  testID,
}: {
  navigation: History;
  /** Whether its screen is in front: only then do the keys move it. */
  active: boolean;
  backLabel: string;
  testID?: string;
}) {
  const common = useCommonMessages();
  const rtl = useIsRtl();
  useWindowKeys(
    (event) => {
      if (matchesChord(BACK_KEY, event)) {
        if (!navigation.canGoBack) return false;
        navigation.back();
        return true;
      }
      if (matchesChord(FORWARD_KEY, event)) {
        if (!navigation.canGoForward) return false;
        navigation.forward();
        return true;
      }
      return false;
    },
    { enabled: active },
  );
  return (
    <ButtonGroup accessibilityLabel={common.backAndForward} testID={testID}>
      <ButtonGroupItem
        iconOnly
        leadingIcon={rtl ? RiArrowRightSLine : RiArrowLeftSLine}
        accessibilityLabel={backLabel}
        disabled={!navigation.canGoBack}
        onPress={navigation.back}
        testID={testID ? `${testID}-back` : undefined}
      />
      <ButtonGroupItem
        iconOnly
        leadingIcon={rtl ? RiArrowLeftSLine : RiArrowRightSLine}
        accessibilityLabel={common.forward}
        disabled={!navigation.canGoForward}
        onPress={navigation.forward}
        testID={testID ? `${testID}-forward` : undefined}
      />
    </ButtonGroup>
  );
});
