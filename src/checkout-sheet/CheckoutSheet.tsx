import type { ReactNode } from 'react';
import { View } from 'react-native';
import { PaymentStatusBlock } from '../payment-status';
import { Button } from '../button';
import { GroupedSection, GroupedSectionItem } from '../grouped-section';
import { Dialog, useDialogFrame } from '../dialog';
import { TextFieldInput } from '../text-field';
import { Text } from '../typography';
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
} from './model';

export interface CheckoutSheetProps {
  open: boolean;
  /** Localized copy, including interpolated merchant, quantity and formatted amount. */
  label(key: string, values?: Record<string, string | number>): string;
  /** Format the quoted minor units; the host owns currency exponents and display preferences. */
  formatAmount(amountMinorUnits: number, currency: string): string;
  footer?: ReactNode;
  /** Provider-owned fields, or a host's explicitly labelled local preview. */
  cardEntry?: ReactNode;
  /** Optional disclosure shown below the confirmation button. */
  notice?: ReactNode;
  /** Override prerequisite navigation for a host-supplied payment method. */
  nextStep?: CheckoutStep;

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
  useDialogFrame({ key: `checkout:${step}`, direction });
  const money = (amount: number) => formatAmount(amount, request.currency);
  const muted = { color: colors.textSecondary };
  const next = props.nextStep ?? nextCheckoutStep(request, draft);
  const cardLabel = draft.card
    ? `${draft.card.brand} ···· ${draft.card.last4}`
    : label('addPayment');
  const sectionText = {
    contact: draft.email || label('addContact'),
    shipping: draft.shipping.address || label('addShipping'),
    delivery: draft.delivery ? label(`delivery.${draft.delivery}`) : label('chooseDelivery'),
    payment: cardLabel,
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
            <GroupedSectionItem
              title={label('subtotal')}
              value={money(request.items.reduce((total, item) => total + item.amountMinorUnits, 0))}
              showChevron={false}
            />
            {request.taxDescription && (
              <GroupedSectionItem
                title={label('tax')}
                value={request.taxDescription}
                showChevron={false}
              />
            )}
          </GroupedSection>
          {request.recurring && (
            <View style={{ gap: 7 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text variant="body-2-regular" style={muted}>
                  {label('recurring')}
                </Text>
                <Text variant="body-2-regular">
                  {money(request.recurring.amountMinorUnits)} / {label(request.recurring.interval)}
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
          {(request.recurring?.renewalTerms || request.recurring?.cancellationTerms) && (
            <View style={{ gap: 4 }}>
              {request.recurring.renewalTerms && (
                <Text variant="body-2-regular" style={muted}>
                  {request.recurring.renewalTerms}
                </Text>
              )}
              {request.recurring.cancellationTerms && (
                <Text variant="body-2-regular" style={muted}>
                  {request.recurring.cancellationTerms}
                </Text>
              )}
            </View>
          )}
          <GroupedSection>
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
            onPress={() => onStep('review')}
          >
            {label('save')}
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
            onPress={() => onStep('review')}
          >
            {label('save')}
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
          <Button size="lg" disabled={!draft.delivery} onPress={() => onStep('review')}>
            {label('save')}
          </Button>
        </>
      )}
      {step === 'payment' && (
        <>
          <Text variant="body-2-regular" style={muted}>
            {label('paymentHint')}
          </Text>
          {request.paymentMethods.includes('card') && savedCards.length > 0 && (
            <GroupedSection>
              {savedCards.map((card) => (
                <GroupedSectionItem
                  key={card.id}
                  title={`${card.brand} ···· ${card.last4}`}
                  description={label('savedCard')}
                  icon={<RiBankCardLine size="md" fill={colors.text} />}
                  onPress={() => {
                    onCard(card);
                    onStep('review');
                  }}
                />
              ))}
            </GroupedSection>
          )}
          {request.paymentMethods.includes('card') && (
            <>
              <Button size="lg" onPress={() => onStep('card')}>
                {label('addCard')}
              </Button>
              <Text style={{ ...muted, textAlign: 'center' }}>{label('acceptedCards')}</Text>
            </>
          )}
        </>
      )}
      {step === 'card' && cardEntry}
      {(step === 'processing' || step === 'success' || step === 'failure') && (
        <PaymentStatusBlock
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
  const hasBack = step !== 'review' && step !== 'processing' && step !== 'success';
  return (
    <Dialog
      open={open}
      placement="bottom"
      detached
      showHandle={false}
      contentPadding={0}
      onClose={onClose}
      panelStyle={{ maxWidth: 540 }}
      header={
        hasBack
          ? {
              title: label(`step.${step}`),
              largeTitle: false,
              showClose: true,
              onBack,
            }
          : undefined
      }
      footer={footer}
      footerBehavior="viewport"
    >
      <CheckoutContent {...props} />
    </Dialog>
  );
}
