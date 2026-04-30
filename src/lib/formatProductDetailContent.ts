/** Divide o corpo longo em parágrafos (blocos separados por linha em branco). */
export function splitBodyParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

type BulletParse =
  | { kind: 'list'; items: string[] }
  | { kind: 'prose'; text: string };

/**
 * Se todas as linhas não vazias parecem itens de lista, devolve lista;
 * caso contrário mantém o texto para `whitespace-pre-line`.
 */
export function parseBulletBlock(text: string): BulletParse {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) {
    return { kind: 'prose', text: '' };
  }
  const bulletLike = (line: string) =>
    /^[-*•]\s/.test(line) || /^\d+[.)]\s/.test(line);
  if (lines.length >= 2 && lines.every(bulletLike)) {
    return {
      kind: 'list',
      items: lines.map((l) => l.replace(/^[-*•]\s|^\d+[.)]\s/, '').trim()),
    };
  }
  return { kind: 'prose', text: text.trim() };
}
