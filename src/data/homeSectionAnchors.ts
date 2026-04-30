/** Ancoras HTML (`id` da `<section>`) alinhadas aos separadores do editor. */
export const TAB_ID_TO_SECTION_ANCHOR: Record<string, string> = {
  inicio: 'hero',
  servicos: 'servicos',
  processo: 'processo',
  empresa: 'about',
  abordagem: 'approach',
  contato: 'contact',
};

export function tabIdForSectionAnchor(anchor: string): string | undefined {
  const hit = Object.entries(TAB_ID_TO_SECTION_ANCHOR).find(([, a]) => a === anchor);
  return hit?.[0];
}

export function sectionAnchorForTabId(tabId: string): string | undefined {
  return TAB_ID_TO_SECTION_ANCHOR[tabId];
}
