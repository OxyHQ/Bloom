import React, { useMemo, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';

import { AiProfileCard } from '../../src/ai-profile-card';
import { AppShell } from '../../src/app-shell';
import { Button } from '../../src/button';
import { AgentsChartCard } from '../../src/chart-cards/AgentsChartCard';
import { TokensChartCard } from '../../src/chart-cards/TokensChartCard';
import { RiEditBoxLine, RiShare2Line } from '../../src/icons/remix';
import { BREAKPOINTS } from '../../src/styles/breakpoints';
import { ACCOUNT, NAV_ITEMS, SECONDARY_ITEMS, TEAM, TEMPLATE_FRAME } from '../shared/dashboard';
import {
  CELLS,
  MONTH_NAMES,
  PROFILE,
  STATS,
  TOKENS_SERIES,
  TOKENS_TOTAL,
  agentsFor,
} from './demo-data';

/**
 * The AI profile template: adaptive bottom, rail and sidebar navigation, and one centred 680px column — the profile card, the agents bar
 * chart and the tokens line chart, 16 apart. The page pads 12, 24 from `sm`.
 */
export function AiProfileTemplate({ initialMonth = 11 }: { initialMonth?: number }) {
  const { width } = useWindowDimensions();
  const small = width >= BREAKPOINTS.sm;
  const [selected, setSelected] = useState('profile');
  const [month, setMonth] = useState(initialMonth);
  const agents = useMemo(() => agentsFor(month), [month]);

  return (
    <View style={TEMPLATE_FRAME}>
      <AppShell
        testID="ai-profile"
        navigationPlacement="auto"
        sidebar={{
          items: NAV_ITEMS,
          secondaryItems: SECONDARY_ITEMS,
          selected,
          onNavigate: (item) => setSelected(item.key),
          account: ACCOUNT,
          team: TEAM,
        }}
        // `max-w-[680px]` inside the page's 24px `sm:p-6`: the shell pads 12, the
        // column adds the other 12 on each side.
        contentMaxWidth={small ? 704 : 680}
      >
        <View
          style={{
            width: '100%',
            alignItems: 'center',
            gap: 16,
            paddingLeft: small ? 12 : 0,
            paddingRight: small ? 12 : 0,
            paddingBottom: small ? 12 : 0,
          }}
        >
          <View style={{ position: 'relative', width: '100%' }}>
            <AiProfileCard
              testID="ai-profile-card"
              name={PROFILE.name}
              handle={PROFILE.handle}
              badge={PROFILE.badge}
              coverSource={PROFILE.cover}
              contributions={PROFILE.contributions}
              delta={PROFILE.delta}
              stats={STATS}
              cells={CELLS}
              actions={
                <>
                  <Button size="sm" leadingIcon={RiShare2Line} appearance="subtle" tone="neutral">
                    Share
                  </Button>
                  <Button size="sm" leadingIcon={RiEditBoxLine} appearance="solid" tone="action">
                    Edit
                  </Button>
                </>
              }
            />

          </View>
          <AgentsChartCard
            testID="ai-profile-agents"
            data={agents.data}
            headline={agents.headline}
            max={agents.max}
            range={MONTH_NAMES[month]}
            onPrevRange={() => setMonth((m) => (m + 11) % 12)}
            onNextRange={() => setMonth((m) => (m + 1) % 12)}
          />
          <TokensChartCard
            testID="ai-profile-tokens"
            data={TOKENS_SERIES}
            headline={TOKENS_TOTAL}
            delta="+9.4%"
          />
        </View>
      </AppShell>
    </View>
  );
}
