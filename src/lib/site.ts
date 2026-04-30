export const siteDomain = 'lancurie.com';

export const fallbackContactEmail = 'hello@lancurie.com';

/** Número WhatsApp só com dígitos (indicativo incluído). Definir em `VITE_WHATSAPP_PHONE` ou no Firestore. */
export const fallbackWhatsappPhone = '';

/** Links públicos por omissão (o painel admin / Firestore pode substituir). */
export const fallbackSocialLinks = {
  linkedin: 'https://www.linkedin.com',
  instagram: 'https://www.instagram.com',
} as const;
