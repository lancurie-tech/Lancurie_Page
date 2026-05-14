import { Fragment, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { usePublicSiteSettings } from '@/contexts/usePublicSiteSettings';
import { useI18n } from '@/i18n/useI18n';
import { siteDomain } from '@/lib/site';
import { cn } from '@/lib/cn';

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function applyPrivacyPlaceholders(body: string, domain: string, email: string) {
  return body.replace(/\{\{dominioSite\}\}/g, domain).replace(/\{\{emailContato\}\}/g, email);
}

function renderInlineBold(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={i} className="font-medium text-zinc-200">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

function renderWithEmailLink(text: string, email: string): ReactNode {
  if (!email.trim()) return renderInlineBold(text);
  const re = new RegExp(`(${escapeRegExp(email)})`, 'g');
  const parts = text.split(re);
  return parts.map((part, i) =>
    part === email ? (
      <a
        key={i}
        href={`mailto:${email}`}
        className="font-medium text-zinc-300 underline decoration-zinc-500/45 underline-offset-2 hover:text-zinc-100"
      >
        {email}
      </a>
    ) : (
      <Fragment key={i}>{renderInlineBold(part)}</Fragment>
    )
  );
}

function PrivacySectionBody({ body, email }: { body: string; email: string }) {
  const resolved = applyPrivacyPlaceholders(body, siteDomain, email);
  const chunks = resolved.trim().split(/\n\n+/);
  return (
    <div className="space-y-3">
      {chunks.map((chunk, idx) => {
        const lines = chunk.split('\n').filter((l) => l.length > 0);
        const isUl = lines.length > 0 && lines.every((l) => /^\s*-\s/.test(l));
        if (isUl) {
          return (
            <ul key={idx} className="list-disc space-y-2 pl-5 text-zinc-300/92">
              {lines.map((line, j) => (
                <li key={j}>{renderWithEmailLink(line.replace(/^\s*-\s*/, ''), email)}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={idx} className="text-sm leading-relaxed text-zinc-300/95">
            {renderWithEmailLink(chunk, email)}
          </p>
        );
      })}
    </div>
  );
}

export function PrivacyPolicyPage() {
  const { publicText } = useI18n();
  const { contactEmail } = usePublicSiteSettings();
  const pp = publicText.privacyPolicy;

  return (
    <main className="flex-1">
      <article className="lancurie-band-b border-b border-zinc-800/80 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-8 lg:px-12">
          <p className="text-[0.64rem] font-semibold uppercase tracking-[0.24em] text-zinc-500">{pp.eyebrow}</p>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">{pp.title}</h1>
          <p className="mt-2 text-xs text-zinc-500">{pp.lastUpdatedLine}</p>

          <div className="mt-10 space-y-8">
            {pp.sections.map((section, index) => (
              <section key={`${index}-${section.title}`} className="space-y-3">
                <h2 className="text-base font-semibold text-zinc-100">{section.title}</h2>
                <PrivacySectionBody body={section.body} email={contactEmail} />
              </section>
            ))}
          </div>

          <p className="mt-12 border-t border-zinc-800/90 pt-8 text-center text-xs text-zinc-500">
            <Link to="/" className={cn('font-medium text-zinc-300 underline-offset-2 hover:text-zinc-100 hover:underline')}>
              {pp.backLinkLabel}
            </Link>
          </p>
        </div>
      </article>
    </main>
  );
}
