"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Check, Download, FileDown, X } from "lucide-react"
import { TeamBadge } from "./team-logos"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"

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

type ExportFilter = {
  agent: string
  type: string
  team: string
  selectedRows: number[]
}

type ExportLanguage = "en" | "zh"

// Translation maps for CSV headers
const headerTranslations: Record<ExportLanguage, Record<string, string>> = {
  en: {
    team: "Team",
    agent: "Agent",
    date: "Date",
    shopId: "ShopId",
    amount: "Amount",
    type: "Type",
    notes: "Notes",
  },
  zh: {
    team: "团队",
    agent: "代理",
    date: "日期",
    shopId: "商店ID",
    amount: "金额",
    type: "类型",
    notes: "备注",
  },
}

// Translation maps for transaction types
const typeTranslations: Record<ExportLanguage, Record<string, string>> = {
  en: {
    Deposit: "Deposit",
    Withdrawal: "Withdrawal",
  },
  zh: {
    Deposit: "存款",
    Withdrawal: "提款",
  },
}

// Translation maps for team names
const teamTranslations: Record<ExportLanguage, Record<string, string>> = {
  en: {
    Hotel: "Hotel",
    Hustle: "Hustle",
  },
  zh: {
    Hotel: "酒店",
    Hustle: "奋斗",
  },
}

