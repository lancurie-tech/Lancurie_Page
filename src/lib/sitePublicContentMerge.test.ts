import { describe, expect, it } from 'vitest';
import { emptySitePublicContent } from '@/data/emptyPublicContent';
import { getPublicContentFromDoc, mergeFromFirestore, mergeSitePublicContent, toStr } from '@/lib/sitePublicContentMerge';
import type { SiteCopyDoc } from '@/types/siteCopy';

describe('toStr', () => {
  it('lê cadeia directa', () => {
    expect(toStr('olá')).toBe('olá');
  });
  it('lê objecto legado { pt }', () => {
    expect(toStr({ pt: 't', en: 'x' })).toBe('t');
  });
  it('devolve vazio se inválido', () => {
    expect(toStr(null)).toBe('');
    expect(toStr(3)).toBe('');
  });
});

describe('mergeFromFirestore', () => {
  it('com overlay null devolve o clone da base vazia', () => {
    const b = emptySitePublicContent();
    const o = mergeFromFirestore(b, null);
    expect(o.brandName).toBe('');
    expect(o).not.toBe(b);
  });
  it('merge parcial de hero e nav', () => {
    const o = mergeFromFirestore(emptySitePublicContent(), {
      brandName: 'Lancurie',
      nav: { home: 'Início' },
      hero: { line1: 'Teste' },
    });
    expect(o.brandName).toBe('Lancurie');
    expect(o.nav.home).toBe('Início');
    expect(o.hero.line1).toBe('Teste');
  });
});

describe('getPublicContentFromDoc', () => {
  it('com doc null devolve editorial vazio e política de privacidade por omissão', () => {
    const c = getPublicContentFromDoc(null);
    expect(c.brandName).toBe('');
    expect(c.privacyPolicy.title).toBe('Política de privacidade');
    expect(c.privacyPolicy.sections[0]?.title).toBe('1. Objetivo');
  });
  it('lê publicContent aninhado', () => {
    const doc: SiteCopyDoc = {
      publicContent: { brandName: 'X', hero: { line1: 'L1' } },
    } as unknown as SiteCopyDoc;
    const c = getPublicContentFromDoc(doc);
    expect(c.brandName).toBe('X');
    expect(c.hero.line1).toBe('L1');
  });
});

describe('mergeSitePublicContent', () => {
  it('aceita o mesmo objecto que o admin (parcial) e reforça tamanhos de listas conhecidas', () => {
    const c = mergeSitePublicContent({ brandName: 'A', faq: { title: 'F', items: [{ q: '1', a: '2' }, {}] } });
    expect(c.faq.title).toBe('F');
    expect(c.faq.items[0]!.q).toBe('1');
    expect(c.faq.items[2]).toBeDefined();
  });
  it('merge de privacyPolicy preserva nove secções', () => {
    const c = mergeSitePublicContent({
      privacyPolicy: {
        title: 'Privacidade',
        sections: [{ title: 'A', body: 'B' }],
      },
    });
    expect(c.privacyPolicy.title).toBe('Privacidade');
    expect(c.privacyPolicy.sections[0]!.title).toBe('A');
    expect(c.privacyPolicy.sections[0]!.body).toBe('B');
    expect(c.privacyPolicy.sections[8]).toBeDefined();
    expect(c.privacyPolicy.sections[8]!.title).toBe('');
  });
});
