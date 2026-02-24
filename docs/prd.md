# BeeInside — Margem de Contribuição com Bling API
## Product Requirements Document (PRD)

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-02-20 | 0.1.0 | Initial draft | Morgan (@pm) |

---

## 1. Goals and Background Context

### Goals

- Automatizar a coleta de notas fiscais de vendas de 2 contas Bling distintas via API
- Consolidar dados de produtos vendidos (nome, quantidade, preço de venda) em uma única interface
- Permitir ao usuário registrar o CMV (Custo da Mercadoria Vendida) unitário por produto por mês
- Permitir categorização manual de contas pagas como "Despesa" ou "Custo de Produto"
- Permitir configuração da alíquota de imposto (%) mensal a ser considerada nos cálculos
- Calcular automaticamente a Margem de Contribuição por produto: `Qtd × (Preço de Venda − Imposto − CMV)`
- Apresentar o resultado final: MC Total − Despesas = Resultado Operacional do mês
- Entregar um relatório gerencial mensal acionável para tomada de decisão de precificação e mix de produtos

### Background Context

Micro e pequenas empresas que utilizam o Bling ERP frequentemente não possuem visibilidade clara de sua margem de contribuição real por produto. Os dados estão dispersos nas notas fiscais de venda, mas o processamento manual é trabalhoso e propenso a erros. A ausência de visibilidade sobre quais produtos realmente geram margem positiva — após desconto de impostos e custo de aquisição — impede decisões estratégicas de precificação e composição de portfólio.

O BeeInside resolve esse problema conectando-se à Bling API para extrair automaticamente os dados de vendas de até 2 contas distintas, guiando o usuário em um fluxo estruturado de preenchimento de custos e despesas, e entregando ao final um relatório completo de Margem de Contribuição por produto e consolidado mensal.

---

## 2. Requirements

### Functional Requirements

- **FR1:** O sistema deve permitir a conexão de até 2 contas Bling via autenticação OAuth 2.0 (Bling API v3)
- **FR2:** O sistema deve buscar notas fiscais de saída (NF-e de vendas) de ambas as contas para um período mensal selecionado pelo usuário
- **FR3:** O sistema deve extrair e consolidar por produto: nome do produto, valor unitário de venda e quantidade vendida, agrupando por nome de produto entre as 2 contas
- **FR4:** O sistema deve exibir a lista de produtos vendidos no mês e solicitar o preenchimento do CMV unitário para cada produto
- **FR5:** O sistema deve persistir os CMVs preenchidos por produto para reutilização e edição em meses subsequentes
- **FR6:** O sistema deve exibir a lista de contas pagas do período (via Bling API — módulo Financeiro) e permitir ao usuário categorizar cada conta manualmente como: **"Despesa"** ou **"Custo de Produto"**
- **FR7:** O sistema deve solicitar ao usuário a alíquota de imposto (%) a ser aplicada uniformemente sobre o valor de venda no mês
- **FR8:** O sistema deve calcular a Margem de Contribuição unitária por produto: `MC = Quantidade × (Preço de Venda − (Preço de Venda × Alíquota%) − CMV Unitário)`
- **FR9:** O sistema deve calcular e exibir o Resultado Operacional Final: `Resultado = Σ(MC por produto) − Σ(Despesas categorizadas)`
- **FR10:** O sistema deve apresentar um relatório/dashboard final com: detalhamento de MC por produto, total de despesas, e resultado operacional consolidado do mês
- **FR11:** O sistema deve permitir selecionar o mês/ano de referência para a análise

### Non-Functional Requirements

- **NFR1:** A aplicação deve ser responsiva e funcional em desktop (resolução mínima 1280px) e tablet
- **NFR2:** As credenciais Bling (tokens OAuth e refresh tokens) devem ser armazenadas de forma segura no backend, nunca expostas ao frontend
- **NFR3:** O tempo de carregamento e processamento das NFs do Bling não deve exceder 30 segundos para volumes de até 500 notas por mês por conta
- **NFR4:** A aplicação deve ser deployável via Vercel (frontend Next.js) e Railway (backend API)
- **NFR5:** O sistema deve tratar rate limiting da Bling API com retry automático com backoff exponencial e feedback visual ao usuário
- **NFR6:** Os dados de CMV e categorizações devem ser persistidos em banco de dados (não apenas em memória)
- **NFR7:** A aplicação deve funcionar exclusivamente em português do Brasil

---

## 3. User Interface Design Goals

### Overall UX Vision

Interface limpa, financeira e objetiva. O usuário é um gestor/empreendedor que precisa de clareza e velocidade — não de complexidade. Fluxo guiado em etapas (wizard-style) para a entrada de dados do mês, com um dashboard de resultado ao final.

