// An inline intersection of the file's object types and inline ones is one record type of all
// their fields (no general intersection type). A spread child among a node's arguments makes
// them a builder (`Section { for x in xs { … } }`).
import { GroupedSection, GroupedSectionItem, toElement, view } from '@oxy.so/bloom-language';

interface Request {
  title: string;
  label: string;
}

export function describe(request: Request & { signal?: string; onClosed?: () => void }): string {
  request.onClosed?.();
  return `${request.title}: ${request.label}${request.signal ?? ''}`;
}

export const Rows = view(function Rows({ labels }: { labels: string[] }) {
  return toElement(GroupedSection(...labels.map((label) => GroupedSectionItem(label).chevron(false))));
});
