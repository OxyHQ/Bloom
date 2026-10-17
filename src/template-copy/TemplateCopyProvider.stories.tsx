import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { TemplateCopyProvider } from './TemplateCopyProvider';
import { TaskList } from '../task-list';
const copy: Record<string,string> = { 'Task list':'Lista de tareas', 'Add task':'Añadir tarea', 'Prepare launch':'Preparar lanzamiento' };
const meta: Meta<typeof TemplateCopyProvider> = { title: 'Foundation/Template Copy', component: TemplateCopyProvider };
export default meta;
type Story = StoryObj<typeof TemplateCopyProvider>;
export const Spanish: Story = { render: () => <TemplateCopyProvider translate={text=>copy[text]??text}><TaskList tasks={[{title:'Prepare launch',steps:[{label:'Prepare launch'}]}]} /></TemplateCopyProvider> };
