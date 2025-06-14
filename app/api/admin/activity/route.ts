import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const logs = await sql`
      SELECT 
        kl.id, 
        kl.used_at, 
        kl.ip_address, 
        kl.label_data,
        ak.key_code
      FROM key_usage_logs kl
      JOIN access_keys ak ON kl.key_id = ak.id
      ORDER BY kl.used_at DESC
      LIMIT 100
    `

    return NextResponse.json(logs)
  } catch (error) {
    console.error("Error fetching activity logs:", error)
    return NextResponse.json({ error: "Failed to fetch activity logs" }, { status: 500 })
  }
}
