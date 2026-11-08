import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './Button.web';
import { ButtonGroup, ButtonGroupItem } from '../button-group/index.web';
import { BloomScope } from '../appearance';
import { RiAddLine } from '../icons/remix/RiAddLine';

const meta: Meta = { title: 'Components/Actions/Button/Touch targets' };
export default meta;
type Story = StoryObj;
export const Targets: Story = {
  render: function TargetsStory() {
    const [last, setLast] = useState('');
    return (
      <div style={{ display: 'grid', gap: 16, maxWidth: '100%' }}>
        {(['ltr', 'rtl'] as const).map((direction) => (
          <div
            key={direction}
            dir={direction}
            data-testid={`targets-${direction}`}
            style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}
          >
            {(['xs', 'sm', 'md', 'lg'] as const).map((size) => (
              <BloomScope key={size} size={size}>
                <Button
                  testID={`${direction}-${size}-text`}
                  onPress={() => setLast(`${direction}-${size}-text`)}
                >
                  Save
                </Button>
                <Button
                  testID={`${direction}-${size}-icon`}
                  icon={RiAddLine}
                  accessibilityLabel="Add"
                  onPress={() => setLast(`${direction}-${size}-icon`)}
                />
              </BloomScope>
            ))}
            <Button
              size="xs"
              testID={`${direction}-override`}
              style={{
                width: 12,
                height: 12,
                minWidth: 0,
                minHeight: 0,
                maxWidth: 12,
                maxHeight: 12,
              }}
              onPress={() => setLast(`${direction}-override`)}
            >
              A
            </Button>
            <Button asChild size="xs">
              <a
                data-testid={`${direction}-child`}
                href="#targets"
                style={{ width: 12, height: 12, minWidth: 0, minHeight: 0 }}
                onClick={(event) => {
                  event.preventDefault();
                  setLast(`${direction}-child`);
                }}
              >
                Go
              </a>
            </Button>
            <Button
              href="#targets"
              size="xs"
              appearance="plain"
              testID={`${direction}-link`}
              onPress={() => setLast(`${direction}-link`)}
            >
              Go
            </Button>
            <Button
              testID={`${direction}-long`}
              className="whitespace-normal"
              style={{ height: 'auto', maxWidth: 190 }}
              onPress={() => setLast(`${direction}-long`)}
            >
              Save this document with a long translated action label
            </Button>
            <BloomScope size="xs">
              <ButtonGroup>
                <ButtonGroupItem
                  testID={`${direction}-group-one`}
                  onPress={() => setLast(`${direction}-group-one`)}
                >
                  One
                </ButtonGroupItem>
                <ButtonGroupItem
                  testID={`${direction}-group-two`}
                  onPress={() => setLast(`${direction}-group-two`)}
                >
                  Two
                </ButtonGroupItem>
              </ButtonGroup>
            </BloomScope>
          </div>
        ))}
        <output data-testid="target-result">{last}</output>
      </div>
    );
  },
};
