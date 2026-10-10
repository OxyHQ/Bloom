import { defineMessages, type MessageCatalog } from '../locale/messages';

/**
 * The breadcrumb's landmark name, in each Bloom language. A caller's
 * `accessibilityLabel` still wins.
 */
export interface BreadcrumbMessages {
  breadcrumb: string;
}

export const BREADCRUMB_MESSAGES: MessageCatalog<BreadcrumbMessages> =
  defineMessages<BreadcrumbMessages>('BREADCRUMB_MESSAGES', {
    breadcrumb: 'Breadcrumb',
  });