export function CSVExport({
  transactions = [],
  onCancel,
}: {
  transactions: Transaction[]
  onCancel: () => void
}) {
  const { t, i18n } = useTranslation()
  const [filters, setFilters] = useState<ExportFilter>({
    agent: "all",
    type: "all",
    team: "all",
    selectedRows: [],
  })
  const [exportLanguage, setExportLanguage] = useState<ExportLanguage>((i18n.language as ExportLanguage) || "en")

  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  const [isPreview, setIsPreview] = useState(false)
  const [selectAll, setSelectAll] = useState(false)

  // Add escape key handler
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel()
      }
    }

    // Add event listener
    document.addEventListener("keydown", handleEscapeKey)

    // Clean up
    return () => {
      document.removeEventListener("keydown", handleEscapeKey)
    }
  }, [onCancel])

  // Get unique agents
  const agents = Array.from(new Set(transactions.map((t) => t?.agent || "").filter(Boolean))).sort()

  // Apply filters to transactions
  useEffect(() => {
    let filtered = [...transactions]

    if (filters.agent !== "all") {
      filtered = filtered.filter((t) => t?.agent === filters.agent)
    }

    if (filters.type !== "all") {
      filtered = filtered.filter((t) => t?.type === filters.type)
    }

    if (filters.team !== "all") {
      filtered = filtered.filter((t) => t?.team === filters.team)
    }

    setFilteredTransactions(filtered)

    // Reset selected rows when filters change
    setFilters((prev) => ({
      ...prev,
      selectedRows: [],
    }))
    setSelectAll(false)
  }, [filters.agent, filters.type, filters.team, transactions])

  // Toggle select all rows
  const handleSelectAll = () => {
    if (selectAll) {
      setFilters((prev) => ({
        ...prev,
        selectedRows: [],
      }))
    } else {
      setFilters((prev) => ({
        ...prev,
        selectedRows: filteredTransactions
          .filter(Boolean)
          .map((t) => t?.id || 0)
          .filter((id) => id !== 0),
      }))
    }
    setSelectAll(!selectAll)
  }

  // Toggle row selection
  const toggleRowSelection = (id: number) => {
    setFilters((prev) => {
      if (prev.selectedRows.includes(id)) {
        return {
          ...prev,
          selectedRows: prev.selectedRows.filter((rowId) => rowId !== id),
        }
      } else {
        return {
          ...prev,
          selectedRows: [...prev.selectedRows, id],
        }
      }
    })
  }

  // Get transactions to export (either filtered or selected)
  const getTransactionsToExport = () => {
    if (filters.selectedRows.length > 0) {
      return filteredTransactions.filter((t) => filters.selectedRows.includes(t.id))
    }
    return filteredTransactions
  }

  // Generate and download CSV
  const handleExport = () => {
    const transactionsToExport = getTransactionsToExport()

    // Use the selected export language for headers
    const headers = [
      headerTranslations[exportLanguage].team,
      headerTranslations[exportLanguage].agent,
      headerTranslations[exportLanguage].date,
      headerTranslations[exportLanguage].shopId,
      headerTranslations[exportLanguage].amount,
      headerTranslations[exportLanguage].type,
      headerTranslations[exportLanguage].notes,
    ]

    // Create CSV content with proper translations
    const rows = transactionsToExport.map((t) => {
      // Translate transaction type and team if needed
      const translatedType = typeTranslations[exportLanguage][t.type] || t.type
      const translatedTeam = teamTranslations[exportLanguage][t.team] || t.team

      // Format each field with quotes to handle special characters
      return [
        `"${translatedTeam}"`,
        `"${t.agent}"`,
        `"${t.date}"`,
        `"${t.shopId}"`,
        t.amount,
        `"${translatedType}"`,
        `"${t.notes || ""}"`,
      ].join(",")
    })

    // Add BOM (Byte Order Mark) for UTF-8 encoding to ensure Chinese characters display correctly
    const BOM = "\uFEFF"
    const csvContent = BOM + [headers.map((h) => `"${h}"`).join(","), ...rows].join("\n")

    // Create download link with UTF-8 encoding
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)

    // Add language indicator to filename
    const langSuffix = exportLanguage === "en" ? "en" : "zh"
    link.setAttribute("download", `transactions_export_${langSuffix}_${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center">
            <FileDown className="mr-2 h-5 w-5" />
            {isPreview
              ? t("export.previewExport", "Preview Export Data")
              : t("export.exportTransactions", "Export Transactions to CSV")}
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-grow overflow-auto">
          {!isPreview ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label className="mb-2 block">{t("export.filterByTeam", "Filter by Team")}</Label>
                  <Select
                    value={filters.team}
                    onValueChange={(value) => setFilters((prev) => ({ ...prev, team: value }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t("export.allTeams", "All Teams")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("export.allTeams", "All Teams")}</SelectItem>
                      <SelectItem value="Hotel">{t("common.hotel", "Hotel")}</SelectItem>
                      <SelectItem value="Hustle">{t("common.hustle", "Hustle")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="mb-2 block">{t("export.filterByAgent", "Filter by Agent")}</Label>
                  <Select
                    value={filters.agent}
                    onValueChange={(value) => setFilters((prev) => ({ ...prev, agent: value }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t("export.allAgents", "All Agents")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("export.allAgents", "All Agents")}</SelectItem>
                      {agents.map((agent) => (
                        <SelectItem key={agent} value={agent}>
                          {t(`agents.${agent}`, agent)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="mb-2 block">{t("export.filterByType", "Filter by Type")}</Label>
                  <Select
                    value={filters.type}
                    onValueChange={(value) => setFilters((prev) => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t("export.allTypes", "All Types")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("export.allTypes", "All Types")}</SelectItem>
                      <SelectItem value="Deposit">{t("common.deposit", "Deposit")}</SelectItem>
                      <SelectItem value="Withdrawal">{t("common.withdrawal", "Withdrawal")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Export Language Selector */}
              <div className="border-t pt-4">
                <Label className="mb-2 block">{t("export.exportLanguage", "Export Language")}</Label>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Select value={exportLanguage} onValueChange={(value) => setExportLanguage(value as ExportLanguage)}>
                    <SelectTrigger className="w-full sm:w-[250px]">
                      <SelectValue placeholder={t("export.selectExportLanguage", "Select export language")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">{t("export.exportInEnglish", "Export in English")}</SelectItem>
                      <SelectItem value="zh">{t("export.exportInChinese", "Export in Chinese")}</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="text-sm text-muted-foreground flex items-center">
                    <span className="mr-2">{t("export.currentUiLanguage", "Current UI language")}:</span>
                    <span className="bg-muted px-2 py-1 rounded-md text-xs">
                      {i18n.language === "zh" ? "中文" : "English"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border rounded-md overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-2 text-left">
                        <div className="flex items-center">
                          <Checkbox id="select-all" checked={selectAll} onCheckedChange={handleSelectAll} />
                          <Label htmlFor="select-all" className="ml-2 text-xs font-medium uppercase">
                            {t("export.select", "Select")}
                          </Label>
                        </div>
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase">{t("export.team", "Team")}</th>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase">
                        {t("export.agent", "Agent")}
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase">{t("export.date", "Date")}</th>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase">
                        {t("export.amount", "Amount")}
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase">{t("export.type", "Type")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredTransactions.length > 0 ? (
                      filteredTransactions.map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-muted/50">
                          <td className="px-4 py-2">
                            <Checkbox
                              id={`select-${transaction.id}`}
                              checked={filters.selectedRows.includes(transaction.id)}
                              onCheckedChange={() => toggleRowSelection(transaction.id)}
                            />
                          </td>
                          <td className="px-4 py-2">
                            <TeamBadge team={transaction.team} />
                          </td>
                          <td className="px-4 py-2">{transaction.agent}</td>
                          <td className="px-4 py-2">{transaction.date}</td>
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
                              {t(`common.${transaction.type.toLowerCase()}`, transaction.type)}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                          {t("export.noTransactionsMatch", "No transactions match the selected filters")}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="text-sm text-muted-foreground">
                {filters.selectedRows.length > 0 ? (
                  <p>
                    {t(
                      "export.rowsSelected",
                      { count: filters.selectedRows.length },
                      "{count} rows selected for export",
                    )}
                  </p>
                ) : (
                  <p>
                    {t(
                      "export.rowsWillBeExported",
                      { count: filteredTransactions.length },
                      "{count} rows will be exported",
                    )}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-muted/30 rounded-md">
                <h3 className="font-medium mb-2">{t("export.exportSummary", "Export Summary")}</h3>
                <p className="text-sm text-muted-foreground mb-1">
                  {t(
                    "export.transactionsWillBeExported",
                    { count: getTransactionsToExport().length },
                    "{count} transactions will be exported",
                  )}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {filters.team !== "all" && (
                    <div className="bg-muted px-2 py-1 rounded-md text-xs">
                      {t("export.team", "Team")}: {t(`common.${filters.team.toLowerCase()}`, filters.team)}
                    </div>
                  )}
                  {filters.agent !== "all" && (
                    <div className="bg-muted px-2 py-1 rounded-md text-xs">
                      {t("export.agent", "Agent")}: {t(`agents.${filters.agent}`, filters.agent)}
                    </div>
                  )}
                  {filters.type !== "all" && (
                    <div className="bg-muted px-2 py-1 rounded-md text-xs">
                      {t("export.type", "Type")}: {t(`common.${filters.type.toLowerCase()}`, filters.type)}
                    </div>
                  )}
                  {filters.selectedRows.length > 0 && (
                    <div className="bg-muted px-2 py-1 rounded-md text-xs">
                      {t(
                        "export.rowsManuallySelected",
                        { count: filters.selectedRows.length },
                        "{count} rows manually selected",
                      )}
                    </div>
                  )}
                  <div className="bg-muted px-2 py-1 rounded-md text-xs">
                    {t("export.exportLanguage", "Export Language")}: {exportLanguage === "en" ? "English" : "中文"}
                  </div>
                </div>
              </div>

              <div className="border rounded-md overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      {/* Show headers in the selected export language */}
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase">
                        {headerTranslations[exportLanguage].team}
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase">
                        {headerTranslations[exportLanguage].agent}
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase">
                        {headerTranslations[exportLanguage].date}
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase">
                        {headerTranslations[exportLanguage].shopId}
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase">
                        {headerTranslations[exportLanguage].amount}
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase">
                        {headerTranslations[exportLanguage].type}
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase">
                        {headerTranslations[exportLanguage].notes}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {getTransactionsToExport()
                      .slice(0, 10)
                      .map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-muted/50">
                          <td className="px-4 py-2">
                            {exportLanguage === "zh" ? (
                              teamTranslations.zh[transaction.team]
                            ) : (
                              <TeamBadge team={transaction.team} />
                            )}
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
                              {/* Show transaction type in the selected export language */}
                              {typeTranslations[exportLanguage][transaction.type] || transaction.type}
                            </span>
                          </td>
                          <td className="px-4 py-2">{transaction.notes || "-"}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                {getTransactionsToExport().length > 10 && (
                  <div className="px-4 py-2 text-sm text-muted-foreground">
                    {t(
                      "export.andMoreTransactions",
                      { count: getTransactionsToExport().length - 10 },
                      "... and {count} more transactions",
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="border-t bg-muted/20 p-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:space-x-2">
          {isPreview ? (
            <>
              <Button variant="outline" onClick={() => setIsPreview(false)}>
                <X className="mr-2 h-4 w-4" />
                {t("export.back", "Back")}
              </Button>
              <Button onClick={handleExport} className="bg-green-600 hover:bg-green-700">
                <Download className="mr-2 h-4 w-4" />
                {t("export.downloadCSV", "Download CSV")}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onCancel}>
                {t("export.cancel", "Cancel")}
              </Button>
              <Button
                onClick={() => setIsPreview(true)}
                disabled={filteredTransactions.length === 0}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Check className="mr-2 h-4 w-4" />
                {t("export.preview", "Preview Export")}
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
