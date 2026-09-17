import React, { memo } from 'react';
import { View } from 'react-native';

import { Badge } from '../badge';
import { Button } from '../button';
import { RiDownload2Line, RiEyeLine, RiQuillPenLine } from '../icons/remix';
import { useContainerWidth } from '../listing-details/use-container-width';
import { Text } from '../typography';
import { DOCUMENT_LIST_WIDE_MIN_WIDTH, TENANCY_DOCUMENT_ICON, TENANCY_DOCUMENT_STATUS } from './constants';
import { HousingCard, IconTile, useHousingPalette } from './parts';
import type { DocumentListProps, TenancyDocument } from './types';

/**
 * The tenancy's paperwork: the contract, inventories, certificates, receipts.
 *
 *   card      the housing card, unpadded; rows edge to edge, hairlines between
 *   row       padding 14 / 20 (right 12), 12 between parts:
 *             a 40 file tile (radius 10, neutral-100 / 700, 20 file icon);
 *             name body-medium (one line) over "240 KB · Signed 2 Sep 2025"
 *             caption-1-regular text-secondary;
 *             status `Badge` (subtle: signed success, pending warning,
 *             expired error) — beside the name from 560 wide, under the meta
 *             line below;
 *             actions: a small primary "Sign" button (with `onSign`), then
 *             secondary icon buttons for view and download, each named after the
 *             document ("Download Tenancy agreement.pdf")
 */

function DocumentListComponent({
  documents,
  statusLabels,
  signLabel = 'Sign',
  viewLabel = (document: TenancyDocument) => `View ${document.name}`,
  downloadLabel = (document: TenancyDocument) => `Download ${document.name}`,
  emptyLabel = 'No documents',
  layout = 'auto',
  style,
  testID,
}: DocumentListProps) {
  const palette = useHousingPalette();
  const { width, onLayout } = useContainerWidth();
  const wide = layout === 'wide' || (layout === 'auto' && width != null && width >= DOCUMENT_LIST_WIDE_MIN_WIDTH);
  const id = (part: string) => (testID ? `${testID}-${part}` : undefined);

  return (
    <HousingCard padded={false} style={style} testID={testID}>
      <View onLayout={onLayout}>
        {documents.length === 0 ? (
          <View style={{ paddingTop: 24, paddingBottom: 24, paddingLeft: 20, paddingRight: 20 }}>
            <Text variant="body-regular" style={{ color: palette.textSecondary }} testID={id('empty')}>
              {emptyLabel}
            </Text>
          </View>
        ) : (
          <View role="list">
            {documents.map((document, index) => {
              const info = document.status ? TENANCY_DOCUMENT_STATUS[document.status] : null;
              const badge =
                info && document.status ? (
                  <Badge
                    content={document.statusLabel ?? statusLabels?.[document.status] ?? info.label}
                    color={info.tone}
                    variant="subtle"
                    size="medium"
                    testID={id(`status-${index}`)}
                  />
                ) : null;
              const meta = [document.size, document.date].filter(Boolean).join(' · ');
              return (
                <View
                  key={document.id}
                  role="listitem"
                  testID={id(`row-${index}`)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    paddingTop: 14,
                    paddingBottom: 14,
                    paddingLeft: 20,
                    paddingRight: 12,
                    borderTopWidth: index === 0 ? 0 : 1,
                    borderTopColor: palette.hairline,
                  }}
                >
                  <IconTile
                    icon={TENANCY_DOCUMENT_ICON[document.type ?? 'other']}
                    radius={10}
                    testID={id(`icon-${index}`)}
                  />
                  <View style={{ flex: 1, minWidth: 0, gap: 2, alignItems: 'flex-start' }}>
                    <Text
                      variant="body-medium"
                      numberOfLines={1}
                      style={{ color: palette.text, alignSelf: 'stretch' }}
                      testID={id(`name-${index}`)}
                    >
                      {document.name}
                    </Text>
                    {meta ? (
                      <Text variant="caption-1-regular" numberOfLines={1} style={{ color: palette.textSecondary }}>
                        {meta}
                      </Text>
                    ) : null}
                    {!wide && badge ? <View style={{ marginTop: 4 }}>{badge}</View> : null}
                  </View>
                  {wide && badge ? <View style={{ width: 144, alignItems: 'flex-start' }}>{badge}</View> : null}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                    {document.onSign ? (
                      <View style={{ marginRight: 6 }}>
                        <Button
                          variant="primary"
                          size="small"
                          leadingIcon={wide ? RiQuillPenLine : undefined}
                          accessibilityLabel={`${signLabel} ${document.name}`}
                          onPress={document.onSign}
                          testID={id(`sign-${index}`)}
                        >
                          {signLabel}
                        </Button>
                      </View>
                    ) : null}
                    {document.onView ? (
                      <Button
                        variant="secondary"
                        size="small"
                        iconOnly
                        leadingIcon={RiEyeLine}
                        accessibilityLabel={viewLabel(document)}
                        onPress={document.onView}
                        testID={id(`view-${index}`)}
                      />
                    ) : null}
                    {document.onDownload ? (
                      <Button
                        variant="secondary"
                        size="small"
                        iconOnly
                        leadingIcon={RiDownload2Line}
                        accessibilityLabel={downloadLabel(document)}
                        onPress={document.onDownload}
                        testID={id(`download-${index}`)}
                      />
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </HousingCard>
  );
}

export const DocumentList = memo(DocumentListComponent);
DocumentList.displayName = 'DocumentList';
