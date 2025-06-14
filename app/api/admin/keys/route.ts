import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    // First check if the table exists
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'access_keys'
      )
    `

    if (!tableExists[0].exists) {
      return NextResponse.json(
        { error: "Table 'access_keys' does not exist. Please initialize the database." },
        { status: 500 },
      )
    }

    const keys = await sql`
      SELECT 
        id, 
        key_code, 
        created_at, 
        is_active, 
        max_uses, 
        current_uses, 
        description 
      FROM access_keys 
      ORDER BY created_at DESC
    `

    // Ensure proper data formatting
    const formattedKeys = keys.map((key) => ({
      ...key,
      current_uses: Number(key.current_uses) || 0,
      max_uses: Number(key.max_uses) || 1,
      is_active: Boolean(key.is_active),
    }))

    return NextResponse.json(formattedKeys)
  } catch (error) {
    console.error("Error fetching keys:", error)
    return NextResponse.json({ error: "Failed to fetch keys", details: error.message }, { status: 500 })
  }
}
