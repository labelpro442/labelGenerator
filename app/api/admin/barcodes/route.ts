import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

// Helper function to extract linear value from GS1 value
// function extractLinearValue(gs1Value: string): string {
//   console.log("=== EXTRACTING LINEAR VALUE ===")
//   console.log("Input GS1 value:", gs1Value)

//   // Clean the input - remove any extra whitespace
//   const cleanValue = gs1Value.trim()
//   console.log("Cleaned value:", cleanValue)

//   // Try multiple patterns to extract the linear value
//   // Pattern 1: (91)LINEAR_VALUE(8008) - most common format
//   let match = cleanValue.match(/$$91$$([^(]+)(?=$$8008$$)/)
//   if (match && match[1]) {
//     const linearValue = match[1].trim()
//     console.log("✅ Pattern 1 matched - Linear value:", linearValue)
//     return linearValue
//   }

//   // Pattern 2: (91)LINEAR_VALUE at the end or followed by other codes
//   match = cleanValue.match(/$$91$$([^(]+)/)
//   if (match && match[1]) {
//     const linearValue = match[1].trim()
//     console.log("✅ Pattern 2 matched - Linear value:", linearValue)
//     return linearValue
//   }

//   // Pattern 3: Try to find any numeric sequence after (91)
//   match = cleanValue.match(/$$91$$(\d+)/)
//   if (match && match[1]) {
//     const linearValue = match[1].trim()
//     console.log("✅ Pattern 3 matched - Linear value:", linearValue)
//     return linearValue
//   }

//   // Pattern 4: Handle cases where there might be spaces
//   match = cleanValue.match(/$$91$$\s*([^(\s]+)/)
//   if (match && match[1]) {
//     const linearValue = match[1].trim()
//     console.log("✅ Pattern 4 matched - Linear value:", linearValue)
//     return linearValue
//   }

//   // Pattern 5: More flexible - capture everything after (91) until next ( or end
//   match = cleanValue.match(/$$91$$([^)]+)/)
//   if (match && match[1]) {
//     // Remove any trailing characters that might be part of next code
//     let linearValue = match[1].trim()
//     // If it ends with a (, remove everything from that point
//     const parenIndex = linearValue.indexOf("(")
//     if (parenIndex > 0) {
//       linearValue = linearValue.substring(0, parenIndex)
//     }
//     if (linearValue.length > 0) {
//       console.log("✅ Pattern 5 matched - Linear value:", linearValue)
//       return linearValue
//     }
//   }

//   console.log("❌ No pattern matched for:", cleanValue)
//   console.log("Available patterns tested:")
//   console.log("1. /$$91$$([^(]+)(?=$$8008$$)/")
//   console.log("2. /$$91$$([^(]+)/")
//   console.log("3. /$$91$$(\\d+)/")
//   console.log("4. /$$91$$\\s*([^(\\s]+)/")
//   console.log("5. /$$91$$([^)]+)/")
//   console.log("=== END EXTRACTION ===")
//   return ""
// }

