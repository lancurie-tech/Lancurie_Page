# Planejamento — evolução do site e admin Lancurie

**Estado:** proposta para **validação e aceite** antes da implementação.  
**Data:** 2026-04-25  
**Referência de estilo & componentes:** [21st.dev](https://21st.dev/) (biblioteca de padrões UI — usar como *inspiração* de interação, *layout* e *craft*, não *copy-paste* cego).  
**Referências adicionais de “sites tech”:** [Vercel](https://vercel.com), [Linear](https://linear.app), [Resend](https://resend.com), [Raycast](https://raycast.com) — grelha, profundidade, *motion* contido, tipografia, pouco ruído.

---

## 1. Objetivo

Elevar a percepção de **qualidade, cor e sofisticação** (sem perder clareza B2B), alinhada à ideia da empresa: **resolução de problemas** com produto, plataforma, build a medida e consultoria. Inclui **site público** e **área de admin** (conteúdo, produtos, imagens) com a mesma linha *premium* e boa *UX*.

### 1.1 O layout actual **não** é regra (mandato de evolução)

- A estrutura e o *UI* atuais são **ponto de partida**, não **congelados**. Cada fase pode **reorganizar secções**, **mudar hierarquia visual** e **introduzir novos módulos** — desde que passem o trio de Fiscais e o *gate* da fase.
- **Peso e modernidade** são objectivos explícitos: a marca deve **sentir-se contemporânea e credível** (B2B com *craft* de produto *tech*), não “site institucional genérico”.
- **Papel do POD B (UI home) + Fiscal-Visual:** propor **1–2 assinaturas** por fase (ex.: *hero* com *motion* *signature*, *bento* mais agressivo, *footer* *editorial*). O **revisor** do POD deve trazer **alternativas** e *trade-offs* (não só validar a primeira opção).
- **Artefactos de “categoria top” (candidatos, não lista fechada):** *motion* com intenção (entradas, *hover*, *parallax* leve, *shimmer* / *border* *animated* com parcimónia); **elemento quase-grafo** (rede, nós, fluxo de dados) em *CSS/SVG* + *pointer* *feedback* **ou** *canvas* ligeiro *below-the-fold* / *on idle*; grelha *grid* *visível*; *depth* e *glass* sem ruído. A escolha concreta é **decisão do POD** com *input* do Fiscal-UX (legibilidade) e Fiscal-geral (mensagem = somos nós, não *gadget* *vazio*).
- **Travões saudáveis:** `prefers-reduced-motion`, *LCP* e *bundle* (ver §2 e §6). *Glamour* pesado **não** no primeiro *paint*; *canvas/WebGL* só com *lazy* e *budget* acordado.

---

## 2. Princípios (Fiscal-geral)

1. **Coerência de marca** — tudo o que o site promete, a operação e o *copy* do bundle/Firestore suportam.  
2. **Acessibilidade mínima** — contraste, foco, `aria`, *motion* respeitando `prefers-reduced-motion`.  
3. **Performance** — *glamour* primeiro com *CSS*; *JS* e *framer* onde o *ROI* for claro.  
4. **Dois cérebros de conteúdo** — `messages.ts` (código) + `siteCopy` (Firebase) com processo de *sync* conhecido.  
5. **Admin é produto** — quem edita o site não pode lutar com a ferramenta.

---

## 3. Estrutura de equipa (agentes & subagentes)

Modelo híbrido: **Fiscais** (aprovação e crítica) + **PODs** (execução com par **executor ↔ revisor**).

### 3.1 Fiscais (sempre envolvidos nos *gates* de fase)

| Papel | Responsabilidade | Critérios principais |
|--------|--------------------|------------------------|
| **Fiscal-geral** | Coerência *end-to-end*, risco, escopo, alinhamento com a Lancurie | Uma voz, sem promessas vazias; *scope* fase claro |
| **Fiscal-UX** | Jornada, *forms*, *nav*, *mobile*, *admin* | Tarefa crítica em &lt; 3 cliques; *friction* mínima |
| **Fiscal-Visual/IA** | *Look*, *color*, *depth*, *typography*, *motion* | Parece “categoria top”; referência 21st/Vercel/Linear; sem *rainbow* caótico |

Regra de *peer review* em cada POD: **nenhuma entrega** sobe a revisão do trio sem o **revisor** do mesmo POD ter *checklist* preenchida e **críticas** registadas (mesmo que “nada a apontar”).

### 3.2 PODs (tarefas + pares)

| POD | Foco | Executor (proposta) | Revisor (crítica) | Fiscais no *gate* |
|-----|------|------------------------|--------------------|------------------|
| **A — Marca & conteúdo** | *Hero*, *encaixe*, *FAQ*, *tom*, *pt-BR* | Subagente *Copy* | Subagente *Marca* | Geral, Visual (copy visual) |
| **B — UI home** | *Layout*, *seções*, *bento*/*glass*, *grid*, *CTA* | Subagente *UI* | Subagente *Motion/CSS* | Visual, UX |
| **C — Sistema visual** | *Tokens*, *cores* de acento, *dark* *rhythm* | *Design system* *lead* | *A11y* *contrast* *buddy* | Visual, Geral |
| **D — Admin** | *AdminSiteContent*, *produtos*, *navegação* admin, *estados* *empty* / *saving* | *UX* *admin* | *Dev* *consistency* | UX, Geral |
| **E — Técnico** | *Bundle*, *Firestore*, *perf*, *i18n* keys | *Engineering* | *Perf/budget* *review* | Geral, UX (perf = UX) |

### 3.3 Orquestrador (único ponto de decisão de fase)

- **Orquestrador** — desbloqueia *Fase N+1* **só** com *sign-off* dos **3 Fiscais** (pode ser “condicional”: *go* com *dívida* listada).  
- Conflito entre fiscais: **Fiscal-geral** *desempata* (com registo de *trade-off*).

---

## 4. Ideias a *importar* (referência, não *clone*)

### 4.1 [21st.dev](https://21st.dev/)

- *Bento* / grelha assimétrica; cartões com *hover* e *border* *glow* suave.  
- *Input* e *CTA* com estados (foco, *disabled*) muito nítidos — aplicável ao *drawer* de contacto e a campos *admin*.  
- *Subtle* *animated* *borders* ou *shimmer* em **1** *hero* *element* (não em todo o site).  

### 4.2 Outros

- **Vercel** — *monochrome* + grelha; muito *whitespace*; *footer* *clean*.  
- **Linear** — *dark* *premium*; *blur*; acento frio; sensação *fast*.  
- **Resend** — se um dia *light* *section*; *card* *elevation* suave.  
- **Raycast** — *depth* e *glass* sem *saturar*.

---

## 5. Fases, entregas e revisão

Cada fase termina com **revisão tripartite** (3 Fiscais) + **checklist** do POD. Máx. **2** ciclos de *rework* por fase; depois *escopo* cai para *follow-up*.

| Fase | Nome | Entregas (exemplos) | *Gate* |
|------|------|----------------------|--------|
| **0** | *Audit* *baseline* | *Scorecard* *UX* (nave, CTAs, *mobile*), *Visual* (paleta, *depth*), *Geral* (copy vs. oferta), *inventário* *admin* | ✓ 3 fiscais |
| **1** | *Design system* *light* | *Tokens* (cor acento, *surfaces*), 2–3 *component* *primitivos* (e.g. *card* *elevado*, *section* *shell*) | ✓ 3 fiscais |
| **2** | *Home* *iteration* | *Hero* reforçado; **pode** *refactor* *layout* (secções, *grid*); *signature* *motion* e/ou **artefacto** *tipo* *grafo* *interactivo* (se aprovado no *gate*); *encaixe*; *catálogo*; *provas*; opcional: *logos* / *citação* | ✓ 3 fiscais |
| **3** | *Admin* *parity* | *Layout* e *hierarquia* alinhados ao *dark* *marketing*; *estados* *loading* / *erro*; *fluxo* *Guardar* / *sync* *bundle* | ✓ 3 fiscais |
| **4** | *Hardening* | *A11y* *spot*; *LCP* *hero*; *regressão* *i18n*; *checklist* *Firestore* | ✓ 3 fiscais |

---

## 6. Riscos e *trade-offs*

- **Mais cor** *vs.* *premium* *sob* — testar *accent* (ciano) só em *highlights* (bordos, 1 *gradient*), não fundos inteiros.  
- *Motion* *vs.* *LCP* — *loop* *hero* *leve*; *avoid* *heavy* *canvas* *na* *first paint*.  
- *Admin* *“bonito”* *vs.* *tempo* — fase 3 pode ser *incremental* (cabeçalho + *cards* *panel* *primeiro*).  

---

## 7. Aceite para implementação

- [ ] Li e aceito a **estrutura de fiscais e PODs**.  
- [ ] Aceito a **ordem das fases** (0 → 1 → 2 → 3 → 4).  
- [ ] Aceito as **referências** (21st + lista acima) como *guia*, não *obrigação* de *component* específico.  
- [ ] Autorizo avançar para **Fase 0 (audit) + Fase 1 (tokens + primitivos)** após a tua *assinatura* / *comentário* de aceite.  

**Assinatura (opcional):** _Nome / data_  

---

## 8. Nota

Este documento vive no repositório para *traceability*; o **estado reactivo** dos agentes no dia-a-dia do Cursor continua em `.cursor/rules/lancurie-conselho-tres-agentes.mdc` e é complementado por [`.cursor/rules/lancurie-orquestracao-site.mdc`](../.cursor/rules/lancurie-orquestracao-site.mdc) (Fiscais + fases + admin).
