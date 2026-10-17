import type { ReactNode } from 'react';
export type TemplateCopyTranslator = (text: string) => string;
export interface TemplateCopyProviderProps { translate: TemplateCopyTranslator; children: ReactNode; }
