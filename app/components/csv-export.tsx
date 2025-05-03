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

export function CSVExport({
  transactions,
  onCancel,
}: {
  transactions: Transaction[]
  onCancel: () => void
}) {
  const [filters, setFilters] = useState<ExportFilter>({
    agent: "all",
    type: "all",
    team: "all",
    selectedRows: [],
  })

  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  const [isPreview, setIsPreview] = useState(false)
  const [selectAll, setSelectAll] = useState(false)

  // Get unique agents
  const agents = Array.from(new Set(transactions.map((t) => t.agent))).sort()

  // Apply filters to transactions
  useEffect(() => {
    let filtered = [...transactions]

    if (filters.agent !== "all") {
      filtered = filtered.filter((t) => t.agent === filters.agent)
    }

    if (filters.type !== "all") {
      filtered = filtered.filter((t) => t.type === filters.type)
    }

    if (filters.team !== "all") {
      filtered = filtered.filter((t) => t.team === filters.team)
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
        selectedRows: filteredTransactions.map((t) => t.id),
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

    // Create CSV header
    const headers = ["Team", "Agent", "Date", "ShopId", "Amount", "Type", "Notes"]
    const csvContent = [
      headers.join(","),
      ...transactionsToExport.map((t) =>
        [t.team, t.agent, t.date, t.shopId, t.amount, t.type, t.notes || ""].join(","),
      ),
    ].join("\n")

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `transactions_export_${new Date().toISOString().split("T")[0]}.csv`)
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
            {isPreview ? "Preview Export Data" : "Export Transactions to CSV"}
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-grow overflow-auto">
          {!isPreview ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="mb-2 block">Filter by Team</Label>
                  <Select
                    value={filters.team}
                    onValueChange={(value) => setFilters((prev) => ({ ...prev, team: value }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Teams" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Teams</SelectItem>
                      <SelectItem value="Hotel">Hotel</SelectItem>
                      <SelectItem value="Hustle">Hustle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="mb-2 block">Filter by Agent</Label>
                  <Select
                    value={filters.agent}
                    onValueChange={(value) => setFilters((prev) => ({ ...prev, agent: value }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Agents" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Agents</SelectItem>
                      {agents.map((agent) => (
                        <SelectItem key={agent} value={agent}>
                          {agent}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="mb-2 block">Filter by Type</Label>
                  <Select
                    value={filters.type}
                    onValueChange={(value) => setFilters((prev) => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="Deposit">Deposit</SelectItem>
                      <SelectItem value="Withdrawal">Withdrawal</SelectItem>
                    </SelectContent>
                  </Select>
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
                            Select
                          </Label>
                        </div>
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase">Team</th>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase">Agent</th>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase">Date</th>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase">Amount</th>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase">Type</th>
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
                              {transaction.type}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                          No transactions match the selected filters
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="text-sm text-muted-foreground">
                {filters.selectedRows.length > 0 ? (
                  <p>{filters.selectedRows.length} rows selected for export</p>
                ) : (
                  <p>{filteredTransactions.length} rows will be exported</p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-muted/30 rounded-md">
                <h3 className="font-medium mb-2">Export Summary</h3>
                <p className="text-sm text-muted-foreground mb-1">
                  {getTransactionsToExport().length} transactions will be exported
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {filters.team !== "all" && (
                    <div className="bg-muted px-2 py-1 rounded-md text-xs">Team: {filters.team}</div>
                  )}
                  {filters.agent !== "all" && (
                    <div className="bg-muted px-2 py-1 rounded-md text-xs">Agent: {filters.agent}</div>
                  )}
                  {filters.type !== "all" && (
                    <div className="bg-muted px-2 py-1 rounded-md text-xs">Type: {filters.type}</div>
                  )}
                  {filters.selectedRows.length > 0 && (
                    <div className="bg-muted px-2 py-1 rounded-md text-xs">
                      {filters.selectedRows.length} rows manually selected
                    </div>
                  )}
                </div>
              </div>

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
                    {getTransactionsToExport()
                      .slice(0, 10)
                      .map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-muted/50">
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
                {getTransactionsToExport().length > 10 && (
                  <div className="px-4 py-2 text-sm text-muted-foreground">
                    ... and {getTransactionsToExport().length - 10} more transactions
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="border-t bg-muted/20 p-4 flex justify-end space-x-2">
          {isPreview ? (
            <>
              <Button variant="outline" onClick={() => setIsPreview(false)}>
                <X className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={handleExport} className="bg-green-600 hover:bg-green-700">
                <Download className="mr-2 h-4 w-4" />
                Download CSV
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button
                onClick={() => setIsPreview(true)}
                disabled={filteredTransactions.length === 0}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Check className="mr-2 h-4 w-4" />
                Preview Export
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
