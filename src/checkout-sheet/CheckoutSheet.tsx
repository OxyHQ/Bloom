import { useCallback, useRef, type ReactNode } from 'react';
import { View } from 'react-native';
import { PaymentStatusBlock } from '../payment-status';
import { sizes as iconSizes } from '../icons/shared';
import { PAYMENT_METHOD_KIND_ICON } from '../payment-method';
import { RiCheckLine } from '../icons/remix/RiCheckLine';
import { RiAddLine } from '../icons/remix/RiAddLine';
import { Button } from '../button';
import { GroupedSection, GroupedSectionItem } from '../grouped-section';
import { Dialog, useDialogFrame } from '../dialog';
import { TextFieldInput } from '../text-field';
import { Text, type TypeScaleVariant } from '../typography';
import { useTheme } from '../theme';
import { RiMailLine } from '../icons/remix/RiMailLine';
import { RiMapPinLine } from '../icons/remix/RiMapPinLine';
import { RiTruckLine } from '../icons/remix/RiTruckLine';
import { RiBankCardLine } from '../icons/remix/RiBankCardLine';
import {
  checkoutSections,
  nextCheckoutStep,
  type CheckoutCard,
  type CheckoutDraft,
  type CheckoutRequest,
  type CheckoutStep,
  type CheckoutPaymentMethod,
} from './model';

export interface CheckoutSheetProps {
  open: boolean;
  /** Prevent dismissal while a host operation requires its current fields to remain mounted. */
  interactionBlocked?: boolean;
  /** Account identity supplied by the host; rendered instead of guest contact collection. */
  accountSummary?: {
    name: string;
    detail?: string;
    avatar?: ReactNode;
    /** Host-owned account context; no identity or balance lookup happens here. */
    supportingRows?: readonly {
      id: string;
      title: string;
      value?: string;
      description?: string;
      onPress?: () => void;
    }[];
  };
  /** Display entries filtered against request.paymentMethods; no availability is inferred. */
  paymentMethods?: readonly CheckoutPaymentMethod[];
  methodContent?: ReactNode;
  /** Heading owned by the shared dialog for a host-specific payment-method screen. */
  methodTitle?: string;
  /** Center an amount-led method screen without changing form or picker headings. */
  methodTitleAlign?: 'left' | 'center';
  /** Optional type-scale token when the method amount, rather than its heading, is primary. */
  methodTitleVariant?: TypeScaleVariant;
  /** Distinguishes host-owned method substates for the shared size morph. */
  frameKey?: string;
  /** The host selects the content and navigates to the method step. */
  onMethod?(methodId: string): void;
  /** Localized copy, including interpolated merchant, quantity and formatted amount. */
  label(key: string, values?: Record<string, string | number>): string;
  /** Format the quoted minor units; the host owns currency exponents and display preferences. */
  formatAmount(amountMinorUnits: number, currency: string): string;
  footer?: ReactNode;
  /** Optional result artwork; the footer owns the status glyph by default. */
  resultIllustration?: ReactNode;
  /** Provider-owned fields, or a host's explicitly labelled local preview. */
  cardEntry?: ReactNode;
  /** Optional disclosure shown below the confirmation button. */
  notice?: ReactNode;
  /** Override prerequisite navigation for a host-supplied payment method. */
  nextStep?: CheckoutStep;
  /** Advance completed details with the updated draft; defaults to returning to review. */
  onContinue?(draft: CheckoutDraft): void;

  request: CheckoutRequest;
  draft: CheckoutDraft;
  step: CheckoutStep;
  direction: 'forward' | 'backward';
  onDraft(draft: CheckoutDraft): void;
  onStep(step: CheckoutStep): void;
  onBack(): void;
  onClose(): void;
  onAuthorize(): void;
  savedCards: CheckoutCard[];
  onCard(card: CheckoutCard): void;
}

