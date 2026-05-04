export const BUG_STATUS = ['open', 'investigating', 'fixed', 'wontfix'] as const;
export type BugStatus = (typeof BUG_STATUS)[number];

export const BUG_SEVERITY = ['low', 'medium', 'high', 'critical'] as const;
export type BugSeverity = (typeof BUG_SEVERITY)[number];

export type Bug = {
  _id: string;
  title: string;
  description: string;
  stackTrace: string;
  status: BugStatus;
  severity: BugSeverity;
  project: string;
  version: number;
  createdAt: string;
  updatedAt: string;
};

export const VALID_TRANSITIONS: Record<BugStatus, ReadonlyArray<BugStatus>> = {
  open: ['investigating', 'wontfix'],
  investigating: ['fixed', 'open', 'wontfix'],
  fixed: ['open'],
  wontfix: ['open'],
};

export function canTransition(from: BugStatus, to: BugStatus): boolean {
  if (from === to) return true;
  return VALID_TRANSITIONS[from].includes(to);
}
