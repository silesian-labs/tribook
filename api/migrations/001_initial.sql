CREATE TABLE IF NOT EXISTS price_feed (
  id bigserial PRIMARY KEY,
  asset text NOT NULL,
  price numeric(30,9) NOT NULL,
  source text NOT NULL DEFAULT 'mock',
  published_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS price_feed_asset_idx ON price_feed(asset, published_at DESC);

CREATE TABLE IF NOT EXISTS decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  action text NOT NULL,
  side text,
  confidence numeric(4,3) NOT NULL,
  amount_usdc numeric(30,9) NOT NULL,
  market text,
  signal_price numeric(30,9),
  thesis text NOT NULL,
  tx_digest text,
  execution_status text NOT NULL CHECK (execution_status IN ('held', 'dry-run', 'submitted'))
);
CREATE INDEX IF NOT EXISTS decisions_created_idx ON decisions(created_at DESC);