### Key Interaction Paradigms

- **Fluxo linear em etapas:** O usuário é conduzido passo a passo (Passo 1: CMV → Passo 2: Categorização → Passo 3: Alíquota → Resultado)
- **Tabelas editáveis inline:** Preenchimento de CMV diretamente na tabela de produtos, sem modais
- **Categorização por toggle/dropdown:** Cada conta paga tem um seletor simples de categoria
- **Dashboard de resultado:** Visualização final com cards de resumo e tabela detalhada

### Core Screens and Views

1. **Dashboard / Home** — Seleção de mês/ano e visão geral dos resultados já calculados
2. **Conexão de Contas Bling** — Tela de autenticação OAuth para conectar as 2 contas
3. **Passo 1: Produtos & CMV** — Tabela de produtos vendidos no mês com campo de CMV editável
4. **Passo 2: Contas Pagas** — Lista de contas pagas com seletor de categoria (Despesa / Custo de Produto)
5. **Passo 3: Alíquota de Imposto** — Input simples para percentual de imposto do mês
6. **Resultado Final** — Dashboard com Margem de Contribuição por produto, total de despesas e resultado operacional

### Accessibility

WCAG AA (básico)

### Branding

Interface minimalista com paleta neutra (branco, cinza, preto) e acento em amarelo/âmbar — referência à identidade "BeeInside". Tipografia clean, sans-serif. Sem elementos visuais desnecessários.

### Target Device and Platforms

Web Responsive — prioridade Desktop, suporte a Tablet

---

## 4. Technical Assumptions

### Repository Structure

**Monorepo** — Frontend (Next.js) e Backend (API Routes Next.js ou Node.js separado) no mesmo repositório

### Service Architecture

**Next.js Full-Stack com API Routes**

- Frontend: Next.js 14+ (App Router) + React + Tailwind CSS
- Backend: Next.js API Routes (para chamadas à Bling API, sem expor tokens ao cliente)
- Banco de dados: PostgreSQL via Supabase (armazenamento de tokens, CMVs, categorizações)
- ORM: Prisma ou Supabase Client
- Autenticação Bling: OAuth 2.0 (Bling API v3) — tokens armazenados no backend

### Testing Requirements

- **Unit Tests:** Funções de cálculo de Margem de Contribuição (obrigatório)
- **Integration Tests:** Endpoints de API (Bling OAuth flow, busca de NFs)
- **Manual Testing:** Fluxo completo de usuário por mês

### Additional Technical Assumptions and Requests

- Bling API v3 base URL: `https://www.bling.com.br/Api/v3`
- OAuth 2.0 scopes necessários: `nota_fiscal`, `financeiro` (contas a pagar)
- Rate limiting Bling: ~3 req/s — implementar queue com backoff exponencial
- Ambiente: Node.js 20+, TypeScript obrigatório
- Deploy: Vercel (frontend + API routes) — opção Railway para API dedicada se necessário
- Variáveis de ambiente: `BLING_CLIENT_ID_1`, `BLING_CLIENT_SECRET_1`, `BLING_CLIENT_ID_2`, `BLING_CLIENT_SECRET_2`, `DATABASE_URL`
- Supabase para persistência de dados (CMVs por produto/mês, categorizações de contas, tokens OAuth)

---

## 5. Epic List

### Epic 1: Foundation & Bling OAuth Connection
Estabelecer a infraestrutura do projeto (Next.js, Supabase, TypeScript) e implementar o fluxo completo de autenticação OAuth 2.0 com a Bling API para 2 contas, com persistência segura de tokens.

### Epic 2: Coleta e Consolidação de Dados de Vendas
Implementar a busca de Notas Fiscais de venda e Contas Pagas da Bling API para ambas as contas, consolidando os dados de produtos (nome, quantidade, preço) e contas financeiras para um período mensal selecionado.

### Epic 3: Fluxo de Entrada de Dados do Usuário
Construir o fluxo guiado em 3 etapas: (1) preenchimento de CMV por produto, (2) categorização de contas pagas como Despesa ou Custo de Produto, e (3) configuração da alíquota de imposto do mês.

### Epic 4: Cálculo e Relatório de Margem de Contribuição
Implementar o motor de cálculo de Margem de Contribuição por produto e resultado operacional final, exibindo o relatório/dashboard completo com detalhamento por produto e totais consolidados.

---

## 6. Epic Details

---

### Epic 1: Foundation & Bling OAuth Connection

**Goal:** Criar a base técnica do projeto e garantir que o sistema consiga autenticar com sucesso nas 2 contas Bling, armazenando tokens de forma segura e renovando-os automaticamente.

