"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, FileUp, Check, X } from "lucide-react"
import { TeamBadge } from "./team-logos"
import { cn } from "@/lib/utils"

// Types
type Transaction = {
  id: number
  team: "Hotel" | "Hustle"
  agent: string
  date: string
  shopId: string
  amount: number
  type: "Deposit" | "Withdrawal"
  notes?: string
}

type CSVRow = {
  Team: string
  Agent: string
  Date: string
  ShopId?: string
  Amount: string
  Type: string
  Notes?: string
}

type ImportError = {
  row: number
  message: string
}

export function CSVImport({
  onImport,
  onCancel,
  nextId,
}: {
  onImport: (transactions: Omit<Transaction, "id">[]) => void
  onCancel: () => void
  nextId: number
}) {
  const [csvData, setCsvData] = useState<CSVRow[]>([])
  const [parsedData, setParsedData] = useState<Omit<Transaction, "id">[]>([])
  const [errors, setErrors] = useState<ImportError[]>([])
  const [isPreview, setIsPreview] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Parse CSV file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      parseCSV(text)
    }
    reader.readAsText(file)
  }

  // Parse CSV text into rows and columns
  const parseCSV = (text: string) => {
    const lines = text.split("\n")
    const headers = lines[0].split(",").map((header) => header.trim())

    // Validate required headers
    const requiredHeaders = ["Team", "Agent", "Date", "Amount", "Type"]
    const missingHeaders = requiredHeaders.filter((header) => !headers.includes(header))

    if (missingHeaders.length > 0) {
      setErrors([
        {
          row: 0,
          message: `Missing required columns: ${missingHeaders.join(", ")}`,
        },
      ])
      return
    }

    const rows: CSVRow[] = []
    const newErrors: ImportError[] = []

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue // Skip empty lines

      const values = lines[i].split(",").map((value) => value.trim())

      // Skip if row doesn't have enough values
      if (values.length < requiredHeaders.length) {
        newErrors.push({
          row: i,
          message: "Row has insufficient data",
        })
        continue
      }

      const row: Record<string, string> = {}
      headers.forEach((header, index) => {
        row[header] = values[index] || ""
      })

      rows.push(row as CSVRow)
    }

    setCsvData(rows)
    validateAndTransformData(rows, newErrors)
  }

  // Validate and transform CSV data into Transaction objects
  const validateAndTransformData = (rows: CSVRow[], existingErrors: ImportError[]) => {
    const newErrors = [...existingErrors]
    const transformedData: Omit<Transaction, "id">[] = []

    rows.forEach((row, index) => {
      // Validate team
      if (row.Team !== "Hotel" && row.Team !== "Hustle") {
        newErrors.push({
          row: index + 1,
          message: `Invalid team: ${row.Team}. Must be "Hotel" or "Hustle"`,
        })
        return
      }

      // Validate type
      if (row.Type !== "Deposit" && row.Type !== "Withdrawal") {
        newErrors.push({
          row: index + 1,
          message: `Invalid type: ${row.Type}. Must be "Deposit" or "Withdrawal"`,
        })
        return
      }

      // Parse and validate date
      let parsedDate: Date | null = null
      try {
        // Try different date formats
        if (/^\d{4}-\d{2}-\d{2}$/.test(row.Date)) {
          // YYYY-MM-DD
          parsedDate = new Date(row.Date)
        } else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(row.Date)) {
          // MM/DD/YYYY
          const [month, day, year] = row.Date.split("/")
          parsedDate = new Date(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`)
        } else if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(row.Date)) {
          // MM-DD-YYYY
          const [month, day, year] = row.Date.split("-")
          parsedDate = new Date(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`)
        } else {
          // Try as-is
          parsedDate = new Date(row.Date)
        }

        // Check if date is valid
        if (isNaN(parsedDate.getTime())) {
          throw new Error("Invalid date")
        }
      } catch (error) {
        newErrors.push({
          row: index + 1,
          message: `Invalid date format: ${row.Date}`,
        })
        return
      }

      // Parse and validate amount
      const amount = Number.parseFloat(row.Amount.replace(/[^0-9.-]+/g, ""))
      if (isNaN(amount)) {
        newErrors.push({
          row: index + 1,
          message: `Invalid amount: ${row.Amount}`,
        })
        return
      }

      // Create transaction object
      transformedData.push({
        team: row.Team as "Hotel" | "Hustle",
        agent: row.Agent,
        date: parsedDate.toISOString().split("T")[0],
        shopId: row.ShopId || "",
        amount,
        type: row.Type as "Deposit" | "Withdrawal",
        notes: row.Notes,
      })
    })

    setErrors(newErrors)
    setParsedData(transformedData)
    setIsPreview(newErrors.length === 0 && transformedData.length > 0)
  }

  // Handle import confirmation
  const handleImport = () => {
    onImport(parsedData)
  }

  // Reset the form
  const handleReset = () => {
    setCsvData([])
    setParsedData([])
    setErrors([])
    setIsPreview(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center">
            <FileUp className="mr-2 h-5 w-5" />
            {isPreview ? "Preview Import Data" : "Import Transactions from CSV"}
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-grow overflow-auto">
          {!isPreview ? (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                <Label htmlFor="csv-file" className="text-lg font-medium block mb-2">
                  Upload CSV File
                </Label>
                <p className="text-muted-foreground mb-4">
                  The CSV must include: Team, Agent, Date, Amount, Type columns
                </p>
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  ref={fileInputRef}
                  className="max-w-sm mx-auto"
                />
              </div>

              {errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Import Errors</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      {errors.map((error, index) => (
                        <li key={index}>
                          Row {error.row}: {error.message}
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {csvData.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-lg font-medium mb-2">CSV Data Preview</h3>
                  <div className="border rounded-md overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          {Object.keys(csvData[0]).map((header) => (
                            <th key={header} className="px-4 py-2 text-left text-xs font-medium uppercase">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {csvData.slice(0, 5).map((row, rowIndex) => (
                          <tr key={rowIndex} className="hover:bg-muted/50">
                            {Object.values(row).map((value, cellIndex) => (
                              <td key={cellIndex} className="px-4 py-2 text-sm">
                                {value}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {csvData.length > 5 && (
                      <div className="px-4 py-2 text-sm text-muted-foreground">
                        ... and {csvData.length - 5} more rows
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <Alert>
                <Check className="h-4 w-4" />
                <AlertTitle>Ready to Import</AlertTitle>
                <AlertDescription>
                  {parsedData.length} transactions will be imported. Please review the data below.
                </AlertDescription>
              </Alert>

              <div className="border rounded-md overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase">Team</th>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase">Agent</th>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase">Date</th>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase">Shop ID</th>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase">Amount</th>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase">Type</th>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {parsedData.slice(0, 10).map((transaction, index) => (
                      <tr key={index} className="hover:bg-muted/50">
                        <td className="px-4 py-2">
                          <TeamBadge team={transaction.team} />
                        </td>
                        <td className="px-4 py-2">{transaction.agent}</td>
                        <td className="px-4 py-2">{transaction.date}</td>
                        <td className="px-4 py-2">{transaction.shopId}</td>
                        <td className="px-4 py-2">${transaction.amount.toLocaleString()}</td>
                        <td className="px-4 py-2">
                          <span
                            className={cn(
                              "inline-flex rounded-full px-2 py-0.5 text-xs font-semibold",
                              transaction.type === "Deposit"
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
                            )}
                          >
                            {transaction.type}
                          </span>
                        </td>
                        <td className="px-4 py-2">{transaction.notes || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedData.length > 10 && (
                  <div className="px-4 py-2 text-sm text-muted-foreground">
                    ... and {parsedData.length - 10} more transactions
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="border-t bg-muted/20 p-4 flex justify-end space-x-2">
          {isPreview ? (
            <>
              <Button variant="outline" onClick={handleReset}>
                <X className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={handleImport} className="bg-green-600 hover:bg-green-700">
                <Check className="mr-2 h-4 w-4" />
                Confirm Import
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button
                onClick={() => setIsPreview(true)}
                disabled={parsedData.length === 0 || errors.length > 0}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Preview Import
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
