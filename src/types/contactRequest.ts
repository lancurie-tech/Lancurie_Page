import type { ContactNeedType } from '@/types/contactIntent';

export type ContactRequestStatus = 'new' | 'in_progress' | 'done' | 'archived';

export type ContactRequest = {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  company: string;
  needType: ContactNeedType;
  needLabel: string;
  message: string;
  privacyAccepted: boolean;
  origin: string;
  productId: string;
  productTitle: string;
  status: ContactRequestStatus;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type ContactRequestInput = {
  name: string;
  email: string;
  whatsapp: string;
  company: string;
  needType: ContactNeedType;
  needLabel: string;
  message: string;
  privacyAccepted: boolean;
  origin: string;
  productId: string;
  productTitle: string;
};
