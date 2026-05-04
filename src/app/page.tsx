import Link from 'next/link';
import { listBugs } from '@/lib/bug-actions';
import { BUG_STATUS, type BugStatus } from '@/types';
import { BugCard } from '@/components/BugCard';
import { CreateBugForm } from '@/components/CreateBugForm';

type SearchParams = Promise<{ status?: string }>;

export default async function HomePage({ searchParams }: { searchParams: SearchParams }) {
  const { status } = await searchParams;
  const filterStatus = (BUG_STATUS as ReadonlyArray<string>).includes(status ?? '')
    ? (status as BugStatus)
    : undefined;

  const bugs = await listBugs(filterStatus ? { status: filterStatus } : undefined);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Bug Triage</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Inherited a stalled project? Start by getting every blocker out of your head and into a list.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 text-sm">
              <FilterPill href="/" active={!filterStatus}>
                All
              </FilterPill>
              {BUG_STATUS.map((s) => (
                <FilterPill key={s} href={`/?status=${s}`} active={filterStatus === s}>
                  {s}
                </FilterPill>
              ))}
            </div>

            {bugs.length === 0 && (
              <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-900">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  No bugs {filterStatus ? `with status "${filterStatus}"` : 'yet'}.
                </p>
              </div>
            )}

            <div className="space-y-2">
              {bugs.map((bug) => (
                <BugCard key={bug._id} bug={bug} />
              ))}
            </div>
          </div>

          <CreateBugForm />
        </div>
      </div>
    </div>
  );
}

function FilterPill({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? 'rounded-full bg-blue-600 px-3 py-1 font-medium text-white'
          : 'rounded-full border border-gray-300 bg-white px-3 py-1 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800'
      }
    >
      {children}
    </Link>
  );
}
