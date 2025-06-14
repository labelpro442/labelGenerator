import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { ImageResponse } from "next/og"

const sql = neon(process.env.DATABASE_URL!)

export const runtime = "edge"

// Helper to fetch image as base64
async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      console.error(`Failed to fetch image: ${response.status} ${response.statusText} from ${url}`)
      return null
    }
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64 = buffer.toString("base64")
    const contentType = response.headers.get("content-type") || "image/png"
    return `data:${contentType};base64,${base64}`
  } catch (error) {
    console.error(`Error fetching image from ${url}:`, error)
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const keyCode = searchParams.get("key")

    console.log("=== GENERATING LABEL IMAGE ===")
    console.log("Generating label for key:", keyCode)

    if (!keyCode) {
      return new NextResponse("No key provided", { status: 401 })
    }

    const keyResult = await sql`
      SELECT id FROM access_keys 
      WHERE key_code = ${keyCode} AND is_active = true AND current_uses < max_uses
    `

    if (keyResult.length === 0) {
      return new NextResponse("Invalid or expired key", { status: 403 })
    }
    const keyId = keyResult[0].id

    // Get the most recent label data for this key
    const labelDataResult = await sql`
      SELECT label_data 
      FROM key_usage_logs 
      WHERE key_id = ${keyId} AND label_data IS NOT NULL
      ORDER BY used_at DESC 
      LIMIT 1
    `

    if (labelDataResult.length === 0 || !labelDataResult[0].label_data) {
      return new NextResponse("No label data found for this key", { status: 404 })
    }

    const data = labelDataResult[0].label_data as any
    console.log("Found label data for key:", keyCode)

    // Check if we have barcode data from the label generation
    let gs1Value, linearValue

    if (data.barcode_used && data.barcode_used.gs1_value && data.barcode_used.linear_value) {
      // Use the barcode that was already marked as used during label generation
      gs1Value = data.barcode_used.gs1_value
      linearValue = data.barcode_used.linear_value
      console.log("✅ Using barcode from label generation:", {
        id: data.barcode_used.id,
        linear: linearValue,
      })
    } else {
      // Fallback: try to get an unused barcode (this shouldn't happen with the new flow)
      console.log("⚠️ No barcode in label data, trying to get unused barcode...")
      const barcodeResult = await sql`
        UPDATE barcode_values
        SET is_used = true, used_at = NOW()
        WHERE id = (
          SELECT id FROM barcode_values
          WHERE is_used = false
          ORDER BY created_at ASC
          LIMIT 1
        )
        RETURNING gs1_value, linear_value, id
      `

      if (barcodeResult.length > 0) {
        gs1Value = barcodeResult[0].gs1_value
        linearValue = barcodeResult[0].linear_value
        console.log("✅ Fallback barcode used:", barcodeResult[0].id)
      } else {
        // Generate random barcode as last resort
        console.log("⚠️ No barcodes available, generating random one")
        const trackingNumber = Math.random().toString(36).substr(2, 9).toUpperCase()
        const articleId = `AP${Math.random().toString().substr(2, 8)}`

        const postcode = (data.toAddress?.cityStatePostcode || "").split(" ").pop()?.replace(/\s/g, "") || "0000"

        linearValue = `0211003022${Math.floor(Math.random() * 999)
          .toString()
          .padStart(3, "0")}00634099${Math.floor(Math.random() * 9)}`
        gs1Value = `(01)99312650999998(91)${linearValue}(8008)231017111405`
        console.log("🎲 Generated random barcode")
      }
    }

    // Construct barcode data strings
    const gs1DataMatrixText = encodeURIComponent(gs1Value)
    const code128Text = encodeURIComponent(linearValue)

    // Barcode generation URLs
    const asposeGs1DataMatrixBaseUrl =
      "https://products.aspose.app/barcode/generate?type=gs1datamatrix&size=Small&format=png&resolutionX=300&resolutionY=300&xDimension=4&codeLocation=None&codetext="
    const tecitCode128BaseUrl = "https://barcode.tec-it.com/barcode.ashx?data="
    const tecitCode128Params =
      "&code=Code128&dpi=300&imagetype=Png&rotation=0&modulewidth=fit&barcolor=000000&bgcolor=FFFFFF&fontcolor=000000&font=Arial&fontsize=10&height=80&showtext=true&textposition=Below&textalign=Center&quietzone=1"

    const gs1DataMatrixUrl = `${asposeGs1DataMatrixBaseUrl}${gs1DataMatrixText}`
    const code128Url = `${tecitCode128BaseUrl}${code128Text}${tecitCode128Params}`

    // Fetch barcodes as base64
    const [gs1DataMatrixBase64, code128Base64] = await Promise.all([
      fetchImageAsBase64(gs1DataMatrixUrl),
      fetchImageAsBase64(code128Url),
    ])

    const placeholderBarcode = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"

    console.log("✅ Generating image for:", data.toAddress?.fullName)
    console.log("Using barcode linear value:", linearValue)

    return new ImageResponse(
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "800px",
          height: "1000px",
          backgroundColor: "white",
          padding: "20px",
          fontFamily: "Arial, sans-serif",
          border: "2px solid black",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            background: "linear-gradient(to right, #FCD34D, #F59E0B)",
            padding: "12px",
            marginBottom: "15px",
            alignItems: "center",
            borderBottom: "1px solid #000",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              backgroundColor: "#DC2626",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginRight: "12px",
            }}
          >
            <div style={{ color: "white", fontSize: "24px", fontWeight: "bold" }}>P</div>
          </div>
          <div style={{ color: "#DC2626", fontSize: "28px", fontWeight: "bold" }}>Express Post</div>
        </div>

        {/* Main content */}
        <div style={{ display: "flex", flexDirection: "row", flex: 1 }}>
          {/* Left section */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 3,
              borderRight: "2px solid #000",
              paddingRight: "15px",
              justifyContent: "space-between",
            }}
          >
            <div>
              {/* To address */}
              <div style={{ marginBottom: "20px" }}>
                <div style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "5px" }}>To:</div>
                <div
                  style={{
                    fontSize: "20px",
                    fontWeight: "bold",
                    marginBottom: "5px",
                    border: "1px solid #eee",
                    padding: "10px",
                  }}
                >
                  {data.toAddress?.fullName || "N/A"}
                </div>
                <div style={{ fontSize: "16px", marginBottom: "3px" }}>{data.toAddress?.street || "N/A"}</div>
                <div style={{ fontSize: "16px" }}>{data.toAddress?.cityStatePostcode || "N/A"}</div>
              </div>

              {/* Package details */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  borderTop: "1px solid #ccc",
                  borderBottom: "1px solid #ccc",
                  padding: "10px 0",
                  marginBottom: "15px",
                }}
              >
                <div style={{ flex: 1, textAlign: "center", padding: "0 5px" }}>
                  <div style={{ fontSize: "12px", marginBottom: "3px" }}>Packaging</div>
                  <div style={{ fontSize: "16px", fontWeight: "bold" }}>OWN</div>
                </div>
                <div
                  style={{
                    flex: 1,
                    textAlign: "center",
                    borderLeft: "1px solid #ccc",
                    borderRight: "1px solid #ccc",
                    padding: "0 5px",
                  }}
                >
                  <div style={{ fontSize: "12px", marginBottom: "3px" }}>Physical weight</div>
                  <div style={{ fontSize: "16px", fontWeight: "bold" }}>{data.weight || "5kg"}</div>
                  <div style={{ fontSize: "12px", marginTop: "3px" }}>Cubic weight</div>
                  <div style={{ fontSize: "16px" }}>N/A</div>
                </div>
                <div style={{ flex: 1, textAlign: "center", padding: "0 5px" }}>
                  <div style={{ fontSize: "12px", marginBottom: "3px" }}>Delivery features</div>
                  <div style={{ fontSize: "16px" }}>-</div>
                </div>
              </div>

              {/* Phone and reference */}
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
                <div style={{ flex: 1, marginRight: "10px" }}>
                  <div style={{ fontSize: "12px", marginBottom: "3px" }}>Ph:</div>
                  <div style={{ fontSize: "14px", border: "1px solid #eee", padding: "5px" }}>
                    {data.phone || "N/A"}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "12px", marginBottom: "3px" }}>Ref:</div>
                  <div style={{ fontSize: "14px", border: "1px solid #eee", padding: "5px" }}>
                    {data.reference || "N/A"}
                  </div>
                </div>
              </div>

              {/* Sender */}
              <div style={{ marginBottom: "20px" }}>
                <div style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "5px" }}>Sender:</div>
                <div style={{ border: "1px solid #eee", padding: "10px" }}>
                  <div style={{ fontSize: "16px", marginBottom: "3px", fontWeight: "bold" }}>
                    {data.fromAddress?.fullName || "N/A"}
                  </div>
                  <div style={{ fontSize: "14px", marginBottom: "3px" }}>{data.fromAddress?.street || "N/A"}</div>
                  <div style={{ fontSize: "14px" }}>{data.fromAddress?.cityStatePostcode || "N/A"}</div>
                </div>
              </div>
            </div>

            {/* Declaration */}
            <div
              style={{
                padding: "10px",
                border: "1px solid #eee",
                borderRadius: "5px",
                fontSize: "10px",
                lineHeight: "1.3",
              }}
            >
              <div style={{ fontWeight: "bold", marginBottom: "5px" }}>
                Aviation Security and Dangerous Goods Declaration
              </div>
              <div>
                The sender acknowledges that this article may be carried by air and will be subject to aviation security
                and clearing procedures; and the sender declares that the article does not contain any dangerous or
                prohibited goods, explosive or incendiary devices. A false declaration is a criminal offence.
              </div>
            </div>
          </div>

          {/* Right section */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              paddingLeft: "15px",
              justifyContent: "space-between",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "5px" }}>Postage Paid</div>
              {/* GS1 DataMatrix Barcode */}
              <img
                src={gs1DataMatrixBase64 || placeholderBarcode}
                alt="GS1 DataMatrix"
                style={{ width: "80px", height: "80px", margin: "0 auto 15px auto", display: "block" }}
              />
            </div>

            {/* Linear Barcode Area */}
            <div
              style={{
                flex: 1,
                width: "100%",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "10px",
                minHeight: "150px",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: "-10px",
                  top: "50%",
                  transform: "translateY(-50%) rotate(-90deg)",
                  transformOrigin: "center",
                  color: "#0066CC",
                  fontSize: "12px",
                  fontWeight: "bold",
                  whiteSpace: "nowrap",
                }}
              >
                AP Article ID Tracking ID
              </div>
              {/* Code128 Barcode */}
              <img
                src={code128Base64 || placeholderBarcode}
                alt="Tracking Barcode"
                style={{
                  maxWidth: "90%",
                  height: "auto",
                  maxHeight: "80px",
                  display: "block",
                  marginTop: "20px",
                }}
              />
            </div>
          </div>
        </div>
      </div>,
      {
        width: 800,
        height: 1000,
      },
    )
  } catch (error) {
    console.error("Error generating label:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return new NextResponse(`Error generating label: ${errorMessage}`, { status: 500 })
  }
}
