-- Create access_keys table if it doesn't exist
CREATE TABLE IF NOT EXISTS access_keys (
  id SERIAL PRIMARY KEY,
  key_code VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  max_uses INTEGER NOT NULL DEFAULT 1,
  current_uses INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create key_usage_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS key_usage_logs (
  id SERIAL PRIMARY KEY,
  key_id INTEGER NOT NULL REFERENCES access_keys(id),
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  ip_address VARCHAR(255),
  label_data JSONB,
  CONSTRAINT fk_key FOREIGN KEY (key_id) REFERENCES access_keys(id)
);

-- Insert some sample keys for testing
INSERT INTO access_keys (key_code, description, max_uses, current_uses, is_active)
VALUES 
  ('DEMO-2024-001', 'Demo key for testing', 10, 0, true),
  ('TEST-KEY-001', 'Test key with limited uses', 5, 0, true),
  ('PREMIUM-2024-002', 'Premium key for full access', 100, 0, true)
ON CONFLICT (key_code) DO NOTHING;

-- Display created tables
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
