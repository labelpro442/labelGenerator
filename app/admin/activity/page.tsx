"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Activity, Search, RefreshCw, Download, Filter, Calendar, Clock, MapPin } from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"

interface ActivityLog {
  id: number
  key_code: string
  used_at: string
  ip_address: string | null
  label_data: any
}

export default function ActivityPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredLogs, setFilteredLogs] = useState<ActivityLog[]>([])
  const { toast } = useToast()

  const fetchLogs = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/admin/activity")
      if (response.ok) {
        const data = await response.json()
        setLogs(data)
        setFilteredLogs(data)
      } else {
        throw new Error("Failed to fetch activity logs")
      }
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "Failed to load activity logs",
        variant: "destructive",
      })
      // Mock data for demo purposes
      const mockData = [
        {
          id: 1,
          key_code: "DEMO-2024-001",
          used_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          ip_address: "192.168.1.100",
          label_data: { toAddress: { fullName: "John Doe" } },
        },
        {
          id: 2,
          key_code: "TEST-KEY-001",
          used_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          ip_address: "10.0.0.50",
          label_data: { toAddress: { fullName: "Jane Smith" } },
        },
        {
          id: 3,
          key_code: "PREMIUM-2024-002",
          used_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          ip_address: "203.0.113.45",
          label_data: { toAddress: { fullName: "Bob Johnson" } },
        },
      ]
      setLogs(mockData)
      setFilteredLogs(mockData)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  useEffect(() => {
    const filtered = logs.filter(
      (log) =>
        log.key_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.ip_address && log.ip_address.includes(searchTerm)) ||
        (log.label_data?.toAddress?.fullName &&
          log.label_data.toAddress.fullName.toLowerCase().includes(searchTerm.toLowerCase())),
    )
    setFilteredLogs(filtered)
  }, [searchTerm, logs])

  const handleExport = () => {
    const csvContent = [
      ["Key Code", "Used At", "IP Address", "Recipient"],
      ...filteredLogs.map((log) => [
        log.key_code,
        format(new Date(log.used_at), "yyyy-MM-dd HH:mm:ss"),
        log.ip_address || "N/A",
        log.label_data?.toAddress?.fullName || "N/A",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `activity-logs-${format(new Date(), "yyyy-MM-dd")}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "📊 Export Complete",
      description: "Activity logs have been exported to CSV",
    })
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Activity Logs
          </h1>
          <p className="text-slate-600 mt-2">Monitor all key usage and label generation activity</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={fetchLogs}
            variant="outline"
            className="hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all duration-200"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button
            onClick={handleExport}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg animate-slide-up">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Total Activities</p>
                <p className="text-3xl font-bold text-blue-800">{logs.length}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-600" />
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
                <p className="text-green-600 text-sm font-medium">Today's Activity</p>
                <p className="text-3xl font-bold text-green-800">
                  {logs.filter((log) => new Date(log.used_at).toDateString() === new Date().toDateString()).length}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card
          className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-lg animate-slide-up"
          style={{ animationDelay: "200ms" }}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Unique IPs</p>
                <p className="text-3xl font-bold text-purple-800">
                  {new Set(logs.filter((log) => log.ip_address).map((log) => log.ip_address)).size}
                </p>
              </div>
              <MapPin className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by key code, IP address, or recipient name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10"
              />
            </div>
            <Button variant="outline" className="h-10">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Activity Table */}
      <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
          <CardTitle className="text-xl bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-600" />
            Activity History ({filteredLogs.length})
          </CardTitle>
          <CardDescription>Complete log of all key usage and label generation activities</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                <p className="text-slate-600">Loading activity logs...</p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-semibold">Key Code</TableHead>
                  <TableHead className="font-semibold">Used At</TableHead>
                  <TableHead className="font-semibold">Time Ago</TableHead>
                  <TableHead className="font-semibold">IP Address</TableHead>
                  <TableHead className="font-semibold">Recipient</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log, index) => (
                    <TableRow
                      key={log.id}
                      className="hover:bg-slate-50 transition-colors duration-200 animate-slide-up"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <TableCell>
                        <code className="bg-slate-100 px-2 py-1 rounded text-sm font-mono">{log.key_code}</code>
                      </TableCell>
                      <TableCell className="text-slate-700">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-slate-400" />
                          {format(new Date(log.used_at), "MMM dd, yyyy HH:mm")}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {formatDistanceToNow(new Date(log.used_at), { addSuffix: true })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-slate-400" />
                          <span className="font-mono text-sm">{log.ip_address || "N/A"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-700">{log.label_data?.toAddress?.fullName || "N/A"}</TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Success</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <Activity className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-slate-600 mb-2">No activity found</h3>
                      <p className="text-slate-500">
                        {searchTerm ? "No activities match your search criteria" : "No activity logs available"}
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
