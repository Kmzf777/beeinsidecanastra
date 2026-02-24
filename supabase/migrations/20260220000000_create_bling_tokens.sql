CREATE TABLE bling_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_number INTEGER NOT NULL CHECK (account_number IN (1, 2)),
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(account_number)
);

-- RLS: only service role can read/write — tokens never accessible by the client
ALTER TABLE bling_tokens ENABLE ROW LEVEL SECURITY;
