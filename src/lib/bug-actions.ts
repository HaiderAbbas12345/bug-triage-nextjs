'use server';

import { revalidatePath } from 'next/cache';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import {
  BUG_SEVERITY,
  BUG_STATUS,
  type Bug,
  type BugStatus,
  canTransition,
} from '@/types';

export type ActionResult<T = unknown> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

const createSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(1).max(5000),
  stackTrace: z.string().max(10_000).optional(),
  severity: z.enum(BUG_SEVERITY),
  project: z.string().min(1).max(100),
});

const updateStatusSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/),
  status: z.enum(BUG_STATUS),
  expectedVersion: z.coerce.number().int().min(0),
});

async function bugCollection() {
  const db = await getDb();
  return db.collection('bugs');
}

function ensureIndexes(): Promise<void> {
  return bugCollection().then(async (col) => {
    await col.createIndex({ status: 1, project: 1, createdAt: -1 });
    await col.createIndex({ severity: 1, status: 1 });
  });
}

let indexesInitialized = false;
async function init(): Promise<void> {
  if (indexesInitialized) return;
  await ensureIndexes();
  indexesInitialized = true;
}

function serialize(doc: Record<string, unknown>): Bug {
  return {
    _id: String(doc._id),
    title: String(doc.title),
    description: String(doc.description),
    stackTrace: String(doc.stackTrace ?? ''),
    status: doc.status as BugStatus,
    severity: doc.severity as Bug['severity'],
    project: String(doc.project),
    version: Number(doc.version ?? 0),
    createdAt: new Date(doc.createdAt as Date).toISOString(),
    updatedAt: new Date(doc.updatedAt as Date).toISOString(),
  };
}

export async function listBugs(filter?: { status?: BugStatus }): Promise<Bug[]> {
  await init();
  const col = await bugCollection();
  const query = filter?.status ? { status: filter.status } : {};
  const docs = await col.find(query).sort({ createdAt: -1 }).limit(100).toArray();
  return docs.map(serialize);
}

export async function getBug(id: string): Promise<Bug | null> {
  if (!/^[0-9a-fA-F]{24}$/.test(id)) return null;
  const col = await bugCollection();
  const doc = await col.findOne({ _id: new ObjectId(id) });
  return doc ? serialize(doc) : null;
}

export async function createBug(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const parsed = createSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    stackTrace: formData.get('stackTrace') || undefined,
    severity: formData.get('severity'),
    project: formData.get('project'),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const col = await bugCollection();
  const now = new Date();
  const result = await col.insertOne({
    ...parsed.data,
    stackTrace: parsed.data.stackTrace ?? '',
    status: 'open' as BugStatus,
    version: 0,
    createdAt: now,
    updatedAt: now,
  });

  revalidatePath('/');
  return { ok: true, data: { id: result.insertedId.toString() } };
}

export async function updateBugStatus(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = updateStatusSchema.safeParse({
    id: formData.get('id'),
    status: formData.get('status'),
    expectedVersion: formData.get('expectedVersion'),
  });

  if (!parsed.success) {
    return { ok: false, error: 'Invalid input' };
  }

  const { id, status, expectedVersion } = parsed.data;
  const col = await bugCollection();
  const existing = await col.findOne({ _id: new ObjectId(id) });
  if (!existing) return { ok: false, error: 'Bug not found' };

  if (!canTransition(existing.status as BugStatus, status)) {
    return {
      ok: false,
      error: `Invalid transition: ${existing.status} → ${status}.`,
    };
  }

  const result = await col.updateOne(
    { _id: new ObjectId(id), version: expectedVersion },
    { $set: { status, updatedAt: new Date() }, $inc: { version: 1 } },
  );

  if (result.matchedCount === 0) {
    return {
      ok: false,
      error: 'This bug was updated by someone else. Refresh to see the latest version.',
    };
  }

  revalidatePath('/');
  revalidatePath(`/bugs/${id}`);
  return { ok: true };
}

export async function deleteBug(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '');
  if (!/^[0-9a-fA-F]{24}$/.test(id)) return;

  const col = await bugCollection();
  await col.deleteOne({ _id: new ObjectId(id) });

  revalidatePath('/');
}
