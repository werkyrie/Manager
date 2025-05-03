"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { I18nextProvider } from "react-i18next"
import i18n from "./i18n/i18n"

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <>{children}</>
  }

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}
