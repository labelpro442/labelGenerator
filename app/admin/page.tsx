import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { neon } from "@neondatabase/serverless"
import { formatDistanceToNow } from "date-fns"
import { Key, Activity, Users, TrendingUp, Plus, ArrowRight } from "lucide-react"
import Link from "next/link"

const sql = neon(process.env.DATABASE_URL!)

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function AdminPage() {
  try {
    // Check if tables exist
    const tablesExist = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'access_keys'
      )
    `

    if (!tablesExist[0].exists) {
      return (
        <div className="space-y-8 animate-fade-in">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Dashboard Overview
            </h1>
          </div>

          <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <div className="text-yellow-500 mb-4">
                <Activity className="w-12 h-12 mx-auto" />
              </div>
              <h2 className="text-xl font-semibold text-yellow-600 mb-2">Database Not Initialized</h2>
              <p className="text-slate-600 mb-6">The database tables have not been created yet.</p>
              <Link href="/admin/keys" passHref>
                <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Go to Key Management to Initialize
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      )
    }

    // Fetch all keys
    const keys = await sql`
      SELECT 
        id, 
        key_code, 
        created_at, 
        is_active, 
        max_uses, 
        current_uses, 
        description 
      FROM access_keys 
      ORDER BY created_at DESC
      LIMIT 5
    `

    // Fetch recent usage logs
    const logs = await sql`
      SELECT 
        kl.id, 
        kl.used_at, 
        kl.ip_address, 
        ak.key_code
      FROM key_usage_logs kl
      JOIN access_keys ak ON kl.key_id = ak.id
      ORDER BY kl.used_at DESC
      LIMIT 5
    `

    // Calculate stats
    const totalKeys = await sql`SELECT COUNT(*) FROM access_keys`
    const activeKeys = await sql`SELECT COUNT(*) FROM access_keys WHERE is_active = true`
    const totalUsage = await sql`SELECT SUM(current_uses) FROM access_keys`
    const recentActivity = await sql`SELECT COUNT(*) FROM key_usage_logs WHERE used_at > NOW() - INTERVAL '24 hours'`

    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Dashboard Overview
          </h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg animate-slide-up">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Total Keys</p>
                  <p className="text-3xl font-bold text-blue-800">{totalKeys[0].count}</p>
                </div>
                <Key className="w-8 h-8 text-blue-600" />
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
                  <p className="text-green-600 text-sm font-medium">Active Keys</p>
                  <p className="text-3xl font-bold text-green-800">{activeKeys[0].count}</p>
                </div>
                <Users className="w-8 h-8 text-green-600" />
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
                  <p className="text-purple-600 text-sm font-medium">Total Usage</p>
                  <p className="text-3xl font-bold text-purple-800">{totalUsage[0].sum || 0}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card
            className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-lg animate-slide-up"
            style={{ animationDelay: "300ms" }}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 text-sm font-medium">Recent Activity</p>
                  <p className="text-3xl font-bold text-orange-800">{recentActivity[0].count}</p>
                </div>
                <Activity className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <Card
            className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm animate-slide-up"
            style={{ animationDelay: "400ms" }}
          >
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
                  <Key className="w-5 h-5 text-blue-600" />
                  Recent Access Keys
                </CardTitle>
                <CardDescription>Latest keys created in the system</CardDescription>
              </div>
              <Link href="/admin/keys" passHref>
                <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Manage Keys
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">Key Code</TableHead>
                    <TableHead className="font-semibold">Description</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Usage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {keys.length > 0 ? (
                    keys.map((key, index) => (
                      <TableRow
                        key={key.id}
                        className="hover:bg-slate-50 transition-colors duration-200 animate-slide-up"
                        style={{ animationDelay: `${500 + index * 50}ms` }}
                      >
                        <TableCell className="font-mono text-sm bg-slate-100 rounded px-2 py-1">
                          {key.key_code}
                        </TableCell>
                        <TableCell className="text-slate-700 max-w-[150px] truncate">{key.description}</TableCell>
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
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {key.current_uses} / {key.max_uses}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4 text-slate-500">
                        No keys found. Create your first key.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="bg-slate-50 border-t border-slate-200 p-4">
              <Link href="/admin/keys" className="w-full" passHref>
                <Button variant="outline" className="w-full">
                  View All Keys
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardFooter>
          </Card>

          <Card
            className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm animate-slide-up"
            style={{ animationDelay: "600ms" }}
          >
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
              <CardTitle className="text-xl bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-600" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest key usage and label generation activity</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">Key</TableHead>
                    <TableHead className="font-semibold">Used At</TableHead>
                    <TableHead className="font-semibold">IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.length > 0 ? (
                    logs.map((log, index) => (
                      <TableRow
                        key={log.id}
                        className="hover:bg-slate-50 transition-colors duration-200 animate-slide-up"
                        style={{ animationDelay: `${700 + index * 50}ms` }}
                      >
                        <TableCell className="font-mono text-sm bg-slate-100 rounded px-2 py-1">
                          {log.key_code}
                        </TableCell>
                        <TableCell className="text-slate-600">
                          {formatDistanceToNow(new Date(log.used_at), { addSuffix: true })}
                        </TableCell>
                        <TableCell className="text-slate-600">{log.ip_address || "N/A"}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-4 text-slate-500">
                        No recent activity found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="bg-slate-50 border-t border-slate-200 p-4">
              <Link href="/admin/activity" className="w-full" passHref>
                <Button variant="outline" className="w-full">
                  View All Activity
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  } catch (error) {
    console.error("Admin page error:", error)
    return (
      <div className="container mx-auto py-10">
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6 text-center">
            <div className="text-red-500 mb-4">
              <Activity className="w-12 h-12 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold text-red-600 mb-2">Database Connection Error</h2>
            <p className="text-slate-600">Unable to load admin data. Please check the database connection.</p>
          </CardContent>
        </Card>
      </div>
    )
  }
}
