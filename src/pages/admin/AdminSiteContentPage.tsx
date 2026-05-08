import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import type { SiteImageKey } from '@/data/siteImageConfig';
import { useSiteCopy } from '@/contexts/useSiteCopy';
import { firebaseReady, storage } from '@/lib/firebase/config';
import { SITE_IMAGE_UPLOAD_MAX_BYTES, uploadSiteImageFile } from '@/lib/firebase/siteImageStorage';
import { patchSiteCopyImage, saveAdminSiteDraft, buildDraftFromDoc, type AdminSiteDraft } from '@/lib/firestore/siteCopy';
import { mergeSiteImageOverrides, resolveSiteImage } from '@/lib/siteImages';
import { mergeSitePublicContent } from '@/lib/sitePublicContentMerge';
import { HomePageView } from '@/pages/HomePageView';
import { cn } from '@/lib/cn';

type HomeContentAccordionSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
  defaultOpen?: boolean;
};

function HomeContentAccordionSection({ title, description, children, defaultOpen = false }: HomeContentAccordionSectionProps) {
  return (
    <details
      open={defaultOpen}
      className="group mb-4 overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-950/35"
    >
      <summary className="flex cursor-pointer list-none items-start justify-between gap-3 px-3 py-4 sm:px-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-200">{title}</h2>
          {description ? <p className="mt-1 text-xs leading-relaxed text-zinc-500">{description}</p> : null}
        </div>
        <ChevronDown
          className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500 transition-transform duration-200 group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <div className="border-t border-zinc-800/80 px-3 py-4 sm:px-4">{children}</div>
    </details>
  );
}

