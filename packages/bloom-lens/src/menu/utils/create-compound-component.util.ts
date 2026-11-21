import type { ComponentType, NamedExoticComponent } from "react";

import { registerComponent } from "./register-component.util";

const createCompoundComponent = <
  TComponent extends ComponentType<never> | NamedExoticComponent<never>,
  TCompound extends Record<string, unknown> = Record<never, never>,
>(
  name: string,
  component: TComponent,
  compound: TCompound = {} as TCompound,
): TComponent & TCompound =>
  Object.assign<TComponent, TCompound>(
    registerComponent(name, component),
    compound,
  );

export { createCompoundComponent };
