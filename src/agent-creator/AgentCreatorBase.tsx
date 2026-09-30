import { Platform } from 'react-native';
import { AgentAvatar, type AvatarConfig } from '../agent-avatar';
import { CloseButton } from '../button/CloseButton';
import { useDirectionProps } from '../hooks/use-is-rtl';
import { StyledPressable, StyledView } from '../styles/styled-primitives';
import { TextFieldInput } from '../text-field';
import { Textarea } from '../textarea';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { AgentPreferencesPanel } from './AgentPreferencesPanel';
import { CustomColorPicker } from './CustomColorPicker';
import { EmotionPicker } from './EmotionPicker';
import { GlossArt } from './GlossArt';
import { ScrollSurface } from './ScrollSurface';
import { ShapeArc } from './ShapeArc';
import { AVATAR_COLORS } from './constants';
import {
  AgentCreatorCopyContext,
  useAgentCreatorBindings,
  useAgentCreatorMessages,
} from './context';
import { avatarHex, hexAppearance } from './shared';
import type { AgentCreatorProps } from './types';

/** Controlled creator block; saving and the surrounding panel belong to the host. */
export function AgentCreatorBase(props: AgentCreatorProps) {
  const directionProps = useDirectionProps();
  const messages = useAgentCreatorMessages(props);
  const { agent, onChange, onClose, className, style } = props;
  const { colors } = useTheme();
  const { Popover, PopoverTrigger, PopoverContent } = useAgentCreatorBindings();
  const c = agent.avatar;
  const appearance = (patch: Partial<AvatarConfig>) =>
    onChange({ ...agent, avatar: { ...c, ...patch, lookAt: 'wander' } });
  return (
    <AgentCreatorCopyContext.Provider
      value={{ locale: props.locale, labels: props.labels }}
    >
      <StyledView
        {...directionProps}
        accessibilityLabel={messages.editor}
        className={
          className ??
          'flex h-full min-h-0 flex-col bg-background-full ps-1 pe-2'
        }
        style={[
          {
            flex: 1,
            minHeight: 0,
            paddingStart: 4,
            paddingEnd: 8,
            backgroundColor: colors.background,
          },
          style,
        ]}
      >
        <StyledView
          className="relative flex h-8 shrink-0 items-start justify-center pt-4"
          style={{ flexDirection: 'row' }}
        >
          <Text
            variant="body-medium"
            className="max-w-[260px] truncate text-body-medium text-text-primary"
            numberOfLines={1}
            style={{ maxWidth: 260, alignSelf: 'center' }}
          >
            {agent.name || messages.newBot}
          </Text>
          {onClose && (
            <CloseButton
              size="xs"
              accessibilityLabel={messages.closeEditor}
              className="absolute end-0 top-3.5 text-foreground-icon-tertiary"
              style={{ position: 'absolute', end: 0, top: 14 }}
              onPress={onClose}
            />
          )}
        </StyledView>
        <ScrollSurface
          className="flex-1"
          contentClassName="pb-4"
          surface="full"
          label={messages.details}
          fadeBottom
        >
          <StyledView className="relative h-[360px] overflow-hidden">
            <StyledView
              pointerEvents="box-none"
              className="pointer-events-none absolute left-1/2 top-[30px] z-10 -translate-x-1/2"
              style={{
                position: 'absolute',
                left: '50%',
                top: 30,
                transform:
                  Platform.OS === 'web' ? undefined : [{ translateX: -134 }],
                zIndex: 10,
              }}
            >
              <EmotionPicker
                key={agent.id}
                config={c}
                onChange={(eyes) => appearance({ eyes })}
              />
            </StyledView>
            <StyledView
              pointerEvents="none"
              className="pointer-events-none absolute left-1/2 top-[83px] -translate-x-1/2"
              style={{
                position: 'absolute',
                left: '50%',
                top: 83,
                transform:
                  Platform.OS === 'web' ? undefined : [{ translateX: -81 }],
              }}
            >
              <AgentAvatar
                config={{ ...c, lookAt: 'wander' }}
                size={162}
                label={messages.livePreview(agent.name || messages.newAgent)}
              />
            </StyledView>
            <StyledView
              pointerEvents="box-none"
              className="pointer-events-none absolute inset-x-0 bottom-0"
              style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}
            >
              <ShapeArc
                key={agent.id}
                config={c}
                onChange={(foldShape) => appearance({ foldShape })}
              />
            </StyledView>
          </StyledView>
          <StyledView className="mt-[15px] flex flex-row justify-center">
            <StyledView
              role="group"
              accessibilityLabel={messages.color}
              className="flex h-[38px] shrink-0 items-center gap-1 rounded-full border border-border-button-default bg-background-primary-default p-[5px] shadow-xs flex-row"
              style={{
                backgroundColor: colors.card,
                borderColor: colors.border,
                boxShadow: '0 1px 2px rgba(0,0,0,.05)',
              }}
            >
              {AVATAR_COLORS.map(([hue, saturation, name, center, edge]) => {
                const active =
                  c.hue === hue &&
                  c.saturation === saturation &&
                  c.lightness === undefined;
                return (
                  <StyledPressable
                    key={name}
                    accessibilityRole="button"
                    accessibilityLabel={messages.avatarColorLabel(
                      messages.colors[name],
                    )}
                    accessibilityState={{ selected: active }}
                    aria-pressed={active}
                    onPress={() =>
                      appearance({
                        hue,
                        saturation,
                        lightness: undefined,
                        lightEyes: false,
                      })
                    }
                    className="relative shrink-0 cursor-pointer overflow-hidden rounded-full transition-transform duration-150 ease-out hover:scale-110 outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring focus-visible:ring-offset-2 size-[26px]"
                  >
                    <GlossArt center={center} edge={edge} active={active} />
                  </StyledPressable>
                );
              })}
              <Popover>
                <PopoverTrigger asChild label={messages.customColor}>
                  <StyledPressable className="relative size-[26px] shrink-0 overflow-hidden rounded-full">
                    <GlossArt rainbow />
                  </StyledPressable>
                </PopoverTrigger>
                <PopoverContent
                  label={messages.customColor}
                  align="end"
                  minWidth={248}
                  maxWidth={248}
                  className="w-[248px] rounded-3xl p-2.5"
                >
                  <CustomColorPicker
                    value={avatarHex(c)}
                    onChange={(hex) => {
                      const next = hexAppearance(hex);
                      if (next) appearance(next);
                    }}
                  />
                </PopoverContent>
              </Popover>
            </StyledView>
          </StyledView>
          <StyledView
            className="mt-[15px] overflow-hidden rounded-2xl bg-background-secondary-default ps-3"
            style={{ backgroundColor: colors.backgroundSecondary }}
          >
            <StyledView
              className="grid h-[52px] grid-cols-[96px_minmax(0,1fr)] items-center border-b border-border-button-default dark:border-border-button-default/35 pe-2.5 flex-row"
              style={{
                flexDirection: 'row',
                alignContent: 'stretch',
                borderColor: colors.border,
              }}
            >
              <Text
                variant="body-regular"
                className="text-body-regular text-text-primary"
                style={{ width: 96 }}
              >
                {messages.name}
              </Text>
              <StyledView className="min-w-0 flex-1">
                <TextFieldInput
                  label={messages.nameInput}
                  size="sm"
                  maxLength={48}
                  value={agent.name}
                  onChangeText={(name) => onChange({ ...agent, name })}
                  placeholder={'Michael Scott' /* i18n-exempt: original example person’s proper name */}
                />
              </StyledView>
            </StyledView>
            <StyledView
              className="grid h-[52px] grid-cols-[96px_minmax(0,1fr)] items-center border-b border-border-button-default dark:border-border-button-default/35 pe-2.5 flex-row"
              style={{
                flexDirection: 'row',
                alignContent: 'stretch',
                borderColor: colors.border,
              }}
            >
              <Text
                variant="body-regular"
                className="text-body-regular text-text-primary"
                style={{ width: 96 }}
              >
                {messages.label}
              </Text>
              <StyledView className="min-w-0 flex-1">
                <TextFieldInput
                  label={messages.labelInput}
                  size="sm"
                  maxLength={60}
                  value={agent.label}
                  onChangeText={(label) => onChange({ ...agent, label })}
                  placeholder={messages.labelPlaceholder}
                />
              </StyledView>
            </StyledView>
            <StyledView
              className="grid h-[82px] grid-cols-[96px_minmax(0,1fr)] items-start py-2.5 pe-2.5 flex-row"
              style={{ flexDirection: 'row' }}
            >
              <Text
                variant="body-regular"
                className="pt-1 text-body-regular text-text-primary"
                style={{ width: 96, paddingTop: 4 }}
              >
                {messages.description}
              </Text>
              <StyledView className="min-w-0 flex-1">
                <Textarea
                  accessibilityLabel={messages.descriptionInput}
                  size="sm"
                  rows={2}
                  resize="none"
                  maxLength={500}
                  fieldStyle={{ height: 62 }}
                  style={{ height: 62 }}
                  value={agent.description}
                  onChangeText={(description) =>
                    onChange({ ...agent, description })
                  }
                  placeholder={messages.descriptionPlaceholder}
                />
              </StyledView>
            </StyledView>
          </StyledView>
          <AgentPreferencesPanel {...props} />
        </ScrollSurface>
      </StyledView>
    </AgentCreatorCopyContext.Provider>
  );
}
