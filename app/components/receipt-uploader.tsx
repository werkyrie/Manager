"use client"

import type React from "react"

import { useRef, useState, useEffect } from "react"
import { Upload, X, ImageIcon, FileText, Clipboard } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"

interface ReceiptUploaderProps {
  value: string | null
  onChange: (value: string | null) => void
  className?: string
}

export function ReceiptUploader({ value, onChange, className }: ReceiptUploaderProps) {
  const { t } = useTranslation()
  const [isDragging, setIsDragging] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Set preview when value changes
  useEffect(() => {
    setPreview(value)
  }, [value])

  // Process file function
  const processFile = (file: File) => {
    // Only accept images
    if (!file.type.startsWith("image/")) {
      alert(t("receipt.onlyImagesAllowed"))
      return
    }

    // Size limit check (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert(t("receipt.fileTooLarge"))
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      onChange(result)
      setPreview(result)
    }
    reader.readAsDataURL(file)
  }

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  // Handle click on upload area
  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  // Handle drag events
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      processFile(file)
    }
  }

  // Handle paste from clipboard
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const clipboardItems = e.clipboardData?.items
      if (!clipboardItems) return

      for (let i = 0; i < clipboardItems.length; i++) {
        if (clipboardItems[i].type.startsWith("image/")) {
          const file = clipboardItems[i].getAsFile()
          if (file) {
            processFile(file)
          }
          break
        }
      }
    }

    window.addEventListener("paste", handlePaste)
    return () => {
      window.removeEventListener("paste", handlePaste)
    }
  }, [])

  // Clear image
  const handleClear = () => {
    onChange(null)
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
        aria-label={t("receipt.uploadReceipt")}
      />

      {preview ? (
        <div className="relative border rounded-md overflow-hidden">
          <div className="aspect-[4/3] relative bg-muted overflow-hidden">
            <img
              src={preview || "/placeholder.svg"}
              alt={t("receipt.receipt")}
              className="w-full h-full object-contain"
            />
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="absolute top-2 right-2 bg-background/80 p-1 rounded-full shadow hover:bg-background"
            aria-label={t("receipt.removeReceipt")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          onClick={handleUploadClick}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={cn(
            "border-2 border-dashed rounded-md p-6 flex flex-col items-center gap-2 cursor-pointer transition-colors",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
          )}
        >
          <Upload className="h-10 w-10 text-muted-foreground" />
          <div className="text-center">
            <p className="text-sm font-medium">{t("receipt.dropFileHere")}</p>
            <p className="text-xs text-muted-foreground mt-1">{t("receipt.orClickToBrowse")}</p>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground px-2 py-1 bg-muted rounded-md">
              <ImageIcon className="h-3 w-3" />
              {t("receipt.dragDrop")}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground px-2 py-1 bg-muted rounded-md">
              <FileText className="h-3 w-3" />
              {t("receipt.clickUpload")}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground px-2 py-1 bg-muted rounded-md">
              <Clipboard className="h-3 w-3" />
              {t("receipt.pasteFromClipboard")}
            </div>
          </div>
        </div>
      )}

      {!preview && (
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={handleUploadClick}>
            <ImageIcon className="h-4 w-4 mr-2" />
            {t("receipt.browseFiles")}
          </Button>
        </div>
      )}
    </div>
  )
}
