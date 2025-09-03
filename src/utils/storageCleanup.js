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

export async function deleteFlowStorage(userId, flowId) {
  if (!userId || !flowId) return;
  const baseRef = ref(storage, `companies/${userId}/flows/${flowId}`);
  try {
    await deletePrefix(baseRef);
  } catch {
    // ignore errors to avoid blocking UI on best-effort cleanup
  }
}

export default { deleteFlowStorage };
