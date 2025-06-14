"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { KeyIcon, Loader2, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"

export function KeyValidationForm() {
  const [keyCode, setKeyCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      toast({
        title: "🔍 Validating...",
        description: "Checking your access key...",
      })

      router.push(`/?key=${encodeURIComponent(keyCode.trim())}`)
    } catch (error) {
      console.error("Key validation error:", error)
      toast({
        title: "❌ Error",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const testKeys = [
    { key: "DEMO-2024-001", label: "Demo Key", uses: "1 use" },
    { key: "TEST-KEY-001", label: "Test Key", uses: "10 uses" },
    { key: "PREMIUM-2024-002", label: "Premium Key", uses: "5 uses" },
    { key: "TRIAL-2024-003", label: "Trial Key", uses: "3 uses" },
  ]

  return (
    <div className="flex justify-center animate-slide-up">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 animate-pulse">
            <KeyIcon className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Enter Access Key
          </CardTitle>
          <CardDescription className="text-base">
            Please enter your access key to continue to the label generator
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <div className="relative group">
                <KeyIcon className="absolute left-4 top-4 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                <Input
                  type="text"
                  placeholder="Enter your access key"
                  value={keyCode}
                  onChange={(e) => setKeyCode(e.target.value.trim())}
                  className="pl-12 h-12 border-2 border-slate-200 focus:border-blue-500 rounded-xl transition-all duration-200 focus:shadow-lg focus:shadow-blue-500/20"
                  required
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Validating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Validate Key
                </>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 pt-6">
          <p className="text-sm text-slate-500 text-center">Need an access key? Contact your administrator.</p>
        </CardFooter>
      </Card>
    </div>
  )
}