function extractLinearValue(gs1Value: string): string {
  console.log("=== EXTRACTING LINEAR VALUE ===");
  console.log("Input GS1 value:", gs1Value);

  // Clean the input - remove any extra whitespace
  const cleanValue = gs1Value.trim();
  console.log("Cleaned value:", cleanValue);

  // Try multiple patterns to extract the linear value
  // Pattern 1: (91)LINEAR_VALUE(8008) - most common format
  let match = cleanValue.match(/\(91\)([^(]+)(?=\(8008\))/);
  if (match && match[1]) {
    const linearValue = match[1].trim();
    console.log("✅ Pattern 1 matched - Linear value:", linearValue);
    return linearValue;
  }

  // Pattern 2: (91)LINEAR_VALUE at the end or followed by other codes
  match = cleanValue.match(/\(91\)([^(]+)/);
  if (match && match[1]) {
    const linearValue = match[1].trim();
    console.log("✅ Pattern 2 matched - Linear value:", linearValue);
    return linearValue;
  }

  // Pattern 3: Try to find any numeric sequence after (91)
  match = cleanValue.match(/\(91\)(\d+)/);
  if (match && match[1]) {
    const linearValue = match[1].trim();
    console.log("✅ Pattern 3 matched - Linear value:", linearValue);
    return linearValue;
  }

  // Pattern 4: Handle cases where there might be spaces
  match = cleanValue.match(/\(91\)\s*([^(\s]+)/);
  if (match && match[1]) {
    const linearValue = match[1].trim();
    console.log("✅ Pattern 4 matched - Linear value:", linearValue);
    return linearValue;
  }

  // Pattern 5: More flexible - capture everything after (91) until next ( or end
  match = cleanValue.match(/\(91\)([^)]+)/);
  if (match && match[1]) {
    // Remove any trailing characters that might be part of next code
    let linearValue = match[1].trim();
    // If it ends with a (, remove everything from that point
    const parenIndex = linearValue.indexOf("(");
    if (parenIndex > 0) {
      linearValue = linearValue.substring(0, parenIndex);
    }
    if (linearValue.length > 0) {
      console.log("✅ Pattern 5 matched - Linear value:", linearValue);
      return linearValue;
    }
  }

  console.log("❌ No pattern matched for:", cleanValue);
  console.log("Available patterns tested:");
  console.log("1. /\\(91\\)([^(]+)(?=\\(8008\\))/");
  console.log("2. /\\(91\\)([^(]+)/");
  console.log("3. /\\(91\\)(\\d+)/");
  console.log("4. /\\(91\\)\\s*([^(\\s]+)/");
  console.log("5. /\\(91\\)([^)]+)/");
  console.log("=== END EXTRACTION ===");
  return "";
}


// Helper function to validate GS1 format
function validateGS1Format(gs1Value: string): boolean {
  const hasRequired91 = gs1Value.includes("(91)")
  console.log("Validation - Contains (91):", hasRequired91, "for value:", gs1Value.substring(0, 50))
  return hasRequired91
}

export async function GET() {
  try {
    // Check if table exists
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'barcode_values'
      )
    `

    if (!tableExists[0].exists) {
      return NextResponse.json(
        { error: "Table 'barcode_values' does not exist. Please initialize the database." },
        { status: 500 },
      )
    }

    // Get barcodes (limit to 100 for performance)
    const barcodes = await sql`
      SELECT id, gs1_value, linear_value, is_used, used_at, created_at
      FROM barcode_values
      ORDER BY created_at DESC
    `

    // Get stats
    const stats = await sql`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_used = true THEN 1 ELSE 0 END) as used,
        SUM(CASE WHEN is_used = false THEN 1 ELSE 0 END) as available
      FROM barcode_values
    `

    return NextResponse.json({
      barcodes,
      stats: {
        total: Number(stats[0].total) || 0,
        used: Number(stats[0].used) || 0,
        available: Number(stats[0].available) || 0,
      },
    })
  } catch (error) {
    console.error("Error fetching barcodes:", error)
    return NextResponse.json({ error: "Failed to fetch barcodes", details: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { barcodeText } = body

    console.log("=== BARCODE UPLOAD STARTED ===")
    console.log("Received barcode text length:", barcodeText?.length)
    console.log("First 200 chars:", barcodeText?.substring(0, 200))

    if (!barcodeText || typeof barcodeText !== "string") {
      console.log("❌ Invalid barcode text provided")
      return NextResponse.json({ error: "Invalid barcode text provided" }, { status: 400 })
    }

    // Ensure the table has the unique constraint
    try {
      await sql`
        DO $$ 
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.table_constraints 
                WHERE constraint_name = 'barcode_values_gs1_value_key' 
                AND table_name = 'barcode_values'
            ) THEN
                ALTER TABLE barcode_values ADD CONSTRAINT barcode_values_gs1_value_key UNIQUE (gs1_value);
            END IF;
        END $$;
      `
      console.log("✅ Unique constraint ensured")
    } catch (constraintError) {
      console.log("⚠️ Constraint creation warning:", constraintError.message)
    }

    // Split the text into lines and filter out empty lines
    const lines = barcodeText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)

    console.log("Total lines to process:", lines.length)
    console.log("Sample lines:", lines.slice(0, 3))

    if (lines.length === 0) {
      console.log("❌ No valid lines found")
      return NextResponse.json({ error: "No valid barcode values found" }, { status: 400 })
    }

    // Process each line and prepare for insertion
    const values = []
    const errors = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      console.log(`\n--- Processing line ${i + 1} ---`)
      console.log("Line content:", line)

      // First validate the format
      if (!validateGS1Format(line)) {
        const error = `Line ${i + 1}: Missing required (91) code in "${line.substring(0, 50)}..."`
        console.log("❌ Validation failed:", error)
        errors.push(error)
        continue
      }

      const linearValue = extractLinearValue(line)
      console.log("Extracted linear value:", linearValue)

      if (linearValue && linearValue.length > 0) {
        values.push({
          gs1_value: line,
          linear_value: linearValue,
        })
        console.log(`✅ Line ${i + 1} processed successfully`)
      } else {
        const error = `Line ${i + 1}: Could not extract linear value from "${line.substring(0, 50)}..."`
        console.log("❌ Extraction failed:", error)
        errors.push(error)
      }
    }

    console.log("\n=== PROCESSING SUMMARY ===")
    console.log("Successfully processed values:", values.length)
    console.log("Errors:", errors.length)
    console.log("Sample processed values:", values.slice(0, 2))
    console.log("Sample errors:", errors.slice(0, 3))

    if (values.length === 0) {
      console.log("❌ No values could be processed")
      return NextResponse.json(
        {
          error: "No valid barcode values could be processed.",
          details: errors.slice(0, 10),
          message: "Make sure they contain (91) followed by a value. Check the console for detailed logs.",
          debug: {
            totalLines: lines.length,
            sampleLines: lines.slice(0, 3),
            errors: errors.slice(0, 5),
            regexPatterns: [
              "/$$91$$([^(]+)(?=$$8008$$)/",
              "/$$91$$([^(]+)/",
              "/$$91$$(\\d+)/",
              "/$$91$$\\s*([^(\\s]+)/",
              "/$$91$$([^)]+)/",
            ],
          },
        },
        { status: 400 },
      )
    }

    // Insert values into the database using individual INSERT statements to handle duplicates better
    console.log("\n=== DATABASE INSERTION ===")

    // Verify table structure has used_at column
    try {
      const tableInfo = await sql`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'barcode_values' 
        AND column_name = 'used_at'
      `
      console.log("Table structure check - used_at column:", tableInfo)
    } catch (error) {
      console.log("Table structure check failed:", error)
    }

    let insertedCount = 0
    let duplicateCount = 0
    const insertErrors = []

    for (const value of values) {
      try {
        console.log("Inserting:", { gs1: value.gs1_value.substring(0, 50), linear: value.linear_value })

        // Check if the value already exists first
        const existing = await sql`
          SELECT id FROM barcode_values WHERE gs1_value = ${value.gs1_value}
        `

        if (existing.length > 0) {
          console.log("⚠️ Duplicate value, skipped")
          duplicateCount++
          continue
        }

        // Insert the new value
        const result = await sql`
          INSERT INTO barcode_values (gs1_value, linear_value)
          VALUES (${value.gs1_value}, ${value.linear_value})
          RETURNING id
        `

        if (result.length > 0) {
          insertedCount++
          console.log("✅ Inserted successfully, ID:", result[0].id)
        }
      } catch (insertError) {
        console.error("❌ Insert error:", insertError)
        insertErrors.push(`Failed to insert barcode: ${insertError.message}`)
      }
    }

    console.log("=== INSERTION COMPLETE ===")
    console.log("Inserted count:", insertedCount)
    console.log("Duplicate count:", duplicateCount)
    console.log("Insert errors:", insertErrors.length)

    return NextResponse.json({
      success: true,
      inserted: insertedCount,
      duplicates: duplicateCount,
      total_processed: values.length,
      processing_errors: errors.length,
      message: `${insertedCount} barcode values have been uploaded successfully${duplicateCount > 0 ? ` (${duplicateCount} duplicates skipped)` : ""}`,
      warnings: errors.length > 0 ? `${errors.length} lines could not be processed` : null,
      details: errors.length > 0 ? errors.slice(0, 5) : undefined,
      debug: {
        totalLines: lines.length,
        processedValues: values.length,
        insertedCount,
        duplicateCount,
        sampleProcessedValues: values.slice(0, 2).map((v) => ({
          gs1: v.gs1_value.substring(0, 50),
          linear: v.linear_value,
        })),
      },
    })
  } catch (error) {
    console.error("=== UPLOAD ERROR ===", error)
    return NextResponse.json(
      {
        error: "Failed to upload barcodes",
        details: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

export async function DELETE() {
  try {
    // Delete all barcode values
    const result = await sql`
      DELETE FROM barcode_values
      RETURNING id
    `

    return NextResponse.json({
      success: true,
      deleted: result.length,
      message: `${result.length} barcode values have been deleted`,
    })
  } catch (error) {
    console.error("Error deleting barcodes:", error)
    return NextResponse.json({ error: "Failed to delete barcodes", details: error.message }, { status: 500 })
  }
}
