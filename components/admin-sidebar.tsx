"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Key, Settings, Package, LogOut, Barcode } from "lucide-react"

export function AdminSidebar() {
  const pathname = usePathname()

  const navItems = [
    {
      name: "Dashboard",
      href: "/admin",
      icon: LayoutDashboard,
    },
    {
      name: "Key Management",
      href: "/admin/keys",
      icon: Key,
    },
    {
      name: "Barcode Management",
      href: "/admin/barcodes",
      icon: Barcode,
    },
    {
      name: "Settings",
      href: "/admin/settings",
      icon: Settings,
    },
  ]

  return (
    <div className="w-64 h-screen bg-white border-r border-slate-200 flex flex-col">
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Package className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Label Generator
            </h1>
            <p className="text-xs text-slate-500">Admin Panel</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link key={item.href} href={item.href} passHref>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start text-slate-600 hover:text-slate-900 hover:bg-slate-100",
                  isActive && "bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800",
                )}
              >
                <item.icon className={cn("mr-3 h-5 w-5", isActive ? "text-blue-600" : "text-slate-500")} />
                {item.name}
              </Button>
            </Link>
          )
        })}
      </nav>

      {/* <div className="p-4 border-t border-slate-200">
        <Button
          variant="ghost"
          className="w-full justify-start text-slate-600 hover:text-red-600 hover:bg-red-50"
          onClick={async () => {
            try {
              await fetch("/api/logout", { method: "POST" })
              window.location.href = "/"
            } catch (error) {
              console.error("Logout error:", error)
              window.location.href = "/"
            }
          }}
        >
          <LogOut className="mr-3 h-5 w-5 text-slate-500" />
          Logout
        </Button>
      </div> */}
    </div>
  )
}
