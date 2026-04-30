import { useEffect, useMemo, useState } from 'react';
import {
  subscribeAllContactRequests,
  updateContactRequestStatus,
} from '@/lib/firestore/contactRequests';
import type { ContactRequest, ContactRequestStatus } from '@/types/contactRequest';

const STATUS_OPTIONS: Array<{ value: ContactRequestStatus; label: string }> = [
  { value: 'new', label: 'Novo' },
  { value: 'in_progress', label: 'Em andamento' },
  { value: 'done', label: 'Concluído' },
  { value: 'archived', label: 'Arquivado' },
];

function dateLabel(value: unknown): string {
  if (value && typeof value === 'object' && 'toDate' in (value as Record<string, unknown>)) {
    try {
      const dt = (value as { toDate: () => Date }).toDate();
      return dt.toLocaleString('pt-BR');
    } catch {
      return '—';
    }
  }
  return '—';
}

function toWhatsappHref(rawPhone: string): string | null {
  const digits = rawPhone.replace(/\D/g, '');
  if (!digits) return null;
  return `https://wa.me/${digits}`;
}

export function AdminContactRequestsPage() {
  const [items, setItems] = useState<ContactRequest[]>([]);
  const [banner, setBanner] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    return subscribeAllContactRequests(
      setItems,
      (err) => setBanner({ type: 'err', text: err.message || 'Falha ao carregar pedidos.' })
    );
  }, []);

  const counts = useMemo(() => {
    return {
      total: items.length,
      open: items.filter((x) => x.status === 'new' || x.status === 'in_progress').length,
      done: items.filter((x) => x.status === 'done').length,
    };
  }, [items]);

  async function onStatusChange(id: string, status: ContactRequestStatus) {
    setBanner(null);
    setBusyId(id);
    try {
      await updateContactRequestStatus(id, status);
      setBanner({ type: 'ok', text: 'Status atualizado.' });
    } catch (e) {
      setBanner({
        type: 'err',
        text: e instanceof Error ? e.message : 'Não foi possível atualizar o status.',
      });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-normal tracking-tight text-zinc-50">Pedidos de contato</h1>
        <p className="mt-2 max-w-3xl text-sm text-zinc-500">
          Gestão dos pedidos enviados pelo formulário do site. Atualize o status para acompanhar o atendimento.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Total</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-100">{counts.total}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Abertos</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-100">{counts.open}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Concluídos</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-100">{counts.done}</p>
        </div>
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
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">Nome / contato</th>
              <th className="px-4 py-3 font-medium">Necessidade</th>
              <th className="px-4 py-3 font-medium">Mensagem</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/80 bg-zinc-900/20">
            {items.map((item) => (
              <tr key={item.id} className="align-top text-zinc-300">
                <td className="px-4 py-3 text-xs text-zinc-500">{dateLabel(item.createdAt)}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-zinc-100">{item.name || '—'}</p>
                  <p className="text-xs text-zinc-400">{item.email || '—'}</p>
                  {item.whatsapp ? (
                    (() => {
                      const waHref = toWhatsappHref(item.whatsapp);
                      if (!waHref) return <p className="text-xs text-zinc-500">{item.whatsapp}</p>;
                      return (
                        <a
                          href={waHref}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-emerald-300 underline decoration-emerald-700/70 underline-offset-2 hover:text-emerald-200"
                          title="Abrir conversa no WhatsApp"
                        >
                          {item.whatsapp}
                        </a>
                      );
                    })()
                  ) : (
                    <p className="text-xs text-zinc-500">—</p>
                  )}
                  {item.company ? <p className="mt-1 text-xs text-zinc-500">{item.company}</p> : null}
                </td>
                <td className="px-4 py-3 text-xs text-zinc-400">
                  <p>{item.needLabel || item.needType || '—'}</p>
                  {item.productTitle ? <p className="mt-1 text-zinc-500">Produto: {item.productTitle}</p> : null}
                  <p className="mt-1 text-zinc-600">Origem: {item.origin || 'unknown'}</p>
                </td>
                <td className="max-w-sm px-4 py-3 text-xs leading-relaxed text-zinc-300">
                  <p className="whitespace-pre-wrap wrap-break-word">{item.message || '—'}</p>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={item.status || 'new'}
                    disabled={busyId === item.id}
                    onChange={(e) => void onStatusChange(item.id, e.target.value as ContactRequestStatus)}
                    className="w-full rounded-md border border-zinc-700 bg-zinc-900/80 px-2 py-1.5 text-xs text-zinc-100"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-zinc-500">
                  Ainda não há pedidos de contato enviados pelo site.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
