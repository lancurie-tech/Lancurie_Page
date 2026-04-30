import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { INITIAL_CASE_STUDIES } from '../src/data/initialCaseStudiesSeed';
import { INITIAL_PRODUCTS } from '../src/data/initialProductsSeed';
import { INITIAL_SITE_PUBLIC_CONTENT } from '../src/data/initialSitePublicContent';

const __dir = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dir, '..', 'docs', 'firebase-seed');

function writeJson(name: string, data: unknown) {
  const path = join(outDir, name);
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log('Escrito', path);
}

mkdirSync(outDir, { recursive: true });

writeJson('publicContent.json', INITIAL_SITE_PUBLIC_CONTENT);
writeJson('products.json', INITIAL_PRODUCTS);
writeJson('caseStudies.json', INITIAL_CASE_STUDIES);

const siteCopyDefault = {
  contactEmail: 'contacto@exemplo.lancurie.pt',
  whatsappPhone: '3519XXXXXXXXX',
  linkedinUrl: 'https://www.linkedin.com/company/lancurie-technology',
  githubUrl: 'https://github.com/lancurie',
  publicContent: INITIAL_SITE_PUBLIC_CONTENT,
  images: {} as Record<string, string>,
};

writeJson('siteCopy-default-partial.json', siteCopyDefault);

console.log('Concluído. Ajusta email, WhatsApp e URLs em `siteCopy-default-partial.json` antes de importar.');
