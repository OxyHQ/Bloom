import { useArgs } from 'storybook/preview-api';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { BottomBar } from './BottomBar.web';
import { Fab } from '../fab/index.web';
import * as Icons from '../icons';
const meta: Meta<typeof BottomBar> = { title: 'Navigation/BottomBar', component: BottomBar, args: { value: 'home', material: 'translucent', actionBehavior: 'hide', actionPlacement: 'auto' }, argTypes: { actionPlacement: { control: 'select', options: ['auto','beside','above'] },
    "value": { control: 'select', options: ['home', 'search'] },
    "blur": { control: 'boolean' },
    "maxWidth": { control: 'number' }, actionBehavior: { control: 'select', options: ['hide', 'visible'] }, material: { control: 'select', options: ['solid', 'translucent'] } } };
export default meta;
type Story = StoryObj<typeof BottomBar>;
function Demo(props: Partial<React.ComponentProps<typeof BottomBar>>) {
  return <View style={{ height: 220, width: 390, maxWidth: '100%', justifyContent: 'flex-end' }}>
    <BottomBar items={[{ name: 'home', label: 'Home', icon: <Icons.RiHomeLine /> }, { name: 'search', label: 'Explore', icon: <Icons.RiSearchLine /> }]}
      value="home" onValueChange={() => {}} action={<Fab icon={Icons.RiAddLine} accessibilityLabel="Create" />} {...props} />
  </View>;
}
export const Default: Story = {
  parameters: { controls: { include: ['value', 'blur', 'maxWidth', 'material', 'actionBehavior', 'actionPlacement'] } },
  render: function Render(args) {
    const [, updateArgs] = useArgs();
    return <Demo {...args} onValueChange={value => updateArgs({ value })} />;
  },
};
export const ActionOnly: Story = {
  parameters: { controls: { include: ['blur', 'material'] } },
  render: args => <Demo {...args} items={[]} />,
};

export const NarrowWithAction: Story = {
  render: function NarrowWithAction(args) {
    const [,updateArgs] = useArgs();
    return <View style={{width:300,maxWidth:'100%',height:240,justifyContent:'flex-end'}}><BottomBar {...args} testID="narrow-bottom-bar" items={[
      {name:'home',label:'Home',icon:<Icons.RiHomeLine/>}, {name:'search',label:'Explore',icon:<Icons.RiSearchLine/>},
      {name:'saved',label:'Saved',icon:<Icons.RiBookmarkLine/>}, {name:'profile',label:'Profile',icon:<Icons.RiUserLine/>},
    ]} onValueChange={value=>updateArgs({value})} action={<Fab icon={Icons.RiAddLine} accessibilityLabel="Create"/>}/></View>;
  },
};
