"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, Eye, Sparkles, AlertTriangle, Loader2 } from "lucide-react"
import { useRef, useEffect, useState } from "react"
import type { LabelData } from "./label-generator-form"
import { fetchAndUseBarcode } from "@/lib/actions"
import { useToast } from "@/components/ui/use-toast"
import Font from "next/font/local"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"

interface LabelPreviewProps {
  labelData: LabelData
  keyCode: string
}

const Stratum = Font({
  src: [{ path: "../public/fonts/Stratum.otf", weight: "400", style: "normal" }],
})

export function LabelPreview({ labelData, keyCode }: LabelPreviewProps) {
  const labelRef = useRef<HTMLDivElement>(null)
  const [gs1DataMatrixUrl, setGs1DataMatrixUrl] = useState<string>("")
  const [code128Url, setCode128Url] = useState<string>("")
  const [barcodeData, setBarcodeData] = useState<{ gs1Value: string; linearValue: string; id?: number } | null>(null)
  const [isLoadingBarcode, setIsLoadingBarcode] = useState(true)
  const [hasError, setHasError] = useState(false)
  const { toast } = useToast()

  // Fetch and use a barcode when the preview loads
  useEffect(() => {
    const fetchBarcode = async () => {
      try {
        setIsLoadingBarcode(true)
        const result = await fetchAndUseBarcode()
        if (result.success && result.barcode) {
          setBarcodeData({
            gs1Value: result.barcode.gs1_value,
            linearValue: result.barcode.linear_value,
            id: result.barcode.id,
          })
          setHasError(false)
          toast({
            title: "✅ Barcode Assigned",
            description: `Barcode ID ${result.barcode.id} has been assigned to your label.`,
          })
        } else {
          setHasError(true)
          setBarcodeData({ gs1Value: "ERROR: No barcode available", linearValue: "ERROR" })
          toast({
            title: "❌ Barcode Error",
            description: result.message || "Failed to assign barcode to label.",
            variant: "destructive",
          })
        }
      } catch (error) {
        setHasError(true)
        setBarcodeData({ gs1Value: "ERROR: Failed to fetch barcode", linearValue: "ERROR" })
        toast({ title: "❌ Error", description: "Failed to fetch barcode for label.", variant: "destructive" })
      } finally {
        setIsLoadingBarcode(false)
      }
    }
    fetchBarcode()
  }, [toast])

  useEffect(() => {
    const generateBarcodes = async () => {
      if (!barcodeData || hasError || isLoadingBarcode) return
      try {
        const bwipjs = await import("bwip-js")
        const gs1Canvas = document.createElement("canvas")
        const code128Canvas = document.createElement("canvas")
        bwipjs.toCanvas(gs1Canvas, { bcid: "datamatrix", text: barcodeData.gs1Value, scale: 3, height: 20, width: 20, includetext: false, gs1: true })
        setGs1DataMatrixUrl(gs1Canvas.toDataURL("image/png"))
        bwipjs.toCanvas(code128Canvas, { bcid: "code128", text: barcodeData.linearValue, scale: 3, height: 10, includetext: false, textxalign: "center", rotate: "L" })
        setCode128Url(code128Canvas.toDataURL("image/png"))
      } catch (error) {
        console.error("Error generating barcodes:", error)
        setGs1DataMatrixUrl("data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7")
        setCode128Url("data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7")
      }
    }
    if (typeof window !== "undefined" && barcodeData && !isLoadingBarcode) {
      generateBarcodes()
    }
  }, [barcodeData, hasError, isLoadingBarcode])

  const handleDownloadPDF = async () => {
    if (!labelRef.current) {
      console.error("labelRef.current is null")
      return
    }

    try {
      const hiddenContainer = document.createElement("div")
      hiddenContainer.style.position = "absolute"
      hiddenContainer.style.left = "-9999px"
      hiddenContainer.style.top = "0"
      hiddenContainer.style.width = "640px"
      hiddenContainer.style.backgroundColor = "#ffffff"
      hiddenContainer.style.padding = "16px"
      document.body.appendChild(hiddenContainer)

      const clonedLabel = labelRef.current.cloneNode(true) as HTMLElement
      clonedLabel.style.transform = "scale(1)"
      clonedLabel.style.boxShadow = "none"
      clonedLabel.classList.remove("animate-slide-up")
      
      // Select the new yellow bar to ensure its background renders correctly in the PDF
      const yellowBar = clonedLabel.querySelector(".pdf-label-header-yellow-bar") as HTMLElement;
      if (yellowBar) yellowBar.style.backgroundColor = "#FAD022";


      const postagePaid = clonedLabel.querySelector(".postage-paid") as HTMLElement
      if (postagePaid) 
        {
          postagePaid.style.marginTop = "-1.2rem"
          postagePaid.style.paddingBottom = "1rem"
        }
      const toAddressBlock = clonedLabel.querySelector(".pdf-label-to-address") as HTMLElement
      if (toAddressBlock) toAddressBlock.style.marginTop = "-.7rem"
      
      const senderAddressBlock = clonedLabel.querySelector(".pdf-label-sender-address") as HTMLElement
      if (senderAddressBlock) senderAddressBlock.style.marginTop = "-.7rem"
      
      const declarationBlock = clonedLabel.querySelector(".pdf-label-declaration") as HTMLElement
      if (declarationBlock) declarationBlock.style.marginTop = "-.3rem"

      const expressText = clonedLabel.querySelector(".pdf-label-header-text") as HTMLElement
      if (expressText) expressText.style.paddingBottom = "1.8rem"

      const phoneLine = clonedLabel.querySelector(".pdf-label-phone") as HTMLElement
      if (phoneLine) {
        phoneLine.style.paddingBottom = ".5rem"
        phoneLine.style.marginTop = "-.7rem"
      }

      const referenceLine = clonedLabel.querySelector(".pdf-label-reference") as HTMLElement
      if (referenceLine) {
        referenceLine.style.marginTop = "-.7rem"
        referenceLine.style.paddingBottom = ".4rem"
      }
      
      const pdfLabelWeightSection = clonedLabel.querySelector(".pdf-label-weight-section") as HTMLElement
      if (pdfLabelWeightSection) pdfLabelWeightSection.style.marginTop = "-.5rem"

      const pdfLabelPackagingSection = clonedLabel.querySelector(".pdf-label-packaging-section") as HTMLElement
      if (pdfLabelPackagingSection) pdfLabelPackagingSection.style.marginTop = "-.5rem"
      
      const pdfLabelFeaturesSection = clonedLabel.querySelector(".pdf-label-features-section") as HTMLElement
      if (pdfLabelFeaturesSection) pdfLabelFeaturesSection.style.marginTop = "-.5rem"
      
      const articleIdText = clonedLabel.querySelector(".pdf-label-article-id") as HTMLElement
      if (articleIdText) articleIdText.style.right = "-12px"
      
      const gs1Img = clonedLabel.querySelector(".datamatrix-code") as HTMLImageElement
      if (gs1Img && gs1DataMatrixUrl) gs1Img.src = gs1DataMatrixUrl

      const code128Img = clonedLabel.querySelector(".linear-barcode") as HTMLImageElement
      if (code128Img && code128Url) code128Img.src = code128Url

      hiddenContainer.appendChild(clonedLabel)

      const canvas = await html2canvas(hiddenContainer, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        windowWidth: hiddenContainer.scrollWidth,
        windowHeight: hiddenContainer.scrollHeight,
        logging: false,
      })
      
      document.body.removeChild(hiddenContainer)

      const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: "a4" })
      const imgData = canvas.toDataURL("image/png")
      const { width: imgWidth, height: imgHeight } = canvas
      const { width: pdfWidth, height: pdfHeight } = pdf.internal.pageSize
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
      const [scaledWidth, scaledHeight] = [imgWidth * ratio, imgHeight * ratio]
      const [xOffset, yOffset] = [(pdfWidth - scaledWidth) / 2, (pdfHeight - scaledHeight) / 2]

      pdf.setFillColor(255, 255, 255)
      pdf.rect(0, 0, pdfWidth, pdfHeight, "F")
      pdf.addImage(imgData, "PNG", xOffset, yOffset, scaledWidth, scaledHeight)
      pdf.save(`shipping-label-${labelData.toAddress.fullName.replace(/\s+/g, "-")}.pdf`)
    } catch (error) {
      console.error("Error generating PDF:", error)
    }
  }
  if (isLoadingBarcode) {
    return (
      <div className="animate-fade-in">
        <Card className="shadow-2xl border-0 bg-white dark:bg-slate-800 backdrop-blur-none overflow-hidden">
          <CardContent className="p-12 text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">Assigning Barcode</h3>
            <p className="text-slate-500">Fetching and assigning a unique barcode to your label...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <Card className="shadow-2xl border-0 bg-white dark:bg-slate-800 backdrop-blur-none overflow-hidden">
        <CardHeader className="text-center pb-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-700 dark:to-slate-600">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 animate-pulse">
            <Eye className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center justify-center gap-2">
            <Sparkles className="w-6 h-6 text-blue-600" />
            Your Generated Label
          </CardTitle>
          <p className="text-slate-600 dark:text-slate-300">Professional shipping label ready for use</p>
          {barcodeData && !hasError && (
            <div className="mt-2 space-y-1">
              <div className="text-xs text-slate-500">Barcode ID: {barcodeData.id}</div>
              <div className="text-xs text-slate-500">Linear Value: {barcodeData.linearValue}</div>
            </div>
          )}
          {hasError && (
            <div className="mt-2 flex items-center justify-center gap-2 text-red-600">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-xs">Error: Failed to assign barcode</span>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-8" style={{ backgroundColor: "#ffffff" }}>
          <div className="flex justify-center mb-6" style={{ backgroundColor: "#ffffff" }}>
            <div
              ref={labelRef}
              className="w-[610px] bg-white rounded-none overflow-hidden shadow-xl animate-slide-up"
              style={{ fontFamily: "Arial, sans-serif", backgroundColor: "#ffffff" }}
            >
              {/* --- HEADER --- */}
              {/* --- CORRECTED HEADER STRUCTURE --- */}
              <div
                className="pdf-label-header"
                style={{
                  display: "flex",
                  alignItems: "stretch", // Ensures both boxes are same height
                  borderBottom: "none",
                }}
              >
                {/* 1. Red logo box - no margin needed */}
                <div
                  className="pdf-label-logo-box"
                  style={{
                    width: "60px",
                    background: "#DC2626",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div className="p-2.5">
                    <img
                      className="w-10 h-10"
                      src="https://ik.imagekit.io/132dqaa7qx/logo.png?updatedAt=1748926741001"
                      alt="Express Post Logo"
                      style={{ objectFit: "contain" }}
                    />
                  </div>
                </div>

                {/* 2. New container for the yellow bar and text */}
                <div
                  className="pdf-label-header-yellow-bar"
                  style={{
                    background: "#FAD022",
                    flex: 1, // Takes up the rest of the space
                    marginLeft: "4px", // This creates the visual gap
                    display: "flex",
                    alignItems: "center",
                    paddingLeft: "1rem", // Space between yellow edge and text
                  }}
                >
                  <div
                    className="pdf-label-header-text"
                    style={{
                      color: "#DC2626",
                      fontSize: "2rem",
                      fontWeight: "900",
                      fontFamily: "'Arial Black', 'Arial', sans-serif",
                      lineHeight: "1",
                    }}
                  >
                    Express Post
                  </div>
                </div>
              </div>
              {/* --- END OF CORRECTED HEADER --- */}


              <div className="main-content" style={{ display: "flex", backgroundColor: "#ffffff" }}>
                {/* --- LEFT COLUMN --- */}
                <div style={{ flex: 1, paddingTop: "6px" }}>
                  {/* To Address */}
                  <div
                    className="pdf-label-to-address-container"
                    style={{ border: "4px solid #E8DFD2", borderBottom: "none" }}
                  >
                    <div
                   
                      style={{ padding: "2px 4px", height: "190px", background: "white", fontSize: "20px", lineHeight: 1.2 }}
                    >
                    <div    className="pdf-label-to-address">
                        To: <br />
                      {labelData.toAddress.fullName} <br />
                      {labelData.toAddress.street} <br />
                      {labelData.toAddress.cityStatePostcode}
                    </div>
                    </div>
                  </div>

                  {/* Packaging, Weight, Features */}
                  <div style={{ display: "flex", border: "4px solid #E8DFD2", borderBottom: "none", lineHeight: 1.2 }}>
                    <div  style={{ flex: 1, padding: "2px", borderRight: "4px solid #E8DFD2" }}>
                        <div className="pdf-label-packaging-section">
                             <div style={{ fontSize: "18px", color: "#666", marginBottom: "4px" }}>Packaging</div>
                      <div style={{ fontSize: "32px", textAlign: "center" }} className={Stratum.className}>OWN</div>
                        </div>
                    </div>
                    <div  style={{ flex: 1, padding: "2px 0", textAlign: "center", borderRight: "4px solid #E8DFD2" }}>
                      <div className="pdf-label-weight-section">
                        <div style={{ fontSize: "16px", color: "#666", marginBottom: "6px" }}>Physical weight</div>
                      <div style={{ fontSize: "32px", marginBottom: "4px", lineHeight: 1.2 }} className={Stratum.className}>{labelData.weight || "5kg"}</div>
                      <div style={{ fontSize: "16px", color: "#666", margin: "8px 0" }}>Cubic weight</div>
                      <div style={{ fontSize: "26px", marginBottom: "8px" ,marginTop:'-4px'}}>N/A</div>
                      </div>
                    </div>
                    <div  style={{ flex: 1, padding: "2px 0", textAlign: "center", lineHeight: 1.2 }}>
                      <div className="pdf-label-features-section">
                        <div style={{ fontSize: "16px", color: "#666", marginBottom: "4px" }}>Delivery features</div>
                      <div style={{ fontSize: "26px" }}>-</div>
                      </div>
                    </div>
                  </div>

                  {/* Phone */}
                  <div style={{ padding: "3px", border: "4px solid #E8DFD2", borderBottom: "none" }}>
                    <div style={{ fontSize: "20px", fontWeight: "700" }} className={`${Stratum.className} pdf-label-phone`}>
                      Ph: {labelData.phone || "N/A"}
                    </div>
                  </div>

                  {/* Reference */}
                  <div style={{ padding: "3px", border: "4px solid #E8DFD2", marginBottom: "16px" }}>
                    <div style={{ fontSize: "20px", fontWeight: "600" }} className={`${Stratum.className} pdf-label-reference`}>
                      Ref: {labelData.reference || "N/A"}
                    </div>
                  </div>

                  {/* Sender Address */}
                  <div className="pdf-label-sender-address-container" style={{ border: "4px solid #E8DFD2" }}>
                    <div  style={{ height: "130px", padding: "4px", background: "white" }}>
                     <div className="pdf-label-sender-address">
                       <div style={{ fontSize: "20px", lineHeight: 1.2, fontWeight: "550" }}>Sender:</div>
                      <div style={{ fontSize: "17px", lineHeight: 1.2 }}>{labelData.fromAddress.fullName}</div>
                      <div style={{ fontSize: "17px", lineHeight: 1.2 }}>{labelData.fromAddress.street}</div>
                      <div style={{ fontSize: "17px", lineHeight: 1.2 }}>{labelData.fromAddress.cityStatePostcode}</div>
                     </div>
                    </div>
                  </div>

                  {/* Declaration */}
                  <div
                    style={{ padding: "8px 4px", paddingTop: "10px", border: "4px solid #E8DFD2", borderTop: "none", height: "200px", lineHeight: 1.2 }}
                  >
                  <div                     className="pdf-label-declaration"
>
                      <div style={{ fontWeight: "bold", fontSize: "14px" }}>Aviation Security and Dangerous Goods Declaration</div>
                    <div style={{ fontSize: "15px", lineHeight: "1.2", color: "#333", marginTop: "13px", textAlign: "justify" }}>
                      The sender acknowledges that this article may be carried by air and will be subject to aviation security and clearing procedures; and the sender declares that the article does not contain any dangerous or prohibited goods, explosive or incendiary devices. A false declaration is a criminal offence.
                    </div>
                  </div>
                  </div>
                </div>

                {/* --- RIGHT COLUMN --- */}
                <div style={{ width: "160px", padding: "16px", display: "flex", flexDirection: "column" }}>
                  <div style={{ textAlign: "center" }}>
                    <p className="postage-paid" style={{ fontSize: "20px", marginBottom: "8px", marginLeft: "-20px" }}>Postage Paid</p>
                    <div style={{ textAlign: "center", width: "100px", height: "100px", margin: "0 auto" }}>
                      <img
                        src={gs1DataMatrixUrl || "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"}
                        alt="GS1 DataMatrix"
                        className="datamatrix-code"
                        style={{ width: "100px", height: "100px", objectFit: "contain" }}
                      />
                    </div>
                  </div>

                  <div style={{ padding: "2px", flex: 1, position: "relative", minHeight: "600px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <p
                      style={{
                        position: "absolute",
                        right: "-2px",
                        top: "12%",
                        transform: "translateY(50%) rotate(90deg)",
                        transformOrigin: "center",
                        fontSize: "16px",
                        fontWeight: "800",
                        whiteSpace: "nowrap",
                      }}
                      className={`${Stratum.className} pdf-label-article-id`}
                    >
                      AP Article Id: {barcodeData?.linearValue || "ERROR"}
                    </p>
                    <img
                      src={code128Url || "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"}
                      alt="Code 128 Barcode"
                      className="linear-barcode"
                      style={{ height: "520px", display: "block" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-700 dark:to-slate-600 p-6">
          <div className="flex justify-center space-x-4 w-full">
            <Button
              variant="outline"
              onClick={handleDownloadPDF}
              className="flex-1 max-w-xs h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              disabled={hasError || isLoadingBarcode}
            >
              <Download className="mr-2 h-5 w-5" />
              Download PDF
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}