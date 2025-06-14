-- Create barcode_values table if it doesn't exist
CREATE TABLE IF NOT EXISTS barcode_values (
  id SERIAL PRIMARY KEY,
  gs1_value TEXT NOT NULL,
  linear_value TEXT NOT NULL,
  is_used BOOLEAN NOT NULL DEFAULT FALSE,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index for faster lookups of unused barcodes
CREATE INDEX IF NOT EXISTS idx_barcode_values_is_used ON barcode_values(is_used);

-- Display created table
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'barcode_values';
