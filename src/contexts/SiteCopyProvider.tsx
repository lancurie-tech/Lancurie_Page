import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { db, firebaseReady } from '@/lib/firebase/config';
import { subscribeSiteCopy } from '@/lib/firestore/siteCopy';
import type { SiteCopyDoc } from '@/types/siteCopy';
import { SiteCopyReactContext, type SiteCopyContextValue } from '@/contexts/siteCopyContextBase';
import { getPublicContentFromDoc } from '@/lib/sitePublicContentMerge';

const CONFIG_ERROR =
  'Firebase não configurado: preenche todas as VITE_FIREBASE_* no .env (vê .env.example), grava o ficheiro e reinicia o Vite. Sem isto, o site lê só estrutura vazia; o admin pode até guardar, mas a home não lê o mesmo projecto.';

function isEditorialEmpty(pc: ReturnType<typeof getPublicContentFromDoc>): boolean {
  return (
    !pc.brandName.trim() &&
    !pc.hero.line1.trim() &&
    !pc.nav.home.trim()
  );
}

export function SiteCopyProvider({ children }: { children: ReactNode }) {
  const firebaseOk = Boolean(firebaseReady && db);
  const [docState, setDocState] = useState<SiteCopyDoc | null>(null);
  const [ready, setReady] = useState(!firebaseOk);
  const [listenerError, setListenerError] = useState<string | null>(null);

  const loadError = useMemo(
    () => (firebaseOk ? listenerError : CONFIG_ERROR),
    [firebaseOk, listenerError],
  );

  useEffect(() => {
    if (!firebaseOk) return;
    const unsub = subscribeSiteCopy(
      (data) => {
        setDocState(data);
        setReady(true);
        setListenerError(null);
      },
      (err) => {
        const msg = err instanceof Error ? err.message : String(err);
        setListenerError(
          `Erro a ler o site no Firestore: ${msg}. Regras de segurança, rede ou o listener falhou. Vê a consola.`,
        );
        setDocState(null);
        setReady(true);
      },
    );
    return () => unsub();
  }, [firebaseOk]);

  const contentFromDoc = useMemo(() => getPublicContentFromDoc(docState), [docState]);
  const publicContent = contentFromDoc;

  const value = useMemo<SiteCopyContextValue>(
    () => ({
      doc: docState,
      ready,
      publicContent,
      loadError,
      siteDocMissing:
        ready && !loadError && docState === null,
      editorialSeemsEmpty:
        ready && !loadError && isEditorialEmpty(contentFromDoc),
    }),
    [docState, ready, publicContent, loadError, contentFromDoc],
  );

  return (
    <SiteCopyReactContext.Provider value={value}>
      {children}
    </SiteCopyReactContext.Provider>
  );
}
