import React, { memo } from 'react';
import { View } from 'react-native';

import { Badge } from '../badge';
import { Button } from '../button';
import { RiDownload2Line } from '../icons/remix/RiDownload2Line';
import { RiEyeLine } from '../icons/remix/RiEyeLine';
import { RiQuillPenLine } from '../icons/remix/RiQuillPenLine';
import { useContainerWidth } from '../hooks/use-container-width';
import { useMessages } from '../locale/messages';
import { Text } from '../typography';
import { DOCUMENT_LIST_WIDE_MIN_WIDTH, TENANCY_DOCUMENT_ICON, TENANCY_DOCUMENT_STATUS } from './constants';
import { TENANCY_MESSAGES } from './messages';
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
  signLabel: signLabelProp,
  viewLabel: viewLabelProp,
  downloadLabel: downloadLabelProp,
  emptyLabel: emptyLabelProp,
  layout = 'auto',
  style,
  testID,
}: DocumentListProps) {
  const { messages } = useMessages(TENANCY_MESSAGES);
  const signLabel = signLabelProp ?? messages.sign;
  // A caller's own verb keeps its old "<verb> <name>" name; Bloom's own is a
  // whole phrase per language, so no language is glued in English order.
  const signName = (name: string) => (signLabelProp != null ? `${signLabelProp} ${name}` : messages.signDocument(name));
  const viewLabel = viewLabelProp ?? ((document: TenancyDocument) => messages.viewDocument(document.name));
  const downloadLabel = downloadLabelProp ?? ((document: TenancyDocument) => messages.downloadDocument(document.name));
  const emptyLabel = emptyLabelProp ?? messages.noDocuments;
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
                    content={document.statusLabel ?? statusLabels?.[document.status] ?? messages.documentStatus[document.status]}
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

                          size="sm"
                          leadingIcon={wide ? RiQuillPenLine : undefined}
                          accessibilityLabel={signName(document.name)}
                          onPress={document.onSign}
                          testID={id(`sign-${index}`)} tone="accent" appearance="solid"
                        >
                          {signLabel}
                        </Button>
                      </View>
                    ) : null}
                    {document.onView ? (
                      <Button

                        size="sm"
                        iconOnly
                        leadingIcon={RiEyeLine}
                        accessibilityLabel={viewLabel(document)}
                        onPress={document.onView}
                        testID={id(`view-${index}`)} tone="neutral" appearance="outline"
                      />
                    ) : null}
                    {document.onDownload ? (
                      <Button

                        size="sm"
                        iconOnly
                        leadingIcon={RiDownload2Line}
                        accessibilityLabel={downloadLabel(document)}
                        onPress={document.onDownload}
                        testID={id(`download-${index}`)} tone="neutral" appearance="outline"
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
