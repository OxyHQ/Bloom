import type { ComponentType, NamedExoticComponent } from "react";

const registerComponent = <
  TComponent extends ComponentType<never> | NamedExoticComponent<never>,
>(
  name: string,
  component: TComponent,
): TComponent => {
  component.displayName = name;
  return component;
};

export { registerComponent };
