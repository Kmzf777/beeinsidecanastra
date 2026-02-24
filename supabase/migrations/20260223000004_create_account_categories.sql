-- Story 3.2: Passo 2 — Categorização de Contas Pagas
-- Stores the most recent category per account description (normalized to lowercase)
CREATE TABLE account_categories (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  description TEXT        NOT NULL,
  category    TEXT        NOT NULL CHECK (category IN ('Despesa', 'Custo de Produto', 'Ignorar')),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(description)
);
