import { useEffect, useState } from 'react';
import { subscribePublishedProducts } from '@/lib/firestore/products';
import type { Product } from '@/types/product';

export function usePublishedProducts(): { products: Product[]; ready: boolean } {
  const [state, setState] = useState<{ products: Product[]; ready: boolean }>({
    products: [],
    ready: false,
  });

  useEffect(() => {
    return subscribePublishedProducts((items) => {
      setState({ products: items, ready: true });
    });
  }, []);

  return state;
}
