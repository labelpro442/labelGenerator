"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { generateLabel } from "@/lib/actions"
import { LabelPreview } from "@/components/label-preview"
import {
  Loader2,
  RefreshCw,
  LogOut,
  MapPin,
  Phone,
  Package,
  User,
  Sparkles,
  AlertTriangle,
  Database,
} from "lucide-react"
import { generateRandomAddress, generateRandomPhone } from "@/lib/utils"
import { useRouter } from "next/navigation"

export type AddressData = {
  fullName: string
  street: string
  cityStatePostcode: string
}

export type LabelData = {
  toAddress: AddressData
  fromAddress: AddressData
  phone: string
  reference: string
  weight: string
}

const initialLabelData: LabelData = {
  toAddress: {
    fullName: "",
    street: "",
    cityStatePostcode: "",
  },
  fromAddress: {
    fullName: "",
    street: "",
    cityStatePostcode: "",
  },
  phone: "",
  reference: "",
  weight: "5kg",
}

interface LabelGeneratorFormProps {
  keyCode: string
}

export function LabelGeneratorForm({ keyCode }: LabelGeneratorFormProps) {
  const [labelData, setLabelData] = useState<LabelData>(initialLabelData)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [activeTab, setActiveTab] = useState("form")
  const [barcodeStatus, setBarcodeStatus] = useState<{
    available: number
    total: number
    hasAvailable: boolean
  } | null>(null)
  const [isCheckingBarcodes, setIsCheckingBarcodes] = useState(true)
  const { toast } = useToast()
  const router = useRouter()

  // Check barcode availability on component mount
  useEffect(() => {
    const checkBarcodeAvailability = async () => {
      try {
        setIsCheckingBarcodes(true)
        const response = await fetch("/api/admin/barcodes/status")
        if (response.ok) {
          const data = await response.json()
          setBarcodeStatus({
            available: data.stats.available,
            total: data.stats.total,
            hasAvailable: data.hasAvailable,
          })

          if (!data.hasAvailable) {
            toast({
              title: "⚠️ No Barcodes Available",
              description: "No barcode values are available. Label generation will fail until barcodes are uploaded.",
              variant: "destructive",
            })
          } else if (data.stats.available < 5) {
            toast({
              title: "⚠️ Low Barcode Count",
              description: `Only ${data.stats.available} barcode values remaining. Consider uploading more.`,
            })
          }
        }
      } catch (error) {
        console.error("Error checking barcode availability:", error)
      } finally {
        setIsCheckingBarcodes(false)
      }
    }

    checkBarcodeAvailability()
  }, [toast])

  const handleInputChange = (section: keyof LabelData, field: string, value: string) => {
    if (section === "toAddress" || section === "fromAddress") {
      setLabelData({
        ...labelData,
        [section]: {
          ...labelData[section],
          [field]: value,
        },
      })
    } else {
      setLabelData({
        ...labelData,
        [field]: value,
      })
    }
  }

  const handleGenerateRandomFromAddress = (state?: string) => {
    const randomAddress = generateRandomAddress(state)
    setLabelData({
      ...labelData,
      fromAddress: randomAddress,
    })
    toast({
      title: "🎲 Address Generated!",
      description: `Random ${state || ""} address has been generated.`,
    })
  }

  const handleGenerateRandomPhone = () => {
    const randomPhone = generateRandomPhone()
    setLabelData({
      ...labelData,
      phone: randomPhone,
    })
    toast({
      title: "📱 Phone Generated!",
      description: "Random Australian phone number generated.",
    })
  }

  const handleGenerateLabel = async (e: React.FormEvent) => {
    e.preventDefault()

    // Check if barcodes are available before attempting generation
    if (barcodeStatus && !barcodeStatus.hasAvailable) {
      toast({
        title: "❌ No Barcodes Available",
        description: "Cannot generate label: No barcode values are available in the database.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)

    try {
      console.log("=== STARTING LABEL GENERATION FROM FORM ===")
      console.log("Using key:", keyCode)
      console.log("Barcode status:", barcodeStatus)

      const result = await generateLabel(labelData, keyCode)
      console.log("=== LABEL GENERATION RESULT ===", result)

      if (result.success) {
        setShowPreview(true)
        setActiveTab("preview")

        toast({
          title: "🎉 Label Generated!",
          description:
            "Your shipping label has been successfully generated. Barcode will be assigned when viewing the preview.",
        })
      } else {
        toast({
          title: "❌ Error",
          description: result.message || "Failed to generate label.",
          variant: "destructive",
        })

        if (result.message?.includes("key")) {
          setTimeout(() => {
            router.push("/")
          }, 2000)
        }
      }
    } catch (error) {
      console.error("Label generation error:", error)
      toast({
        title: "❌ Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleLogout = () => {
    router.push("/")
  }

  const stateButtons = [
    { code: "NSW", name: "New South Wales", color: "from-blue-500 to-blue-600" },
    { code: "VIC", name: "Victoria", color: "from-purple-500 to-purple-600" },
    { code: "QLD", name: "Queensland", color: "from-orange-500 to-orange-600" },
    { code: "WA", name: "Western Australia", color: "from-green-500 to-green-600" },
    { code: "SA", name: "South Australia", color: "from-red-500 to-red-600" },
    { code: "TAS", name: "Tasmania", color: "from-teal-500 to-teal-600" },
    { code: "ACT", name: "Australian Capital Territory", color: "from-pink-500 to-pink-600" },
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-slate-600 dark:text-slate-300">
            Using key:{" "}
            <span className="font-mono bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 rounded-full text-xs">
              {keyCode}
            </span>
          </span>
        </div>
        <Button
          variant="outline"
          onClick={handleLogout}
          className="hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all duration-200"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>

      {/* Barcode Status Warning */}
      {barcodeStatus && (
        <div className="p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20">
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-blue-600" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Barcode Status:</span>
                <span className={`text-sm font-bold ${barcodeStatus.hasAvailable ? "text-green-600" : "text-red-600"}`}>
                  {barcodeStatus.available} available
                </span>
                <span className="text-sm text-slate-500">({barcodeStatus.total} total)</span>
              </div>
              {!barcodeStatus.hasAvailable && (
                <div className="flex items-center gap-2 mt-1">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span className="text-xs text-red-600">No barcodes available - label generation will fail</span>
                </div>
              )}
              {barcodeStatus.hasAvailable && barcodeStatus.available < 5 && (
                <div className="flex items-center gap-2 mt-1">
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  <span className="text-xs text-yellow-600">Low barcode count - consider uploading more</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/20 rounded-2xl p-1">
          <TabsTrigger
            value="form"
            className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all duration-200"
          >
            <Package className="mr-2 h-4 w-4" />
            Label Form
          </TabsTrigger>
          <TabsTrigger
            value="preview"
            disabled={!showPreview}
            className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all duration-200"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="form" className="animate-slide-up">
          <Card className="shadow-2xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center justify-center gap-2">
                <Package className="w-6 h-6 text-blue-600" />
                Create Shipping Label
              </CardTitle>
              <CardDescription className="text-base">
                Fill in the details below to generate your professional shipping label
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGenerateLabel} className="space-y-8">
                {/* To Address Section */}
                <div className="space-y-4 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-700 dark:to-slate-600 rounded-2xl border border-blue-100 dark:border-slate-600">
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200">TO Address</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="relative group">
                      <User className="absolute left-3 top-4 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                      <Input
                        placeholder="Full Name"
                        value={labelData.toAddress.fullName}
                        onChange={(e) => handleInputChange("toAddress", "fullName", e.target.value)}
                        className="pl-10 h-12 border-2 border-slate-200 focus:border-blue-500 rounded-xl transition-all duration-200 focus:shadow-lg focus:shadow-blue-500/20"
                        required
                      />
                    </div>
                    <div className="relative group">
                      <MapPin className="absolute left-3 top-4 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                      <Input
                        placeholder="Street Address"
                        value={labelData.toAddress.street}
                        onChange={(e) => handleInputChange("toAddress", "street", e.target.value)}
                        className="pl-10 h-12 border-2 border-slate-200 focus:border-blue-500 rounded-xl transition-all duration-200 focus:shadow-lg focus:shadow-blue-500/20"
                        required
                      />
                    </div>
                    <div className="relative group">
                      <MapPin className="absolute left-3 top-4 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                      <Input
                        placeholder="City, State, Postcode"
                        value={labelData.toAddress.cityStatePostcode}
                        onChange={(e) => handleInputChange("toAddress", "cityStatePostcode", e.target.value)}
                        className="pl-10 h-12 border-2 border-slate-200 focus:border-blue-500 rounded-xl transition-all duration-200 focus:shadow-lg focus:shadow-blue-500/20"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* From Address Section */}
                <div className="space-y-4 p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-slate-700 dark:to-slate-600 rounded-2xl border border-purple-100 dark:border-slate-600">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-purple-600" />
                      <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-200">FROM Address</h3>
                    </div>
                  </div>

                  {/* State Selection Buttons */}
                  <div className="space-y-3">
                    <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                      Generate random address by state:
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {stateButtons.map((state, index) => (
                        <Button
                          key={state.code}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleGenerateRandomFromAddress(state.code)}
                          className={`h-10 bg-gradient-to-r ${state.color} text-white border-0 hover:shadow-lg transform hover:scale-105 transition-all duration-200 animate-slide-up`}
                          style={{ animationDelay: `${index * 50}ms` }}
                          title={state.name}
                        >
                          {state.code}
                        </Button>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleGenerateRandomFromAddress()}
                        className="h-10 bg-gradient-to-r from-slate-500 to-slate-600 text-white border-0 hover:shadow-lg transform hover:scale-105 transition-all duration-200 animate-slide-up"
                        style={{ animationDelay: `${stateButtons.length * 50}ms` }}
                      >
                        <RefreshCw className="mr-1 h-3 w-3" />
                        Any
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="relative group">
                      <User className="absolute left-3 top-4 h-4 w-4 text-slate-400 group-focus-within:text-purple-500 transition-colors duration-200" />
                      <Input
                        placeholder="Full Name"
                        value={labelData.fromAddress.fullName}
                        onChange={(e) => handleInputChange("fromAddress", "fullName", e.target.value)}
                        className="pl-10 h-12 border-2 border-slate-200 focus:border-purple-500 rounded-xl transition-all duration-200 focus:shadow-lg focus:shadow-purple-500/20"
                        required
                      />
                    </div>
                    <div className="relative group">
                      <MapPin className="absolute left-3 top-4 h-4 w-4 text-slate-400 group-focus-within:text-purple-500 transition-colors duration-200" />
                      <Input
                        placeholder="Street Address"
                        value={labelData.fromAddress.street}
                        onChange={(e) => handleInputChange("fromAddress", "street", e.target.value)}
                        className="pl-10 h-12 border-2 border-slate-200 focus:border-purple-500 rounded-xl transition-all duration-200 focus:shadow-lg focus:shadow-purple-500/20"
                        required
                      />
                    </div>
                    <div className="relative group">
                      <MapPin className="absolute left-3 top-4 h-4 w-4 text-slate-400 group-focus-within:text-purple-500 transition-colors duration-200" />
                      <Input
                        placeholder="City, State, Postcode"
                        value={labelData.fromAddress.cityStatePostcode}
                        onChange={(e) => handleInputChange("fromAddress", "cityStatePostcode", e.target.value)}
                        className="pl-10 h-12 border-2 border-slate-200 focus:border-purple-500 rounded-xl transition-all duration-200 focus:shadow-lg focus:shadow-purple-500/20"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Details */}
                <div className="space-y-4 p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-slate-700 dark:to-slate-600 rounded-2xl border border-green-100 dark:border-slate-600">
                  <div className="flex items-center gap-2 mb-4">
                    <Package className="w-5 h-5 text-green-600" />
                    <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">Additional Details</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Phone Number</label>
                      <div className="flex space-x-2">
                        <div className="relative group flex-1">
                          <Phone className="absolute left-3 top-4 h-4 w-4 text-slate-400 group-focus-within:text-green-500 transition-colors duration-200" />
                          <Input
                            placeholder="04xxxxxxxx"
                            value={labelData.phone}
                            onChange={(e) => handleInputChange("", "phone", e.target.value)}
                            className="pl-10 h-12 border-2 border-slate-200 focus:border-green-500 rounded-xl transition-all duration-200 focus:shadow-lg focus:shadow-green-500/20"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleGenerateRandomPhone}
                          className="h-12 px-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Reference</label>
                      <Input
                        placeholder="Reference number"
                        value={labelData.reference}
                        onChange={(e) => handleInputChange("", "reference", e.target.value)}
                        className="h-12 border-2 border-slate-200 focus:border-green-500 rounded-xl transition-all duration-200 focus:shadow-lg focus:shadow-green-500/20"
                      />
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-14 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] text-lg"
                  disabled={isGenerating || isCheckingBarcodes || (barcodeStatus && !barcodeStatus.hasAvailable)}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                      Generating Your Label...
                    </>
                  ) : isCheckingBarcodes ? (
                    <>
                      <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                      Checking Barcode Availability...
                    </>
                  ) : barcodeStatus && !barcodeStatus.hasAvailable ? (
                    <>
                      <AlertTriangle className="mr-3 h-6 w-6" />
                      No Barcodes Available
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-3 h-6 w-6" />
                      Generate Professional Label
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="animate-slide-up">
          {showPreview && <LabelPreview labelData={labelData} keyCode={keyCode} />}
        </TabsContent>
      </Tabs>
    </div>
  )
}
