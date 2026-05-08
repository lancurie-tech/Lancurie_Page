import type {
  ContactFormFields,
  PrivacyPolicySectionContent,
  ProofCardContent,
  EngagementCardContent,
  FaqItemContent,
  ProcessStepContent,
  PrincipleItemContent,
  HomeProductContent,
  SitePublicContent,
} from '@/types/sitePublicContent';

const z = (): string => '';

const card = (): ProofCardContent => ({ badge: z(), title: z(), body: z() });
const eng = (): EngagementCardContent => ({ title: z(), body: z() });
const faq = (): FaqItemContent => ({ q: z(), a: z() });
const step = (): ProcessStepContent => ({ title: z(), body: z() });
const prin = (): PrincipleItemContent => ({ title: z(), body: z() });
const product = (id: string): HomeProductContent => ({
  id,
  title: z(),
  tagline: z(),
  body: z(),
  bullets: z(),
  imageUrl: z(),
  focalX: 50,
  focalY: 50,
});
const privacySection = (): PrivacyPolicySectionContent => ({ title: z(), body: z() });

const form = (): ContactFormFields => ({
  name: z(),
  email: z(),
  whatsapp: z(),
  company: z(),
  needType: z(),
  needModular: z(),
  needBespoke: z(),
  needClientInfra: z(),
  needAutomation: z(),
  needConsulting: z(),
  needOther: z(),
  message: z(),
  privacy: z(),
  submit: z(),
  openWhatsapp: z(),
  cancel: z(),
  emailProductLine: z(),
});

/**
 * Estrutura vazia (apenas cadeias vazias) — nenhum texto de marketing.
 * Garante que o app pode ler chaves; o conteúdo real vem só do Firestore.
 */
export function emptySitePublicContent(): SitePublicContent {
  return {
    brandName: z(),
    nav: {
      home: z(),
      proof: z(),
      services: z(),
      process: z(),
      about: z(),
      approach: z(),
      contact: z(),
      cases: z(),
    },
    hero: {
      kicker: z(),
      line1: z(),
      line2: z(),
      subtitle: z(),
      graphBrainLabel: z(),
      graphAria: z(),
      scrollHint: z(),
      ctaPrimary: z(),
      ctaSecondary: z(),
    },
    trust: { line: z() },
    proof: { kicker: z(), title: z(), lead: z(), cards: [card(), card(), card()] },
    products: [product('produto-1'), product('produto-2'), product('produto-3')],
    cases: { kicker: z(), title: z(), lead: z(), empty: z() },
    audience: { kicker: z(), title: z(), body: z() },
    engagement: { kicker: z(), title: z(), lead: z(), cards: [eng(), eng(), eng()] },
    faq: { title: z(), items: [faq(), faq(), faq()] },
    services: { title: z(), lead: z(), cta: z(), empty: z() },
    process: { title: z(), lead: z(), cta: z(), steps: [step(), step(), step()] },
    about: { kicker: z(), title: z(), body: z() },
    principles: { title: z(), lead: z(), items: [prin(), prin(), prin()] },
    contact: {
      title: z(),
      lead: z(),
      emailLabel: z(),
      whatsappCta: z(),
      cta: z(),
      drawerCta: z(),
      drawer: { title: z(), lead: z() },
      form: form(),
    },
    footer: { rights: z(), built: z(), locationLine: z(), emailUs: z(), socialAria: z() },
    privacyPolicy: {
      eyebrow: z(),
      title: z(),
      lastUpdatedLine: z(),
      backLinkLabel: z(),
      sections: [
        privacySection(),
        privacySection(),
        privacySection(),
        privacySection(),
        privacySection(),
        privacySection(),
        privacySection(),
        privacySection(),
        privacySection(),
      ],
    },
    serviceDetail: { back: z(), contactCta: z() },
    welcome: { line: z() },
    marketing: { subnavAria: z() },
    login: { title: z(), emailLabel: z(), passwordLabel: z(), submit: z() },
    a11y: {
      closeContactDrawer: z(),
      openMenu: z(),
      closeMenu: z(),
      subnavPrev: z(),
      subnavNext: z(),
      utilitiesMenu: z(),
    },
    ui: { login: z(), theme: z(), themeLight: z(), themeDark: z(), paletteTone: 'cool' },
  };
}
