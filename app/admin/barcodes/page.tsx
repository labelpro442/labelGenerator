"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import {
  Loader2,
  Upload,
  RefreshCw,
  Trash2,
  Database,
  Check,
  X,
  FileText,
  Download,
  AlertCircle,
  TestTube,
  Bug,
} from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"

interface BarcodeValue {
  id: number
  gs1_value: string
  linear_value: string
  is_used: boolean
  used_at: string | null
  created_at: string
}

export default function BarcodesPage() {
  const [barcodes, setBarcodes] = useState<BarcodeValue[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [barcodeText, setBarcodeText] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [debugMode, setDebugMode] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    used: 0,
    available: 0,
  })
  const { toast } = useToast()

  const fetchBarcodes = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/admin/barcodes")

      if (response.ok) {
        const data = await response.json()
        setBarcodes(data.barcodes)
        setStats({
          total: data.stats.total,
          used: data.stats.used,
          available: data.stats.available,
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch barcodes")
      }
    } catch (error) {
      console.error("Error fetching barcodes:", error)
      toast({
        title: "❌ Error",
        description: error instanceof Error ? error.message : "Failed to load barcode data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchBarcodes()
  }, [fetchBarcodes])

  const handleUploadBarcodes = async () => {
    if (!barcodeText.trim()) {
      toast({
        title: "❌ Error",
        description: "Please enter barcode values to upload",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    try {
      console.log("=== FRONTEND UPLOAD START ===")
      console.log("Barcode text to upload:", barcodeText.substring(0, 200))

      const response = await fetch("/api/admin/barcodes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ barcodeText }),
      })

      const data = await response.json()
      console.log("=== UPLOAD RESPONSE ===", data)

      if (response.ok) {
        let message = `${data.inserted} barcode values have been uploaded successfully`
        if (data.warnings) {
          message += `. Warning: ${data.warnings}`
        }

        toast({
          title: "✅ Success",
          description: message,
        })

        if (debugMode && data.debug) {
          console.log("Debug info:", data.debug)
        }

        setBarcodeText("")
        fetchBarcodes()
      } else {
        console.error("Upload failed:", data)

        let errorMessage = data.error || "Failed to upload barcodes"

        if (data.debug) {
          console.log("Debug info from server:", data.debug)
          errorMessage += `\n\nDebug Info:\n- Total lines: ${data.debug.totalLines}\n- Sample lines: ${JSON.stringify(data.debug.sampleLines)}`
        }

        if (data.details && Array.isArray(data.details)) {
          errorMessage += `\n\nErrors:\n${data.details.slice(0, 3).join("\n")}`
        }

        if (data.message) {
          errorMessage += `\n\n${data.message}`
        }

        toast({
          title: "❌ Upload Failed",
          description: errorMessage,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error uploading barcodes:", error)
      toast({
        title: "❌ Error",
        description: error instanceof Error ? error.message : "Failed to upload barcode values",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleLoadSampleData = () => {
    const sampleBarcodes = `(01)99312650999998(91)0211003022413006340990(8008)231017111405
(01)99312650999998(91)0211003022413006340991(8008)231017111406
(01)99312650999998(91)0211003022413006340992(8008)231017111407
(01)99312650999998(91)0211003022413006340993(8008)231017111408
(01)99312650999998(91)0211003022413006340994(8008)231017111409`

    setBarcodeText(sampleBarcodes)
    toast({
      title: "📋 Sample Data Loaded",
      description: "Sample barcode values have been loaded into the text area",
    })
  }

  const handleLoadSimpleTestData = () => {
    const simpleBarcodes = `(91)0211003022413006340990
(91)0211003022413006340991
(91)0211003022413006340992`

    setBarcodeText(simpleBarcodes)
    toast({
      title: "📋 Simple Test Data Loaded",
      description: "Simple test barcode values have been loaded",
    })
  }

  const handleTestSingleBarcode = () => {
    const singleBarcode = "(01)99312650999998(91)0211003022413006340990(8008)231017111405"
    setBarcodeText(singleBarcode)
    toast({
      title: "🧪 Single Test Barcode Loaded",
      description: "Single test barcode loaded for debugging",
    })
  }

  const handleDeleteAllBarcodes = async () => {
    if (!confirm("Are you sure you want to delete ALL barcode values? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch("/api/admin/barcodes", {
        method: "DELETE",
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "✅ Success",
          description: `${data.deleted} barcode values have been deleted`,
        })
        fetchBarcodes()
      } else {
        throw new Error(data.message || "Failed to delete barcodes")
      }
    } catch (error) {
      console.error("Error deleting barcodes:", error)
      toast({
        title: "❌ Error",
        description: "Failed to delete barcode values",
        variant: "destructive",
      })
    }
  }

  const handleExportBarcodes = () => {
    // Create CSV content
    const csvContent = [
      ["ID", "GS1 Value", "Linear Value", "Status", "Used At", "Created At"],
      ...barcodes.map((barcode) => [
        barcode.id,
        barcode.gs1_value,
        barcode.linear_value,
        barcode.is_used ? "Used" : "Available",
        barcode.used_at ? format(new Date(barcode.used_at), "yyyy-MM-dd HH:mm:ss") : "N/A",
        format(new Date(barcode.created_at), "yyyy-MM-dd HH:mm:ss"),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    // Create and download the file
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `barcodes-export-${format(new Date(), "yyyy-MM-dd")}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "📊 Export Complete",
      description: "Barcode values have been exported to CSV",
    })
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Barcode Management
          </h1>
          <p className="text-slate-600 mt-2">Upload and manage barcode values for label generation</p>
        </div>
        <div className="flex gap-3">
         
          <Button
            onClick={fetchBarcodes}
            variant="outline"
            className="hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all duration-200"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button
            onClick={handleExportBarcodes}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
            disabled={barcodes.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Debug Info */}
      {debugMode && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-yellow-800 flex items-center gap-2">
              <Bug className="w-5 h-5" />
              Debug Mode Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-yellow-700 text-sm">
              Debug mode is active. Check the browser console for detailed logs during upload. The server will provide
              additional debugging information.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg animate-slide-up">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Total Barcodes</p>
                <p className="text-3xl font-bold text-blue-800">{stats.total}</p>
              </div>
              <Database className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card
          className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg animate-slide-up"
          style={{ animationDelay: "100ms" }}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Available Barcodes</p>
                <p className="text-3xl font-bold text-green-800">{stats.available}</p>
              </div>
              <Check className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card
          className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-lg animate-slide-up"
          style={{ animationDelay: "200ms" }}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium">Used Barcodes</p>
                <p className="text-3xl font-bold text-orange-800">{stats.used}</p>
              </div>
              <X className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upload Form */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
          <CardTitle className="text-xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-600" />
            Upload Barcode Values
          </CardTitle>
          <CardDescription>
            Paste barcode values below, one per line. Each line must contain <code>(91)</code> followed by the linear
            value.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-2">Supported Formats:</p>
                <div className="space-y-2">
                  <div>
                    <p className="font-medium">Full GS1 Format:</p>
                    <code className="bg-white px-2 py-1 rounded text-xs block mt-1">
                      (01)99312650999998(91)0211003022413006340990(8008)231017111405
                    </code>
                  </div>
                  <div>
                    <p className="font-medium">Simplified Format:</p>
                    <code className="bg-white px-2 py-1 rounded text-xs block mt-1">(91)0211003022413006340990</code>
                  </div>
                </div>
                <p className="mt-2 text-xs">
                  The system will extract the linear value (the number after <code>(91)</code>) automatically.
                </p>
              </div>
            </div>

            <div className="flex gap-2 mb-4 flex-wrap">
              <Button
                onClick={handleLoadSampleData}
                variant="outline"
                className="bg-green-50 border-green-200 text-green-800 hover:bg-green-100"
              >
                <TestTube className="mr-2 h-4 w-4" />
                Load Full Sample
              </Button>
              <Button
                onClick={handleLoadSimpleTestData}
                variant="outline"
                className="bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100"
              >
                <TestTube className="mr-2 h-4 w-4" />
                Load Simple Test
              </Button>
              <Button
                onClick={handleTestSingleBarcode}
                variant="outline"
                className="bg-purple-50 border-purple-200 text-purple-800 hover:bg-purple-100"
              >
                <Bug className="mr-2 h-4 w-4" />
                Single Test
              </Button>
            </div>

            <Textarea
              placeholder="Paste barcode values here, one per line...

Examples:
(01)99312650999998(91)0211003022413006340990(8008)231017111405
(01)99312650999998(91)0211003022413006340991(8008)231017111406
(91)0211003022413006340992
(91)0211003022413006340993"
              value={barcodeText}
              onChange={(e) => setBarcodeText(e.target.value)}
              className="min-h-[200px] font-mono text-sm"
            />
            <div className="flex justify-between">
              <Button
                variant="destructive"
                onClick={handleDeleteAllBarcodes}
                className="bg-red-600 hover:bg-red-700"
                disabled={isUploading || stats.total === 0}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete All Barcodes
              </Button>
              <Button
                onClick={handleUploadBarcodes}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                disabled={isUploading || !barcodeText.trim()}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Barcodes
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Barcodes Table */}
      <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100">
          <CardTitle className="text-xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            Barcode Values ({barcodes.length})
          </CardTitle>
          <CardDescription>List of all barcode values in the system</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                <p className="text-slate-600">Loading barcode data...</p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-semibold">ID</TableHead>
                  <TableHead className="font-semibold">GS1 Value</TableHead>
                  <TableHead className="font-semibold">Linear Value</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Created</TableHead>
                  <TableHead className="font-semibold">Used At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {barcodes.length > 0 ? (
                  barcodes.map((barcode, index) => (
                    <TableRow
                      key={barcode.id}
                      className="hover:bg-slate-50 transition-colors duration-200 animate-slide-up"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <TableCell className="font-mono text-sm">{barcode.id}</TableCell>
                      <TableCell className="font-mono text-xs max-w-[300px] truncate" title={barcode.gs1_value}>
                        {barcode.gs1_value}
                      </TableCell>
                      <TableCell className="font-mono text-sm font-bold text-blue-600">
                        {barcode.linear_value}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={barcode.is_used ? "secondary" : "default"}
                          className={`${
                            barcode.is_used
                              ? "bg-red-100 text-red-800 hover:bg-red-200"
                              : "bg-green-100 text-green-800 hover:bg-green-200"
                          } transition-colors duration-200`}
                        >
                          {barcode.is_used ? "Used" : "Available"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-600 text-sm">
                        {formatDistanceToNow(new Date(barcode.created_at), { addSuffix: true })}
                      </TableCell>
                      <TableCell className="text-slate-600 text-sm">
                        {barcode.used_at ? formatDistanceToNow(new Date(barcode.used_at), { addSuffix: true }) : "N/A"}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <Database className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-slate-600 mb-2">No barcode values found</h3>
                      <p className="text-slate-500 mb-4">Upload barcode values to get started</p>
                      <div className="flex gap-2 justify-center">
                        <Button
                          onClick={handleLoadSampleData}
                          variant="outline"
                          className="bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100"
                        >
                          <TestTube className="mr-2 h-4 w-4" />
                          Load Sample Data
                        </Button>
                        <Button
                          onClick={handleTestSingleBarcode}
                          variant="outline"
                          className="bg-purple-50 border-purple-200 text-purple-800 hover:bg-purple-100"
                        >
                          <Bug className="mr-2 h-4 w-4" />
                          Test Single
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
        <CardFooter className="bg-slate-50 border-t border-slate-200 p-4 text-center text-sm text-slate-500">
          Barcode values are automatically used when generating labels and removed from the available pool.
        </CardFooter>
      </Card>
    </div>
  )
}
