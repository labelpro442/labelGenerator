-- Add unique constraint to gs1_value column if it doesn't exist
DO $$ 
BEGIN
    -- Check if the constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'barcode_values_gs1_value_key' 
        AND table_name = 'barcode_values'
    ) THEN
        -- Add the unique constraint
        ALTER TABLE barcode_values ADD CONSTRAINT barcode_values_gs1_value_key UNIQUE (gs1_value);
    END IF;
END $$;

-- Display table constraints
SELECT 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'barcode_values'
    AND tc.table_schema = 'public';
