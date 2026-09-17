import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { FileMessage } from './FileMessage';
import { resolveMessageMediaPaint } from './shared';
import type { DocumentGridProps } from './types';

/**
 * The FILES tab beside {@link SharedMediaGrid}'s media tab.
 *
 * It is a list, not a grid of tiles, and the name is the pair's rather than the
 * shape's: a document has no thumbnail worth three columns, and the two things a
 * reader is scanning for — the file NAME and its size — are text that needs a
 * line each.
 *
 * Every row is `FileMessage variant="compact"`, so the kind icons, the colours,
 * the "2.4 MB · PDF" line and the download ring are the same ones the bubble
 * draws. A second implementation of a file row is a second place for the size
 * format to drift.
 *
 * The rows are always `incoming` tone: this list lives on the panel surface, not
 * on a bubble.
 */
function DocumentGridComponent({
  items,
  onPressItem,
  onDownloadItem,
  onCancelItem,
  divider = true,
  accessibilityLabel,
  style,
  testID,
}: DocumentGridProps) {
  const theme = useTheme();
  const paint = useMemo(() => resolveMessageMediaPaint(theme, 'incoming'), [theme]);

  const listName =
    accessibilityLabel ?? `Shared files, ${items.length} item${items.length === 1 ? '' : 's'}`;

  return (
    <View role="list" accessibilityLabel={listName} style={style ?? null} testID={testID}>
      {items.map((item, index) => (
        <View
          key={item.id}
          role="listitem"
          style={
            divider && index > 0
              ? { borderTopWidth: 1, borderTopColor: paint.border }
              : undefined
          }
        >
          <FileMessage
            variant="compact"
            name={item.name}
            kind={item.kind}
            mimeType={item.mimeType}
            sizeBytes={item.sizeBytes}
            sizeLabel={item.sizeLabel}
            typeLabel={item.typeLabel}
            metaLabel={item.metaLabel}
            progress={item.progress}
            transfer={item.transfer}
            onPress={onPressItem ? () => onPressItem(index) : undefined}
            onDownload={onDownloadItem ? () => onDownloadItem(index) : undefined}
            onCancel={onCancelItem ? () => onCancelItem(index) : undefined}
            testID={testID ? `${testID}-row-${index}` : undefined}
          />
        </View>
      ))}
    </View>
  );
}

export const DocumentGrid = memo(DocumentGridComponent);
DocumentGrid.displayName = 'DocumentGrid';
