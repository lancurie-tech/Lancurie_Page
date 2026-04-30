# Conteúdo inicial para o Firebase (Lancurie)

Objetivo: povoar **Firestore** (e opcionalmente **Storage** para imagens) com textos e catálogos, para o site público e o admin mostrarem dados reais de primeira.

## Gerar os JSON a partir do código

O conteúdo canónico vive em TypeScript em `src/data/` (evita desalinhos entre tipos e ficheiros manuais).

```bash
npm run seed:export
```

Ficheiros emitidos em `docs/firebase-seed/`:

| Ficheiro | Uso |
| --- | --- |
| `publicContent.json` | Só o bloco `publicContent` (se quiseres colar à mão noutro doc). |
| `siteCopy-default-partial.json` | Rascunho de documento `siteCopy` / **`default`**: `contactEmail`, `whatsappPhone`, `linkedinUrl`, `githubUrl`, `publicContent`, `images`. |
| `products.json` | Array alinhado a `ProductInput` — criar documentos em `products`. |
| `caseStudies.json` | Array alinhado a `CaseStudyInput` — criar documentos em `caseStudies`. |

**Antes de publicar:** edita `siteCopy-default-partial.json` (email real, `whatsappPhone` em dígitos com indicativo, ex. `3519XXXXXXXXX`, sem `+`) e, se for o caso, URLs LinkedIn/GitHub oficiais.

## Coleção `siteCopy` — documento `default`

1. No Console Firebase → **Firestore** → cria a coleção `siteCopy` (se ainda não existir).
2. Cria o documento com ID **`default`**.
3. Importa o conteúdo a partir de `siteCopy-default-partial.json` (ou copia o campo `publicContent` de `publicContent.json` e preenche os contactos no admin do site, em alternativa).
4. Campo `images` (opcional): mapa de chaves de `src/data/siteImageConfig.ts` para URL absoluta. Podes deixar `{}` e preencher depois no admin, que sincroniza com o Storage se configurado.

O site já não usa o antigo `strings`; tudo o que for texto estruturado do site passa em `publicContent` (e merge com defaults em `emptyPublicContent` / runtime).

## Coleção `products`

1. Cria a coleção **`products`**.
2. Para cada item em `products.json`, cria **um documento** com ID auto-gerado (ou o que preferires).
3. Os campos devem bater com o que o admin e o `subscribeProductsPublic` esperam (`titlePt`, `order`, `published`, etc.). Podes apagar chaves vazias (`imageUrl: ""`, `titleEn: ""`) se o importador o permitir.

## Coleção `caseStudies`

1. Cria a coleção **`caseStudies`**.
2. Idem: um documento por entrada em `caseStudies.json`, com `order` e `published` preenchidos.

## Regras e índices

Garante que as **regras de segurança** do Firestore permitem leitura pública dos documentos/campos usados no site (produtos e casos publicados, `siteCopy` relevante) e escrita só para contas de admin, conforme a tua implementação. Se usares `orderBy` em consultas, cria **índices compostos** quando o consola pedir o link a partir de um erro de dev tools.

## Versionamento

Os ficheiros em `docs/firebase-seed/*.json` podem ser **registados no Git** após `seed:export` para histórico; ou podes adicionar `docs/firebase-seed/*.json` ao `.gitignore` se quiseres que só a equipa regenere localmente — neste repositório, o fluxo padrão é comitar o snapshot para o deploy e revisão serem previsíveis.
