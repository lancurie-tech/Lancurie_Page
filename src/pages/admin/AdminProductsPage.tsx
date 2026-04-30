import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createProduct,
  deleteProduct,
  subscribeAllProducts,
  updateProduct,
} from '@/lib/firestore/products';
import type { Product, ProductInput } from '@/types/product';

function emptyInput(nextOrder: number): ProductInput {
  return {
    titlePt: '',
    titleEn: '',
    taglinePt: '',
    taglineEn: '',
    bodyPt: '',
    bodyEn: '',
    bulletsPt: '',
    bulletsEn: '',
    order: nextOrder,
    published: false,
    imageUrl: '',
  };
}

function toInput(p: Product): ProductInput {
  return {
    titlePt: p.titlePt,
    titleEn: p.titleEn,
    taglinePt: p.taglinePt,
    taglineEn: p.taglineEn,
    bodyPt: p.bodyPt,
    bodyEn: p.bodyEn,
    bulletsPt: p.bulletsPt,
    bulletsEn: p.bulletsEn,
    order: p.order,
    published: p.published,
    imageUrl: p.imageUrl,
  };
}

export function AdminProductsPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [banner, setBanner] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [draft, setDraft] = useState<ProductInput | null>(null);

  useEffect(() => {
    return subscribeAllProducts(setItems);
  }, []);

  const nextOrder = useMemo(() => {
    if (items.length === 0) return 0;
    return Math.max(...items.map((p) => p.order ?? 0)) + 1;
  }, [items]);

  const openNew = useCallback(() => {
    setEditingId('new');
    setDraft(emptyInput(nextOrder));
    setBanner(null);
  }, [nextOrder]);

  const openEdit = useCallback((p: Product) => {
    setEditingId(p.id);
    setDraft(toInput(p));
    setBanner(null);
  }, []);

  const closeForm = useCallback(() => {
    setEditingId(null);
    setDraft(null);
  }, []);

  async function onSave() {
    if (!draft) return;
    setBanner(null);
    setSaving(true);
    try {
      const payload: ProductInput = {
        ...draft,
        order: Number.isFinite(draft.order) ? Number(draft.order) : 0,
        imageUrl: draft.imageUrl?.trim() || '',
        titleEn: '',
        taglineEn: '',
        bodyEn: '',
        bulletsEn: '',
      };
      if (editingId === 'new') {
        await createProduct(payload);
        setBanner({ type: 'ok', text: 'Produto criado.' });
      } else if (editingId) {
        await updateProduct(editingId, payload);
        setBanner({ type: 'ok', text: 'Produto atualizado.' });
      }
      closeForm();
    } catch (e) {
      setBanner({
        type: 'err',
        text: e instanceof Error ? e.message : 'Não foi possível guardar.',
      });
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    if (!window.confirm('Eliminar este produto?')) return;
    setBanner(null);
    try {
      await deleteProduct(id);
      setBanner({ type: 'ok', text: 'Produto eliminado.' });
      if (editingId === id) closeForm();
    } catch (e) {
      setBanner({
        type: 'err',
        text: e instanceof Error ? e.message : 'Não foi possível eliminar.',
      });
    }
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-normal tracking-tight text-zinc-50">
            Produtos
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-500">
            Produtos <strong>publicados</strong> aparecem no carrossel da secção Serviços na Home e em{' '}
            <code className="text-zinc-400">/servicos/{'<id>'}</code>. No carrossel só entram o{' '}
            <strong>título</strong> e o <strong>subtítulo</strong>; a descrição longa e a lista ficam na página «Saiba
            mais». O conteúdo é só em português; visitantes podem usar a tradução do próprio browser (ex. Chrome) para
            inglês.
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="shrink-0 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500"
        >
          Novo produto
        </button>
      </div>

      {banner ? (
        <p
          className={
            banner.type === 'ok'
              ? 'rounded-lg border border-emerald-800/60 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-200'
              : 'rounded-lg border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm text-red-200'
          }
          role="status"
        >
          {banner.text}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-zinc-800">
        <table className="min-w-full divide-y divide-zinc-800 text-left text-sm">
          <thead className="bg-zinc-950/80 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-medium">Ordem</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Título</th>
              <th className="px-4 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/80 bg-zinc-900/20">
            {items.map((p) => (
              <tr key={p.id} className="text-zinc-300">
                <td className="px-4 py-3 tabular-nums text-zinc-500">{p.order ?? 0}</td>
                <td className="px-4 py-3">
                  {p.published ? (
                    <span className="rounded-full bg-emerald-950/80 px-2 py-0.5 text-xs text-emerald-300">
                      Publicado
                    </span>
                  ) : (
                    <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-500">Rascunho</span>
                  )}
                </td>
                <td className="max-w-56 truncate px-4 py-3 font-medium text-zinc-100">
                  {p.titlePt || '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => openEdit(p)}
                    className="mr-2 text-emerald-400 hover:text-emerald-300"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => void onDelete(p.id)}
                    className="text-red-400/90 hover:text-red-300"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-zinc-500">
                  Ainda não há produtos. Utilize «Novo produto».
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {draft && editingId ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-medium text-zinc-100">
              {editingId === 'new' ? 'Novo produto' : 'Editar produto'}
            </h2>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={closeForm}
                className="rounded-lg border border-zinc-600 px-3 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void onSave()}
                className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
              >
                {saving ? 'A guardar…' : 'Guardar'}
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-zinc-500">Ordem (número)</span>
              <input
                type="number"
                value={draft.order}
                onChange={(e) =>
                  setDraft((d) => (d ? { ...d, order: Number(e.target.value) } : d))
                }
                className="mt-1.5 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
              />
            </label>
            <label className="flex items-end gap-2 pb-1 text-sm text-zinc-400">
              <input
                type="checkbox"
                checked={draft.published}
                onChange={(e) =>
                  setDraft((d) => (d ? { ...d, published: e.target.checked } : d))
                }
                className="h-4 w-4 rounded border-zinc-600"
              />
              Publicado (visível no site)
            </label>
          </div>

          <label className="mt-4 block text-sm">
            <span className="text-zinc-500">URL da imagem de capa (opcional)</span>
            <input
              value={draft.imageUrl ?? ''}
              onChange={(e) => setDraft((d) => (d ? { ...d, imageUrl: e.target.value } : d))}
              className="mt-1.5 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
              placeholder="https://…"
            />
          </label>

          {(
            [
              ['title', 'Título', 'Nome do serviço no cartão da Home e no topo da página do serviço.'],
              [
                'tagline',
                'Subtítulo (carrossel + página do serviço)',
                'Breve frase: aparece no cartão da Home e como destaque abaixo do título em «Saiba mais».',
              ],
              [
                'body',
                'Descrição completa (só em «Saiba mais»)',
                'Parágrafos longos. Separe blocos com uma linha em branco. Não aparece no carrossel.',
              ],
              [
                'bullets',
                'Lista / detalhes (só em «Saiba mais»)',
                'Opcional. Uma linha por item com prefixo «- » vira lista marcada; caso contrário o texto é mostrado como bloco.',
              ],
            ] as const
          ).map(([field, label, hint]) => (
            <div key={field} className="mt-6 border-t border-zinc-800/80 pt-6">
              <p className="text-sm font-medium text-zinc-300">{label}</p>
              <p className="mt-1 text-xs text-zinc-500">{hint}</p>
              <label className="mt-3 block text-sm">
                <span className="text-zinc-500">Texto</span>
                <textarea
                  value={draft[`${field}Pt` as keyof ProductInput] as string}
                  onChange={(e) =>
                    setDraft((d) =>
                      d ? ({ ...d, [`${field}Pt`]: e.target.value } as ProductInput) : d
                    )
                  }
                  rows={field === 'body' ? 5 : 3}
                  className="mt-1.5 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
                />
              </label>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
