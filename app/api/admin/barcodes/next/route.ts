import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    // Get the next available barcode
    const result = await sql`
      SELECT id, gs1_value, linear_value
      FROM barcode_values
      WHERE is_used = false
      ORDER BY created_at ASC
      LIMIT 1
    `

    if (result.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No available barcodes found",
      })
    }

    // Mark the barcode as reserved but don't set it as used yet
    // This happens when the label is actually generated
    return NextResponse.json({
      success: true,
      barcode: result[0],
    })
  } catch (error) {
    console.error("Error fetching next barcode:", error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch next barcode", error: String(error) },
      { status: 500 },
    )
  }
}
