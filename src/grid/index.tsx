import React, { createContext, memo, useContext, useMemo } from 'react';
import { View, type ViewStyle } from 'react-native';

const GridContext = createContext({ gap: 0 });
GridContext.displayName = 'GridContext';

const RowComponent = function Row({
  children,
  gap = 0,
  style,
}: {
  children: React.ReactNode;
  gap?: number;
  style?: ViewStyle | ViewStyle[];
}) {
  return (
    <GridContext.Provider value={useMemo(() => ({ gap }), [gap])}>
      <View
        style={[
          {
            flexDirection: 'row',
            flex: 1,
            marginLeft: -gap / 2,
            marginRight: -gap / 2,
          },
          style,
        ]}>
        {children}
      </View>
    </GridContext.Provider>
  );
};

export const Row = memo(RowComponent);
Row.displayName = 'Row';

const ColComponent = function Col({
  children,
  width = 1,
  style,
}: {
  children: React.ReactNode;
  width?: number;
  style?: ViewStyle | ViewStyle[];
}) {
  const { gap } = useContext(GridContext);
  return (
    <View
      style={[
        {
          flexDirection: 'column',
          paddingLeft: gap / 2,
          paddingRight: gap / 2,
          width: `${width * 100}%` as unknown as number,
        },
        style,
      ]}>
      {children}
    </View>
  );
};

export const Col = memo(ColComponent);
Col.displayName = 'Col';
