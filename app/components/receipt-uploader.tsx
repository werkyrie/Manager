"use client"

import type React from "react"

import { useRef, useState, useEffect } from "react"
import { Upload, X, ImageIcon, FileText, Clipboard, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ReceiptUploaderProps {
  value: string | null
  onChange: (value: string | null) => void
  className?: string
}

export function ReceiptUploader({ value, onChange, className }: ReceiptUploaderProps) {
  const { t } = useTranslation()
  const [isDragging, setIsDragging] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Set preview when value changes
  useEffect(() => {
    setPreview(value)
  }, [value])

  // Improved file validation and processing
  const validateFile = (file: File): boolean => {
    // Check file type
    if (!file.type.startsWith("image/")) {
      setError(t("receipt.onlyImagesAllowed"))
      return false
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError(`${t("receipt.fileTooLarge")} (${(file.size / (1024 * 1024)).toFixed(2)}MB > 5MB)`)
      return false
    }

    return true
  }

  // Update the processFile function to be more reliable
  const processFile = (file: File) => {
    // Reset error state
    setError(null)
    setIsLoading(true)

    // Validate file
    if (!validateFile(file)) {
      setIsLoading(false)
      return
    }

    // Use FileReader to convert to data URL
    const reader = new FileReader()

    reader.onload = () => {
      try {
        // Get the result as a data URL
        const dataUrl = reader.result as string

        // Set the preview immediately for better UX
        setPreview(dataUrl)

        // Then update the parent component
        onChange(dataUrl)
        setIsLoading(false)
      } catch (err) {
        console.error("Error processing image:", err)
        setError(t("receipt.imageProcessingError"))
        setIsLoading(false)
      }
    }

    reader.onerror = () => {
      console.error("FileReader error:", reader.error)
      setError(t("receipt.fileReadError"))
      setIsLoading(false)
    }

    reader.readAsDataURL(file)
  }

  // Add this helper function for image compression
  const compressImage = (dataUrl: string, fileType: string, quality = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        const img = new Image()
        img.onload = () => {
          // Calculate new dimensions (max 1200px width/height)
          const MAX_SIZE = 1200
          let width = img.width
          let height = img.height

          if (width > MAX_SIZE || height > MAX_SIZE) {
            if (width > height) {
              height = Math.round((height * MAX_SIZE) / width)
              width = MAX_SIZE
            } else {
              width = Math.round((width * MAX_SIZE) / height)
              height = MAX_SIZE
            }
          }

          // Create canvas and resize
          const canvas = document.createElement("canvas")
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext("2d")
          if (!ctx) {
            reject(new Error("Could not get canvas context"))
            return
          }

          ctx.drawImage(img, 0, 0, width, height)

          // Get compressed data URL
          const compressedDataUrl = canvas.toDataURL(fileType, quality)

          // Check if compression actually helped
          if (compressedDataUrl.length < dataUrl.length) {
            resolve(compressedDataUrl)
          } else {
            // If compression didn't reduce size, use original
            resolve(dataUrl)
          }
        }

        img.onerror = () => reject(new Error("Failed to load image for compression"))
        img.src = dataUrl
      } catch (error) {
        reject(error)
      }
    })
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
        accept="image/jpeg,image/png,image/gif"
        aria-label={t("receipt.uploadReceipt")}
      />

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="border rounded-md overflow-hidden p-8 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-sm text-muted-foreground">{t("receipt.processing")}</p>
        </div>
      ) : preview ? (
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
        <div className="flex flex-col gap-2">
          <Button type="button" variant="outline" size="sm" onClick={handleUploadClick}>
            <ImageIcon className="h-4 w-4 mr-2" />
            {t("receipt.browseFiles")}
          </Button>
          <p className="text-xs text-muted-foreground">
            {t("receipt.fileSizeLimit")} (5MB). {t("receipt.supportedFormats")}: JPG, PNG, GIF
          </p>
        </div>
      )}
    </div>
  )
}
