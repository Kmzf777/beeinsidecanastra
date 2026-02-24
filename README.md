# Beeinside

Plataforma de análise de **margem de contribuição** para e-commerce, integrando dados do Bling ERP.

## Stack

- **Framework:** Next.js 16+ com App Router
- **Linguagem:** TypeScript
- **Estilos:** Tailwind CSS 4
- **Banco:** PostgreSQL via Supabase
- **Deploy:** Vercel

## Pré-requisitos

- Node.js 20+
- npm 10+
- Conta Supabase
- Credenciais OAuth do Bling (contas 1 e 2)

## Setup Local

### 1. Clonar o repositório

```bash
git clone <repo-url>
cd beeinside
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

```bash
cp .env.example .env.local
```

Edite `.env.local` com seus valores:

| Variável | Descrição |
|----------|-----------|
| `BLING_CLIENT_ID_1` | Client ID do app Bling — Conta 1 |
| `BLING_CLIENT_SECRET_1` | Client Secret do app Bling — Conta 1 |
| `BLING_CLIENT_ID_2` | Client ID do app Bling — Conta 2 |
| `BLING_CLIENT_SECRET_2` | Client Secret do app Bling — Conta 2 |
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anônima do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de service role do Supabase |
| `DATABASE_URL` | Connection string PostgreSQL |

### 4. Iniciar em desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Versão do Node.js

Este projeto requer Node.js 20+. Use [nvm](https://github.com/nvm-sh/nvm) para gerenciar versões:

```bash
nvm use 20
```

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia servidor de desenvolvimento |
| `npm run build` | Gera build de produção |
| `npm run start` | Inicia servidor de produção |
| `npm run lint` | Verifica problemas de lint |
| `npm run typecheck` | Verifica tipos TypeScript |
| `npm run format` | Formata o código com Prettier |

## Estrutura de Pastas

```
beeinside/
├── app/                    # Next.js App Router
│   ├── layout.tsx
│   ├── page.tsx
│   └── api/                # API Routes
├── components/
│   ├── ui/                 # Componentes genéricos reutilizáveis
│   └── layout/             # Header, Sidebar, etc.
├── lib/
│   ├── supabase/
│   │   ├── client.ts       # Supabase browser client
│   │   └── server.ts       # Supabase server client (RSC/API Routes)
│   ├── bling/              # Cliente da API Bling
│   └── calculations/       # Motor de cálculo de margem
├── types/
│   └── index.ts            # Interfaces TypeScript globais
├── .env.example            # Template de variáveis de ambiente
└── README.md
```

## Deploy (Vercel)

O deploy é gerenciado pelo `@devops`. Para informações de configuração, consulte a Story 1.1.
