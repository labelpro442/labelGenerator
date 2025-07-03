"use server"

import { neon } from "@neondatabase/serverless"
import type { LabelData } from "@/components/label-generator-form"

const sql = neon(process.env.DATABASE_URL!)

// export async function generateLabel(labelData: LabelData, keyCode: string) {
//   try {
//     console.log("=== STARTING LABEL GENERATION ===")
//     console.log("Key code:", keyCode)

//     // Verify the key is still valid
//     const key = await sql`
//       SELECT id, current_uses, max_uses, is_active FROM access_keys 
//       WHERE key_code = ${keyCode}
//     `

//     if (key.length === 0) {
//       return { success: false, message: "Your access key is no longer valid" }
//     }

//     const keyData = key[0]

//     if (!keyData.is_active) {
//       return { success: false, message: "Your access key has been deactivated" }
//     }

//     // Check if this would exceed max uses
//     if (keyData.current_uses >= keyData.max_uses) {
//       return { success: false, message: "Your access key has reached its maximum number of uses" }
//     }

//     // Check if barcodes are available (without consuming one)
//     const availableBarcodes = await sql`
//       SELECT COUNT(*) as count FROM barcode_values WHERE is_used = false
//     `

//     if (Number(availableBarcodes[0].count) === 0) {
//       console.log("❌ NO BARCODES AVAILABLE - FAILING LABEL GENERATION")
//       return {
//         success: false,
//         message: "No barcode values available in the database. Please contact administrator to upload more barcodes.",
//       }
//     }

//     // Increment the key usage count
//     await sql`
//       UPDATE access_keys 
//       SET current_uses = current_uses + 1 
//       WHERE id = ${keyData.id}
//     `

//     // If this was the last use, deactivate the key
//     if (keyData.current_uses + 1 >= keyData.max_uses) {
//       await sql`
//         UPDATE access_keys 
//         SET is_active = false 
//         WHERE id = ${keyData.id}
//       `
//     }

//     // Log the label generation (without barcode data for now)
//     await sql`
//       INSERT INTO key_usage_logs (key_id, label_data) 
//       VALUES (${keyData.id}, ${JSON.stringify(labelData)})
//     `

//     console.log("=== LABEL GENERATION COMPLETE ===")
//     console.log("✅ Key usage incremented")
//     console.log("✅ Activity logged")
//     console.log("✅ Barcode will be fetched and marked as used during preview generation")

//     return {
//       success: true,
//       message: "Label generated successfully. Barcode will be assigned during preview.",
//     }
//   } catch (error) {
//     console.error("Error generating label:", error)
//     return { success: false, message: "An error occurred while generating the label" }
//   }
// }

export async function fetchAndUseBarcode() {
  try {
    console.log("=== FETCHING AND MARKING BARCODE AS USED ===")

    // Use atomic UPDATE to get and mark a barcode as used
    const barcodeResult = await sql`
      UPDATE barcode_values
      SET is_used = true, used_at = NOW()
      WHERE id = (
        SELECT id FROM barcode_values
        WHERE is_used = false
        ORDER BY created_at ASC
        LIMIT 1
      )
      RETURNING id, gs1_value, linear_value, used_at
    `

    if (barcodeResult.length === 0) {
      console.log("❌ NO BARCODES AVAILABLE")
      return {
        success: false,
        message: "No barcode values available in the database.",
      }
    }

    const barcodeInfo = barcodeResult[0]
    console.log("✅ Barcode marked as used:", {
      id: barcodeInfo.id,
      gs1_value: barcodeInfo.gs1_value.substring(0, 50) + "...",
      linear_value: barcodeInfo.linear_value,
      used_at: barcodeInfo.used_at,
    })

    return {
      success: true,
      barcode: {
        id: barcodeInfo.id,
        gs1_value: barcodeInfo.gs1_value,
        linear_value: barcodeInfo.linear_value,
        used_at: barcodeInfo.used_at,
      },
    }
  } catch (error) {
    console.error("Error fetching barcode:", error)
    return {
      success: false,
      message: "Failed to fetch barcode",
    }
  }
}
