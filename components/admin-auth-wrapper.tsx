"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Shield, Lock, Eye, EyeOff, Loader2 } from "lucide-react"
import { AdminSidebar } from "@/components/admin-sidebar"

interface AdminAuthWrapperProps {
  children: React.ReactNode
}

export function AdminAuthWrapper({ children }: AdminAuthWrapperProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const [loggedInUsername, setLoggedInUsername] = useState("")

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = () => {
      const authToken = localStorage.getItem("admin_auth_token")
      const authExpiry = localStorage.getItem("admin_auth_expiry")
      const storedUsername = localStorage.getItem("admin_username")

      if (authToken && authExpiry && storedUsername) {
        const expiryTime = Number.parseInt(authExpiry)
        if (Date.now() < expiryTime) {
          setIsAuthenticated(true)
          setLoggedInUsername(storedUsername)
        } else {
          // Token expired, clear storage
          localStorage.removeItem("admin_auth_token")
          localStorage.removeItem("admin_auth_expiry")
          localStorage.removeItem("admin_username")
        }
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Simple authentication - in production, this should be server-side
      console.log(process.env.admin_username)
      const validCredentials = [
        { username: process.env.NEXT_PUBLIC_ADMIN_USERNAME, password: process.env.NEXT_PUBLIC_ADMIN_PASSWORD },
      ]

      const isValid = validCredentials.some((cred) => cred.username === username && cred.password === password)

      if (isValid) {
        // Set authentication token with 24-hour expiry
        const token = btoa(`${username}:${Date.now()}`)
        const expiry = Date.now() + 24 * 60 * 60 * 1000 // 24 hours

        localStorage.setItem("admin_auth_token", token)
        localStorage.setItem("admin_auth_expiry", expiry.toString())
        localStorage.setItem("admin_username", username)

        setIsAuthenticated(true)
        setLoggedInUsername(username)
        toast({
          title: "🎉 Welcome Admin!",
          description: "Successfully logged into admin dashboard.",
        })
      } else {
        toast({
          title: "❌ Access Denied",
          description: "Invalid username or password.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "An error occurred during login.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogout = async () => {
    try {
      // Call the logout API
      await fetch("/api/logout", {
        method: "POST",
      })

      // Clear local storage
      localStorage.removeItem("admin_auth_token")
      localStorage.removeItem("admin_auth_expiry")
      localStorage.removeItem("admin_username")

      // Update state
      setIsAuthenticated(false)
      setUsername("")
      setPassword("")
      setLoggedInUsername("")

      toast({
        title: "👋 Logged Out",
        description: "You have been logged out successfully.",
      })
    } catch (error) {
      console.error("Logout error:", error)
      // Still clear local state even if API call fails
      localStorage.removeItem("admin_auth_token")
      localStorage.removeItem("admin_auth_expiry")
      localStorage.removeItem("admin_username")
      setIsAuthenticated(false)
      setUsername("")
      setPassword("")
      setLoggedInUsername("")
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-slate-600">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-4">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-red-400/20 to-orange-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 backdrop-blur-sm relative z-10 animate-slide-up">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl flex items-center justify-center mb-4 animate-pulse">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
              Admin Access Required
            </CardTitle>
            <CardDescription className="text-base">
              Please enter your administrator credentials to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-4">
                <div className="relative group">
                  <Shield className="absolute left-4 top-4 h-5 w-5 text-slate-400 group-focus-within:text-red-500 transition-colors duration-200" />
                  <Input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-12 h-12 border-2 border-slate-200 focus:border-red-500 rounded-xl transition-all duration-200 focus:shadow-lg focus:shadow-red-500/20"
                    required
                  />
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-4 h-5 w-5 text-slate-400 group-focus-within:text-red-500 transition-colors duration-200" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 pr-12 h-12 border-2 border-slate-200 focus:border-red-500 rounded-xl transition-all duration-200 focus:shadow-lg focus:shadow-red-500/20"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-4 text-slate-400 hover:text-red-500 transition-colors duration-200"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-5 w-5" />
                    Access Admin Panel
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Admin Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Admin Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
          <div className="px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-xl font-bold text-slate-800">Admin Dashboard</h1>
                <p className="text-xs text-slate-500">Logged in as: {loggedInUsername || "Unknown User"}</p>
              </div>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all duration-200"
            >
              <Shield className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Admin Content */}
        <div className="flex-1 p-6 overflow-auto">{children}</div>
      </div>
    </div>
  )
}
