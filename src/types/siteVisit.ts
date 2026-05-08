import type { Timestamp } from 'firebase/firestore';

export type SiteVisitGeo = {
  city: string | null;
  region: string | null;
  country: string | null;
  countryCode: string | null;
  latitude: number;
  longitude: number;
};

export type SiteVisit = {
  id: string;
  path: string;
  createdAt: Timestamp | null;
  geo?: SiteVisitGeo | null;
};
