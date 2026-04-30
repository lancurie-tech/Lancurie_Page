# Lancurie Technology — site institucional

SPA **Vite + React 19 + TypeScript + Tailwind CSS 4** com **Firebase** (Auth, Firestore, Hosting). Deploy automático com **GitHub Actions** para **dois projetos Firebase** (desenvolvimento e produção), com bases de dados separadas. A interface pública usa **apenas tema escuro** (não segue `prefers-color-scheme`).

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
| `npm run dev` | `development` | **Dev** (via `.env.development`) | Uso diário; HMR ativo. |
| `npm run prod` | `production` | **Prod** (via `.env.production` / `.env.production.local`) | **Cuidado:** lê/escreve no projeto real. Só para debug pontual. |
| `npm run build` | `production` | Conforme `.env.production*` | Build de produção (como na `main` na CI). |
| `npm run build:dev` | `development` | Conforme `.env.development` | Build alinhado ao ambiente dev na CI. |
| `npm run preview` | — | Serve a pasta `dist` gerada pelo último build | |
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
- **`.env.development.example`** → copiar para `.env.development` com credenciais do projeto Firebase **dev**.
- **`.env.production.example`** → copiar para `.env.production` ou `.env.production.local` se precisares de build/servidor local contra **prod** (raro).

### Variáveis Firebase (sempre estes nomes no cliente)

| Variável | Descrição |
|----------|-----------|
| `VITE_FIREBASE_API_KEY` | Chave Web do projeto Firebase. |
| `VITE_FIREBASE_AUTH_DOMAIN` | Domínio Auth. |
| `VITE_FIREBASE_PROJECT_ID` | ID do projeto (ex.: `lancurie` ou `lancurie-dev`). |
| `VITE_FIREBASE_STORAGE_BUCKET` | Bucket Storage (se usado). |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Sender ID. |
| `VITE_FIREBASE_APP_ID` | App ID da app Web. |
| `VITE_CONTACT_EMAIL` | E-mail na secção de contacto (opcional). |

Na **CI**, o job **dev** usa secrets com sufixo **`_DEV`** (ex.: `VITE_FIREBASE_API_KEY_DEV`); o workflow mapeia os valores para `VITE_FIREBASE_*` durante o build. O job **prod** usa secrets **sem** sufixo.

## Fluxo Git recomendado

1. Branch de trabalho → **merge para `dev`** → deploy e testes no **Firebase dev** (Hosting live + Firestore desse projeto).
2. Quando estiver validado → **merge `dev` → `main`** → deploy no **Firebase prod**.

Assim o tráfego e os dados de desenvolvimento não misturam com produção.

## Deploy (Firebase Hosting + Firestore)

### Conceito

- **Produção:** projeto Firebase **`lancurie`** (ou o ID definido na variável `FIREBASE_PROJECT_PROD`).
- **Desenvolvimento:** segundo projeto Firebase (**ex.: `lancurie-dev`**) com Auth, Firestore e Hosting próprios (ou o ID em `FIREBASE_PROJECT_DEV`).

Ficheiros relevantes:

- **`firebase.json`** — Hosting (`public: dist`, rewrite SPA para `/index.html`) + Firestore (`rules`, `indexes`).
- **`.firebaserc`** — aliases `prod` e `dev` para os IDs GCP.

### GitHub Actions — `.github/workflows/deploy.yml`

| Evento | Job | O que faz |
|--------|-----|-----------|
| **Push** ou **workflow_dispatch** na branch **`dev`** | Dev | Build com secrets `*_DEV` → Hosting **live** no projeto dev → `firebase deploy --only firestore` no projeto dev. |
| **Push** ou **workflow_dispatch** na **`main`** | Produção | Build com secrets de prod → Hosting **live** em prod → Firestore em prod. |
| **PR** com base em **`main`** ou **`dev`** | Dev | Build com secrets **dev** → **preview** de Hosting só no projeto **dev** (URL no log / comentário no PR). |

Variáveis de repositório opcionais (**Settings → Secrets and variables → Actions → Variables**):

- **`FIREBASE_PROJECT_DEV`** — ID do projeto dev (por defeito no YAML: `lancurie-dev`).
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

**Desenvolvimento** (`dev` e PRs):

| Secret | Conteúdo |
|--------|------------|
| `FIREBASE_SERVICE_ACCOUNT_DEV` | JSON completo da chave no **projeto dev** (não um fragmento nem só o e-mail). |
| `VITE_FIREBASE_API_KEY_DEV` | … |
| `VITE_FIREBASE_AUTH_DOMAIN_DEV` | … |
| `VITE_FIREBASE_PROJECT_ID_DEV` | … |
| `VITE_FIREBASE_STORAGE_BUCKET_DEV` | … |
| `VITE_FIREBASE_MESSAGING_SENDER_ID_DEV` | … |
| `VITE_FIREBASE_APP_ID_DEV` | … |

### Permissões IAM (Google Cloud) para a CI

A conta de serviço usada em cada projeto (campo `client_email` do JSON) precisa de conseguir:

- **Hosting** — deploy (a chave gerada no Firebase costuma bastar para Hosting).
- **Firestore** — o passo `firebase deploy --only firestore` chama a API **Service Usage**; se aparecer **403** ao “ensuring API”, no **IAM** do projeto (**Lancurie Dev** ou **prod**) edita essa conta e adiciona, no mínimo para ambiente dev:
  - **Editor** (`roles/editor`), **ou**
  - **Visualizador do Service Usage** + **Administrador do Firebase** (papéis mais granulares).

### Permissões do repositório GitHub (workflow)

O workflow declara `checks: write` para a action `FirebaseExtended/action-hosting-deploy` criar *check runs*. Se a organização restringir o `GITHUB_TOKEN`, em **Settings → Actions → General → Workflow permissions** permite **Read and write** (ou equivalente que não bloqueie `checks: write`).

### Execução manual

**Actions** → workflow **Deploy Firebase (dev + prod)** → **Run workflow** (escolhe a branch **`dev`** ou **`main`** conforme o ambiente).

## CI — `.github/workflows/ci.yml`

Em **push** e **PR** para **`main`** e **`dev`**: `npm ci`, `npm run lint`, `npm run build`. Recomenda-se exigir este check em **Branch protection** na `main`.

## Firebase CLI (opcional, local)

Na raiz do repo, com [Firebase CLI](https://firebase.google.com/docs/cli) instalada e login:

```bash
firebase deploy --only hosting --project lancurie-dev
firebase deploy --only firestore --project lancurie-dev
```

Sem `--project`, o CLI usa o alias **default** em `.firebaserc` (hoje **prod** `lancurie`). Para **dev**, usa sempre o ID ou `firebase use dev` se o alias estiver correto.

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
