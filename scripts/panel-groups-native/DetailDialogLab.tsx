import { useState } from 'react';
import { Button } from './.source/button';
import { DetailDialog, DetailDialogSection } from './.source/dialog';
import { TextFieldInput } from './.source/text-field';
import { Text } from './.source/typography';

/** Product-like detail content; shared Dialog/Screen own every viewport edge. */
export function DetailDialogLab() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('Synthetic task');
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(0);
  return (
    <>
      <Button testID="native-detail-open" onPress={() => setOpen(true)}>
        Open task detail
      </Button>
      <Text testID="native-detail-saved">Saved: {saved}</Text>
      <DetailDialog
        open={open}
        onClose={() => setOpen(false)}
        label="Synthetic task detail"
        header="Task details"
        subtitle="Native shared detail fixture"
        testID="native-detail"
        footerKeyboardBehavior="follow"
        footer={
          <Button testID="native-detail-save" onPress={() => setSaved((value) => value + 1)}>
            Save task
          </Button>
        }
      >
        <DetailDialogSection label="Title">
          <TextFieldInput
            testID="native-detail-title"
            value={title}
            onChangeText={setTitle}
            accessibilityLabel="Task title"
          />
        </DetailDialogSection>
        {Array.from({ length: 24 }, (_, index) => (
          <Text key={index}>Task description paragraph {index + 1}</Text>
        ))}
        <DetailDialogSection label="Notes">
          <TextFieldInput
            testID="native-detail-note"
            value={note}
            onChangeText={setNote}
            accessibilityLabel="Task note"
          />
        </DetailDialogSection>
      </DetailDialog>
    </>
  );
}
