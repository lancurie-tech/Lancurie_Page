import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type {
  ContactRequest,
  ContactRequestInput,
  ContactRequestStatus,
} from '@/types/contactRequest';

export const CONTACT_REQUESTS_COLLECTION = 'contactRequests';

function colRef() {
  if (!db) return null;
  return collection(db, CONTACT_REQUESTS_COLLECTION);
}

export async function createContactRequest(input: ContactRequestInput): Promise<string> {
  const c = colRef();
  if (!c) throw new Error('Firestore indisponível.');
  const ref = await addDoc(c, {
    ...input,
    status: 'new',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export function subscribeAllContactRequests(
  onData: (items: ContactRequest[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const c = colRef();
  if (!c) {
    onData([]);
    return () => {};
  }
  const q = query(c, orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      onData(
        snap.docs.map((d) => {
          const data = d.data() as Omit<ContactRequest, 'id'>;
          return { id: d.id, ...data };
        })
      );
    },
    (err) => {
      console.error('[Lancurie] contactRequests snapshot', err);
      onError?.(err);
      onData([]);
    }
  );
}

export async function updateContactRequestStatus(id: string, status: ContactRequestStatus): Promise<void> {
  if (!db) throw new Error('Firestore indisponível.');
  await updateDoc(doc(db, CONTACT_REQUESTS_COLLECTION, id), {
    status,
    updatedAt: serverTimestamp(),
  });
}
