'use client';

import { useActionState, useEffect, useRef } from 'react';
import { createBug, type ActionResult } from '@/lib/bug-actions';
import { BUG_SEVERITY } from '@/types';

export function CreateBugForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState<ActionResult<{ id: string }> | null, FormData>(
    createBug,
    null,
  );

  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900"
    >
      <h2 className="text-sm font-medium text-gray-900 dark:text-white">Log a bug</h2>

      <input
        name="title"
        type="text"
        required
        minLength={3}
        maxLength={200}
        placeholder="Title"
        className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
      />

      <textarea
        name="description"
        required
        rows={3}
        maxLength={5000}
        placeholder="What's broken? When does it happen? Steps to reproduce."
        className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
      />

      <textarea
        name="stackTrace"
        rows={3}
        maxLength={10_000}
        placeholder="Stack trace (optional)"
        className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 font-mono text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white"
      />

      <div className="grid grid-cols-2 gap-3">
        <input
          name="project"
          type="text"
          required
          maxLength={100}
          placeholder="Project (e.g. api-gateway)"
          className="block rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />

        <select
          name="severity"
          defaultValue="medium"
          className="block rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        >
          {BUG_SEVERITY.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {state && !state.ok && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? 'Logging…' : 'Log bug'}
      </button>
    </form>
  );
}
