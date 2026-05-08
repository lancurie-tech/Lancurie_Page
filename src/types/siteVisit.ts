import type { Timestamp } from 'firebase/firestore';

export type SiteVisit = {
  id: string;
  path: string;
  createdAt: Timestamp | null;
};
