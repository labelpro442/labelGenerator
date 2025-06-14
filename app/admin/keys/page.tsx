"use client"

import { DialogFooter } from "@/components/ui/dialog"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast"
import { createKey, updateKey, deleteKey, toggleKeyStatus } from "@/lib/admin-actions"
import { Loader2, Plus, Edit, Trash2, Key, Power, PowerOff, Copy, RefreshCw } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface AccessKey {
  id: number
  key_code: string
  description: string
  max_uses: number
  current_uses: number
  is_active: boolean
  created_at: string
}

const initializeDatabase = async () => {
  try {
    const response = await fetch("/api/admin/init-database", { method: "POST" })
    if (response.ok) {
      return true
    }
    return false
  } catch (error) {
    console.error("Error initializing database:", error)
    return false
  }
}

export default function KeyManagementPage() {
  const [keys, setKeys] = useState<AccessKey[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editingKey, setEditingKey] = useState<AccessKey | null>(null)
  const [deletingKey, setDeletingKey] = useState<AccessKey | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const { toast } = useToast()

  // Form states
  const [keyPrefix, setKeyPrefix] = useState("KEY")
  const [description, setDescription] = useState("")
  const [maxUses, setMaxUses] = useState(1)

  const fetchKeys = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/admin/keys", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setKeys(data)
      } else if (response.status === 500) {
        // If we get a 500 error, it might be because the tables don't exist
        const dbInitialized = await initializeDatabase()
        if (dbInitialized) {
          toast({
            title: "✅ Database Initialized",
            description: "Database tables have been created. Refreshing data...",
          })
          // Try fetching keys again after initializing the database
          const retryResponse = await fetch("/api/admin/keys", {
            cache: "no-store",
            headers: {
              "Cache-Control": "no-cache",
            },
          })
          if (retryResponse.ok) {
            const data = await retryResponse.json()
            setKeys(data)
          }
        } else {
          throw new Error("Failed to initialize database")
        }
      } else {
        throw new Error("Failed to fetch keys")
      }
    } catch (error) {
      console.error("Error fetching keys:", error)
      toast({
        title: "❌ Error",
        description: "Failed to load keys. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchKeys()
  }, [fetchKeys])

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)

    try {
      console.log("Creating key with:", { keyPrefix, description, maxUses })

      if (!keyPrefix.trim() || !description.trim() || maxUses < 1) {
        toast({
          title: "❌ Validation Error",
          description: "Please fill in all fields correctly",
          variant: "destructive",
        })
        setIsCreating(false)
        return
      }

      const result = await createKey({
        keyPrefix: keyPrefix.trim(),
        description: description.trim(),
        maxUses,
      })

      console.log("Create key result:", result)

      if (result.success) {
        toast({
          title: "🎉 Key Created!",
          description: `New key created: ${result.keyCode}`,
        })
        // Reset form
        setCreateDialogOpen(false)
        setDescription("")
        setKeyPrefix("KEY")
        setMaxUses(1)
        // Refresh the keys list
        await fetchKeys()
      } else {
        toast({
          title: "❌ Error",
          description: result.message || "Failed to create key",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Create key error:", error)
      toast({
        title: "❌ Error",
        description: "An unexpected error occurred while creating the key",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleEditKey = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingKey) return

    setIsEditing(true)

    try {
      console.log("Updating key:", { id: editingKey.id, description: description.trim(), maxUses })

      const result = await updateKey({
        id: editingKey.id,
        description: description.trim(),
        maxUses,
      })

      console.log("Update result:", result)

      if (result.success) {
        toast({
          title: "✅ Key Updated!",
          description: result.message || "Key has been successfully updated",
        })
        setEditDialogOpen(false)
        setEditingKey(null)
        setDescription("")
        setMaxUses(1)
        // Refresh the keys list
        await fetchKeys()
      } else {
        toast({
          title: "❌ Error",
          description: result.message || "Failed to update key",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Edit key error:", error)
      toast({
        title: "❌ Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsEditing(false)
    }
  }

  const confirmDeleteKey = (key: AccessKey) => {
    setDeletingKey(key)
    setDeleteDialogOpen(true)
  }

  const handleDeleteKey = async () => {
    if (!deletingKey) return

    setIsDeleting(true)

    try {
      console.log("Starting delete process for key:", deletingKey.id, deletingKey.key_code)

      const result = await deleteKey(deletingKey.id)
      console.log("Delete operation result:", result)

      if (result.success) {
        toast({
          title: "🗑️ Key Deleted!",
          description: result.message || `Key ${deletingKey.key_code} has been permanently deleted`,
        })

        // Close dialog and reset state
        setDeleteDialogOpen(false)
        setDeletingKey(null)

        // Refresh the keys list
        await fetchKeys()
      } else {
        toast({
          title: "❌ Delete Failed",
          description: result.message || "Failed to delete key",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Delete key error:", error)
      toast({
        title: "❌ Error",
        description: "An unexpected error occurred while deleting the key",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleToggleStatus = async (keyId: number, keyCode: string, currentStatus: boolean) => {
    try {
      const result = await toggleKeyStatus(keyId, !currentStatus)

      if (result.success) {
        toast({
          title: currentStatus ? "⏸️ Key Deactivated" : "▶️ Key Activated",
          description: `Key ${keyCode} has been ${currentStatus ? "deactivated" : "activated"}`,
        })
        // Refresh the keys list
        await fetchKeys()
      } else {
        toast({
          title: "❌ Error",
          description: result.message || "Failed to update key status",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Toggle status error:", error)
      toast({
        title: "❌ Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (key: AccessKey) => {
    setEditingKey(key)
    setDescription(key.description)
    setMaxUses(key.max_uses)
    setEditDialogOpen(true)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "📋 Copied!",
      description: "Key code copied to clipboard",
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-slate-600">Loading keys...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Key Management
          </h1>
          <p className="text-slate-600 mt-2">Create, edit, and manage access keys for your label generator</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={fetchKeys}
            variant="outline"
            className="hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all duration-200"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button
                type="button"
                onClick={() => setCreateDialogOpen(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                aria-label="Create new access key"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create New Key
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-blue-600" />
                  Create New Access Key
                </DialogTitle>
                <DialogDescription>Generate a new access key for users to access the label generator</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateKey}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="keyPrefix">Key Prefix</Label>
                    <Input
                      id="keyPrefix"
                      value={keyPrefix}
                      onChange={(e) => setKeyPrefix(e.target.value)}
                      placeholder="KEY"
                      className="h-10"
                      required
                    />
                    <p className="text-xs text-slate-500">The prefix will be combined with a unique identifier</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="What is this key for?"
                      className="h-10"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxUses">Maximum Uses</Label>
                    <Input
                      id="maxUses"
                      type="number"
                      min="1"
                      max="1000"
                      value={maxUses}
                      onChange={(e) => setMaxUses(Number.parseInt(e.target.value))}
                      className="h-10"
                      required
                    />
                    <p className="text-xs text-slate-500">How many times can this key be used?</p>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCreateDialogOpen(false)}
                    disabled={isCreating}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Key
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
          <CardTitle className="text-xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
            <Key className="w-5 h-5 text-blue-600" />
            Access Keys ({keys.length})
          </CardTitle>
          <CardDescription>Manage all access keys and their permissions</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="font-semibold">Key Code</TableHead>
                <TableHead className="font-semibold">Description</TableHead>
                <TableHead className="font-semibold">Usage</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Created</TableHead>
                <TableHead className="font-semibold text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.map((key, index) => (
                <TableRow
                  key={key.id}
                  className="hover:bg-slate-50 transition-colors duration-200 animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="bg-slate-100 px-2 py-1 rounded text-sm font-mono">{key.key_code}</code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(key.key_code)}
                        className="h-6 w-6 p-0 hover:bg-blue-100"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-700 max-w-xs truncate">{key.description}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {key.current_uses} / {key.max_uses}
                      </span>
                      <div className="w-16 bg-slate-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            key.current_uses >= key.max_uses
                              ? "bg-gradient-to-r from-red-500 to-red-600"
                              : "bg-gradient-to-r from-blue-500 to-purple-500"
                          }`}
                          style={{
                            width: `${Math.min((key.current_uses / key.max_uses) * 100, 100)}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={key.is_active ? "default" : "secondary"}
                      className={`${
                        key.is_active
                          ? "bg-green-100 text-green-800 hover:bg-green-200"
                          : "bg-red-100 text-red-800 hover:bg-red-200"
                      } transition-colors duration-200`}
                    >
                      {key.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-600 text-sm">
                    {formatDistanceToNow(new Date(key.created_at), { addSuffix: true })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(key.id, key.key_code, key.is_active)}
                        className={`h-8 w-8 p-0 ${
                          key.is_active
                            ? "hover:bg-red-100 hover:text-red-600"
                            : "hover:bg-green-100 hover:text-green-600"
                        }`}
                        title={key.is_active ? "Deactivate" : "Activate"}
                      >
                        {key.is_active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(key)}
                        className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                        title="Delete"
                        onClick={() => confirmDeleteKey(key)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {keys.length === 0 && (
            <div className="text-center py-12">
              <Key className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-600 mb-2">No access keys found</h3>
              <p className="text-slate-500 mb-4">Create your first access key to get started</p>
              <Button
                onClick={() => setCreateDialogOpen(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create First Key
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-blue-600" />
              Edit Access Key
            </DialogTitle>
            <DialogDescription>
              Update the details for key: <code className="bg-slate-100 px-1 rounded">{editingKey?.key_code}</code>
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditKey}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="editDescription">Description</Label>
                <Input
                  id="editDescription"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this key for?"
                  className="h-10"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editMaxUses">Maximum Uses</Label>
                <Input
                  id="editMaxUses"
                  type="number"
                  min="1"
                  max="1000"
                  value={maxUses}
                  onChange={(e) => setMaxUses(Number.parseInt(e.target.value))}
                  className="h-10"
                  required
                />
                <p className="text-xs text-slate-500">
                  Current usage: {editingKey?.current_uses || 0} / {editingKey?.max_uses || 0}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)} disabled={isEditing}>
                Cancel
              </Button>
              <Button type="submit" disabled={isEditing}>
                {isEditing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Edit className="mr-2 h-4 w-4" />
                    Update Key
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Access Key</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the key <strong>{deletingKey?.key_code}</strong>? This action cannot be
              undone and will permanently remove the key and all associated usage logs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingKey(null)}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDeleteKey}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Key"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
