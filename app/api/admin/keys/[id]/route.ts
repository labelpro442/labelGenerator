import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { revalidatePath } from "next/cache"

const sql = neon(process.env.DATABASE_URL!)

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id, 10)

    if (isNaN(id) || id <= 0) {
      return NextResponse.json({ success: false, message: "Invalid key ID" }, { status: 400 })
    }

    // Check if key exists
    const existingKey = await sql`
      SELECT id, key_code FROM access_keys WHERE id = ${id}
    `

    if (existingKey.length === 0) {
      return NextResponse.json({ success: false, message: "Key not found" }, { status: 404 })
    }

    const keyCode = existingKey[0].key_code

    // Delete associated usage logs first
    await sql`DELETE FROM key_usage_logs WHERE key_id = ${id}`

    // Delete the key
    await sql`DELETE FROM access_keys WHERE id = ${id}`

    // Revalidate paths
    revalidatePath("/admin")
    revalidatePath("/admin/keys")

    return NextResponse.json({
      success: true,
      message: `Key ${keyCode} deleted successfully`,
    })
  } catch (error) {
    console.error("Error deleting key:", error)
    return NextResponse.json(
      {
        success: false,
        message: `Failed to delete key: ${error.message || "Unknown error"}`,
      },
      { status: 500 },
    )
  }
}
