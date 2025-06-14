import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST() {
  try {
    // Create access_keys table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS access_keys (
        id SERIAL PRIMARY KEY,
        key_code VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        max_uses INTEGER NOT NULL DEFAULT 1,
        current_uses INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `

    // Create key_usage_logs table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS key_usage_logs (
        id SERIAL PRIMARY KEY,
        key_id INTEGER NOT NULL,
        used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        ip_address VARCHAR(255),
        label_data JSONB,
        CONSTRAINT fk_key FOREIGN KEY (key_id) REFERENCES access_keys(id)
      )
    `

    // Create barcode_values table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS barcode_values (
        id SERIAL PRIMARY KEY,
        gs1_value TEXT NOT NULL,
        linear_value TEXT NOT NULL,
        is_used BOOLEAN NOT NULL DEFAULT FALSE,
        used_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `

    // Create index for faster lookups of unused barcodes
    await sql`
      CREATE INDEX IF NOT EXISTS idx_barcode_values_is_used ON barcode_values(is_used)
    `

    // Insert some sample keys for testing
    await sql`
      INSERT INTO access_keys (key_code, description, max_uses, current_uses, is_active)
      VALUES 
        ('DEMO-2024-001', 'Demo key for testing', 10, 0, true),
        ('TEST-KEY-001', 'Test key with limited uses', 5, 0, true),
        ('PREMIUM-2024-002', 'Premium key for full access', 100, 0, true)
      ON CONFLICT (key_code) DO NOTHING
    `

    return NextResponse.json({ success: true, message: "Database initialized successfully" })
  } catch (error) {
    console.error("Error initializing database:", error)
    return NextResponse.json(
      { success: false, message: "Failed to initialize database", error: String(error) },
      { status: 500 },
    )
  }
}
