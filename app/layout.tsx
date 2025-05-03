import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { I18nProvider } from "./i18n-provider"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "./context/auth-context"

// Import Firebase to ensure it's initialized
import "./lib/firebase"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Team Transactions Dashboard",
  description: "Track deposits and withdrawals across teams and agents",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <I18nProvider>
            <AuthProvider>{children}</AuthProvider>
          </I18nProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
