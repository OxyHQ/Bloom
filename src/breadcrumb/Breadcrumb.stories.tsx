import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Breadcrumb, BreadcrumbItem } from './index';
import { PageHeader } from '../page-header';
import { Button } from '../button';
import { BloomScope } from '../appearance';
import { RiChat3Line } from '../icons/remix/RiChat3Line';
import { RiMoreLine } from '../icons/remix/RiMoreLine';
import { RiHome5Line as HomeIcon, RiSettings3Line, RiUserLine } from '../icons/remix';

const meta: Meta<typeof Breadcrumb> = {
  id: 'base-breadcrumb',
  title: 'Components/Navigation/Breadcrumb',
  component: Breadcrumb,
};

export default meta;

type Story = StoryObj<typeof Breadcrumb>;

/** A link with an icon, a button, and the current page. Hover the first two. */
export const Basic: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Breadcrumb>
      <BreadcrumbItem icon={HomeIcon} href="#home">
        Home
      </BreadcrumbItem>
      <BreadcrumbItem onPress={() => {}}>Projects</BreadcrumbItem>
      <BreadcrumbItem current>Board</BreadcrumbItem>
    </Breadcrumb>
  ),
};

/** Every item shape, and a trail long enough to scroll inside a narrow container. */
export const Matrix: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ gap: 20, alignItems: 'flex-start' }}>
      <Breadcrumb>
        <BreadcrumbItem href="#a">Workspace</BreadcrumbItem>
        <BreadcrumbItem href="#b">Engineering</BreadcrumbItem>
        <BreadcrumbItem current>Roadmap</BreadcrumbItem>
      </Breadcrumb>
      <Breadcrumb>
        <BreadcrumbItem icon={HomeIcon} onPress={() => {}}>
          Home
        </BreadcrumbItem>
        <BreadcrumbItem icon={RiSettings3Line} href="#settings">
          Settings
        </BreadcrumbItem>
        <BreadcrumbItem icon={RiUserLine} current>
          Profile
        </BreadcrumbItem>
      </Breadcrumb>
      <View style={{ width: 240 }}>
        <Breadcrumb>
          <BreadcrumbItem href="#1">Company</BreadcrumbItem>
          <BreadcrumbItem href="#2">Departments</BreadcrumbItem>
          <BreadcrumbItem href="#3">Engineering</BreadcrumbItem>
          <BreadcrumbItem href="#4">Platform</BreadcrumbItem>
          <BreadcrumbItem current>Quarterly planning</BreadcrumbItem>
        </Breadcrumb>
      </View>
    </View>
  ),
};

/** The existing header reserves action space; the breadcrumb fits its own slot. */
export const HeaderCollapse: Story = {
  render: () => (
    <BloomScope size="md">
      <View style={{ width: '100%', maxWidth: 900 }}>
        <PageHeader
          presentation="bar"
          density="compact"
          safeArea={false}
          testID="breadcrumb-header"
          title={
            <Breadcrumb overflow="collapse" testID="header-trail">
              <BreadcrumbItem href="#workspace">Workspace</BreadcrumbItem>
              <BreadcrumbItem href="#engineering">
                Engineering and product development
              </BreadcrumbItem>
              <BreadcrumbItem href="#platform">Platform documentation</BreadcrumbItem>
              <BreadcrumbItem current testID="header-current">
                A long current page title that remains visible in narrow headers
              </BreadcrumbItem>
            </Breadcrumb>
          }
          actions={
            <>
              <Button
                iconOnly
                icon={RiChat3Line}
                accessibilityLabel="Comments"
                appearance="plain"
                tone="neutral"
              />
              <Button appearance="plain" tone="neutral">
                Share
              </Button>
              <Button
                iconOnly
                icon={RiMoreLine}
                accessibilityLabel="Page actions"
                appearance="plain"
                tone="neutral"
              />
            </>
          }
        />
      </View>
    </BloomScope>
  ),
};

/** Measured labels remain contained even when the source has no break opportunities. */
export const NarrowLongLabels: Story = {
  render: () => (
    <View style={{ width: '100%', gap: 24 }}>
      {[80, 111, 300].map((width) => (
        <View key={width} style={{ width }}>
          <Breadcrumb overflow="collapse" testID={`narrow-${width}`}>
            <BreadcrumbItem icon={HomeIcon} href="#home" size="lg">
              {'Ancestor'.repeat(125)}
            </BreadcrumbItem>
            <BreadcrumbItem href="#parent">Parent</BreadcrumbItem>
            <BreadcrumbItem current testID={`current-${width}`}>
              {'Current'.repeat(143)}
            </BreadcrumbItem>
          </Breadcrumb>
        </View>
      ))}
    </View>
  ),
};
