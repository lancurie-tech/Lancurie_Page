import { useMemo } from 'react';
import { useSiteCopy } from '@/contexts/useSiteCopy';
import { fallbackContactEmail, fallbackSocialLinks, fallbackWhatsappPhone } from '@/lib/site';

export function usePublicSiteSettings() {
  const { doc } = useSiteCopy();
  return useMemo(() => {
    const fromEnv = import.meta.env.VITE_CONTACT_EMAIL?.trim();
    const contactEmail =
      doc?.contactEmail?.trim() || fromEnv || fallbackContactEmail;
    const fromEnvWa = import.meta.env.VITE_WHATSAPP_PHONE?.replace(/\D/g, '') ?? '';
    const whatsappPhone =
      doc?.whatsappPhone?.replace(/\D/g, '') || fromEnvWa || fallbackWhatsappPhone;
    const linkedin = doc?.linkedinUrl?.trim() || fallbackSocialLinks.linkedin;
    const instagram =
      doc?.instagramUrl?.trim() ||
      doc?.githubUrl?.trim() ||
      fallbackSocialLinks.instagram;
    return {
      contactEmail,
      whatsappPhone,
      socialLinks: { linkedin, instagram } as const,
    };
  }, [doc]);
}