---

#### Story 1.1: Project Scaffold & Environment Setup

As a developer,
I want the Next.js project scaffolded with TypeScript, Tailwind, Supabase and all dependencies configured,
so that the team has a working foundation to build upon.

**Acceptance Criteria:**
1. Next.js 14+ com App Router, TypeScript e Tailwind CSS configurados
2. Supabase client configurado com variáveis de ambiente
3. Estrutura de pastas definida: `/app`, `/lib`, `/components`, `/types`
4. ESLint + Prettier configurados
5. README com instruções de setup local
6. `.env.example` com todas as variáveis necessárias documentadas
7. Deploy básico funcionando na Vercel (página placeholder)

---

#### Story 1.2: Bling OAuth 2.0 — Conexão da Conta 1

As a user,
I want to connect my first Bling account via OAuth,
so that the system can access my sales data securely.

**Acceptance Criteria:**
1. Botão "Conectar Conta Bling 1" redireciona para o fluxo de autorização Bling OAuth 2.0
2. Após autorização, o callback captura `code` e troca por `access_token` + `refresh_token`
3. Tokens são armazenados de forma segura no Supabase (nunca expostos no frontend)
4. Status de conexão ("Conectado" / "Não conectado") é exibido na tela de configurações
5. Refresh token automático implementado quando `access_token` expira
6. Tratamento de erro para autorização negada ou falha na troca de token

---

#### Story 1.3: Bling OAuth 2.0 — Conexão da Conta 2

As a user,
I want to connect a second Bling account independently,
so that I can consolidate data from both companies.

**Acceptance Criteria:**
1. Fluxo OAuth independente para Conta 2 (separado da Conta 1)
2. Ambas as contas exibem status de conexão na tela de configurações
3. Sistema suporta operação com apenas 1 conta conectada (Conta 2 opcional)
4. Tokens da Conta 2 armazenados separadamente no Supabase
5. Botão de desconectar disponível para cada conta individualmente

---

### Epic 2: Coleta e Consolidação de Dados de Vendas

**Goal:** Buscar automaticamente as Notas Fiscais de venda e Contas Pagas de ambas as contas Bling para o mês selecionado, consolidando os dados em estruturas prontas para o fluxo de análise.

---

#### Story 2.1: Seletor de Período Mensal

As a user,
I want to select the month/year I want to analyze,
so that the system fetches the correct period's data.

**Acceptance Criteria:**
1. Seletor de mês/ano na tela principal (mês atual como padrão)
2. Seleção persiste durante toda a sessão de análise
3. Interface indica claramente o período selecionado em todas as telas do fluxo
4. Botão "Buscar Dados" dispara a coleta via Bling API

---

#### Story 2.2: Busca de Notas Fiscais de Venda (Bling API)

As a user,
I want the system to automatically fetch all sales invoices from both Bling accounts for the selected month,
so that I don't need to export data manually.

**Acceptance Criteria:**
1. API Route `/api/bling/notas-fiscais` busca NFs de saída de ambas as contas para o período
2. Paginação da Bling API tratada (busca todas as páginas automaticamente)
3. Rate limiting tratado com retry automático (máx. 3 tentativas com backoff)
4. Dados extraídos por item de NF: nome do produto, quantidade, valor unitário
5. Loading state e feedback visual durante a busca
6. Tratamento de erro com mensagem amigável ao usuário
7. Resultados das 2 contas consolidados em uma única lista de produtos

---

#### Story 2.3: Busca de Contas Pagas (Bling API — Financeiro)

As a user,
I want the system to fetch all paid accounts (expenses) from Bling for the selected month,
so that I can categorize them without manual lookup.

**Acceptance Criteria:**
1. API Route `/api/bling/contas-pagas` busca contas a pagar com status "pago" do período
2. Dados extraídos: descrição da conta, valor, data de pagamento, conta de origem (Conta 1 ou 2)
3. Lista exibida no Passo 2 do fluxo com todos os lançamentos do período
4. Paginação e rate limiting tratados conforme Story 2.2
5. Contas de ambas as contas Bling consolidadas na mesma lista

---

### Epic 3: Fluxo de Entrada de Dados do Usuário

**Goal:** Implementar o fluxo guiado de 3 etapas que coleta os dados necessários do usuário (CMV, categorização de despesas e alíquota) para viabilizar o cálculo da Margem de Contribuição.

---

#### Story 3.1: Passo 1 — Preenchimento de CMV por Produto

As a user,
I want to fill in the unit cost (CMV) for each product sold in the month,
so that the system can calculate the accurate contribution margin.

