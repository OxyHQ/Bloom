// A trimmed copy of Mention's `useJobForm`: a hook with no annotated result, as TS infers it.
import { useCallback, useState } from 'react';

export interface LoadedJob {
  title: string;
  skills?: string[];
}

export function useJobForm() {
  const [title, setTitle] = useState('');
  const [salaryMin, setSalaryMin] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [workplaceType, setWorkplaceType] = useState<'remote' | 'onsite' | ''>('');

  const hydrate = useCallback((job: LoadedJob) => {
    setTitle(job.title);
    setSkills(job.skills ?? []);
  }, []);

  const min = salaryMin.trim() ? Number(salaryMin) : undefined;
  const salary = min !== undefined ? { min, currency: 'USD' } : undefined;
  const isComplete = Boolean(title.trim()) && skills.length > 0;

  return {
    title,
    setTitle,
    salaryMin,
    setSalaryMin,
    skills,
    setSkills,
    workplaceType,
    setWorkplaceType,
    hydrate,
    salary,
    isComplete,
  };
}

export type JobForm = ReturnType<typeof useJobForm>;

/** A constant of the module, unannotated: its initializer's type. */
export const HEADER_CONTENT_GAP = 12;

type RobotsDirective = string & { readonly kind?: 'robots' };

/** A hook whose member is the optional of a type Bloom does not map: TS's to check. */
export function useJobSeo(robots?: RobotsDirective) {
  return { robots };
}

/** An integer constant: an `Int`. */
export const MAX_SKILLS = 4;

/** A record that may be absent, whose member Bloom does not map. */
export declare function seoServer(): { robots: RobotsDirective } | undefined;
