import { CONTAINER_CASES } from './containers.cases';
import { describeNativeParity } from './support/native';

describeNativeParity(
  'Card, Row, GroupedSection, Chip, EmptyState, Admonition, Tabs, Kbd and ErrorBoundary',
  CONTAINER_CASES,
);
