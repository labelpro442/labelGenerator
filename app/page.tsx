import { KeyValidationForm } from "@/components/key-validation-form"
import { LabelGeneratorForm } from "@/components/label-generator-form"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export const dynamic = "force-dynamic"

interface PageProps {
  searchParams: { key?: string }
}

export default async function Home({ searchParams }: PageProps) {
  const keyCode = searchParams.key

  let isKeyValid = false
  let keyInfo = null

  if (keyCode) {
    try {
      // Check if key exists and is still active
      const key = await sql`
        SELECT id, key_code, max_uses, current_uses, is_active
        FROM access_keys 
        WHERE key_code = ${keyCode}
      `

      if (key.length > 0) {
        const keyData = key[0]
        keyInfo = keyData

        // Check if key is active and hasn't reached max uses
        if (keyData.is_active && keyData.current_uses < keyData.max_uses) {
          isKeyValid = true
        }
      }
    } catch (error) {
      console.error("Error checking key validity:", error)
      isKeyValid = false
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-400/20 to-orange-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-cyan-400/10 to-blue-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 container mx-auto py-8 px-4">
        <header className="mb-12 text-center animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-6 shadow-lg animate-bounce">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4 animate-slide-up">
            Label Generator Pro
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 animate-slide-up delay-200">
            Generate professional shipping labels with ease and style
          </p>
        </header>

        <div className="animate-fade-in delay-500">
          {isKeyValid ? (
            <div>
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full shadow-lg animate-slide-up">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-semibold">Access Granted! Ready to generate labels</span>
                </div>
              </div>
              {/* ▼▼▼ MODIFIED LINE ▼▼▼ */}
              <LabelGeneratorForm keyCode={keyCode!} keyDetails={keyInfo!} />
              {/* ▲▲▲ END OF MODIFICATION ▲▲▲ */}
            </div>
          ) : (
            <div>
              {keyCode && (
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full shadow-lg animate-shake">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="font-semibold">Invalid or expired access key</span>
                  </div>
                </div>
              )}
              <KeyValidationForm />
            </div>
          )}
        </div>
      </div>
    </main>
  )
}