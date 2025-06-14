-- Create barcode_values table if it doesn't exist
CREATE TABLE IF NOT EXISTS barcode_values (
  id SERIAL PRIMARY KEY,
  gs1_value TEXT NOT NULL UNIQUE,
  linear_value TEXT NOT NULL,
  is_used BOOLEAN NOT NULL DEFAULT FALSE,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index for faster lookups of unused barcodes
CREATE INDEX IF NOT EXISTS idx_barcode_values_is_used ON barcode_values(is_used);

-- Create index for faster lookups by gs1_value
CREATE INDEX IF NOT EXISTS idx_barcode_values_gs1 ON barcode_values(gs1_value);

-- Insert some sample barcode values for testing
INSERT INTO barcode_values (gs1_value, linear_value, is_used)
VALUES 
  ('(01)99312650999998(91)0211003022413006340990(8008)231017111405', '0211003022413006340990', false),
  ('(01)99312650999998(91)0211003022413006340991(8008)231017111406', '0211003022413006340991', false),
  ('(01)99312650999998(91)0211003022413006340992(8008)231017111407', '0211003022413006340992', false)
ON CONFLICT (gs1_value) DO NOTHING;

-- Display created table info
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'barcode_values'
ORDER BY ordinal_position;

-- Show sample data
SELECT COUNT(*) as total_barcodes, 
       SUM(CASE WHEN is_used THEN 1 ELSE 0 END) as used_barcodes,
       SUM(CASE WHEN NOT is_used THEN 1 ELSE 0 END) as available_barcodes
FROM barcode_values;
