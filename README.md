# Lancurie Technology — site institucional

SPA **Vite + React 19 + TypeScript + Tailwind CSS 4** com **Firebase** (Auth, Firestore, Hosting). Deploy automático com **GitHub Actions** usando branch `dev` para validação, preview em PR para `main` e deploy de produção apenas na `main`. A interface pública usa **apenas tema escuro** (não segue `prefers-color-scheme`).

## Funcionalidades

- **PT / EN**: idioma inicial por `localStorage` (se o utilizador já escolheu), depois `navigator.languages`, depois país estimado via [ipapi.co](https://ipapi.co) (HTTPS). Troca manual no cabeçalho persiste a escolha.
- **Recepção**: logo `logo-full` sem “caixa” retangular (sem wrap com borda/shimmer); entrada com **mola** (Framer Motion); saída com **voo** até ao logo do header e **clarão** do fundo em paralelo; **clique**, **Escape** ou temporizador iniciam a saída. `WelcomeLayoutProvider` + ref no link do header para medir o destino.
- **Secções**: hero, princípios, ofertas (cartões com hover tipo streaming), contacto (`mailto`).
- **Área administrativa** (Firebase): gestão de conteúdo e produtos (evolui conforme o repositório).

## Requisitos

- **Node.js** 22.x (alinhado à CI)
- **npm**

## Desenvolvimento local

```bash
npm ci
npm run dev
```

| Comando | Modo Vite | Firebase típico | Notas |
|--------|------------|------------------|--------|
| `npm run dev` | `development` | Projeto configurado em `.env.development` | Uso diário; HMR ativo. |
| `npm run dev:prod` | `production` | **Prod** (via `.env.production` / `.env.production.local`) | Servidor local em modo produção; **cuidado** com dados reais. |
| `npm run prod` | `production` | **Prod** | Alias de compatibilidade para `npm run dev:prod`. |
| `npm run build` | `production` | Conforme `.env.production*` | Build de produção (como na `main` na CI). |
| `npm run build:prod` | `production` | Conforme `.env.production*` | Alias explícito para build de produção. |
| `npm run build:dev` | `development` | Conforme `.env.development` | Build local em modo development. |
| `npm run preview` | — | Serve a pasta `dist` gerada pelo último build | |
| `npm run preview:prod` | `production` | Conforme `.env.production*` | Faz build de produção e sobe preview local em sequência. |
| `npm run lint` | — | — | ESLint. |

## Variáveis de ambiente

O cliente só expõe variáveis com prefixo **`VITE_`** (ver `src/lib/firebase/config.ts`). O Vite escolhe o ficheiro `.env` consoante o **modo** (`development` vs `production`); ver [documentação Vite — Env and Mode](https://vitejs.dev/guide/env-and-mode.html).

### Ficheiros (não commitados — ver `.gitignore`)

| Ficheiro | Quando é carregado |
|----------|---------------------|
| `.env.development` | `npm run dev`, `npm run build:dev` |
| `.env.production` / `.env.production.local` | `npm run prod`, `npm run build` |
| `.env.local` | Sobreposição local em qualquer modo (se existir) |

### Modelos no repositório

- **`.env.example`** — visão geral e estratégia de ambientes.
- **`.env.development.example`** → copiar para `.env.development` com as credenciais que deseja usar no desenvolvimento local.
- **`.env.production.example`** → copiar para `.env.production` ou `.env.production.local` se precisares de build/servidor local contra **prod** (raro).

### Variáveis Firebase (sempre estes nomes no cliente)

| Variável | Descrição |
|----------|-----------|
| `VITE_FIREBASE_API_KEY` | Chave Web do projeto Firebase. |
| `VITE_FIREBASE_AUTH_DOMAIN` | Domínio Auth. |
| `VITE_FIREBASE_PROJECT_ID` | ID do projeto (ex.: `lancurie`). |
| `VITE_FIREBASE_STORAGE_BUCKET` | Bucket Storage (se usado). |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Sender ID. |
| `VITE_FIREBASE_APP_ID` | App ID da app Web. |
| `VITE_CONTACT_EMAIL` | E-mail na secção de contacto (opcional). |

Na **CI**, os jobs usam os secrets de produção (**sem sufixo `_DEV`**) para validar build/lint, gerar preview no PR para `main` e fazer deploy live apenas na `main`.

## Fluxo Git recomendado

1. Branch de trabalho → **merge para `dev`** → validação (lint + build), sem deploy.
2. **PR `dev` → `main`** → validação + preview de Hosting.
3. Merge na **`main`** → deploy live no Firebase de produção.

## Deploy (Firebase Hosting + Firestore)

### Conceito

- **Produção:** projeto Firebase **`lancurie`** (ou o ID definido na variável `FIREBASE_PROJECT_PROD`).
- **Desenvolvimento:** branch de integração `dev` usada para validação contínua (sem deploy live).

Ficheiros relevantes:

- **`firebase.json`** — Hosting (`public: dist`, rewrite SPA para `/index.html`) + Firestore (`rules`, `indexes`).
- **`.firebaserc`** — alias `prod` (e `default`) para o ID GCP principal.

### GitHub Actions — `.github/workflows/deploy.yml`

| Evento | Job | O que faz |
|--------|-----|-----------|
| **Push** ou **workflow_dispatch** na branch **`dev`** | Validate | `npm ci`, `npm run lint`, `npm run build` (sem deploy). |
| **PR** com base em **`main`** | Validate + Preview | validação + **preview** de Hosting (URL no log / comentário no PR). |
| **Push** ou **workflow_dispatch** na **`main`** | Validate + Produção | validação + Hosting **live** em prod + deploy de Firestore/Storage rules em prod. |

Variável de repositório opcional (**Settings → Secrets and variables → Actions → Variables**):

- **`FIREBASE_PROJECT_PROD`** — ID de produção (por defeito: `lancurie`).

### Secrets no GitHub (**Settings → Secrets and variables → Actions**)

**Produção** (`main`):

| Secret | Conteúdo |
|--------|------------|
| `FIREBASE_SERVICE_ACCOUNT` | JSON completo da chave da conta de serviço do **projeto prod** (Firebase → Definições → Contas de serviço → Gerar nova chave privada). |
| `VITE_FIREBASE_API_KEY` | Config da app Web **prod**. |
| `VITE_FIREBASE_AUTH_DOMAIN` | … |
| `VITE_FIREBASE_PROJECT_ID` | … |
| `VITE_FIREBASE_STORAGE_BUCKET` | … |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | … |
| `VITE_FIREBASE_APP_ID` | … |

### Permissões IAM (Google Cloud) para a CI

A conta de serviço usada em cada projeto (campo `client_email` do JSON) precisa de conseguir:

- **Hosting** — deploy (a chave gerada no Firebase costuma bastar para Hosting).
- **Firestore** — o passo `firebase deploy --only firestore` chama a API **Service Usage**; se aparecer **403** ao “ensuring API”, no **IAM** do projeto (**prod**) edita essa conta e adiciona:
  - **Editor** (`roles/editor`), **ou**
  - **Visualizador do Service Usage** + **Administrador do Firebase** (papéis mais granulares).

### Permissões do repositório GitHub (workflow)

O workflow declara `checks: write` para a action `FirebaseExtended/action-hosting-deploy` criar *check runs*. Se a organização restringir o `GITHUB_TOKEN`, em **Settings → Actions → General → Workflow permissions** permite **Read and write** (ou equivalente que não bloqueie `checks: write`).

### Execução manual

**Actions** → workflow **CI + Deploy Firebase** → **Run workflow** (escolhe a branch **`dev`** para validar ou **`main`** para deploy).

## CI — `.github/workflows/ci.yml`

Em **push** e **PR** para **`main`** e **`dev`**: `npm ci`, `npm run lint`, `npm run build`. Recomenda-se exigir este check em **Branch protection** na `main`.

## Firebase CLI (opcional, local)

Na raiz do repo, com [Firebase CLI](https://firebase.google.com/docs/cli) instalada e login:

```bash
firebase deploy --only hosting --project lancurie
firebase deploy --only firestore --project lancurie
```

Sem `--project`, o CLI usa o alias **default** em `.firebaserc` (hoje `lancurie`).

## `vercel.json`

Mantém-se um **`vercel.json`** histórico (saída `dist/` + rewrite SPA). O deploy oficial deste repositório é **Firebase Hosting** via Actions; não é necessário configurar a Vercel para o fluxo atual.

## Assets de marca

Ficheiros em `public/brand/` (nomes estáveis para a web):

- `favicon.png`, `logo-full.png`, `identidade-visual.png`, `identidade-visual-transparent.png`, `wordmark.png`

## Manutenção deste README

Ao alterar fluxo de deploy, nomes de secrets, scripts `npm` ou ficheiros `.env`, atualiza as secções correspondentes aqui para novos membros da equipa e para o teu “eu futuro” conseguir operar o projeto sem adivinhar.

## Próximos passos (ideias)

- Formulário de contacto com Cloud Function ou backend em vez de só `mailto`.
- Monitorização / analytics conforme necessidade do negócio.
