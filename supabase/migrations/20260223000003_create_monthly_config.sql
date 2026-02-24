CREATE TABLE monthly_config (
  month     INTEGER     NOT NULL CHECK (month BETWEEN 1 AND 12),
  year      INTEGER     NOT NULL,
  aliquota  DECIMAL(5, 2) NOT NULL DEFAULT 0 CHECK (aliquota BETWEEN 0 AND 100),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (month, year)
);
