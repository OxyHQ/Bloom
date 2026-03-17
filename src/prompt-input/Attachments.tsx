import React from 'react';
import { View, Text, Image, Pressable, ScrollView, ActivityIndicator } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { usePromptInput, type Attachment } from './context';
import type { PromptInputAttachmentsProps } from './types';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function truncateFilename(name: string, maxLength = 20): string {
  if (name.length <= maxLength) return name;
  const lastDot = name.lastIndexOf('.');
  if (lastDot < 0) return name.slice(0, maxLength - 3) + '...';
  const ext = name.slice(lastDot);
  const base = name.slice(0, lastDot);
  const available = maxLength - ext.length - 3;
  if (available <= 0) return name.slice(0, maxLength - 3) + '...';
  return base.slice(0, available) + '...' + ext;
}

interface DocIconInfo {
  label: string;
  color: string;
  bgColor: string;
}

function getDocumentIconInfo(mimeType: string, name: string): DocIconInfo {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';

  if (mimeType === 'application/pdf' || ext === 'pdf')
    return { label: 'PDF', color: '#EF4444', bgColor: '#EF444418' };
  if (mimeType.includes('word') || ['doc', 'docx'].includes(ext))
    return { label: 'DOC', color: '#3B82F6', bgColor: '#3B82F618' };
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || ['xls', 'xlsx', 'csv'].includes(ext))
    return { label: 'XLS', color: '#22C55E', bgColor: '#22C55E18' };
  if (['js', 'ts', 'tsx', 'jsx', 'py', 'rb', 'go', 'rs', 'java', 'c', 'cpp', 'h', 'json', 'xml', 'yaml', 'yml', 'html', 'css', 'scss', 'sh', 'sql'].includes(ext))
    return { label: '</>', color: '#8B5CF6', bgColor: '#8B5CF618' };
  if (mimeType.includes('zip') || mimeType.includes('archive') || ['zip', 'rar', 'tar', 'gz', '7z'].includes(ext))
    return { label: 'ZIP', color: '#EAB308', bgColor: '#EAB30818' };
  if (mimeType.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'flac', 'aac'].includes(ext))
    return { label: '♫', color: '#EC4899', bgColor: '#EC489918' };
  if (mimeType === 'text/plain' || ['txt', 'md', 'rtf'].includes(ext))
    return { label: 'TXT', color: '#6B7280', bgColor: '#6B728018' };
  return { label: 'FILE', color: '#9CA3AF', bgColor: '#9CA3AF18' };
}

function RemoveButton({
  onPress,
  size,
  backgroundColor,
  removeIcon,
  label,
}: {
  onPress: () => void;
  size: number;
  backgroundColor: string;
  removeIcon?: React.ReactNode;
  label: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Remove ${label}`}
      style={{
        position: 'absolute',
        top: 6,
        right: 6,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {removeIcon ?? <Text style={{ color: '#FFFFFF', fontSize: size * 0.6, fontWeight: '700', lineHeight: size * 0.7 }}>×</Text>}
    </Pressable>
  );
}

function ImageAttachmentItem({
  attachment,
  onRemove,
  removeIcon,
}: {
  attachment: Attachment;
  onRemove: () => void;
  removeIcon?: React.ReactNode;
}) {
  const theme = useTheme();

  return (
    <View
      style={{
        width: 120,
        height: 120,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: theme.colors.backgroundSecondary,
        borderWidth: 1,
        borderColor: theme.colors.border,
      }}
    >
      {!attachment.isLoading && attachment.uri ? (
        <Image
          source={{ uri: attachment.uri }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="small" />
        </View>
      )}
      {attachment.name && !attachment.isLoading && (
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            paddingHorizontal: 8,
            paddingVertical: 4,
            backgroundColor: 'rgba(0,0,0,0.5)',
          }}
        >
          <Text style={{ fontSize: 11, color: '#FFFFFF' }} numberOfLines={1}>
            {truncateFilename(attachment.name)}
          </Text>
        </View>
      )}
      <RemoveButton
        onPress={onRemove}
        size={24}
        backgroundColor="rgba(0,0,0,0.6)"
        removeIcon={removeIcon}
        label={attachment.name || 'image'}
      />
    </View>
  );
}

function DocumentAttachmentItem({
  attachment,
  onRemove,
  removeIcon,
  renderDocumentIcon,
}: {
  attachment: Attachment;
  onRemove: () => void;
  removeIcon?: React.ReactNode;
  renderDocumentIcon?: (mimeType: string, name: string) => React.ReactNode;
}) {
  const theme = useTheme();
  const iconInfo = getDocumentIconInfo(attachment.mimeType, attachment.name);

  return (
    <View
      style={{
        width: 180,
        height: 80,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
        overflow: 'hidden',
        backgroundColor: theme.colors.backgroundSecondary,
      }}
    >
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 12,
          gap: 12,
        }}
      >
        {renderDocumentIcon ? (
          renderDocumentIcon(attachment.mimeType, attachment.name)
        ) : (
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: iconInfo.bgColor,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: iconInfo.color }}>
              {iconInfo.label}
            </Text>
          </View>
        )}
        <View style={{ flex: 1, paddingRight: 16 }}>
          <Text
            style={{ fontSize: 12, fontWeight: '500', color: theme.colors.text }}
            numberOfLines={1}
          >
            {truncateFilename(attachment.name)}
          </Text>
          {attachment.size > 0 && (
            <Text style={{ fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 }}>
              {formatFileSize(attachment.size)}
            </Text>
          )}
        </View>
      </View>
      <RemoveButton
        onPress={onRemove}
        size={20}
        backgroundColor={theme.colors.backgroundTertiary}
        removeIcon={removeIcon}
        label={attachment.name || 'document'}
      />
    </View>
  );
}

export function PromptInputAttachments({
  removeIcon,
  renderDocumentIcon,
  style,
  testID,
}: PromptInputAttachmentsProps) {
  const { attachments, removeAttachment } = usePromptInput();

  if (attachments.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[{ flexGrow: 0, marginBottom: 8, paddingTop: 8 }, style]}
      contentContainerStyle={{ gap: 10, paddingHorizontal: 12 }}
      testID={testID}
    >
      {attachments.map((attachment) => (
        <View key={attachment.id}>
          {attachment.type === 'image' ? (
            <ImageAttachmentItem
              attachment={attachment}
              onRemove={() => removeAttachment(attachment.id)}
              removeIcon={removeIcon}
            />
          ) : (
            <DocumentAttachmentItem
              attachment={attachment}
              onRemove={() => removeAttachment(attachment.id)}
              removeIcon={removeIcon}
              renderDocumentIcon={renderDocumentIcon}
            />
          )}
        </View>
      ))}
    </ScrollView>
  );
}
