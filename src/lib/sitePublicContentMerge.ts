import { emptySitePublicContent } from '@/data/emptyPublicContent';
import type { SiteCopyDoc } from '@/types/siteCopy';
import type { SitePublicContent } from '@/types/sitePublicContent';

/**
 * Lê o valor: string direta, ou legado `{ pt, en }` (usa só `pt` quando possível).
 */
export function toStr(v: unknown): string {
  if (typeof v === 'string') return v;
  if (v && typeof v === 'object' && v !== null && 'pt' in (v as object)) {
    const o = v as { pt?: unknown; en?: unknown };
    if (typeof o.pt === 'string') return o.pt;
    if (typeof o.en === 'string') return o.en;
  }
  return '';
}

function toPercent(v: unknown, fallback = 50): number {
  if (typeof v === 'number' && Number.isFinite(v)) return Math.max(0, Math.min(100, v));
  if (typeof v === 'string') {
    const n = Number(v);
    if (Number.isFinite(n)) return Math.max(0, Math.min(100, n));
  }
  return fallback;
}

/** Aplica o documento do Firestore sobre a estrutura vazia (sem textos de repositório). */
export function getPublicContentFromDoc(doc: SiteCopyDoc | null | undefined): SitePublicContent {
  return mergeFromFirestore(emptySitePublicContent(), doc?.publicContent);
}

/**
 * Faz o merge a partir de um parcial (ex.: rascunho do admin) sobre a base vazia
 * — não usa defaults de marketing, só cadeias vazias como ausência.
 */
