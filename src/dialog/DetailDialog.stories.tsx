import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Button } from '../button';
import { TextFieldInput } from '../text-field';
import { Text } from '../typography';
import { DetailDialog } from './DetailDialog';
import { DetailDialogSection } from './DetailDialogSection';

const meta: Meta<typeof DetailDialog> = {
  title: 'Surfaces/Detail Dialog',
  component: DetailDialog,
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj<typeof DetailDialog>;

function RecordDetail() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'side' | 'center'>('side');
  const [draft, setDraft] = useState('Product-owned draft');
  return (
    <>
      <Button testID="detail-open" onPress={() => setOpen(true)}>
        Open record
      </Button>
      <Button testID="detail-mode" onPress={() => setMode(mode === 'side' ? 'center' : 'side')}>
        {mode}
      </Button>
      <DetailDialog
        open={open}
        onClose={() => setOpen(false)}
        mode={mode}
        label="Record detail"
        header="DOC-38"
        subtitle="Workspace · Planning"
        testID="record-detail"
        footer={
          <Button testID="detail-save" onPress={() => setOpen(false)}>
            Save record
          </Button>
        }
        scrollFooter={<Text testID="detail-activity">Record activity</Text>}
      >
        <TextFieldInput
          testID="detail-draft"
          label="Record title"
          value={draft}
          onValueChange={setDraft}
        />
        <DetailDialogSection label="Status">
          <Text>In progress</Text>
        </DetailDialogSection>
        {Array.from({ length: 30 }, (_, index) => (
          <Text key={index}>Editable record section {index + 1}</Text>
        ))}
      </DetailDialog>
    </>
  );
}
export const Record: Story = { render: () => <RecordDetail /> };
