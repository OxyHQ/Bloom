import { CONTAINER_CASES } from './containers.cases';
import { describeWebParity } from './support/web';

describeWebParity(
  'Card, Row, GroupedSection, Chip, EmptyState, Admonition, Tabs, Kbd and ErrorBoundary',
  CONTAINER_CASES,
);
