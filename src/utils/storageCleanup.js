// src/utils/storageCleanup.js
import { ref, listAll, deleteObject } from 'firebase/storage';
import { storage } from '../config/firebase';

async function deletePrefix(prefixRef) {
  const { items, prefixes } = await listAll(prefixRef);
  // Delete files in this level
  await Promise.all(items.map((itemRef) => deleteObject(itemRef).catch(() => {})));
  // Recurse into subfolders
  for (const folderRef of prefixes) {
    await deletePrefix(folderRef);
  }
}

// Best-effort deletion with optional timeout so UI isn't blocked
export async function deleteFlowStorage(userId, flowId, { timeoutMs = 3000 } = {}) {
  if (!userId || !flowId) return;
  const baseRef = ref(storage, `companies/${userId}/flows/${flowId}`);
  const task = (async () => {
    try {
      await deletePrefix(baseRef);
    } catch {
      // ignore errors to avoid blocking UI on best-effort cleanup
    }
  })();

  // Enforce a timeout so network/storage issues don't hang deletions
  if (!timeoutMs) return task;
  return Promise.race([
    task,
    new Promise((resolve) => setTimeout(resolve, timeoutMs)),
  ]);
}

export default { deleteFlowStorage };