export function mergeFromFirestore(base: SitePublicContent, over: unknown): SitePublicContent {
  if (!over || typeof over !== 'object' || Array.isArray(over)) return structuredClone(base);
  const p = over as Record<string, unknown>;
  const e = structuredClone(base);
  e.brandName = toStr(p.brandName);
  if (p.nav && typeof p.nav === 'object' && p.nav !== null) {
    const n = p.nav as Record<string, unknown>;
    e.nav = {
      home: toStr(n.home),
      proof: toStr(n.proof),
      services: toStr(n.services),
      process: toStr(n.process),
      about: toStr(n.about),
      approach: toStr(n.approach),
      contact: toStr(n.contact),
      cases: toStr(n.cases),
    };
  }
  if (p.hero && typeof p.hero === 'object' && p.hero !== null) {
    const h = p.hero as Record<string, unknown>;
    e.hero = {
      kicker: toStr(h.kicker),
      line1: toStr(h.line1),
      line2: toStr(h.line2),
      subtitle: toStr(h.subtitle),
      graphBrainLabel: toStr(h.graphBrainLabel),
      graphAria: toStr(h.graphAria),
      scrollHint: toStr(h.scrollHint),
      ctaPrimary: toStr(h.ctaPrimary),
      ctaSecondary: toStr(h.ctaSecondary),
    };
  }
  if (p.trust && typeof p.trust === 'object' && p.trust !== null) {
    e.trust = { line: toStr((p.trust as { line?: unknown }).line) };
  }
  if (p.proof && typeof p.proof === 'object' && p.proof !== null) {
    const r = p.proof as Record<string, unknown>;
    e.proof = {
      kicker: toStr(r.kicker),
      title: toStr(r.title),
      lead: toStr(r.lead),
      cards: e.proof.cards.map((c, i) => {
        const it = (r.cards as unknown[])?.[i] as Record<string, unknown> | undefined;
        if (!it) return c;
        return { badge: toStr(it.badge), title: toStr(it.title), body: toStr(it.body) };
      }) as typeof e.proof.cards,
    };
  }
  if (p.products && Array.isArray(p.products)) {
    const products = p.products as unknown[];
    e.products = e.products.map((prod, i) => {
      const it = products[i] as Record<string, unknown> | undefined;
      if (!it) return prod;
      return {
        id: toStr(it.id),
        title: toStr(it.title),
        tagline: toStr(it.tagline),
        body: toStr(it.body),
        bullets: toStr(it.bullets),
        imageUrl: toStr(it.imageUrl),
        focalX: toPercent(it.focalX),
        focalY: toPercent(it.focalY),
      };
    }) as typeof e.products;
  }
  if (p.cases && typeof p.cases === 'object' && p.cases !== null) {
    const c = p.cases as Record<string, unknown>;
    e.cases = { kicker: toStr(c.kicker), title: toStr(c.title), lead: toStr(c.lead), empty: toStr(c.empty) };
  }
  if (p.audience && typeof p.audience === 'object' && p.audience !== null) {
    const a = p.audience as Record<string, unknown>;
    e.audience = { kicker: toStr(a.kicker), title: toStr(a.title), body: toStr(a.body) };
  }
  if (p.engagement && typeof p.engagement === 'object' && p.engagement !== null) {
    const r = p.engagement as Record<string, unknown>;
    e.engagement = {
      kicker: toStr(r.kicker),
      title: toStr(r.title),
      lead: toStr(r.lead),
      cards: e.engagement.cards.map((c, i) => {
        const it = (r.cards as unknown[])?.[i] as Record<string, unknown> | undefined;
        if (!it) return c;
        return { title: toStr(it.title), body: toStr(it.body) };
      }) as typeof e.engagement.cards,
    };
  }
  if (p.faq && typeof p.faq === 'object' && p.faq !== null) {
    const f = p.faq as Record<string, unknown>;
    e.faq = {
      title: toStr(f.title),
      items: e.faq.items.map((c, i) => {
        const it = (f.items as unknown[])?.[i] as Record<string, unknown> | undefined;
        if (!it) return c;
        return { q: toStr(it.q), a: toStr(it.a) };
      }) as typeof e.faq.items,
    };
  }
  if (p.services && typeof p.services === 'object' && p.services !== null) {
    const s = p.services as Record<string, unknown>;
    e.services = { title: toStr(s.title), lead: toStr(s.lead), cta: toStr(s.cta), empty: toStr(s.empty) };
  }
  if (p.process && typeof p.process === 'object' && p.process !== null) {
    const r = p.process as Record<string, unknown>;
    e.process = {
      title: toStr(r.title),
      lead: toStr(r.lead),
      cta: toStr(r.cta),
      steps: e.process.steps.map((c, i) => {
        const it = (r.steps as unknown[])?.[i] as Record<string, unknown> | undefined;
        if (!it) return c;
        return { title: toStr(it.title), body: toStr(it.body) };
      }) as typeof e.process.steps,
    };
  }
  if (p.about && typeof p.about === 'object' && p.about !== null) {
    const a = p.about as Record<string, unknown>;
    e.about = { kicker: toStr(a.kicker), title: toStr(a.title), body: toStr(a.body) };
  }
  if (p.principles && typeof p.principles === 'object' && p.principles !== null) {
    const r = p.principles as Record<string, unknown>;
    e.principles = {
      title: toStr(r.title),
      lead: toStr(r.lead),
      items: e.principles.items.map((c, i) => {
        const it = (r.items as unknown[])?.[i] as Record<string, unknown> | undefined;
        if (!it) return c;
        return { title: toStr(it.title), body: toStr(it.body) };
      }) as typeof e.principles.items,
    };
  }
  if (p.contact && typeof p.contact === 'object' && p.contact !== null) {
    const c = p.contact as Record<string, unknown>;
    const f = c.form;
    e.contact = {
      title: toStr(c.title),
      lead: toStr(c.lead),
      emailLabel: toStr(c.emailLabel),
      whatsappCta: toStr(c.whatsappCta),
      cta: toStr(c.cta),
      drawerCta: toStr(c.drawerCta),
      drawer: {
        title: toStr((c.drawer as { title?: unknown })?.title),
        lead: toStr((c.drawer as { lead?: unknown })?.lead),
      },
      form:
        f && typeof f === 'object' && f !== null
          ? (() => {
              const m = f as Record<string, unknown>;
              return {
                name: toStr(m.name),
                email: toStr(m.email),
                whatsapp: toStr(m.whatsapp),
                company: toStr(m.company),
                needType: toStr(m.needType),
                needModular: toStr(m.needModular),
                needBespoke: toStr(m.needBespoke),
                needClientInfra: toStr(m.needClientInfra),
                needAutomation: toStr(m.needAutomation),
                needConsulting: toStr(m.needConsulting),
                needOther: toStr(m.needOther),
                message: toStr(m.message),
                privacy: toStr(m.privacy),
                submit: toStr(m.submit),
                openWhatsapp: toStr(m.openWhatsapp),
                cancel: toStr(m.cancel),
                emailProductLine: toStr(m.emailProductLine),
              };
            })()
          : e.contact.form,
    };
  }
  if (p.footer && typeof p.footer === 'object' && p.footer !== null) {
    const f = p.footer as Record<string, unknown>;
    e.footer = {
      rights: toStr(f.rights),
      built: toStr(f.built),
      locationLine: toStr(f.locationLine),
      emailUs: toStr(f.emailUs),
      socialAria: toStr(f.socialAria),
    };
  }
  if (p.serviceDetail && typeof p.serviceDetail === 'object' && p.serviceDetail !== null) {
    const s = p.serviceDetail as Record<string, unknown>;
    e.serviceDetail = { back: toStr(s.back), contactCta: toStr(s.contactCta) };
  }
  if (p.welcome && typeof p.welcome === 'object' && p.welcome !== null) {
    e.welcome = { line: toStr((p.welcome as { line?: unknown }).line) };
  }
  if (p.marketing && typeof p.marketing === 'object' && p.marketing !== null) {
    e.marketing = { subnavAria: toStr((p.marketing as { subnavAria?: unknown }).subnavAria) };
  }
  if (p.login && typeof p.login === 'object' && p.login !== null) {
    const l = p.login as Record<string, unknown>;
    e.login = {
      title: toStr(l.title),
      emailLabel: toStr(l.emailLabel),
      passwordLabel: toStr(l.passwordLabel),
      submit: toStr(l.submit),
    };
  }
  if (p.a11y && typeof p.a11y === 'object' && p.a11y !== null) {
    const a = p.a11y as Record<string, unknown>;
    e.a11y = {
      closeContactDrawer: toStr(a.closeContactDrawer),
      openMenu: toStr(a.openMenu),
      closeMenu: toStr(a.closeMenu),
      subnavPrev: toStr(a.subnavPrev),
      subnavNext: toStr(a.subnavNext),
      utilitiesMenu: toStr(a.utilitiesMenu),
    };
  }
  if (p.ui && typeof p.ui === 'object' && p.ui !== null) {
    const u = p.ui as Record<string, unknown>;
    const tone = toStr(u.paletteTone);
    e.ui = {
      login: toStr(u.login),
      theme: toStr(u.theme),
      themeLight: toStr(u.themeLight),
      themeDark: toStr(u.themeDark),
      paletteTone: tone === 'warm' || tone === 'cool' ? tone : 'cool',
    };
  }
  return e;
}

/** Rascunho JSON do admin: mesmo merge que a leitura, sem repositório. */
export function mergeSitePublicContent(over: unknown): SitePublicContent {
  return mergeFromFirestore(emptySitePublicContent(), over);
}
