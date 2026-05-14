import { useMemo } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useI18n } from '@/i18n/useI18n';
import { parseBulletBlock, splitBodyParagraphs } from '@/lib/formatProductDetailContent';
import { cn } from '@/lib/cn';

export function ServiceDetailPage() {
  const { productId: rawId } = useParams();
  const productId = rawId ? decodeURIComponent(rawId) : '';
  const { publicText: p } = useI18n();

  const product = useMemo(
    () => p.products.find((prod) => (prod.id.trim() || '').toLowerCase() === productId.toLowerCase()),
    [p.products, productId]
  );

  if (!productId) {
    return <Navigate to="/" replace />;
  }

  if (!product) {
    return <Navigate to="/" replace />;
  }

  const title = product.title;
  const tagline = product.tagline;
  const body = product.body;
  const bullets = product.bullets;
  const cover = product.imageUrl?.trim();

  const bodyParagraphs = splitBodyParagraphs(body);
  const bulletBlock = bullets ? parseBulletBlock(bullets) : null;
  const hasBulletContent =
    bulletBlock &&
    (bulletBlock.kind === 'list'
      ? bulletBlock.items.length > 0
      : bulletBlock.text.length > 0);
  return (
    <main className="flex-1 lancurie-band-c">
      <article className="mx-auto max-w-6xl px-4 py-12 sm:px-8 sm:py-16 lg:px-12">
        <div
          className={cn(
            'grid gap-8 lg:items-start lg:gap-12',
            cover ? 'lg:grid-cols-[minmax(0,1fr)_minmax(30rem,48%)]' : 'lg:grid-cols-1'
          )}
        >
          <div className="min-w-0">
            <header className="max-w-3xl">
              <h1 className="font-display text-3xl font-semibold tracking-tight text-zinc-100 sm:text-4xl">
                {title}
              </h1>
              {tagline ? (
                <p className="mt-4 text-lg font-medium leading-relaxed text-pretty text-justify text-zinc-400 sm:text-xl">{tagline}</p>
              ) : null}
            </header>

            {cover ? (
              <figure className="mt-6 w-full lg:hidden">
                <div className="overflow-hidden rounded-2xl border border-zinc-700/60 shadow-[0_24px_54px_-26px_rgba(0,0,0,0.65)]">
                  <img
                    src={cover}
                    alt=""
                    className="aspect-16/10 max-h-112 w-full object-cover"
                    loading="lazy"
                  />
                </div>
              </figure>
            ) : null}

            {bodyParagraphs.length > 0 ? (
              <div className="mt-8 max-w-3xl space-y-5 lg:mt-10">
                {bodyParagraphs.map((para, i) => (
                  <p key={i} className="text-base leading-relaxed text-pretty text-justify text-zinc-400">
                    {para}
                  </p>
                ))}
              </div>
            ) : null}

            {hasBulletContent && bulletBlock ? (
              <section className="mt-8 max-w-3xl border-t border-zinc-800/90 pt-8 lg:mt-10">
                {bulletBlock.kind === 'list' ? (
                  <ul className="list-disc space-y-3 pl-5 text-sm leading-relaxed marker:text-zinc-600 sm:text-base">
                    {bulletBlock.items.map((item, i) => (
                      <li key={i} className="text-pretty text-justify text-zinc-400">
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="whitespace-pre-line text-base leading-relaxed text-pretty text-justify text-zinc-400">
                    {bulletBlock.text}
                  </div>
                )}
              </section>
            ) : null}
          </div>

          {cover ? (
            <figure className="mx-auto hidden w-full max-w-xl self-start lg:mx-0 lg:block lg:max-w-none">
              <div className="overflow-hidden rounded-2xl border border-zinc-700/60 shadow-[0_24px_54px_-26px_rgba(0,0,0,0.65)]">
                <img
                  src={cover}
                  alt=""
                  className="aspect-16/10 max-h-112 w-full object-cover"
                  loading="lazy"
                />
              </div>
            </figure>
          ) : null}
        </div>
      </article>
    </main>
  );
}
