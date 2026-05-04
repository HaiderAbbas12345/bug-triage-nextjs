'use client';

import { useActionState } from 'react';
import { updateBugStatus, type ActionResult } from '@/lib/bug-actions';
import { BUG_STATUS, type Bug, canTransition } from '@/types';

export function StatusForm({ bug }: { bug: Bug }) {
  const [state, formAction, isPending] = useActionState<ActionResult | null, FormData>(
    updateBugStatus,
    null,
  );

  return (
    <form action={formAction} className="mt-3 flex items-end gap-3">
      <input type="hidden" name="id" value={bug._id} />
      <input type="hidden" name="expectedVersion" value={bug.version} />
      <label className="block flex-1">
        <span className="block text-xs text-gray-500 dark:text-gray-400">New status</span>
        <select
          name="status"
          defaultValue={bug.status}
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        >
          {BUG_STATUS.map((s) => (
            <option key={s} value={s} disabled={!canTransition(bug.status, s)}>
              {s}
              {!canTransition(bug.status, s) ? ' (invalid transition)' : ''}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? 'Updating…' : 'Update'}
      </button>
      {state && !state.ok && (
        <p className="ml-3 text-sm text-red-600 dark:text-red-400" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
