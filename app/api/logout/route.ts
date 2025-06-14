import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const cookieStore = await cookies()

    // Clear the access key cookie
    cookieStore.delete("access_key")

    return NextResponse.json({ success: true, message: "Logged out successfully" })
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ success: false, message: "Logout failed" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies()

    // Clear the access key cookie
    cookieStore.delete("access_key")

    // Redirect to home page
    return NextResponse.redirect(new URL("/", process.env.VERCEL_URL || "http://localhost:3000"))
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.redirect(new URL("/", process.env.VERCEL_URL || "http://localhost:3000"))
  }
}
