import { placeholderImages } from '@/lib/placeholderImages';

/** Chaves de imagem do site (todas usadas no layout actual). */
export const SITE_IMAGE_KEYS = [
  'logoFull',
  'footerFavicon',
  'wordmark',
  'cardFallback',
  'homeContact',
] as const;

export type SiteImageKey = (typeof SITE_IMAGE_KEYS)[number];

export type SiteImageFieldMeta = {
  key: SiteImageKey;
  labelPt: string;
  hintPt?: string;
};

/** Metadados para o painel admin (rótulos e dicas). */
export const SITE_IMAGE_FIELDS: SiteImageFieldMeta[] = [
  {
    key: 'logoFull',
    labelPt: 'Logo completo',
    hintPt: 'Cabeçalho, recepção inicial e painel admin. Envie ficheiro (Storage) ou URL / caminho em public/.',
  },
  { key: 'footerFavicon', labelPt: 'Ícone circular do rodapé', hintPt: 'Avatar redondo acima do wordmark.' },
  { key: 'wordmark', labelPt: 'Wordmark do rodapé', hintPt: 'Logótipo em texto ou imagem horizontal.' },
  {
    key: 'cardFallback',
    labelPt: 'Placeholder dos cards sem foto',
    hintPt: 'Serviços sem imagem definida no produto.',
  },
  {
    key: 'homeContact',
    labelPt: 'Imagem — secção Contacto (home)',
    hintPt: 'Grande foto ao lado do formulário de contacto na Home.',
  },
];

export const SITE_IMAGE_DEFAULTS: Record<SiteImageKey, string> = {
  /** Alinhar com `public/brand/` e com `<link rel="preload">` em `index.html` (cache no primeiro pedido). */
  logoFull: '/brand/logo_2_novo_novo.png',
  footerFavicon: '/brand/logo_2_favicon.png',
  wordmark: '/brand/logo_logo_lan.png',
  cardFallback: '/brand/logo_2_logo.png',
  homeContact: placeholderImages.contact,
};