/** Presentation-only checkout: no provider, account, key-storage or money API imports. */
function CheckoutContent(props: CheckoutSheetProps) {
  const {
    label,
    formatAmount,
    cardEntry,
    notice,
    request,
    draft,
    step,
    direction,
    onDraft,
    onStep,
    onClose,
    onAuthorize,
    savedCards,
    onCard,
  } = props;
  const { colors } = useTheme();
  useDialogFrame({ key: `checkout:${step}:${props.frameKey ?? ''}`, direction });
  const money = (amount: number) => formatAmount(amount, request.currency);
  const muted = { color: colors.textSecondary };
  const next = props.nextStep ?? nextCheckoutStep(request, draft);
  const continueWith = (updated: CheckoutDraft = draft) =>
    props.onContinue ? props.onContinue(updated) : onStep('review');
  const required = nextCheckoutStep(request, draft);
  const confirmationNext =
    required !== 'review' ? required : next === 'confirmation' ? 'review' : next;
  const cardLabel = draft.card
    ? `${draft.card.brand} ···· ${draft.card.last4}`
    : label('addPayment');
  const sectionText = {
    contact: draft.email || label('addContact'),
    shipping: draft.shipping.address || label('addShipping'),
    delivery: draft.delivery ? label(`delivery.${draft.delivery}`) : label('chooseDelivery'),
    payment:
      (draft.paymentSelection
        ? [draft.paymentSelection.label, draft.paymentSelection.detail].filter(Boolean).join(' · ')
        : undefined) ?? (draft.paymentSelection === null ? label('addPayment') : cardLabel),
  };
  const sectionIcons = {
    contact: RiMailLine,
    shipping: RiMapPinLine,
    delivery: RiTruckLine,
    payment: RiBankCardLine,
  };
  return (
    <View
      testID="bloom-checkout-step"
      style={{
        paddingHorizontal: 20,
        paddingBottom: 20,
        paddingTop: ['review', 'processing', 'success'].includes(step) ? 20 : 0,
        gap: 16,
      }}
    >
      {step === 'review' && (
        <>
          <View style={{ alignItems: 'center', gap: 5 }}>
            <Text variant="body-2-regular" style={muted}>
              {label('payMerchant', { merchant: request.merchant })}
            </Text>
            <Text variant="display-3-bold">{money(request.dueTodayMinorUnits)}</Text>
            <Text variant="body-2-regular" style={muted}>
              {label('dueToday')}
            </Text>
          </View>
          <GroupedSection>
            {request.items.map((item) => (
              <GroupedSectionItem
                key={item.id}
                title={item.name}
                description={`${item.detail} · ${label('quantity', { count: item.quantity })}`}
                value={money(item.amountMinorUnits)}
                showChevron={false}
                icon={
                  item.artwork ? (
                    item.artwork
                  ) : request.requiresShipping ? (
                    <RiTruckLine size="md" fill={colors.text} />
                  ) : (
                    <RiBankCardLine size="md" fill={colors.text} />
                  )
                }
              />
            ))}
            {!request.tax && (
              <GroupedSectionItem
                title={label('subtotal')}
                value={money(
                  request.items.reduce((total, item) => total + item.amountMinorUnits, 0),
                )}
                showChevron={false}
              />
            )}
            {(request.tax || request.totalMinorUnits !== undefined) && (
              <GroupedSectionItem
                title={label('orderTotal')}
                testID="bloom-checkout-order-total"
                content={
                  request.tax ? (
                    <View style={{ gap: 4 }}>
                      <View
                        style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}
                      >
                        <Text variant="body-2-regular" style={muted}>
                          {label('subtotal')}
                        </Text>
                        <Text variant="body-2-regular" style={muted}>
                          {money(request.tax.subtotalMinorUnits)}
                        </Text>
                      </View>
                      <View
                        style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}
                      >
                        <Text variant="body-2-regular" style={muted}>
                          {label(request.tax.inclusive ? 'taxIncluded' : 'tax')}
                        </Text>
                        <Text variant="body-2-regular" style={muted}>
                          {money(request.tax.taxMinorUnits)}
                        </Text>
                      </View>
                      <View
                        style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}
                      >
                        <Text variant="body-semibold">{label('orderTotal')}</Text>
                        <Text variant="body-semibold">{money(request.tax.totalMinorUnits)}</Text>
                      </View>
                    </View>
                  ) : undefined
                }
                value={money(
                  request.tax?.totalMinorUnits ??
                    request.totalMinorUnits ??
                    request.dueTodayMinorUnits,
                )}
                showChevron={false}
              />
            )}
            {!request.tax && request.taxDescription && (
              <GroupedSectionItem
                title={label('tax')}
                value={request.taxDescription}
                showChevron={false}
              />
            )}
          </GroupedSection>
          <GroupedSection>
            {request.requiresContact === false && props.accountSummary ? (
              <>
                <GroupedSectionItem
                  title={props.accountSummary.name}
                  description={props.accountSummary.detail}
                  icon={props.accountSummary.avatar}
                  showChevron={false}
                />
                {props.accountSummary.supportingRows?.map(({ id, ...row }) => (
                  <GroupedSectionItem key={id} {...row} />
                ))}
              </>
            ) : null}
            {(request.recurring?.renewalTerms || request.recurring?.cancellationTerms) && (
              <GroupedSectionItem title={label('terms')} onPress={() => onStep('terms')} />
            )}
            {checkoutSections(request).map((section) => {
              const Icon = sectionIcons[section];
              return (
                <GroupedSectionItem
                  key={section}
                  title={label(`section.${section}`)}
                  description={sectionText[section]}
                  icon={<Icon size="md" fill={colors.textSecondary} />}
                  accessibilityLabel={`${label(`section.${section}`)}: ${sectionText[section]}`}
                  onPress={() => onStep(section)}
                />
              );
            })}
          </GroupedSection>
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text variant="body-semibold">{label('dueToday')}</Text>
              <Text variant="body-semibold">{money(request.dueTodayMinorUnits)}</Text>
            </View>
            {request.recurring && (
              <View style={{ gap: 7 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text variant="body-2-regular" style={muted}>
                    {label('recurring')}
                  </Text>
                  <Text variant="body-2-regular">
                    {money(request.recurring.amountMinorUnits)} /{' '}
                    {label(request.recurring.interval)}
                  </Text>
                </View>
                {request.recurring.startsOn && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text variant="body-2-regular" style={muted}>
                      {label('starts')}
                    </Text>
                    <Text variant="body-2-regular">{request.recurring.startsOn}</Text>
                  </View>
                )}
              </View>
            )}
            <Button size="lg" onPress={() => (next === 'review' ? onAuthorize() : onStep(next))}>
              {next === 'review'
                ? request.recurring && request.dueTodayMinorUnits === 0
                  ? label('confirmSubscription')
                  : label('payAmount', { amount: money(request.dueTodayMinorUnits) })
                : label('continue')}
            </Button>
            {notice != null && (
              <Text variant="caption-1-regular" style={{ ...muted, textAlign: 'center' }}>
                {notice}
              </Text>
            )}
          </View>
        </>
      )}

      {step === 'confirmation' && (
        <>
          <View style={{ alignItems: 'center', gap: 5 }}>
            <Text variant="display-3-bold">{money(request.dueTodayMinorUnits)}</Text>
            <Text variant="body-2-regular" style={muted}>
              {label('dueToday')}
            </Text>
          </View>
          <GroupedSection>
            <GroupedSectionItem
              title={label('section.payment')}
              description={sectionText.payment}
              showChevron={false}
            />
          </GroupedSection>
          <Button
            size="lg"
            onPress={() =>
              confirmationNext === 'review' ? onAuthorize() : onStep(confirmationNext)
            }
          >
            {confirmationNext !== 'review'
              ? label('continue')
              : request.recurring && request.dueTodayMinorUnits === 0
                ? label('confirmSubscription')
                : label('payAmount', { amount: money(request.dueTodayMinorUnits) })}
          </Button>
          {notice != null && (
            <Text variant="caption-1-regular" style={{ ...muted, textAlign: 'center' }}>
              {notice}
            </Text>
          )}
        </>
      )}

      {step === 'terms' && (
        <>
          <GroupedSection>
            {request.recurring?.renewalTerms && (
              <GroupedSectionItem
                title={label('terms.renewal')}
                description={request.recurring.renewalTerms}
                descriptionLines={0}
                showChevron={false}
              />
            )}
            {request.recurring?.cancellationTerms && (
              <GroupedSectionItem
                title={label('terms.cancellation')}
                description={request.recurring.cancellationTerms}
                descriptionLines={0}
                showChevron={false}
              />
            )}
          </GroupedSection>
          <Button size="lg" onPress={() => onStep('review')}>
            {label('continue')}
          </Button>
        </>
      )}

      {step === 'contact' && (
        <>
          <Text variant="body-2-regular" style={muted}>
            {label('contactHint')}
          </Text>
          <TextFieldInput
            label={label('email')}
            value={draft.email}
            onValueChange={(email) => onDraft({ ...draft, email })}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Button
            size="lg"
            disabled={!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())}
            onPress={() => continueWith()}
          >
            {label('continue')}
          </Button>
        </>
      )}
      {step === 'shipping' && (
        <>
          <Text variant="body-2-regular" style={muted}>
            {label('shippingHint')}
          </Text>
          {(['name', 'address', 'city', 'postalCode', 'country'] as const).map((field) => (
            <TextFieldInput
              key={field}
              label={label(`field.${field}`)}
              value={draft.shipping[field]}
              onValueChange={(value) =>
                onDraft({ ...draft, shipping: { ...draft.shipping, [field]: value } })
              }
            />
          ))}
          <Button
            size="lg"
            disabled={Object.values(draft.shipping).some((value) => !value.trim())}
            onPress={() => continueWith()}
          >
            {label('continue')}
          </Button>
        </>
      )}
      {step === 'delivery' && (
        <>
          <Text variant="body-2-regular" style={muted}>
            {label('deliveryHint')}
          </Text>
          <GroupedSection>
            {(['standard', 'express'] as const).map((method) => (
              <GroupedSectionItem
                key={method}
                title={label(`delivery.${method}`)}
                description={label(`delivery.${method}Hint`)}
                showChevron={false}
                rightElement={draft.delivery === method ? <Text>✓</Text> : undefined}
                accessibilityState={{ selected: draft.delivery === method }}
                onPress={() => onDraft({ ...draft, delivery: method })}
              />
            ))}
          </GroupedSection>
          <Button size="lg" disabled={!draft.delivery} onPress={() => continueWith()}>
            {label('continue')}
          </Button>
        </>
      )}
      {step === 'payment' && (
        <>
          <Text variant="body-2-regular" style={muted}>
            {label('paymentHint')}
          </Text>
          <GroupedSection>
            {request.paymentMethods.includes('card') &&
              savedCards.map((card) => {
                const selected =
                  draft.paymentSelection === undefined
                    ? draft.card?.id === card.id
                    : draft.paymentSelection?.method === 'card' &&
                      draft.paymentSelection.id === card.id;
                return (
                  <GroupedSectionItem
                    key={`card:${card.id}`}
                    title={`${card.brand} ···· ${card.last4}`}
                    description={label('savedCard')}
                    icon={<RiBankCardLine size="md" fill={colors.text} />}
                    showChevron={false}
                    accessibilityState={{ selected }}
                    rightElement={
                      selected ? <RiCheckLine size="md" fill={colors.primary} /> : undefined
                    }
                    onPress={() => {
                      onCard(card);
                      continueWith({
                        ...draft,
                        card,
                        paymentSelection:
                          draft.paymentSelection === undefined
                            ? undefined
                            : {
                                id: card.id,
                                method: 'card',
                                label: `${card.brand} ···· ${card.last4}`,
                              },
                      });
                    }}
                  />
                );
              })}
            {(props.paymentMethods ?? [])
              .filter(
                (method) =>
                  method.disabled === true ||
                  (method.id !== 'card' && request.paymentMethods.includes(method.id)),
              )
              .map((method) => {
                const Icon = PAYMENT_METHOD_KIND_ICON[method.kind ?? 'wallet'];
                const enabled = !method.disabled && request.paymentMethods.includes(method.id);
                const selected = enabled && draft.paymentSelection?.method === method.id;
                return (
                  <GroupedSectionItem
                    key={`method:${method.id}`}
                    title={method.label}
                    description={method.detail}
                    icon={
                      method.artwork ?? (
                        <Icon width={iconSizes.md} height={iconSizes.md} fill={colors.text} />
                      )
                    }
                    showChevron={false}
                    accessibilityState={{ selected }}
                    rightElement={
                      selected ? <RiCheckLine size="md" fill={colors.primary} /> : undefined
                    }
                    disabled={!enabled || !props.onMethod}
                    onPress={() => {
                      if (enabled) props.onMethod?.(method.id);
                    }}
                  />
                );
              })}
            {request.paymentMethods.includes('card') && (
              <GroupedSectionItem
                title={label('addCard')}
                icon={<RiAddLine size="md" fill={colors.text} />}
                onPress={() => onStep('card')}
              />
            )}
          </GroupedSection>
        </>
      )}
      {step === 'card' && cardEntry}
      {step === 'method' && props.methodContent}
      {(step === 'processing' || step === 'success' || step === 'failure') && (
        <PaymentStatusBlock
          testID="bloom-checkout-result"
          illustration={props.resultIllustration}
          showIcon={false}
          variant="plain"
          state={step === 'processing' ? 'authorising' : step === 'success' ? 'paid' : 'failed'}
          status={label(`result.${step}`)}
          detail={label(`result.${step}Hint`)}
          actions={
            step === 'processing' ? undefined : (
              <Button size="lg" onPress={step === 'success' ? onClose : () => onStep('review')}>
                {step === 'success' ? label('done') : label('tryAgain')}
              </Button>
            )
          }
        />
      )}
    </View>
  );
}

