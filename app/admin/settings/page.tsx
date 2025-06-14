"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { Settings, Save, Mail, Shield, Globe } from "lucide-react"

export default function SettingsPage() {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // General settings
  const [siteName, setSiteName] = useState("Label Generator Pro")
  const [siteDescription, setSiteDescription] = useState("Generate shipping labels with a secure key system")

  // Email settings
  const [emailNotifications, setEmailNotifications] = useState(false)
  const [emailFrom, setEmailFrom] = useState("noreply@labelgenerator.com")
  const [emailFooter, setEmailFooter] = useState("© 2025 Label Generator Pro. All rights reserved.")

  // Security settings
  const [requireStrongKeys, setRequireStrongKeys] = useState(true)
  const [sessionTimeout, setSessionTimeout] = useState(60)
  const [maxLoginAttempts, setMaxLoginAttempts] = useState(5)

  const handleSaveSettings = (e: React.FormEvent, section: string) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false)
      toast({
        title: "✅ Settings Saved",
        description: `Your ${section} settings have been updated successfully.`,
      })
    }, 800)
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-slate-600 mt-2">Configure your label generator application settings</p>
        </div>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3 mb-8">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span>General</span>
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <span>Email</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span>Security</span>
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-600" />
                General Settings
              </CardTitle>
              <CardDescription>Configure the basic settings for your application</CardDescription>
            </CardHeader>
            <form onSubmit={(e) => handleSaveSettings(e, "general")}>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    placeholder="Enter site name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="siteDescription">Site Description</Label>
                  <Input
                    id="siteDescription"
                    value={siteDescription}
                    onChange={(e) => setSiteDescription(e.target.value)}
                    placeholder="Enter site description"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isSubmitting} className="ml-auto">
                  {isSubmitting ? (
                    <>Saving...</>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-600" />
                Email Settings
              </CardTitle>
              <CardDescription>Configure email notifications and templates</CardDescription>
            </CardHeader>
            <form onSubmit={(e) => handleSaveSettings(e, "email")}>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="emailNotifications">Email Notifications</Label>
                    <div className="text-sm text-slate-500">Send email notifications for key usage</div>
                  </div>
                  <Switch
                    id="emailNotifications"
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emailFrom">From Email Address</Label>
                  <Input
                    id="emailFrom"
                    value={emailFrom}
                    onChange={(e) => setEmailFrom(e.target.value)}
                    placeholder="noreply@example.com"
                    type="email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emailFooter">Email Footer Text</Label>
                  <Input
                    id="emailFooter"
                    value={emailFooter}
                    onChange={(e) => setEmailFooter(e.target.value)}
                    placeholder="Email footer text"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email Notifications</Label>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between border p-3 rounded-md">
                      <div>
                        <p className="font-medium">Key Created</p>
                        <p className="text-sm text-slate-500">Send notification when a new key is created</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between border p-3 rounded-md">
                      <div>
                        <p className="font-medium">Key Used</p>
                        <p className="text-sm text-slate-500">Send notification when a key is used</p>
                      </div>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between border p-3 rounded-md">
                      <div>
                        <p className="font-medium">Key Expired</p>
                        <p className="text-sm text-slate-500">Send notification when a key expires</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isSubmitting} className="ml-auto">
                  {isSubmitting ? (
                    <>Saving...</>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Security Settings
              </CardTitle>
              <CardDescription>Configure security options for your application</CardDescription>
            </CardHeader>
            <form onSubmit={(e) => handleSaveSettings(e, "security")}>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="requireStrongKeys">Require Strong Keys</Label>
                    <div className="text-sm text-slate-500">Enforce minimum length and complexity for keys</div>
                  </div>
                  <Switch id="requireStrongKeys" checked={requireStrongKeys} onCheckedChange={setRequireStrongKeys} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Admin Session Timeout (minutes)</Label>
                  <Input
                    id="sessionTimeout"
                    value={sessionTimeout}
                    onChange={(e) => setSessionTimeout(Number(e.target.value))}
                    type="number"
                    min="5"
                    max="1440"
                  />
                  <p className="text-xs text-slate-500">
                    How long before an inactive admin session expires (5-1440 minutes)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">Maximum Login Attempts</Label>
                  <Input
                    id="maxLoginAttempts"
                    value={maxLoginAttempts}
                    onChange={(e) => setMaxLoginAttempts(Number(e.target.value))}
                    type="number"
                    min="1"
                    max="10"
                  />
                  <p className="text-xs text-slate-500">Number of failed login attempts before temporary lockout</p>
                </div>

                <div className="space-y-2">
                  <Label>Security Options</Label>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between border p-3 rounded-md">
                      <div>
                        <p className="font-medium">IP Restriction</p>
                        <p className="text-sm text-slate-500">Restrict admin access to specific IP addresses</p>
                      </div>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between border p-3 rounded-md">
                      <div>
                        <p className="font-medium">Two-Factor Authentication</p>
                        <p className="text-sm text-slate-500">Require 2FA for admin login</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between border p-3 rounded-md">
                      <div>
                        <p className="font-medium">Audit Logging</p>
                        <p className="text-sm text-slate-500">Log all admin actions</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isSubmitting} className="ml-auto">
                  {isSubmitting ? (
                    <>Saving...</>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
