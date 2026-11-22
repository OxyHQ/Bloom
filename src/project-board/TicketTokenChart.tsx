import { useContext, type ComponentProps } from 'react';
import { View } from 'react-native';
import { TokensChartCard } from '../chart-cards/TokensChartCard';
import { webDataSet } from '../styles/web-data';
import { TicketGenieEnteredContext } from './context';

/** Keep the card's geometry in the entrance copy, then restart its live plot clock. */
export function TicketTokenChart(props: ComponentProps<typeof TokensChartCard>) {
  const entered = useContext(TicketGenieEnteredContext);
  return (
    <View {...webDataSet({ bloomDetailDeferred: '' })}>
      <TokensChartCard {...props} animate={entered} />
    </View>
  );
}
