/**
 * Where the mock backend keeps file bytes (an object store such as S3 in production). Metadata lives
 * in the mock database; bytes live here under the attachment id.
 */
export interface BlobStore {
  put(key: number, blob: Blob): Promise<void>;
  get(key: number): Promise<Blob | null>;
  delete(key: number): Promise<void>;
  /** Deletes every blob whose key is not in `keep` (files of records deleted elsewhere). */
  retain(keep: ReadonlySet<number>): Promise<void>;
}

export function createMemoryBlobStore(): BlobStore {
  const blobs = new Map<number, Blob>();
  return {
    put: async (key, blob) => void blobs.set(key, blob),
    get: async (key) => blobs.get(key) ?? null,
    delete: async (key) => void blobs.delete(key),
    retain: async (keep) => {
      for (const key of [...blobs.keys()]) if (!keep.has(key)) blobs.delete(key);
    },
  };
}

const DB_NAME = 'cerebro-demo-files';
const STORE = 'blobs';

/**
 * Browser blob store on IndexedDB (localStorage could not hold files). Falls back to memory when
 * IndexedDB is unavailable (private mode, blocked storage): uploads then last for the session.
 */
export function createIndexedDbBlobStore(): BlobStore {
  if (typeof indexedDB === 'undefined') return createMemoryBlobStore();
  let opening: Promise<IDBDatabase> | null = null;
  const open = () => {
    opening ??= new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(STORE);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('IndexedDB açılamadı'));
    });
    return opening;
  };
  const run = async <T>(
    mode: IDBTransactionMode,
    action: (store: IDBObjectStore) => IDBRequest<T>,
  ): Promise<T> => {
    const db = await open();
    return new Promise<T>((resolve, reject) => {
      const request = action(db.transaction(STORE, mode).objectStore(STORE));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('IndexedDB işlemi başarısız'));
    });
  };
  const fallback = createMemoryBlobStore();
  const guard = async <T>(work: () => Promise<T>, otherwise: () => Promise<T>) => {
    try {
      return await work();
    } catch {
      return otherwise();
    }
  };
  return {
    put: (key, blob) =>
      guard(
        async () => void (await run('readwrite', (s) => s.put(blob, key))),
        () => fallback.put(key, blob),
      ),
    get: (key) =>
      guard(
        async () =>
          ((await run<unknown>('readonly', (s) => s.get(key))) as Blob | undefined) ?? null,
        () => fallback.get(key),
      ),
    delete: (key) =>
      guard(
        async () => void (await run('readwrite', (s) => s.delete(key))),
        () => fallback.delete(key),
      ),
    retain: (keep) =>
      guard(
        async () => {
          const keys = (await run('readonly', (s) => s.getAllKeys())) as number[];
          await Promise.all(
            keys
              .filter((key) => !keep.has(key))
              .map((key) => run('readwrite', (s) => s.delete(key))),
          );
        },
        () => fallback.retain(keep),
      ),
  };
}