export function AdminSiteContentPage() {
  const { doc, ready, loadError } = useSiteCopy();
  const hydrated = useRef(false);

  const [draft, setDraft] = useState<AdminSiteDraft>(() => buildDraftFromDoc(null));
  const draftRef = useRef(draft);
  draftRef.current = draft;

  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [imageUploading, setImageUploading] = useState<Partial<Record<SiteImageKey, boolean>>>({});
  const [homeProductImageUploading, setHomeProductImageUploading] = useState<Record<number, boolean>>({});
  const [previewOpen, setPreviewOpen] = useState(false);
  const [cropEditor, setCropEditor] = useState<{ index: number; x: number; y: number } | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(null);
  const cropDragRef = useRef<{
    pointerId: number;
    rect: DOMRect;
    startClientX: number;
    startClientY: number;
    startX: number;
    startY: number;
    moved: boolean;
  } | null>(null);

  useEffect(() => {
    if (!ready || hydrated.current) return;
    hydrated.current = true;
    const d = buildDraftFromDoc(doc);
    setDraft(d);
    setSavedSnapshot(JSON.stringify(d));
    setLastSavedAt(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
  }, [ready, doc]);

  const setImage = useCallback((key: SiteImageKey, value: string) => {
    setDraft((d) => ({
      ...d,
      images: { ...d.images, [key]: value },
    }));
  }, []);

  const onPickSiteImageFile = useCallback(
    async (key: SiteImageKey, file: File | null) => {
      if (!file) return;
      if (!firebaseReady) {
        setBanner({ type: 'err', text: 'Firebase não está configurado (.env).' });
        return;
      }
      setBanner(null);
      setImageUploading((m) => ({ ...m, [key]: true }));
      try {
        const url = await uploadSiteImageFile(key, file);
        await patchSiteCopyImage(key, url);
        setImage(key, url);
        setBanner({
          type: 'ok',
          text: 'Imagem enviada e guardada. O ficheiro anterior nesta posição foi substituído no Storage.',
        });
      } catch (e) {
        setBanner({
          type: 'err',
          text: e instanceof Error ? e.message : 'Não foi possível enviar a imagem.',
        });
      } finally {
        setImageUploading((m) => ({ ...m, [key]: false }));
      }
    },
    [setImage]
  );

  const onPickHomeProductImageFile = useCallback(async (index: number, file: File | null) => {
    if (!file) return;
    if (!firebaseReady || !storage) {
      setBanner({ type: 'err', text: 'Firebase Storage não está configurado.' });
      return;
    }
    if (file.size > SITE_IMAGE_UPLOAD_MAX_BYTES) {
      setBanner({
        type: 'err',
        text: `Ficheiro demasiado grande (máx. ${SITE_IMAGE_UPLOAD_MAX_BYTES / (1024 * 1024)} MB).`,
      });
      return;
    }
    setBanner(null);
    setHomeProductImageUploading((m) => ({ ...m, [index]: true }));
    try {
      const objectRef = ref(storage, `site/assets/products/product-${index + 1}`);
      await uploadBytes(objectRef, file, { contentType: file.type || 'application/octet-stream' });
      const url = await getDownloadURL(objectRef);
      setDraft((d) => ({
        ...d,
        publicContent: {
          ...d.publicContent,
          products: d.publicContent.products.map((prod, i) => (i === index ? { ...prod, imageUrl: url } : prod)) as typeof d.publicContent.products,
        },
      }));
      setBanner({ type: 'ok', text: 'Imagem do produto enviada para o Firebase Storage.' });
    } catch (e) {
      setBanner({
        type: 'err',
        text: e instanceof Error ? e.message : 'Não foi possível enviar a imagem do produto.',
      });
    } finally {
      setHomeProductImageUploading((m) => ({ ...m, [index]: false }));
    }
  }, []);

  const mergedSiteImages = useMemo(
    () => mergeSiteImageOverrides(doc?.images, draft.images),
    [doc?.images, draft.images]
  );

  const previewText = useMemo(() => draft.publicContent, [draft.publicContent]);
  const setPublicContent = useCallback(
    (updater: (prev: AdminSiteDraft['publicContent']) => AdminSiteDraft['publicContent']) => {
      setDraft((d) => ({ ...d, publicContent: updater(d.publicContent) }));
    },
    []
  );
  const clampPercent = useCallback((value: number) => Math.max(0, Math.min(100, value)), []);

  const hasUnsavedChanges = useMemo(() => {
    if (!savedSnapshot) return false;
    return JSON.stringify(draft) !== savedSnapshot;
  }, [draft, savedSnapshot]);
  const subnavProcessLabel = draft.publicContent.nav.process.trim() || draft.publicContent.nav.approach.trim() || 'Processo';
  const subnavServicesLabel = draft.publicContent.nav.services.trim() || 'Serviços';
  const subnavProofLabel = draft.publicContent.nav.proof.trim() || 'Destaques';
  const subnavContactLabel = draft.publicContent.nav.contact.trim() || 'Contato';
  const cropTarget = cropEditor ? draft.publicContent.products[cropEditor.index] : null;

  const renderImageEditor = useCallback(
    (key: SiteImageKey, label: string, hint?: string) => {
      const resolved = resolveSiteImage(key, mergedSiteImages);
      return (
        <div className="rounded-lg border border-zinc-800/90 bg-zinc-950/50 p-3">
          <label className="block text-xs font-medium text-zinc-300" htmlFor={`site-img-${key}`}>
            {label}
          </label>
          {hint ? <p className="mt-0.5 text-[0.65rem] leading-snug text-zinc-600">{hint}</p> : null}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <label
              className={cn(
                'inline-flex cursor-pointer items-center rounded-md border border-zinc-600 bg-zinc-900/80 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:border-zinc-500',
                (!firebaseReady || imageUploading[key]) && 'pointer-events-none cursor-not-allowed opacity-50'
              )}
            >
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                disabled={!firebaseReady || imageUploading[key]}
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  e.target.value = '';
                  void onPickSiteImageFile(key, f);
                }}
              />
              {imageUploading[key] ? 'A enviar…' : 'Enviar ficheiro'}
            </label>
          </div>
          <input
            id={`site-img-${key}`}
            type="text"
            inputMode="url"
            autoComplete="off"
            placeholder={resolveSiteImage(key, null)}
            value={draft.images[key] ?? ''}
            onChange={(e) => setImage(key, e.target.value)}
            className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-900/80 px-2 py-1.5 font-mono text-[0.7rem] text-zinc-100 placeholder:text-zinc-600"
          />
          <div className="mt-2 flex items-center gap-2">
            <img
              src={resolved}
              alt=""
              className="h-12 max-w-24 rounded border border-zinc-800 object-contain"
              loading="lazy"
            />
            <span className="truncate text-[0.65rem] text-zinc-600" title={resolved}>
              {resolved.length > 48 ? `${resolved.slice(0, 46)}…` : resolved}
            </span>
          </div>
        </div>
      );
    },
    [draft.images, imageUploading, mergedSiteImages, onPickSiteImageFile, setImage]
  );

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges || saving) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [hasUnsavedChanges, saving]);

  async function onSave() {
    const merged = mergeSitePublicContent(draftRef.current.publicContent);
    const toSave: AdminSiteDraft = { ...draftRef.current, publicContent: merged };
    setDraft(toSave);
    setBanner(null);
    setSaving(true);
    try {
      await saveAdminSiteDraft(toSave);
      setSavedSnapshot(JSON.stringify(toSave));
      setLastSavedAt(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
      setBanner({ type: 'ok', text: 'Alterações guardadas.' });
    } catch (e) {
      setBanner({
        type: 'err',
        text: e instanceof Error ? e.message : 'Não foi possível guardar.',
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="-mx-4 -mt-2 flex min-h-0 flex-col sm:-mx-6">
      <header className="sticky top-0 z-40 mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/90 bg-[#050508]/95 px-2 py-3 backdrop-blur-md sm:px-0">
        <div>
          <h1 className="font-display text-lg font-normal tracking-tight text-zinc-100 sm:text-xl">Conteúdo do site</h1>
          <p className="hidden text-xs text-zinc-500 sm:block">
            Textos e imagens da página inicial. A fonte após guardar é o Firebase. Use{' '}
            <strong>Abrir pré-visualização</strong> para rever antes de guardar.
          </p>
        </div>
        <div className="flex max-w-2xl flex-1 flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="rounded-lg border border-zinc-600 bg-zinc-900/80 px-3 py-2 text-sm font-medium text-zinc-200 hover:border-zinc-500"
          >
            Abrir pré-visualização
          </button>
          <span
            className={cn(
              'rounded-md border px-2.5 py-1 text-[0.68rem]',
              saving
                ? 'border-zinc-600 bg-zinc-900 text-zinc-300'
                : hasUnsavedChanges
                  ? 'border-amber-700/60 bg-amber-950/30 text-amber-200'
                  : 'border-emerald-700/60 bg-emerald-950/30 text-emerald-200'
            )}
          >
            {saving
              ? 'A guardar...'
              : hasUnsavedChanges
                ? 'Alterações pendentes'
                : lastSavedAt
                  ? `Sem alterações · salvo às ${lastSavedAt}`
                  : 'Sem alterações'}
          </span>
          <button
            type="button"
            onClick={() => void onSave()}
            disabled={!firebaseReady || saving}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {saving ? 'A guardar…' : 'Guardar'}
          </button>
        </div>
      </header>

      {loadError ? (
        <p
          className="mx-2 mb-3 rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-200/95 sm:mx-0"
          role="alert"
        >
          {loadError}
        </p>
      ) : null}

      {banner ? (
        <p
          className={
            banner.type === 'ok'
              ? 'mx-2 mb-3 rounded-lg border border-emerald-800/60 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-200 sm:mx-0'
              : 'mx-2 mb-3 rounded-lg border border-red-900/60 bg-red-950/30 px-3 py-2 text-sm text-red-200 sm:mx-0'
          }
          role="status"
        >
          {banner.text}
        </p>
      ) : null}

      <p className="mb-4 px-1 text-xs text-zinc-500 sm:hidden">Edite os campos abaixo, abra a pré-visualização e toque em «Guardar».</p>

      <HomeContentAccordionSection title="Header" description="Imagem usada no cabeçalho do site e no admin.">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            {renderImageEditor('logoFull', 'Logo completo', 'Cabeçalho do site, recepção inicial e painel admin.')}
          </div>
        </div>
      </HomeContentAccordionSection>

      <HomeContentAccordionSection title="Inicio" description="Conteúdo da secção inicial (hero) da home.">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-zinc-800/90 bg-zinc-950/50 p-3 sm:col-span-2">
            <p className="text-xs font-semibold text-zinc-300">Subheader da Home (menu de secções)</p>
            <p className="mt-1 text-[0.7rem] leading-relaxed text-zinc-500">
              Estes nomes aparecem no menu logo abaixo do cabeçalho da Home.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block text-xs text-zinc-400">
                Item 1 (Hero)
                <input
                  type="text"
                  value={draft.publicContent.nav.home}
                  onChange={(e) =>
                    setPublicContent((p) => ({
                      ...p,
                      nav: { ...p.nav, home: e.target.value },
                    }))
                  }
                  className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900/80 px-2 py-1.5 text-sm text-zinc-100"
                />
              </label>
              <label className="block text-xs text-zinc-400">
                Item 2 (Processo)
                <input
                  type="text"
                  value={draft.publicContent.nav.process}
                  onChange={(e) =>
                    setPublicContent((p) => ({
                      ...p,
                      nav: { ...p.nav, process: e.target.value },
                    }))
                  }
                  className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900/80 px-2 py-1.5 text-sm text-zinc-100"
                />
              </label>
              <label className="block text-xs text-zinc-400">
                Item 3 (Serviços)
                <input
                  type="text"
                  value={draft.publicContent.nav.services}
                  onChange={(e) =>
                    setPublicContent((p) => ({
                      ...p,
                      nav: { ...p.nav, services: e.target.value },
                    }))
                  }
                  className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900/80 px-2 py-1.5 text-sm text-zinc-100"
                />
              </label>
              <label className="block text-xs text-zinc-400">
                Item 4 (Destaques)
                <input
                  type="text"
                  value={draft.publicContent.nav.proof}
                  onChange={(e) =>
                    setPublicContent((p) => ({
                      ...p,
                      nav: { ...p.nav, proof: e.target.value },
                    }))
                  }
                  className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900/80 px-2 py-1.5 text-sm text-zinc-100"
                />
              </label>
              <label className="block text-xs text-zinc-400 sm:col-span-2">
                Item 5 (Contato)
                <input
                  type="text"
                  value={draft.publicContent.nav.contact}
                  onChange={(e) =>
                    setPublicContent((p) => ({
                      ...p,
                      nav: { ...p.nav, contact: e.target.value },
                    }))
                  }
                  className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900/80 px-2 py-1.5 text-sm text-zinc-100"
                />
              </label>
            </div>
          </div>
          <label className="block text-xs text-zinc-400">
            Paleta visual da Home
            <select
              value={draft.publicContent.ui.paletteTone === 'warm' ? 'warm' : 'cool'}
              onChange={(e) =>
                setPublicContent((p) => ({
                  ...p,
                  ui: { ...p.ui, paletteTone: e.target.value === 'warm' ? 'warm' : 'cool' },
                }))
              }
              className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900/80 px-2 py-1.5 text-sm text-zinc-100"
            >
              <option value="cool">Cool (azul/ciano)</option>
              <option value="warm">Warm (laranja-avermelhado)</option>
            </select>
          </label>
          <label className="block text-xs text-zinc-400 sm:col-span-2">
            Hero - título principal
            <input
              type="text"
              value={draft.publicContent.hero.line1}
              onChange={(e) =>
                setDraft((d) => ({ ...d, publicContent: { ...d.publicContent, hero: { ...d.publicContent.hero, line1: e.target.value } } }))
              }
              className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900/80 px-2 py-1.5 text-sm text-zinc-100"
            />
          </label>
          <label className="block text-xs text-zinc-400 sm:col-span-2">
            Hero - subtítulo curto
            <input
              type="text"
              value={draft.publicContent.hero.line2}
              onChange={(e) =>
                setDraft((d) => ({ ...d, publicContent: { ...d.publicContent, hero: { ...d.publicContent.hero, line2: e.target.value } } }))
              }
              className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900/80 px-2 py-1.5 text-sm text-zinc-100"
            />
          </label>
        </div>
      </HomeContentAccordionSection>

      <HomeContentAccordionSection
        title={subnavProcessLabel}
        description={`Conteúdo da secção “${subnavProcessLabel}” da home.`}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs text-zinc-400">
            Título da secção
            <input
              type="text"
              value={draft.publicContent.principles.title}
              onChange={(e) => setPublicContent((p) => ({ ...p, principles: { ...p.principles, title: e.target.value } }))}
              className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900/80 px-2 py-1.5 text-sm text-zinc-100"
            />
          </label>
          <label className="block text-xs text-zinc-400 sm:col-span-2">
            Texto introdutório
            <textarea
              rows={3}
              value={draft.publicContent.principles.lead}
              onChange={(e) => setPublicContent((p) => ({ ...p, principles: { ...p.principles, lead: e.target.value } }))}
              className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900/80 px-2 py-1.5 text-sm text-zinc-100"
            />
          </label>

          {draft.publicContent.principles.items.map((item, idx) => (
            <div key={`princ-${idx}`} className="rounded-lg border border-zinc-800/90 bg-zinc-950/50 p-3 sm:col-span-2">
              <p className="text-xs font-semibold text-zinc-300">Item {idx + 1}</p>
              <label className="mt-2 block text-xs text-zinc-400">
                Título
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) =>
                    setPublicContent((p) => ({
                      ...p,
                      principles: {
                        ...p.principles,
                        items: p.principles.items.map((it, i) => (i === idx ? { ...it, title: e.target.value } : it)) as typeof p.principles.items,
                      },
                    }))
                  }
                  className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900/80 px-2 py-1.5 text-sm text-zinc-100"
                />
              </label>
              <label className="mt-2 block text-xs text-zinc-400">
                Descrição
                <textarea
                  rows={3}
                  value={item.body}
                  onChange={(e) =>
                    setPublicContent((p) => ({
                      ...p,
                      principles: {
                        ...p.principles,
                        items: p.principles.items.map((it, i) => (i === idx ? { ...it, body: e.target.value } : it)) as typeof p.principles.items,
                      },
                    }))
                  }
                  className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900/80 px-2 py-1.5 text-sm text-zinc-100"
                />
              </label>
            </div>
          ))}
        </div>
      </HomeContentAccordionSection>

      <HomeContentAccordionSection title={subnavServicesLabel} description={`Cards exibidos na secção ${subnavServicesLabel} da home.`}>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs text-zinc-400 sm:col-span-2">
            Título da secção
            <input
              type="text"
              value={draft.publicContent.services.title}
              onChange={(e) => setPublicContent((p) => ({ ...p, services: { ...p.services, title: e.target.value } }))}
              className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900/80 px-2 py-1.5 text-sm text-zinc-100"
            />
          </label>
          <label className="block text-xs text-zinc-400 sm:col-span-2">
            Texto introdutório
            <textarea
              rows={3}
              value={draft.publicContent.services.lead}
              onChange={(e) => setPublicContent((p) => ({ ...p, services: { ...p.services, lead: e.target.value } }))}
              className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900/80 px-2 py-1.5 text-sm text-zinc-100"
            />
          </label>
          <label className="block text-xs text-zinc-400">
            Texto do botão
            <input
              type="text"
              value={draft.publicContent.services.cta}
              onChange={(e) => setPublicContent((p) => ({ ...p, services: { ...p.services, cta: e.target.value } }))}
              className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900/80 px-2 py-1.5 text-sm text-zinc-100"
            />
          </label>
          <label className="block text-xs text-zinc-400">
            Mensagem quando não houver serviços
            <input
              type="text"
              value={draft.publicContent.services.empty}
              onChange={(e) => setPublicContent((p) => ({ ...p, services: { ...p.services, empty: e.target.value } }))}
              className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900/80 px-2 py-1.5 text-sm text-zinc-100"
            />
          </label>
          <div className="sm:col-span-2">
            {renderImageEditor(
              'cardFallback',
              'Placeholder dos cards sem foto',
              'Imagem usada quando um produto não tiver foto definida.'
            )}
          </div>
          {draft.publicContent.products.map((item, idx) => (
            <div key={`home-product-${idx}`} className="rounded-lg border border-zinc-800/90 bg-zinc-950/50 p-3 sm:col-span-2">
              <p className="text-xs font-semibold text-zinc-300">Produto {idx + 1}</p>
              <label className="mt-2 block text-xs text-zinc-400">
                Identificador (URL do detalhe)
                <input
                  type="text"
                  value={item.id}
                  onChange={(e) =>
                    setPublicContent((p) => ({
                      ...p,
                      products: p.products.map((prod, i) => (i === idx ? { ...prod, id: e.target.value } : prod)) as typeof p.products,
                    }))
                  }
                  className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900/80 px-2 py-1.5 text-sm text-zinc-100"
                />
              </label>
              <label className="mt-2 block text-xs text-zinc-400">
                Título
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) =>
                    setPublicContent((p) => ({
                      ...p,
                      products: p.products.map((prod, i) => (i === idx ? { ...prod, title: e.target.value } : prod)) as typeof p.products,
                    }))
                  }
                  className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900/80 px-2 py-1.5 text-sm text-zinc-100"
                />
              </label>
              <label className="mt-2 block text-xs text-zinc-400">
                Tagline
                <input
                  type="text"
                  value={item.tagline}
                  onChange={(e) =>
                    setPublicContent((p) => ({
                      ...p,
                      products: p.products.map((prod, i) => (i === idx ? { ...prod, tagline: e.target.value } : prod)) as typeof p.products,
                    }))
                  }
                  className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900/80 px-2 py-1.5 text-sm text-zinc-100"
                />
              </label>
              <label className="mt-2 block text-xs text-zinc-400">
                Descrição
                <textarea
                  rows={3}
                  value={item.body}
                  onChange={(e) =>
                    setPublicContent((p) => ({
                      ...p,
                      products: p.products.map((prod, i) => (i === idx ? { ...prod, body: e.target.value } : prod)) as typeof p.products,
                    }))
                  }
                  className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900/80 px-2 py-1.5 text-sm text-zinc-100"
                />
              </label>
              <label className="mt-2 block text-xs text-zinc-400">
                Bullets (uma linha por item)
                <textarea
                  rows={3}
                  value={item.bullets}
                  onChange={(e) =>
                    setPublicContent((p) => ({
                      ...p,
                      products: p.products.map((prod, i) => (i === idx ? { ...prod, bullets: e.target.value } : prod)) as typeof p.products,
                    }))
                  }
                  className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900/80 px-2 py-1.5 text-sm text-zinc-100"
                />
              </label>
              <label className="mt-2 block text-xs text-zinc-400">
                Imagem (URL)
                <input
                  type="url"
                  value={item.imageUrl}
                  onChange={(e) =>
                    setPublicContent((p) => ({
                      ...p,
                      products: p.products.map((prod, i) => (i === idx ? { ...prod, imageUrl: e.target.value } : prod)) as typeof p.products,
                    }))
                  }
                  className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900/80 px-2 py-1.5 text-sm text-zinc-100"
                />
              </label>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <label
                  className={cn(
                    'inline-flex cursor-pointer items-center rounded-md border border-zinc-600 bg-zinc-900/80 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:border-zinc-500',
                    (!firebaseReady || homeProductImageUploading[idx]) && 'pointer-events-none cursor-not-allowed opacity-50'
                  )}
                >
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    disabled={!firebaseReady || homeProductImageUploading[idx]}
                    onChange={(e) => {
                      const f = e.target.files?.[0] ?? null;
                      e.target.value = '';
                      void onPickHomeProductImageFile(idx, f);
                    }}
                  />
                  {homeProductImageUploading[idx] ? 'A enviar…' : 'Enviar imagem para Firebase'}
                </label>
                {item.imageUrl ? (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setCropEditor({
                          index: idx,
                          x: clampPercent(item.focalX ?? 50),
                          y: clampPercent(item.focalY ?? 50),
                        })
                      }
                      className="rounded-md border border-zinc-600 bg-zinc-900/80 px-2.5 py-1.5 text-xs font-medium text-zinc-200 hover:border-zinc-500"
                    >
                      Ajustar enquadramento
                    </button>
                    <img
                      src={item.imageUrl}
                      alt=""
                      className="h-12 max-w-24 rounded border border-zinc-800 object-cover"
                      style={{ objectPosition: `${Math.round(item.focalX ?? 50)}% ${Math.round(item.focalY ?? 50)}%` }}
                      loading="lazy"
                    />
                  </>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </HomeContentAccordionSection>

      <HomeContentAccordionSection
        title={subnavProofLabel}
        description={`Conteúdo da secção ${subnavProofLabel} da home.`}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs text-zinc-400 sm:col-span-2">
            Título da secção
            <input
              type="text"
              value={draft.publicContent.proof.title}
              onChange={(e) => setPublicContent((p) => ({ ...p, proof: { ...p.proof, title: e.target.value } }))}
              className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900/80 px-2 py-1.5 text-sm text-zinc-100"
            />
          </label>
          <label className="block text-xs text-zinc-400 sm:col-span-2">
            Texto introdutório
            <textarea
              rows={3}
              value={draft.publicContent.proof.lead}
              onChange={(e) => setPublicContent((p) => ({ ...p, proof: { ...p.proof, lead: e.target.value } }))}
              className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900/80 px-2 py-1.5 text-sm text-zinc-100"
            />
          </label>

          {draft.publicContent.proof.cards.map((card, idx) => (
            <div key={`proof-${idx}`} className="rounded-lg border border-zinc-800/90 bg-zinc-950/50 p-3 sm:col-span-2">
              <p className="text-xs font-semibold text-zinc-300">Card {idx + 1}</p>
              <label className="mt-2 block text-xs text-zinc-400">
                Badge
                <input
                  type="text"
                  value={card.badge}
                  onChange={(e) =>
                    setPublicContent((p) => ({
                      ...p,
                      proof: {
                        ...p.proof,
                        cards: p.proof.cards.map((c, i) => (i === idx ? { ...c, badge: e.target.value } : c)) as typeof p.proof.cards,
                      },
                    }))
                  }
                  className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900/80 px-2 py-1.5 text-sm text-zinc-100"
                />
              </label>
              <label className="mt-2 block text-xs text-zinc-400">
                Título
                <input
                  type="text"
                  value={card.title}
                  onChange={(e) =>
                    setPublicContent((p) => ({
                      ...p,
                      proof: {
                        ...p.proof,
                        cards: p.proof.cards.map((c, i) => (i === idx ? { ...c, title: e.target.value } : c)) as typeof p.proof.cards,
                      },
                    }))
                  }
                  className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900/80 px-2 py-1.5 text-sm text-zinc-100"
                />
              </label>
              <label className="mt-2 block text-xs text-zinc-400">
                Descrição
                <textarea
                  rows={3}
                  value={card.body}
                  onChange={(e) =>
                    setPublicContent((p) => ({
                      ...p,
                      proof: {
                        ...p.proof,
                        cards: p.proof.cards.map((c, i) => (i === idx ? { ...c, body: e.target.value } : c)) as typeof p.proof.cards,
                      },
                    }))
                  }
                  className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900/80 px-2 py-1.5 text-sm text-zinc-100"
                />
              </label>
            </div>
          ))}
        </div>
      </HomeContentAccordionSection>

      <HomeContentAccordionSection title={subnavContactLabel}>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs text-zinc-400">
            E-mail
            <input
              type="email"
              value={draft.contactEmail}
              onChange={(e) => setDraft((d) => ({ ...d, contactEmail: e.target.value }))}
              className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900/80 px-2 py-1.5 text-sm text-zinc-100"
            />
          </label>
          <label className="block text-xs text-zinc-400">
            WhatsApp (dígitos, com indicativo)
            <input
              type="text"
              inputMode="numeric"
              value={draft.whatsappPhone}
              onChange={(e) => setDraft((d) => ({ ...d, whatsappPhone: e.target.value }))}
              className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900/80 px-2 py-1.5 text-sm text-zinc-100"
            />
          </label>
          <label className="block text-xs text-zinc-400">
            Título contato
            <input
              type="text"
              value={draft.publicContent.contact.title}
              onChange={(e) => setPublicContent((p) => ({ ...p, contact: { ...p.contact, title: e.target.value } }))}
              className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900/80 px-2 py-1.5 text-sm text-zinc-100"
            />
          </label>
          <label className="block text-xs text-zinc-400">
            Rótulo E-mail
            <input
              type="text"
              value={draft.publicContent.contact.emailLabel}
              onChange={(e) => setPublicContent((p) => ({ ...p, contact: { ...p.contact, emailLabel: e.target.value } }))}
              className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900/80 px-2 py-1.5 text-sm text-zinc-100"
            />
          </label>
          <label className="block text-xs text-zinc-400">
            Rótulo WhatsApp
            <input
              type="text"
              value={draft.publicContent.contact.whatsappCta}
              onChange={(e) => setPublicContent((p) => ({ ...p, contact: { ...p.contact, whatsappCta: e.target.value } }))}
              className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900/80 px-2 py-1.5 text-sm text-zinc-100"
            />
          </label>
          <label className="block text-xs text-zinc-400 sm:col-span-2">
            Texto introdutório do contato
            <textarea
              rows={3}
              value={draft.publicContent.contact.lead}
              onChange={(e) => setPublicContent((p) => ({ ...p, contact: { ...p.contact, lead: e.target.value } }))}
              className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900/80 px-2 py-1.5 text-sm text-zinc-100"
            />
          </label>
          <label className="block text-xs text-zinc-400 sm:col-span-2">
            Texto do botão principal
            <input
              type="text"
              value={draft.publicContent.contact.drawer.title}
              onChange={(e) =>
                setPublicContent((p) => ({ ...p, contact: { ...p.contact, drawer: { ...p.contact.drawer, title: e.target.value } } }))
              }
              className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900/80 px-2 py-1.5 text-sm text-zinc-100"
            />
          </label>
          <div className="sm:col-span-2">
            {renderImageEditor(
              'homeContact',
              'Imagem da secção Contato',
              'Imagem exibida ao lado das informações de contato na home.'
            )}
          </div>
        </div>
      </HomeContentAccordionSection>

      <HomeContentAccordionSection title="Rodapé" description="Imagens exibidas no rodapé do site.">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs text-zinc-400 sm:col-span-2">
            LinkedIn (URL)
            <input
              type="url"
              value={draft.linkedinUrl}
              onChange={(e) => setDraft((d) => ({ ...d, linkedinUrl: e.target.value }))}
              className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900/80 px-2 py-1.5 text-sm text-zinc-100"
            />
          </label>
          <label className="block text-xs text-zinc-400 sm:col-span-2">
            Instagram (URL)
            <input
              type="url"
              value={draft.instagramUrl}
              onChange={(e) => setDraft((d) => ({ ...d, instagramUrl: e.target.value }))}
              className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900/80 px-2 py-1.5 text-sm text-zinc-100"
            />
          </label>
          {renderImageEditor('footerFavicon', 'Ícone circular do rodapé', 'Avatar redondo acima do wordmark.')}
          {renderImageEditor('wordmark', 'Wordmark do rodapé', 'Logótipo em texto ou imagem horizontal.')}
        </div>
      </HomeContentAccordionSection>

      {cropEditor && cropTarget?.imageUrl ? (
        <div className="fixed inset-0 z-80 bg-black/75 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal>
          <div className="mx-auto flex h-full w-full max-w-5xl flex-col rounded-xl border border-zinc-700 bg-[#050508]">
            <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold text-zinc-100">Ajustar enquadramento do card</h2>
                <p className="text-xs text-zinc-500">Arraste a imagem dentro da moldura para definir o recorte.</p>
              </div>
              <button
                type="button"
                onClick={() => setCropEditor(null)}
                className="rounded-md border border-zinc-600 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-800"
              >
                Fechar
              </button>
            </div>
            <div className="grid min-h-0 flex-1 items-center gap-4 overflow-auto p-4 md:grid-cols-[minmax(18rem,24rem)_1fr]">
              <div className="mx-auto w-full max-w-sm">
                <div
                  className="relative aspect-8/11 w-full cursor-grab overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900/55 active:cursor-grabbing"
                  onPointerDown={(event) => {
                    const rect = event.currentTarget.getBoundingClientRect();
                    cropDragRef.current = {
                      pointerId: event.pointerId,
                      rect,
                      startClientX: event.clientX,
                      startClientY: event.clientY,
                      startX: cropEditor.x,
                      startY: cropEditor.y,
                      moved: false,
                    };
                    event.currentTarget.setPointerCapture(event.pointerId);
                  }}
                  onPointerMove={(event) => {
                    const drag = cropDragRef.current;
                    if (!drag || drag.pointerId !== event.pointerId) return;
                    const dx = event.clientX - drag.startClientX;
                    const dy = event.clientY - drag.startClientY;
                    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) drag.moved = true;
                    setCropEditor((prev) =>
                      prev
                        ? {
                            ...prev,
                            x: clampPercent(drag.startX - (dx / Math.max(1, drag.rect.width)) * 100),
                            y: clampPercent(drag.startY - (dy / Math.max(1, drag.rect.height)) * 100),
                          }
                        : prev
                    );
                  }}
                  onPointerUp={(event) => {
                    const drag = cropDragRef.current;
                    if (!drag || drag.pointerId !== event.pointerId) return;
                    if (!drag.moved) {
                      const cx = ((event.clientX - drag.rect.left) / Math.max(1, drag.rect.width)) * 100;
                      const cy = ((event.clientY - drag.rect.top) / Math.max(1, drag.rect.height)) * 100;
                      setCropEditor((prev) => (prev ? { ...prev, x: clampPercent(cx), y: clampPercent(cy) } : prev));
                    }
                    cropDragRef.current = null;
                    event.currentTarget.releasePointerCapture(event.pointerId);
                  }}
                  onPointerCancel={(event) => {
                    const drag = cropDragRef.current;
                    if (!drag || drag.pointerId !== event.pointerId) return;
                    cropDragRef.current = null;
                    event.currentTarget.releasePointerCapture(event.pointerId);
                  }}
                >
                  <img
                    src={cropTarget.imageUrl}
                    alt=""
                    className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
                    style={{ objectPosition: `${cropEditor.x}% ${cropEditor.y}%` }}
                    draggable={false}
                  />
                  <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/15" aria-hidden />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                  <span>X: {Math.round(cropEditor.x)}%</span>
                  <span>Y: {Math.round(cropEditor.y)}%</span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCropEditor((prev) => (prev ? { ...prev, x: 50, y: 50 } : prev))}
                    className="rounded-md border border-zinc-600 bg-zinc-900/80 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:border-zinc-500"
                  >
                    Centralizar
                  </button>
                  <button
                    type="button"
                    onClick={() => setCropEditor(null)}
                    className="rounded-md border border-zinc-700 bg-zinc-900/70 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:border-zinc-500"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPublicContent((p) => ({
                        ...p,
                        products: p.products.map((prod, i) =>
                          i === cropEditor.index ? { ...prod, focalX: cropEditor.x, focalY: cropEditor.y } : prod
                        ) as typeof p.products,
                      }));
                      setCropEditor(null);
                    }}
                    className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
                  >
                    Aplicar ao card
                  </button>
                </div>
              </div>
              <div className="hidden rounded-lg border border-zinc-800/80 bg-zinc-950/40 p-4 md:block">
                <p className="text-xs leading-relaxed text-zinc-400">
                  Dica: clique numa área para posicionar rápido ou arraste para ajuste fino.
                  A moldura representa o formato do card de serviços.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {previewOpen ? (
        <div className="fixed inset-0 z-80 bg-black/70 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal>
          <div className="mx-auto flex h-full w-full max-w-[1400px] flex-col rounded-xl border border-zinc-700 bg-[#050508]">
            <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
              <h2 className="text-sm font-semibold text-zinc-100">Pré-visualização antes de guardar</h2>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="rounded-md border border-zinc-600 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-800"
              >
                Fechar preview
              </button>
                </div>
            <div className="min-h-0 flex-1 overflow-auto">
              <div className="origin-top scale-[0.62] sm:scale-[0.78]">
          <HomePageView
            publicTextOverride={previewText}
            siteImageOverrides={mergedSiteImages}
            siteImageReady
          />
        </div>
      </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
