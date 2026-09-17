import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Text } from '../typography';
import { useTheme } from '../theme/use-theme';
import { FileUpload } from './index';
import type { FileUploadFile } from './types';

const meta: Meta<typeof FileUpload> = {
  title: 'Base/File Upload',
  component: FileUpload,
};

export default meta;

type Story = StoryObj<typeof FileUpload>;

const REPORT: FileUploadFile = { name: 'quarterly-report.pdf', size: 2.4 * 1024 * 1024 };
const SHEET: FileUploadFile = { name: 'budget-2026.xlsx', size: 312 * 1024 };
const PHOTO: FileUploadFile = { name: 'team-offsite-photo-with-a-very-long-file-name.png', size: 14 * 1024 * 1024 };

function Frame({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View testID="frame" style={{ padding: 40, gap: 32, width: 613, backgroundColor: theme.colors.background }}>
      {children}
    </View>
  );
}

/**
 * A self-running demo: click (or drop a file) to pick; progress is
 * simulated, then the success state holds and the zone resets. Try a `.txt`
 * or a file over 8 MB for the rejection message.
 */
export const Default: Story = {
  render: function DefaultStory() {
    const [last, setLast] = useState<string | null>(null);
    return (
      <Frame>
        <FileUpload testID="upload" onUploadComplete={(file) => setLast(file.name)} />
        <Text variant="body-2-regular">Last upload: {last ?? '—'}</Text>
      </Frame>
    );
  },
};

/** Every phase, held still: idle, uploading at 0 / 42 / 88%, complete, and each file-type icon. */
export const States: Story = {
  render: () => (
    <Frame>
      <FileUpload file={null} testID="idle" />
      <FileUpload file={REPORT} progress={0} />
      <FileUpload file={REPORT} progress={42} testID="uploading" />
      <FileUpload file={SHEET} progress={88} />
      <FileUpload file={PHOTO} progress={100} testID="complete" />
      <FileUpload file={null} disabled accessibilityLabel="Upload (disabled)" />
    </Frame>
  ),
};

/** Custom extensions, size limit and Spanish copy. */
export const CustomRules: Story = {
  render: () => (
    <Frame>
      <FileUpload
        allowedExtensions={['csv', 'json']}
        maxBytes={500 * 1024}
        labels={{
          prompt: 'Arrastra y suelta para subir o',
          select: 'selecciona',
          uploading: (size) => `Subiendo ${size}...`,
          uploaded: '¡Subido correctamente!',
          unsupported: (exts) => `Solo se admiten archivos ${exts}`,
          tooLarge: (max) => `El archivo supera ${max}`,
        }}
        accessibilityLabel="Subir un archivo"
      />
    </Frame>
  ),
};

/**
 * Fully controlled, as a real integration wires it: `onPickFiles` stands in
 * for a native document picker, `onFileSelected` starts the "upload", and
 * `progress` + `file` are fed back.
 */
export const Controlled: Story = {
  render: function ControlledStory() {
    const [file, setFile] = useState<FileUploadFile | null>(null);
    const [progress, setProgress] = useState(0);
    const timer = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => () => {
      if (timer.current) clearInterval(timer.current);
    }, []);

    return (
      <Frame>
        <FileUpload
          testID="controlled"
          file={file}
          progress={progress}
          onPickFiles={() => REPORT}
          onFileSelected={(picked) => {
            setFile(picked);
            setProgress(0);
            if (timer.current) clearInterval(timer.current);
            timer.current = setInterval(() => {
              setProgress((value) => {
                const next = Math.min(100, value + 10);
                if (next >= 100 && timer.current) clearInterval(timer.current);
                return next;
              });
            }, 200);
          }}
          onUploadComplete={() => {
            setFile(null);
            setProgress(0);
          }}
        />
        <Text variant="body-2-regular">
          {file ? `${file.name}: ${progress}%` : 'Press the zone to pick a file'}
        </Text>
      </Frame>
    );
  },
};
