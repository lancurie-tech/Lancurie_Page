import { Link } from 'react-router-dom';
import { useSiteCopy } from '@/contexts/useSiteCopy';

/**
 * Aviso global quando a cópia do site não carrega, está vazia, ou o Firebase local não aponta ao projecto.
 */
export function SiteHealthBanner() {
  const { loadError, ready, siteDocMissing, editorialSeemsEmpty } = useSiteCopy();

  if (!ready) return null;
  if (loadError) {
    return (
      <div
        className="border-b border-red-900/60 bg-red-950/50 px-4 py-2.5 text-center text-sm text-red-100/95"
        role="alert"
      >
        {loadError}
      </div>
    );
  }
  if (siteDocMissing) {
    return (
      <div
        className="border-b border-amber-800/50 bg-amber-950/35 px-4 py-2.5 text-center text-sm text-amber-100/90"
        role="status"
      >
        Ainda não existe o documento <code className="text-amber-200/90">siteCopy</code> / <code className="text-amber-200/90">default</code> com conteúdo, ou a leitura devolveu vazio. Cria o doc no consola Firestore ou, na área logada,{' '}
        <Link to="/admin/home" className="text-amber-200 underline underline-offset-2">
          Conteúdo do site
        </Link>{' '}
        e grava o JSON.
      </div>
    );
  }
  if (editorialSeemsEmpty) {
    return (
      <div
        className="border-b border-amber-800/50 bg-amber-950/35 px-4 py-2.5 text-center text-sm text-amber-100/90"
        role="status"
      >
        O texto editorial ainda vem vazio (merge). Confirma que o <code className="text-amber-200/90">.env</code> do local tem o
        mesmo <code className="text-amber-200/90">VITE_FIREBASE_PROJECT_ID</code> que usaste a gravar, reinicia o Vite e
        força recarga. Se o doc tem <code className="text-amber-200/90">publicContent</code>, abre a{' '}
        <Link to="/admin/home" className="text-amber-200 underline underline-offset-2">
          admin
        </Link>
        e volta a <strong>Guardar</strong>.
      </div>
    );
  }
  return null;
}