/** Controlled checkout composition; this component never authorizes or moves funds itself. */
export function CheckoutSheet(props: CheckoutSheetProps) {
  const { open, onClose, onBack, step, label, footer } = props;
  const blocked = step === 'processing' || props.interactionBlocked === true;
  const latest = useRef({ blocked, onClose, onBack });
  latest.current = { blocked, onClose, onBack };
  const requestClose = useCallback(() => {
    if (!latest.current.blocked) latest.current.onClose();
  }, []);
  const requestBack = useCallback(() => {
    if (!latest.current.blocked) latest.current.onBack();
  }, []);
  const hasBack = step !== 'review' && step !== 'processing' && step !== 'success';
  return (
    <Dialog
      open={open}
      placement="bottom"
      detached
      showHandle={false}
      contentPadding={0}
      onClose={requestClose}
      dismissOnBackdrop={!blocked}
      panelStyle={{ maxWidth: 540 }}
      header={
        hasBack
          ? {
              title:
                step === 'method'
                  ? (props.methodTitle ?? label('step.method'))
                  : label(`step.${step}`),
              largeTitle: true,
              largeTitleAlign:
                step === 'confirmation'
                  ? 'center'
                  : step === 'method'
                    ? props.methodTitleAlign
                    : undefined,
              largeTitleVariant:
                step === 'confirmation'
                  ? 'title-2-semibold'
                  : step === 'method'
                    ? props.methodTitleVariant
                    : undefined,
              titleReveal: 'afterTitle',
              showClose: !blocked,
              onBack: blocked ? undefined : requestBack,
            }
          : undefined
      }
      footer={footer}
      footerBehavior="viewport"
    >
      <CheckoutContent {...props} onClose={requestClose} onBack={requestBack} />
    </Dialog>
  );
}
