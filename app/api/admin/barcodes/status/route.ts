import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    // Get barcode availability status
    const stats = await sql`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_used = true THEN 1 ELSE 0 END) as used,
        SUM(CASE WHEN is_used = false THEN 1 ELSE 0 END) as available
      FROM barcode_values
    `

    const barcodeStats = {
      total: Number(stats[0].total) || 0,
      used: Number(stats[0].used) || 0,
      available: Number(stats[0].available) || 0,
    }

    // Get the next available barcode (without marking it as used)
    const nextBarcode = await sql`
      SELECT id, gs1_value, linear_value, created_at
      FROM barcode_values
      WHERE is_used = false
      ORDER BY created_at ASC
      LIMIT 1
    `

    return NextResponse.json({
      success: true,
      stats: barcodeStats,
      hasAvailable: barcodeStats.available > 0,
      nextBarcode:
        nextBarcode.length > 0
          ? {
              id: nextBarcode[0].id,
              gs1_value: nextBarcode[0].gs1_value.substring(0, 50) + "...",
              linear_value: nextBarcode[0].linear_value,
              created_at: nextBarcode[0].created_at,
            }
          : null,
    })
  } catch (error) {
    console.error("Error checking barcode status:", error)
    return NextResponse.json(
      { success: false, message: "Failed to check barcode status", error: String(error) },
      { status: 500 },
    )
  }
}
