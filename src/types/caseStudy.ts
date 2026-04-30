import type { Timestamp } from 'firebase/firestore';

/** Caso de estudo / prova de conceito com cliente (site público + admin). */
export type CaseStudy = {
  id: string;
  titlePt: string;
  titleEn: string;
  /** Resumo do resultado (1–2 frases) */
  summaryPt: string;
  summaryEn: string;
  /** Nome do cliente ou setor (pode ser anonimizado) */
  clientLabel: string;
  published: boolean;
  order: number;
  imageUrl?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

export type CaseStudyInput = Omit<CaseStudy, 'id' | 'createdAt' | 'updatedAt'>;
