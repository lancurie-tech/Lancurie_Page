import { createRoot } from 'react-dom/client';
import '@/index.css';
import App from '@/App';

const rootEl = document.getElementById('root');

if (!rootEl) {
  document.body.textContent = 'Missing #root.';
} else {
  // Sem <StrictMode>: em dev, o duplo efeito rebenta o agregador de watch do
  // Firestore (assert "Unexpected state" / val: -1) com onSnapshot. Produção
  // não era afectada; isto desbloqueia o admin e o site em localhost.
  createRoot(rootEl).render(<App />);
}
