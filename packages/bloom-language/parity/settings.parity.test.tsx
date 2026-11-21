import { SETTINGS_CASES } from './settings.cases';
import { describeNativeParity } from './support/native';

describeNativeParity('The settings pages’ rows', SETTINGS_CASES);
