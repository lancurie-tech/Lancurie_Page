import type { Timestamp } from 'firebase/firestore';

/** Produto editável no admin e listado no site quando `published`. */
export type Product = {
  id: string;
  titlePt: string;
  titleEn: string;
  taglinePt: string;
  taglineEn: string;
  bodyPt: string;
  bodyEn: string;
  bulletsPt: string;
  bulletsEn: string;
  /** Ordem no catálogo e na secção da Home (menor = primeiro). */
  order: number;
  published: boolean;
  /** URL opcional de imagem de capa (ex. Storage ou CDN). */
  imageUrl?: string;
  /** `object-position` da capa (ex.: `42% 30%`) para controlar o recorte no card. */
  imagePosition?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

export type ProductInput = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;
