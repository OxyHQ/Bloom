import { useContext, type ComponentProps } from 'react';
import { TokensChartCard } from '../chart-cards/TokensChartCard';
import { StyledView } from '../styles/styled-primitives';
import { TicketGenieEnteredContext } from './context';

/** Keep the card's geometry in the entrance copy, then restart its live plot clock. */
export function TicketTokenChart(props: ComponentProps<typeof TokensChartCard>) {
  const entered = useContext(TicketGenieEnteredContext);
  return (
    <StyledView className="bloom-ticket-detail-chart">
      <TokensChartCard {...props} animate={entered} />
    </StyledView>
  );
}
