import Link from 'next/link';
import type { Bug } from '@/types';

const severityColor: Record<Bug['severity'], string> = {
  low: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  medium: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  high: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  critical: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
};

const statusColor: Record<Bug['status'], string> = {
  open: 'text-red-700 dark:text-red-400',
  investigating: 'text-amber-700 dark:text-amber-400',
  fixed: 'text-green-700 dark:text-green-400',
  wontfix: 'text-gray-500 dark:text-gray-500',
};

export function BugCard({ bug }: { bug: Bug }) {
  return (
    <Link
      href={`/bugs/${bug._id}`}
      className="block rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-colors hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-medium text-gray-900 dark:text-white">
            {bug.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
            {bug.description}
          </p>
          <div className="mt-2 flex items-center gap-2 text-xs">
            <span className="text-gray-500 dark:text-gray-400">{bug.project}</span>
            <span className="text-gray-300 dark:text-gray-700">·</span>
            <span className="text-gray-500 dark:text-gray-400">
              {new Date(bug.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${severityColor[bug.severity]}`}
          >
            {bug.severity}
          </span>
          <span className={`text-xs font-medium ${statusColor[bug.status]}`}>{bug.status}</span>
        </div>
      </div>
    </Link>
  );
}
