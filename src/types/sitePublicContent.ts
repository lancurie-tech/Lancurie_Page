/**
 * Conteúdo editorial do site: apenas cadeias em português.
 * A fonte de verdade é o Firestore; não há "texto padrão" do repositório.
 */
export type SiteNavContent = {
  home: string;
  proof: string;
  services: string;
  process: string;
  about: string;
  approach: string;
  contact: string;
  cases: string;
};

export type SiteHeroContent = {
  kicker: string;
  line1: string;
  line2: string;
  subtitle: string;
  /** Título do mapa (ex. «Cérebro Lancurie» / «Lancurie Brain») — personifica o grafo. */
  graphBrainLabel: string;
  graphAria: string;
  scrollHint: string;
  ctaPrimary: string;
  ctaSecondary: string;
};

export type ProofCardContent = { badge: string; title: string; body: string };
export type EngagementCardContent = { title: string; body: string };
export type FaqItemContent = { q: string; a: string };
export type ProcessStepContent = { title: string; body: string };
export type PrincipleItemContent = { title: string; body: string };
export type HomeProductContent = {
  id: string;
  title: string;
  tagline: string;
  body: string;
  bullets: string;
  imageUrl: string;
  /** Ponto focal horizontal da imagem no card (0-100). */
  focalX?: number;
  /** Ponto focal vertical da imagem no card (0-100). */
  focalY?: number;
};

export type PrivacyPolicySectionContent = {
  title: string;
  /** Parágrafos separados por linha em branco; linhas `- ` viram lista; `**texto**` negrito; `{{dominioSite}}` e `{{emailContato}}` substituídos no site. */
  body: string;
};

export type PrivacyPolicySectionsTuple = [
  PrivacyPolicySectionContent,
  PrivacyPolicySectionContent,
  PrivacyPolicySectionContent,
  PrivacyPolicySectionContent,
  PrivacyPolicySectionContent,
  PrivacyPolicySectionContent,
  PrivacyPolicySectionContent,
  PrivacyPolicySectionContent,
  PrivacyPolicySectionContent,
];

export type PrivacyPolicyPageContent = {
  eyebrow: string;
  title: string;
  lastUpdatedLine: string;
  backLinkLabel: string;
  sections: PrivacyPolicySectionsTuple;
};

export type ContactFormFields = {
  name: string;
  email: string;
  whatsapp: string;
  company: string;
  needType: string;
  needModular: string;
  needBespoke: string;
  needClientInfra: string;
  needAutomation: string;
  needConsulting: string;
  needOther: string;
  message: string;
  privacy: string;
  submit: string;
  openWhatsapp: string;
  cancel: string;
  emailProductLine: string;
};

export type SitePublicContent = {
  brandName: string;
  nav: SiteNavContent;
  hero: SiteHeroContent;
  trust: { line: string };
  proof: { kicker: string; title: string; lead: string; cards: [ProofCardContent, ProofCardContent, ProofCardContent] };
  products: [HomeProductContent, HomeProductContent, HomeProductContent];
  cases: { kicker: string; title: string; lead: string; empty: string };
  audience: { kicker: string; title: string; body: string };
  engagement: { kicker: string; title: string; lead: string; cards: [EngagementCardContent, EngagementCardContent, EngagementCardContent] };
  faq: { title: string; items: [FaqItemContent, FaqItemContent, FaqItemContent] };
  services: { title: string; lead: string; cta: string; empty: string };
  process: { title: string; lead: string; cta: string; steps: [ProcessStepContent, ProcessStepContent, ProcessStepContent] };
  about: { kicker: string; title: string; body: string };
  principles: { title: string; lead: string; items: [PrincipleItemContent, PrincipleItemContent, PrincipleItemContent] };
  contact: {
    title: string;
    lead: string;
    emailLabel: string;
    whatsappCta: string;
    cta: string;
    drawerCta: string;
    drawer: { title: string; lead: string };
    form: ContactFormFields;
  };
  footer: { rights: string; built: string; locationLine: string; emailUs: string; socialAria: string };
  /** Textos da rota `/privacidade` (editável no admin). */
  privacyPolicy: PrivacyPolicyPageContent;
  serviceDetail: { back: string; contactCta: string };
  welcome: { line: string };
  marketing: { subnavAria: string };
  login: { title: string; emailLabel: string; passwordLabel: string; submit: string };
  a11y: {
    closeContactDrawer: string;
    openMenu: string;
    closeMenu: string;
    subnavPrev: string;
    subnavNext: string;
    utilitiesMenu: string;
  };
  ui: {
    login: string;
    theme: string;
    themeLight: string;
    themeDark: string;
    /** Paleta visual da home: `cool` (azul) ou `warm` (laranja-avermelhado). */
    paletteTone: 'cool' | 'warm' | string;
  };
};

/** Alias: legível em `useI18n().publicText` (só conteúdo em PT, do Firestore). */
export type PublicPageText = SitePublicContent;
