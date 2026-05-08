export const SAO_PAULO_TZ = 'America/Sao_Paulo';

/** Chave yyyy-mm-dd no fuso America/Sao_Paulo (útil para agregar métricas “por dia” no Brasil). */
export function formatSaoPauloDayKey(date: Date): string {
  return date.toLocaleDateString('en-CA', { timeZone: SAO_PAULO_TZ });
}
