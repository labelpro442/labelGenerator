import type React from "react"
import { AdminAuthWrapper } from "@/components/admin-auth-wrapper"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminAuthWrapper>{children}</AdminAuthWrapper>
}
