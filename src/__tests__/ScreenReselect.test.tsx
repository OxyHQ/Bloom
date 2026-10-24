import { act, fireEvent, render } from '@testing-library/react-native';
import { Screen } from '../screen';
import { Tabs, TabsTrigger } from '../tabs';
import {
  ScreenReselectScope,
  useRegisterScreenScroller,
  useScreenReselect,
  useScreenReselectHandler,
} from '../screen/reselect';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

let offset = 0;
const scrollToOffset = jest.fn();
const refresh = jest.fn();
let reselect = () => {};

function Page({ active }: { active: boolean }) {
  useRegisterScreenScroller({ offset: () => offset, scrollToOffset }, active);
  useScreenReselectHandler({ refresh });
  return null;
}
function Trigger() {
  reselect = useScreenReselect();
  return null;
}

function mount(active = true) {
  render(
    <BloomThemeProvider mode="light">
      <ScreenReselectScope>
        <Trigger />
        <Screen active={active} scroll="none">
          <Page active={active} />
        </Screen>
      </ScreenReselectScope>
    </BloomThemeProvider>,
  );
}

beforeEach(() => {
  offset = 0;
  jest.clearAllMocks();
});

it('takes the screen in front back to its top, and reloads it once it is there', () => {
  mount();
  offset = 300;
  act(() => reselect());
  expect(scrollToOffset).toHaveBeenCalledWith(0);
  expect(refresh).not.toHaveBeenCalled();
  offset = 0;
  act(() => reselect());
  expect(refresh).toHaveBeenCalledTimes(1);
});

it('never answers for a screen that is not the active one', () => {
  mount(false);
  act(() => reselect());
  expect(scrollToOffset).not.toHaveBeenCalled();
  expect(refresh).not.toHaveBeenCalled();
});

it('reselects the screen from the open inner tab, and still selects the others', () => {
  const select = jest.fn();
  const screen = render(
    <BloomThemeProvider mode="light">
      <ScreenReselectScope>
        <Screen scroll="none">
          <Page active />
          <Tabs value="a" onValueChange={select} pressOpenTab="reselect">
            <TabsTrigger value="a" label="A" />
            <TabsTrigger value="b" label="B" />
          </Tabs>
        </Screen>
      </ScreenReselectScope>
    </BloomThemeProvider>,
  );
  fireEvent.press(screen.getByLabelText('A'));
  expect(refresh).toHaveBeenCalledTimes(1);
  expect(select).not.toHaveBeenCalled();
  fireEvent.press(screen.getByLabelText('B'));
  expect(select).toHaveBeenCalledWith('b');
});

it('answers for the screen beneath again once the one pushed over it leaves', () => {
  const below = jest.fn();
  const above = jest.fn();
  const tree = (pushed: boolean) => (
    <BloomThemeProvider mode="light">
      <ScreenReselectScope>
        <Trigger />
        <Screen scroll="none" reselect={{ refresh: below }} />
        {pushed ? <Screen scroll="none" reselect={{ refresh: above }} /> : null}
      </ScreenReselectScope>
    </BloomThemeProvider>
  );
  const view = render(tree(true));
  act(() => reselect());
  expect(above).toHaveBeenCalledTimes(1);
  expect(below).not.toHaveBeenCalled();
  view.rerender(tree(false));
  act(() => reselect());
  expect(below).toHaveBeenCalledTimes(1);
});
