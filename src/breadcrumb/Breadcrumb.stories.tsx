import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Breadcrumb, BreadcrumbItem } from './index';
import { RiHome5Line as HomeIcon, RiSettings3Line, RiUserLine } from '../icons/remix';

const meta: Meta<typeof Breadcrumb> = {
  title: 'Base/Breadcrumb',
  component: Breadcrumb,
};

export default meta;

type Story = StoryObj<typeof Breadcrumb>;

/** A link with an icon, a button, and the current page. Hover the first two. */
export const Basic: Story = {
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
