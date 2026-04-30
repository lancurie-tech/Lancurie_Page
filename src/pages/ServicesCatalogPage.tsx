import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { OfferingCard } from '@/components/OfferingCard';
import { useI18n } from '@/i18n/useI18n';
import { resolveSiteImage } from '@/lib/siteImages';
import { productField } from '@/lib/productDisplay';
import type { Product } from '@/types/product';

function sortByOrder(products: Product[]) {
  return [...products].sort((a, b) => a.order - b.order);
}

export function ServicesCatalogPage() {
  const { publicText: p } = useI18n();
  const navigate = useNavigate();
  const clampPercent = (value: unknown, fallback = 50) => {
    const n = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(0, Math.min(100, n));
  };

  const products = useMemo<Product[]>(
    () =>
      sortByOrder(
        p.products
          .filter((prod) => prod.title.trim() || prod.tagline.trim() || prod.body.trim())
          .map((prod, i) => ({
            id: prod.id.trim() || `produto-${i + 1}`,
            titlePt: prod.title,
            titleEn: '',
            taglinePt: prod.tagline,
            taglineEn: '',
            bodyPt: prod.body,
            bodyEn: '',
            bulletsPt: prod.bullets,
            bulletsEn: '',
            order: i,
            published: true,
            imageUrl: prod.imageUrl,
            imagePosition: `${clampPercent(prod.focalX)}% ${clampPercent(prod.focalY)}%`,
          }))
      ),
    [p.products]
  );

  const fallbackCover = resolveSiteImage('cardFallback', null);

  return (
    <main className="flex-1">
      <section className="bg-[linear-gradient(180deg,#131c2f_0%,#0f1629_18%,#111a2d_54%,#121c30_100%)] py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-8 lg:px-12">
          <h1 className="font-display text-3xl font-normal tracking-tight text-zinc-100 sm:text-4xl">
            {p.services.title}
          </h1>
          <p className="mt-5 max-w-3xl text-sm leading-relaxed text-zinc-300/90 sm:text-base">{p.services.lead}</p>
          {products.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-zinc-700/50 bg-zinc-900/35 px-6 py-10 text-center">
              <p className="text-sm leading-relaxed text-zinc-400">{p.services.empty}</p>
            </div>
          ) : (
            <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => (
                <div
                  key={product.id}
                  role="link"
                  tabIndex={0}
                  onClick={() => navigate(`/servicos/${encodeURIComponent(product.id)}`)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      navigate(`/servicos/${encodeURIComponent(product.id)}`);
                    }
                  }}
                  className="mx-auto w-full max-w-[20rem] cursor-pointer sm:max-w-none"
                >
                  <OfferingCard
                    variant="teaser"
                    title={productField(product, 'title')}
                    tagline={productField(product, 'tagline')}
                    coverSrc={product.imageUrl?.trim() || undefined}
                    coverPosition={product.imagePosition}
                    fallbackCoverSrc={fallbackCover}
                    detailHref={`/servicos/${encodeURIComponent(product.id)}`}
                    ctaLabel={p.services.cta}
                  />
                </div>
              ))}
            </div>
          )}

        </div>
      </section>
    </main>
  );
}

