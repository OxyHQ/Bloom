import { LinkPreviewCard } from '@bloom/link-preview';
import type { Cases } from '../support/cases';

export const CASES: Cases = {
  'LinkPreviewCard plain': () => <LinkPreviewCard url="https://oxy.so/bloom" />,
  'LinkPreviewCard loaded': () => (
    <LinkPreviewCard
      url="https://oxy.so/bloom"
      title="Bloom, the shared component library"
      description="One set of components for every Oxy app."
      siteName="Oxy"
      author="Oxy"
      image="https://oxy.so/og.png"
      coverFill
      style={{ height: 180 }}
    />
  ),
};
