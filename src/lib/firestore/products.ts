import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Product, ProductInput } from '@/types/product';

export const PRODUCTS_COLLECTION = 'products';

export function productsCollectionRef() {
  if (!db) return null;
  return collection(db, PRODUCTS_COLLECTION);
}

export function subscribeAllProducts(
  onData: (items: Product[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const col = productsCollectionRef();
  if (!col) {
    onData([]);
    return () => {};
  }
  const q = query(col, orderBy('order', 'asc'));
  return onSnapshot(
    q,
    (snap) => {
      onData(
        snap.docs.map((d) => {
          const data = d.data() as Omit<Product, 'id'>;
          return { id: d.id, ...data };
        })
      );
    },
    (err) => {
      console.error('[Lancurie] products admin snapshot', err);
      onError?.(err);
      onData([]);
    }
  );
}

export function subscribePublishedProducts(
  onData: (items: Product[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const col = productsCollectionRef();
  if (!col) {
    onData([]);
    return () => {};
  }
  const q = query(col, where('published', '==', true), orderBy('order', 'asc'));
  return onSnapshot(
    q,
    (snap) => {
      onData(
        snap.docs.map((d) => {
          const data = d.data() as Omit<Product, 'id'>;
          return { id: d.id, ...data };
        })
      );
    },
    (err) => {
      console.error('[Lancurie] products public snapshot', err);
      onError?.(err);
      onData([]);
    }
  );
}

export async function createProduct(input: ProductInput): Promise<string> {
  const col = productsCollectionRef();
  if (!col) throw new Error('Firestore não disponível.');
  const ref = await addDoc(col, {
    ...input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateProduct(id: string, input: ProductInput): Promise<void> {
  if (!db) throw new Error('Firestore não disponível.');
  const ref = doc(db, PRODUCTS_COLLECTION, id);
  await updateDoc(ref, {
    ...input,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteProduct(id: string): Promise<void> {
  if (!db) throw new Error('Firestore não disponível.');
  await deleteDoc(doc(db, PRODUCTS_COLLECTION, id));
}
