import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../button';
import { toast, ToastOutlet } from './index';

const meta: Meta = {
  title: 'Components/Toast',
};

export default meta;

type Story = StoryObj;

function ToastDemo({
  variant,
  message,
}: {
  variant: 'default' | 'success' | 'error' | 'warning' | 'info';
  message: string;
}) {
  const fire = () => {
    switch (variant) {
      case 'success':
        toast.success(message);
        return;
      case 'error':
        toast.error(message);
        return;
      case 'warning':
        toast.warning(message);
        return;
      case 'info':
        toast.info(message);
        return;
      case 'default':
      default:
        toast(message);
    }
  };

  return (
    <Button onPress={fire}>{`Show ${variant}`}</Button>
  );
}

function Outlet() {
  return <ToastOutlet />;
}

export const Basic: Story = {
  render: () => (
    <View style={{ gap: 12, alignItems: 'flex-start' }}>
      <ToastDemo variant="default" message="Saved" />
      <Outlet />
    </View>
  ),
};

export const Success: Story = {
  render: () => (
    <View style={{ gap: 12, alignItems: 'flex-start' }}>
      <ToastDemo variant="success" message="Profile updated" />
      <Outlet />
    </View>
  ),
};

export const ErrorToast: Story = {
  name: 'Error',
  render: () => (
    <View style={{ gap: 12, alignItems: 'flex-start' }}>
      <ToastDemo variant="error" message="Network error" />
      <Outlet />
    </View>
  ),
};

export const Warning: Story = {
  render: () => (
    <View style={{ gap: 12, alignItems: 'flex-start' }}>
      <ToastDemo variant="warning" message="Storage almost full" />
      <Outlet />
    </View>
  ),
};

export const Info: Story = {
  render: () => (
    <View style={{ gap: 12, alignItems: 'flex-start' }}>
      <ToastDemo variant="info" message="New version available" />
      <Outlet />
    </View>
  ),
};

export const Composition: Story = {
  render: () => (
    <View style={{ gap: 12, alignItems: 'flex-start' }}>
      <ToastDemo variant="default" message="Default" />
      <ToastDemo variant="success" message="Success" />
      <ToastDemo variant="error" message="Error" />
      <ToastDemo variant="warning" message="Warning" />
      <ToastDemo variant="info" message="Info" />
      <Outlet />
    </View>
  ),
};
