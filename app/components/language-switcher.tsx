"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function LanguageSwitcher({ className }: { className?: string }) {
  const { i18n } = useTranslation()
  const [mounted, setMounted] = useState(false)

  // Ensure component is mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "zh" : "en"
    i18n.changeLanguage(newLang)
  }

  if (!mounted) return null

  return (
    <Button variant="outline" size="sm" onClick={toggleLanguage} className={cn("font-medium", className)}>
      EN / 中文
    </Button>
  )
}