**Acceptance Criteria:**
1. Tabela exibe todos os produtos consolidados do mês com: nome, quantidade vendida, preço médio de venda
2. Coluna "CMV Unitário (R$)" editável inline para cada produto
3. CMV preenchido anteriormente para o mesmo produto é carregado automaticamente do banco
4. Validação: CMV deve ser um número positivo, menor que o preço de venda
5. Botão "Salvar e Continuar" persiste os CMVs no Supabase e avança para o Passo 2
6. Indicador visual de campos pendentes (não preenchidos)

---

#### Story 3.2: Passo 2 — Categorização de Contas Pagas

As a user,
I want to manually categorize each paid account as "Despesa" or "Custo de Produto",
so that the system knows what to subtract from the contribution margin.

**Acceptance Criteria:**
1. Lista de contas pagas do período exibida com: descrição, valor, conta de origem
2. Cada conta possui seletor de categoria: **"Despesa"** | **"Custo de Produto"** | **"Ignorar"**
3. Categorizações anteriores para a mesma descrição de conta são sugeridas automaticamente
4. Total de "Despesas" e "Custo de Produto" exibido em tempo real enquanto o usuário categoriza
5. Botão "Salvar e Continuar" persiste as categorizações e avança para o Passo 3

---

#### Story 3.3: Passo 3 — Configuração de Alíquota de Imposto

As a user,
I want to input the tax rate (%) to be considered for the month,
so that the system deducts the correct tax amount from the selling price.

**Acceptance Criteria:**
1. Input numérico para alíquota (%) com valor do mês anterior pré-preenchido (se disponível)
2. Validação: valor entre 0% e 100%
3. Preview em tempo real mostrando o impacto da alíquota no preço de um produto exemplo
4. Alíquota persistida por mês no Supabase
5. Botão "Calcular Resultado" dispara o cálculo e avança para o relatório final

---

### Epic 4: Cálculo e Relatório de Margem de Contribuição

**Goal:** Implementar o motor de cálculo que processa todos os dados coletados e apresenta o relatório final de Margem de Contribuição por produto e resultado operacional consolidado do mês.

---

#### Story 4.1: Motor de Cálculo de Margem de Contribuição

As a developer,
I want a calculation engine that computes contribution margin per product and total operational result,
so that the final report is accurate and auditable.

**Acceptance Criteria:**
1. Função `calculateContributionMargin(products, aliquota, expenses)` implementada com TypeScript
2. Fórmula por produto: `MC = Quantidade × (Preço Venda − (Preço Venda × Alíquota/100) − CMV Unitário)`
3. Resultado final: `Resultado = Σ(MC todos os produtos) − Σ(Despesas categorizadas como "Despesa")`
4. Testes unitários cobrindo: cálculo correto, produto com CMV zerado, alíquota 0%, MC negativa
5. Resultados persistidos no Supabase por mês para histórico

---

#### Story 4.2: Dashboard de Resultado Final

As a user,
I want to see a clear final report with contribution margin per product and the total operational result,
so that I can make informed decisions about pricing and product mix.

**Acceptance Criteria:**
1. Cards de resumo no topo: "Receita Total", "Total de Impostos", "Total CMV", "Total Despesas", "Resultado Operacional"
2. Tabela detalhada por produto: Nome | Qtd Vendida | Preço Médio | Imposto | CMV Unit. | MC Unit. | MC Total
3. Produtos com MC negativa destacados visualmente (vermelho)
4. Totais ao rodapé da tabela
5. Botão "Exportar PDF" ou "Exportar CSV" do relatório
6. Navegação para editar qualquer etapa anterior (CMV, Despesas, Alíquota) sem perder dados

---

## 7. Checklist Results Report

_A ser preenchido após validação pelo @po_

---

## 8. Next Steps

### UX Expert Prompt

> @ux-design-expert — Com base no PRD `docs/prd.md`, crie a especificação de frontend (`docs/front-end-spec.md`) para o BeeInside. O sistema tem 6 telas principais (Dashboard, Conexão OAuth, Passo 1 CMV, Passo 2 Categorização, Passo 3 Alíquota, Resultado Final) com fluxo linear wizard-style. Stack: Next.js + Tailwind CSS. Prioridade: desktop-first, minimalista, financeiro.

### Architect Prompt

> @architect — Com base no PRD `docs/prd.md`, crie a arquitetura fullstack (`docs/fullstack-architecture.md`) para o BeeInside. Stack definida: Next.js 14 (App Router) + TypeScript + Tailwind + Supabase + Prisma. Integração com Bling API v3 (OAuth 2.0, rate limiting). Deploy: Vercel. Foco em segurança dos tokens OAuth e tratamento robusto da Bling API.
