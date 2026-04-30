import type { Product } from '@/types/product';

type Field = 'title' | 'tagline' | 'body' | 'bullets';

/** Texto em português; se PT vazio, usa EN. */
export function productField(product: Product, field: Field): string {
  const pt = (product[`${field}Pt` as keyof Product] as string | undefined)?.trim() ?? '';
  const en = (product[`${field}En` as keyof Product] as string | undefined)?.trim() ?? '';
  if (pt) return pt;
  if (en) return en;
  return '';
}
