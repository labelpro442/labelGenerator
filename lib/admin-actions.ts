"use server"

import { neon } from "@neondatabase/serverless"
import { revalidatePath } from "next/cache"
import { nanoid } from "nanoid"

const sql = neon(process.env.DATABASE_URL!)

interface CreateKeyParams {
  keyPrefix: string
  description: string
  maxUses: number
}

interface UpdateKeyParams {
  id: number
  description: string
  maxUses: number
}

export async function createKey({ keyPrefix, description, maxUses }: CreateKeyParams) {
  console.log("Server action: createKey called with", { keyPrefix, description, maxUses })

  try {
    // Validate inputs
    if (!keyPrefix.trim()) {
      return {
        success: false,
        message: "Key prefix is required",
      }
    }

    if (!description.trim()) {
      return {
        success: false,
        message: "Description is required",
      }
    }

    if (maxUses < 1) {
      return {
        success: false,
        message: "Maximum uses must be at least 1",
      }
    }

    // Test database connection first
    await sql`SELECT 1`

    // Generate a unique key code
    const uniqueId = nanoid(8).toUpperCase()
    const keyCode = `${keyPrefix.trim()}-${uniqueId}`

    console.log("Inserting new key:", keyCode)

    // Insert the new key
    const result = await sql`
      INSERT INTO access_keys (key_code, description, max_uses, current_uses, is_active) 
      VALUES (${keyCode}, ${description.trim()}, ${maxUses}, 0, true)
      RETURNING id
    `

    console.log("Insert result:", result)

    if (result.length === 0) {
      throw new Error("Failed to create key - no ID returned")
    }

    revalidatePath("/admin")
    revalidatePath("/admin/keys")

    return {
      success: true,
      keyCode,
    }
  } catch (error) {
    console.error("Error creating key:", error)
    return {
      success: false,
      message: `Failed to create key: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}

export async function updateKey({ id, description, maxUses }: UpdateKeyParams) {
  try {
    // Validate inputs
    if (!id || id < 1) {
      return {
        success: false,
        message: "Invalid key ID",
      }
    }

    if (!description.trim()) {
      return {
        success: false,
        message: "Description is required",
      }
    }

    if (maxUses < 1) {
      return {
        success: false,
        message: "Maximum uses must be at least 1",
      }
    }

    // Test database connection first
    await sql`SELECT 1`

    // Check if key exists
    const existingKey = await sql`
      SELECT id, current_uses FROM access_keys WHERE id = ${id}
    `

    if (existingKey.length === 0) {
      return {
        success: false,
        message: "Key not found",
      }
    }

    // Ensure max_uses is not less than current_uses
    if (maxUses < existingKey[0].current_uses) {
      return {
        success: false,
        message: `Maximum uses cannot be less than current usage (${existingKey[0].current_uses})`,
      }
    }

    // Update the key
    await sql`
      UPDATE access_keys 
      SET description = ${description.trim()}, max_uses = ${maxUses}
      WHERE id = ${id}
    `

    revalidatePath("/admin")
    revalidatePath("/admin/keys")

    return {
      success: true,
      message: "Key updated successfully",
    }
  } catch (error) {
    console.error("Error updating key:", error)
    return {
      success: false,
      message: `Failed to update key: ${error instanceof Error ? error.message : "Database connection error"}`,
    }
  }
}

export async function deleteKey(id: number) {
  console.log("Server action: deleteKey called with ID:", id)

  try {
    // Validate input
    if (!id || id < 1) {
      return {
        success: false,
        message: "Invalid key ID",
      }
    }

    // Test database connection first
    await sql`SELECT 1`

    // First, check if key exists and get key code
    const existingKey = await sql`
      SELECT id, key_code FROM access_keys WHERE id = ${id}
    `

    console.log("Existing key check:", existingKey)

    if (existingKey.length === 0) {
      return {
        success: false,
        message: "Key not found",
      }
    }

    const keyCode = existingKey[0].key_code
    console.log(`Deleting key ${keyCode} (ID: ${id})`)

    // Delete associated usage logs first (foreign key constraint)
    console.log("Deleting associated usage logs...")
    await sql`
      DELETE FROM key_usage_logs WHERE key_id = ${id}
    `

    // Delete the key
    console.log("Deleting the key...")
    await sql`
      DELETE FROM access_keys WHERE id = ${id}
    `

    console.log(`Successfully deleted key ${keyCode} (ID: ${id})`)

    revalidatePath("/admin")
    revalidatePath("/admin/keys")

    return {
      success: true,
      message: `Key ${keyCode} deleted successfully`,
    }
  } catch (error) {
    console.error("Error deleting key:", error)
    return {
      success: false,
      message: `Failed to delete key: ${error instanceof Error ? error.message : "Database connection error"}`,
    }
  }
}

export async function toggleKeyStatus(id: number, isActive: boolean) {
  try {
    // Validate input
    if (!id || id < 1) {
      return {
        success: false,
        message: "Invalid key ID",
      }
    }

    // Test database connection first
    await sql`SELECT 1`

    // Check if key exists
    const existingKey = await sql`
      SELECT id FROM access_keys WHERE id = ${id}
    `

    if (existingKey.length === 0) {
      return {
        success: false,
        message: "Key not found",
      }
    }

    // Update the key status
    await sql`
      UPDATE access_keys 
      SET is_active = ${isActive}
      WHERE id = ${id}
    `

    revalidatePath("/admin")
    revalidatePath("/admin/keys")

    return {
      success: true,
      message: `Key ${isActive ? "activated" : "deactivated"} successfully`,
    }
  } catch (error) {
    console.error("Error toggling key status:", error)
    return {
      success: false,
      message: `Failed to update key status: ${error instanceof Error ? error.message : "Database connection error"}`,
    }
  }
}
