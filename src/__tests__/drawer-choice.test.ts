import { closingOnChoice } from '../app-shell/drawer-choice';

it('closes the drawer before the logo takes the reader home', () => {
  const order: string[] = [];
  const sidebar = closingOnChoice({ logo: { icon: null, onPress: () => order.push('home') } }, () =>
    order.push('close'),
  );
  sidebar.logo?.onPress?.();
  expect(order).toEqual(['close', 'home']);
});
