import type { ProductInput } from '@/types/product';

/** Produtos de exemplo para criar em `products` no Firebase (ou copiar no admin). */
export const INITIAL_PRODUCTS: ProductInput[] = [
  {
    titlePt: 'Plataforma vertical (ex.: operação em rede)',
    titleEn: '',
    taglinePt: 'SaaS com canal comercial, não só fatura mensal muda.',
    taglineEn: '',
    bodyPt:
      'Concebido para quem precisa de multi-tenant, funções de operação, integrações e um caminho de escala. Inclui desenho de domínio, entrega, observabilidade e opção de retainer. Útil quando o “template genérico” esgota a meio do primeiro cliente enterprise.',
    bodyEn: '',
    bulletsPt:
      'Mapa de domínio e risco técnico\nPapel do produto, tenant e facturação mínima\nPós go-live: retainer e priorização por impacto',
    bulletsEn: '',
    order: 0,
    published: true,
    imageUrl: '',
  },
  {
    titlePt: 'Software a medida + manutenção',
    titleEn: '',
    taglinePt: 'Da descoberta à produção, com a mesma equipa no pós-entrega.',
    taglineEn: '',
    bodyPt:
      'Indicado quando a integração, o compliance (ex. saúde) ou a herança técnica exigem equipa dedicada. Estruturamos fases, entregáveis e um plano pós go-live: horas, SLA e canais. Evita o choque de “entrega a terceiros e depois ninguém atende o telefone”.',
    bodyEn: '',
    bulletsPt:
      'Descoberta e corte de escopo com números\nReleases com critério de pronto, não de calendário\nManutenção: evolução, suporte, incidente',
    bulletsEn: '',
    order: 1,
    published: true,
    imageUrl: '',
  },
  {
    titlePt: 'E-commerce e operação B2C',
    titleEn: '',
    taglinePt: 'Loja que aguenta operação, não só vitrine.',
    taglineEn: '',
    bodyPt:
      'Para quem precisa de catálogo, logística, pagamentos e, quando faz sentido, ligação a contabilidade/ERP. O foco é operação: menos “site bonito”, mais fluxo de encomenda, excepções e pessoas a usar o back-office.',
    bodyEn: '',
    bulletsPt:
      'Foco em excepções e reembolsos, não no happy path\nIntegrações mínimas necessárias\nObservabilidade e alertas básicos',
    bulletsEn: '',
    order: 2,
    published: true,
    imageUrl: '',
  },
];
