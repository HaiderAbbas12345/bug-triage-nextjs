import Link from 'next/link';
import { notFound } from 'next/navigation';
import { deleteBug, getBug } from '@/lib/bug-actions';
import { StatusForm } from './status-form';

type Params = Promise<{ id: string }>;

export default async function BugDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const bug = await getBug(id);
  if (!bug) notFound();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="mx-auto max-w-3xl px-6 py-8">
        <Link
          href="/"
          className="text-sm text-blue-600 hover:underline dark:text-blue-400"
        >
          ← All bugs
        </Link>

        <header className="mt-4">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span>{bug.project}</span>
            <span>·</span>
            <span>severity: {bug.severity}</span>
            <span>·</span>
            <span>v{bug.version}</span>
          </div>
          <h1 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
            {bug.title}
          </h1>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Logged {new Date(bug.createdAt).toLocaleString()} · Updated{' '}
            {new Date(bug.updatedAt).toLocaleString()}
          </p>
        </header>

        <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200">
            {bug.description}
          </p>
        </section>

        {bug.stackTrace && (
          <section className="mt-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Stack trace</h2>
            <pre className="mt-2 overflow-x-auto rounded-md bg-gray-50 p-3 font-mono text-xs text-gray-800 dark:bg-gray-950 dark:text-gray-200">
              {bug.stackTrace}
            </pre>
          </section>
        )}

        <section className="mt-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Update status</h2>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Optimistic concurrency: the form submits the version it was rendered with. If the bug
            was updated by someone else, the change is rejected.
          </p>
          <StatusForm bug={bug} />
        </section>

        <form action={deleteBug} className="mt-4">
          <input type="hidden" name="id" value={bug._id} />
          <button
            type="submit"
            className="text-xs text-red-600 hover:underline dark:text-red-400"
          >
            Delete this bug
          </button>
        </form>
      </div>
    </div>
  );
}
