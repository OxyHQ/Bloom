import {
  vectorShapeImports,
  vectorEyeImports,
  vectorEyewearImports,
  vectorAccessoryImports,
  vectorTemplateImports,
} from './vector-asset-imports';
import { createVectorAssetLoader } from './vector-loader';

/** Every vector asset Bloom ships. Importing this module links all of them; see `default-catalog.ts`. */
export const vectorAssetLoader = createVectorAssetLoader({
  shape: vectorShapeImports,
  eyes: vectorEyeImports,
  eyewear: vectorEyewearImports,
  accessory: vectorAccessoryImports,
  template: vectorTemplateImports,
});
