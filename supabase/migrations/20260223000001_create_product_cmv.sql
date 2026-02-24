-- Story 3.1: Passo 1 — Preenchimento de CMV por Produto
-- Stores the most recent unit cost per product (MVP simplification — see Scope OUT)
CREATE TABLE product_cmv (
  id          UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  product_name TEXT         NOT NULL,
  cmv_unitario DECIMAL(10,2) NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ   DEFAULT NOW(),
  UNIQUE(product_name)
);
