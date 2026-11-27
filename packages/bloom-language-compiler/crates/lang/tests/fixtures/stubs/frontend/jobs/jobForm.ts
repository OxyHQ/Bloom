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
