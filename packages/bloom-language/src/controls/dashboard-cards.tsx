import {
  ImportantAlertsCard as BloomImportantAlertsCard,
  type ImportantAlertsCardAlert,
  type ImportantAlertsCardProps,
} from '@oxy.so/bloom/important-alerts-card';
import {
  PatientInfoCard as BloomPatientInfoCard,
  type PatientInfoCardDetail,
  type PatientInfoCardProps,
} from '@oxy.so/bloom/patient-info-card';

import { Node, type ViewModifiers } from '../node';
import type { SpaceToken } from '../tokens';
import type { ControlRenderer } from './draw';
import { product } from './product';

/** The dashboard's fixed-height cards: alerts and a profile. */
export type DashboardCardKind = 'importantAlertsCard' | 'patientInfoCard';

type Drawn = 'style' | 'testID';

/** Bloom `ImportantAlertsCard`'s data; its height a space token. */
export type ImportantAlertsCardOptions = Omit<
  ImportantAlertsCardProps,
  Drawn | 'alerts' | 'count' | 'height'
> & { readonly height?: SpaceToken };
/** Bloom `PatientInfoCard`'s data; its height a space token. */
export type PatientInfoCardOptions = Omit<
  PatientInfoCardProps,
  Drawn | 'name' | 'details' | 'height'
> & { readonly height?: SpaceToken };

export type ImportantAlertsCardView = ViewModifiers<ImportantAlertsCardView>;
export type PatientInfoCardView = ViewModifiers<PatientInfoCardView>;

/** Bloom `ImportantAlertsCard`: `count` alerts, the feed `alerts`. */
export function ImportantAlertsCard(
  alerts: readonly ImportantAlertsCardAlert[],
  count: number | string,
  options: ImportantAlertsCardOptions = {},
): ImportantAlertsCardView {
  return new Node('importantAlertsCard', { alerts, count, options }, []);
}
/** Bloom `PatientInfoCard`: `name` and its detail rows. */
export function PatientInfoCard(
  name: string,
  details: readonly PatientInfoCardDetail[],
  options: PatientInfoCardOptions = {},
): PatientInfoCardView {
  return new Node('patientInfoCard', { name, details, options }, []);
}

export const DASHBOARD_CARDS: Record<DashboardCardKind, ControlRenderer> = {
  importantAlertsCard: product(BloomImportantAlertsCard, { lengths: ['height'] }),
  patientInfoCard: product(BloomPatientInfoCard, { lengths: ['height'] }),
};
