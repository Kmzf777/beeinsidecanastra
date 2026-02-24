-- Story 4.1: Motor de Cálculo de Margem de Contribuição
-- Stores calculation results per month/year with full product detail snapshot
CREATE TABLE monthly_results (
  id                    UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  month                 INTEGER       NOT NULL,
  year                  INTEGER       NOT NULL,
  total_receita         DECIMAL(12,2),
  total_impostos        DECIMAL(12,2),
  total_cmv             DECIMAL(12,2),
  total_mc              DECIMAL(12,2),
  total_despesas        DECIMAL(12,2),
  resultado_operacional DECIMAL(12,2),
  products_detail       JSONB,        -- snapshot of ProductCalculation[]
  calculated_at         TIMESTAMPTZ   DEFAULT NOW(),
  UNIQUE(month, year)
);
