import React, { memo, useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { Button } from '../button';
import { RiAddLine } from '../icons/remix/RiAddLine';
import { RiDeleteBinLine } from '../icons/remix/RiDeleteBinLine';
import {
  Select,
  SelectContent,
  SelectIcon,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectTrigger,
  SelectValue,
} from '../select';
import { TextFieldInput } from '../text-field';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { useMessages } from '../locale/messages';
import { CREATOR_STUDIO_MESSAGES } from './messages';
import { creditRoleOptions, resolveCreatorStudioPaint } from './shared';
import type { CreditsEditorLabels, CreditsEditorProps, CreatorOption, TrackCredit } from './types';

/**
 * `CreditsEditor`: who wrote, produced and performed a track.
 *
 *   heading  `body-medium` title + an empty-state line (`body-2-regular`
 *            text-secondary) while there are no credits
 *   rows     8 apart: role `Select` (200 wide) · name `TextFieldInput` (fills) ·
 *            a secondary delete icon button named "Remove credit <n>" (in English). Below 480px
 *            of its own width the role takes its own line over name + delete
 *   add      a secondary "Add credit" button with a plus glyph; the new row
 *            takes the first role and an empty name
 *
 * Controlled: every change calls `onCreditsChange` with the whole list.
 */

/** The English labels; the component reads the localised ones from `CREATOR_STUDIO_MESSAGES`. */
export const CREDITS_EDITOR_LABELS: CreditsEditorLabels = CREATOR_STUDIO_MESSAGES.en.credits;

const STACK_BELOW = 480;
let creditCounter = 0;

function CreditsEditorComponent({
  credits,
  onCreditsChange,
  roles: rolesProp,
  createId,
  disabled = false,
  labels: labelOverrides,
  style,
  testID,
}: CreditsEditorProps) {
  const { messages } = useMessages(CREATOR_STUDIO_MESSAGES);
  const theme = useTheme();
  const paint = useMemo(() => resolveCreatorStudioPaint(theme), [theme]);
  const labels = { ...messages.credits, ...labelOverrides };
  const localRoles = useMemo(() => creditRoleOptions(messages), [messages]);
  const roles = rolesProp ?? localRoles;
  const [width, setWidth] = useState(0);
  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const next = Math.round(event.nativeEvent.layout.width);
    setWidth((prev) => (prev === next ? prev : next));
  }, []);
  const stacked = width > 0 && width < STACK_BELOW;
  const createIdRef = useRef(createId);
  createIdRef.current = createId;

  const update = (id: string, patch: Partial<TrackCredit>) =>
    onCreditsChange(credits.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const remove = (id: string) => onCreditsChange(credits.filter((c) => c.id !== id));
  const add = () => {
    const id = createIdRef.current ? createIdRef.current() : `credit-${Date.now()}-${creditCounter++}`;
    onCreditsChange([...credits, { id, role: roles[0]?.value ?? '', name: '' }]);
  };

  return (
    <View testID={testID} onLayout={onLayout} style={[styles.root, style]}>
      <View style={styles.heading}>
        <Text variant="body-medium" role="heading" style={{ color: paint.text }}>
          {labels.title}
        </Text>
        {credits.length === 0 ? (
          <Text variant="body-2-regular" style={{ color: paint.textSecondary }}>
            {labels.empty}
          </Text>
        ) : null}
      </View>

      {credits.map((credit, index) => {
        const roleSelect = (
          <View style={stacked ? styles.roleStacked : styles.role}>
            <Select
              value={credit.role}
              onValueChange={(role) => update(credit.id, { role })}
              disabled={disabled}
            >
              <SelectTrigger
                label={messages.credits.field(labels.role, index + 1)}
                testID={testID ? `${testID}-role-${index}` : undefined}
              >
                <SelectValue placeholder={labels.role} />
                <SelectIcon />
              </SelectTrigger>
              <SelectContent<CreatorOption>
                label={labels.role}
                items={roles}
                renderItem={(item) => (
                  <SelectItem value={item.value} label={item.label}>
                    <SelectItemIndicator />
                    <SelectItemText>{item.label}</SelectItemText>
                  </SelectItem>
                )}
              />
            </Select>
          </View>
        );
        const nameAndRemove = (
          <View style={styles.nameRow}>
            <View style={styles.name}>
              <TextFieldInput
                label={messages.credits.field(labels.name, index + 1)}
                placeholder={labels.name}
                value={credit.name}
                onChangeText={(name) => update(credit.id, { name })}
                disabled={disabled}
                testID={testID ? `${testID}-name-${index}` : undefined}
              />
            </View>
            <Button

              size="md"
              iconOnly
              leadingIcon={RiDeleteBinLine}
              disabled={disabled}
              accessibilityLabel={labels.remove(index, credit.name)}
              onPress={() => remove(credit.id)}
              testID={testID ? `${testID}-remove-${index}` : undefined} tone="neutral" appearance="outline"
            />
          </View>
        );
        return (
          <View
            key={credit.id}
            testID={testID ? `${testID}-row-${index}` : undefined}
            style={stacked ? styles.rowStacked : styles.row}
          >
            {roleSelect}
            {nameAndRemove}
          </View>
        );
      })}

      <Button

        size="md"
        leadingIcon={RiAddLine}
        onPress={add}
        disabled={disabled}
        style={styles.add}
        testID={testID ? `${testID}-add` : undefined} tone="neutral" appearance="outline"
      >
        {labels.add}
      </Button>
    </View>
  );
}

export const CreditsEditor = memo(CreditsEditorComponent);
CreditsEditor.displayName = 'CreditsEditor';

const styles = StyleSheet.create({
  root: { width: '100%', gap: 8, minWidth: 0 },
  heading: { gap: 2, marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowStacked: { gap: 6 },
  role: { width: 200, flexShrink: 0 },
  roleStacked: { width: '100%' },
  nameRow: { flexGrow: 1, flexShrink: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 4 },
  name: { flex: 1, minWidth: 0 },
  add: { alignSelf: 'flex-start', marginTop: 4 },
});
