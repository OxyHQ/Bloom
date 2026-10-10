import { defineMessages, type MessageCatalog } from '../locale/messages';

/**
 * Every fixed string the address family draws or announces, in each Bloom
 * language. A caller's `emptyTitle`/`accessibilityLabel` still wins.
 */
export interface AddressMessages {
  /** `AddressList`'s empty state. */
  emptyTitle: string;
  /** Names `AddressList`. */
  addresses: string;
}

export const ADDRESS_MESSAGES: MessageCatalog<AddressMessages> = defineMessages<AddressMessages>(
  'ADDRESS_MESSAGES',
  { emptyTitle: 'Nothing here yet', addresses: 'Addresses' },
);
