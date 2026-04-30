import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import type { SiteImageKey } from '@/data/siteImageConfig';
import { storage } from '@/lib/firebase/config';

/** Caminho fixo por chave: novo upload substitui o objeto (sem acumular ficheiros). */
const STORAGE_PREFIX = 'siteCopy/images';

export const SITE_IMAGE_UPLOAD_MAX_BYTES = 5 * 1024 * 1024;

export function siteImageStorageRef(key: SiteImageKey) {
  if (!storage) throw new Error('Firebase Storage não está configurado.');
  return ref(storage, `${STORAGE_PREFIX}/${key}`);
}

export function isFirebaseStorageDownloadUrl(url: string): boolean {
  return url.includes('firebasestorage.googleapis.com');
}

/** Remove o ficheiro gerido nesta chave (ignora se não existir). */
export async function deleteManagedSiteImageObject(key: SiteImageKey): Promise<void> {
  if (!storage) return;
  try {
    await deleteObject(siteImageStorageRef(key));
  } catch (e: unknown) {
    const code = e && typeof e === 'object' && 'code' in e ? String((e as { code: string }).code) : '';
    if (code !== 'storage/object-not-found') throw e;
  }
}

export async function uploadSiteImageFile(key: SiteImageKey, file: File): Promise<string> {
  if (file.size > SITE_IMAGE_UPLOAD_MAX_BYTES) {
    throw new Error(`Ficheiro demasiado grande (máx. ${SITE_IMAGE_UPLOAD_MAX_BYTES / (1024 * 1024)} MB).`);
  }
  const r = siteImageStorageRef(key);
  await uploadBytes(r, file, { contentType: file.type || 'application/octet-stream' });
  return getDownloadURL(r);
}

/**
 * Ao gravar o Firestore: apaga o blob em `siteCopy/images/{key}` quando o site deixa de usar
 * um ficheiro no Storage para essa chave (campo vazio ou URL externa /public). Re-upload na
 * mesma chave já substituiu o objeto; se `next` continua a ser URL do Storage, não apaga.
 */
export async function syncSiteImageStorageOnPersist(args: {
  key: SiteImageKey;
  next: string;
  prev: string;
}): Promise<void> {
  const { key, next, prev } = args;
  if (next === prev) return;
  const nextFb = Boolean(next && isFirebaseStorageDownloadUrl(next));

  if (!next) {
    await deleteManagedSiteImageObject(key);
    return;
  }

  if (!nextFb) {
    await deleteManagedSiteImageObject(key);
    return;
  }
}
