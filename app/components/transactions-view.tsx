"use client"

import React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  ArrowDown,
  ArrowUp,
  Plus,
  Search,
  StickyNote,
  Trash2,
  CalendarIcon,
  DollarSign,
  Users,
  ArrowRightLeft,
  Loader2,
  Check,
  X,
  Edit,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
} from "lucide-react"
import { TeamBadge } from "./team-logos"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { FloatingActionButton } from "@/components/ui/floating-action-button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"

// Import the useTranslation hook
import { useTranslation } from "react-i18next"

// Import the Firebase service functions
import { bulkDeleteTransactions, bulkUpdateTransactions } from "../lib/firebase-service"

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
  receipt?: string | null
  firebaseId?: string
}

type SortDirection = "asc" | "desc" | null
type SortField = "date" | "amount" | null

type BulkActionType = "delete" | "changeType" | "changeTeam" | "changeDate" | "changeAmount" | null

// Transactions View Component
export function TransactionsView({
  transactions,
  searchQuery,
  setSearchQuery,
  selectedTeam,
  setSelectedTeam,
  selectedType,
  setSelectedType,
  selectedAgent,
  setSelectedAgent,
  sortField,
  sortDirection,
  handleSort,
  getFilteredAndSortedTransactions,
  setEditingTransaction,
  setShowTransactionModal,
  deleteTransaction,
  formatTableDate,
  setTransactions,
  updateTransaction,
  agentOptions,\
  primaryButtonClass?: string,
}) {
  // Add the translation hook
  const { t, i18n } = useTranslation()
  const { toast } = useToast()

  // State for bulk actions
  const [selectedTransactions, setSelectedTransactions] = useState<number[]>([])
  const [selectAll, setSelectAll] = useState(false)
  const [currentBulkAction, setCurrentBulkAction] = useState<BulkActionType>(null)

  // State for bulk action dialogs
  const [bulkActionValue, setBulkActionValue] = useState<string>("")
  const [bulkActionDate, setBulkActionDate] = useState<string>(new Date().toISOString().split("T")[0])
  const [bulkActionAmount, setBulkActionAmount] = useState<number>(0)

  // Add isLoading state
  const [isLoading, setIsLoading] = useState(false)

  // Add state for inline editing
  const [editingInlineId, setEditingInlineId] = useState<number | null>(null)
  const [inlineFormData, setInlineFormData] = useState<Transaction | null>(null)
  const inlineFormRef = useRef<HTMLTableRowElement>(null)

  // Add pagination state at the top of the component, after the existing state declarations
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25) // Changed from 10 to 25

  // Add a function to handle page changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // Scroll to top of the table when changing pages
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // Add a function to handle page size changes
  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    // Reset to first page when changing page size
    setCurrentPage(1)
  }

  // Modify the getFilteredAndSortedTransactions function to return all filtered transactions without pagination
  // We'll apply pagination in the render method

  // Add a new function to get paginated transactions
  const getPaginatedTransactions = () => {
    const filtered = getFilteredAndSortedTransactions()
    const startIndex = (currentPage - 1) * pageSize
    return filtered.slice(startIndex, startIndex + pageSize)
  }

  // Calculate total pages
  const totalFilteredTransactions = getFilteredAndSortedTransactions().length
  const totalPages = Math.max(1, Math.ceil(totalFilteredTransactions / pageSize))

  // Get filtered transactions
  const filteredTransactions = getFilteredAndSortedTransactions()

  // Format date as "Month Day" (e.g., "May 5")
  const formatMonthDay = (dateString: string) => {
    const date = new Date(dateString)
    const currentLang = i18n.language

    if (currentLang === "zh") {
      // For Chinese, format as "5月5日"
      const month = date.getMonth() + 1
      const day = date.getDate()
      return `${month}月${day}日`
    } else {
      // For English, format as "May 5"
      return date.toLocaleDateString("en-US", { month: "long", day: "numeric" })
    }
  }

  // Handle select all checkbox
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedTransactions([])
    } else {
      setSelectedTransactions(filteredTransactions.map((t) => t.id))
    }
    setSelectAll(!selectAll)
  }

  // Handle individual row selection
  const handleSelectTransaction = (id: number) => {
    if (selectedTransactions.includes(id)) {
      setSelectedTransactions(selectedTransactions.filter((transactionId) => transactionId !== id))
      setSelectAll(false)
    } else {
      setSelectedTransactions([...selectedTransactions, id])
      if (selectedTransactions.length + 1 === filteredTransactions.length) {
        setSelectAll(true)
      }
    }
  }

  // Handle bulk delete
  const handleBulkDelete = async () => {
    // Confirm deletion
    if (window.confirm(t("bulkActions.confirmDelete", { count: selectedTransactions.length }))) {
      try {
        // Store the transactions to be deleted for potential rollback
        const transactionsToDelete = transactions.filter((t) => selectedTransactions.includes(t.id))

        // Optimistically update UI immediately
        if (typeof setTransactions === "function") {
          // If setTransactions is a function, use it to update state
          setTransactions((prev) => prev.filter((t) => !selectedTransactions.includes(t.id)))
        } else {
          // Fallback: directly modify the transactions array
          const indicesToRemove = selectedTransactions
            .map((id) => transactions.findIndex((t) => t.id === id))
            .filter((index) => index !== -1)

          // Remove items in reverse order to avoid index shifting issues
          indicesToRemove
            .sort((a, b) => b - a)
            .forEach((index) => {
              transactions.splice(index, 1)
            })
        }

        // Clear selection
        const deletedCount = selectedTransactions.length
        setSelectedTransactions([])
        setSelectAll(false)

        // Close the dialog by setting currentBulkAction to null
        setCurrentBulkAction(null)

        // Show immediate success toast
        toast({
          title: t("bulkActions.deleteSuccess"),
          description: t("bulkActions.deleteSuccessDesc", { count: deletedCount }),
        })

        // Perform the actual deletion in the background
        setIsLoading(true)

        try {
          // Delete transactions in Firebase
          await bulkDeleteTransactions(selectedTransactions)
          setIsLoading(false)
        } catch (deleteError) {
          console.error("Error bulk deleting transactions:", deleteError)

          // If the Firebase deletion fails, rollback the UI changes
          if (typeof setTransactions === "function") {
            setTransactions((prev) => [...prev, ...transactionsToDelete])
          } else {
            // Fallback: directly add back the deleted transactions
            transactions.push(...transactionsToDelete)
          }

          // Show error toast
          toast({
            title: t("common.error"),
            description: t("bulkActions.deleteError"),
            variant: "destructive",
          })
          setIsLoading(false)
        }
      } catch (error) {
        console.error("Error in bulk delete operation:", error)
        toast({
          title: t("common.error"),
          description: t("common.unexpectedError"),
          variant: "destructive",
        })
        setIsLoading(false)
        // Ensure dialog is closed on error
        setCurrentBulkAction(null)
      }
    } else {
      // User canceled the deletion, close the dialog
      setCurrentBulkAction(null)
    }
  }

  // Handle bulk action execution
  const executeBulkAction = async () => {
    try {
      setIsLoading(true)
      const updatedTransactions = [...transactions]
      let successMessage = ""
      let updates: Partial<Transaction> = {}

      switch (currentBulkAction) {
        case "changeType":
          updates = { type: bulkActionValue as "Deposit" | "Withdrawal" }
          successMessage = t("bulkActions.typeChangeSuccess")
          break

        case "changeTeam":
          updates = { team: bulkActionValue as "Hotel" | "Hustle" }
          successMessage = t("bulkActions.teamChangeSuccess")
          break

        case "changeDate":
          updates = { date: bulkActionDate }
          successMessage = t("bulkActions.dateChangeSuccess")
          break

        case "changeAmount":
          updates = { amount: bulkActionAmount }
          successMessage = t("bulkActions.amountChangeSuccess")
          break
      }

      // Update transactions in Firebase
      await bulkUpdateTransactions(selectedTransactions, updates)

      // Update local state
      selectedTransactions.forEach((id) => {
        const index = updatedTransactions.findIndex((t) => t.id === id)
        if (index !== -1) {
          updatedTransactions[index] = {
            ...updatedTransactions[index],
            ...updates,
          }
        }
      })

      // Update transactions in parent component
      if (typeof setTransactions === "function") {
        setTransactions([...updatedTransactions])
      } else {
        transactions.splice(0, transactions.length, ...updatedTransactions)
      }

      // Reset state
      setCurrentBulkAction(null)
      setBulkActionValue("")
      setSelectedTransactions([])
      setSelectAll(false)

      // Show success toast
      toast({
        title: t("bulkActions.success"),
        description: successMessage,
      })
    } catch (error) {
      console.error("Error executing bulk action:", error)
      toast({
        title: t("common.error"),
        description: t("bulkActions.updateError"),
        variant: "destructive",
      })
      // Ensure dialog is closed on error
      setCurrentBulkAction(null)
    } finally {
      setIsLoading(false)
    }
  }

  // Start inline editing for a transaction
  const startInlineEdit = (transaction: Transaction) => {
    setEditingInlineId(transaction.id)
    setInlineFormData({ ...transaction })
  }

  // Cancel inline editing
  const cancelInlineEdit = () => {
    setEditingInlineId(null)
    setInlineFormData(null)
  }

  // Save inline edits
  const saveInlineEdit = async () => {
    if (!inlineFormData) return

    try {
      // Validate required fields
      if (!inlineFormData.team || !inlineFormData.agent || !inlineFormData.date || !inlineFormData.type) {
        toast({
          title: t("validation.validationError"),
          description: t("validation.requiredFields"),
          variant: "destructive",
        })
        return
      }

      // Validate amount
      if (inlineFormData.amount <= 0) {
        toast({
          title: t("validation.validationError"),
          description: t("validation.amountGreaterThanZero"),
          variant: "destructive",
        })
        return
      }

      setIsLoading(true)

      // Create a local copy of the updated transaction
      const updatedTransaction = { ...inlineFormData }

      // Check if updateTransaction is a function
      if (typeof updateTransaction === "function") {
        try {
          const result = await updateTransaction(inlineFormData)
          // If successful, use the returned transaction
          Object.assign(updatedTransaction, result)
        } catch (error) {
          console.warn("Error calling updateTransaction:", error)
          // Continue with the local copy if updateTransaction fails
        }
      } else {
        console.warn("updateTransaction function is not provided, using fallback implementation")
      }

      // Check if setTransactions is a function
      if (typeof setTransactions === "function") {
        // Update the transaction in the local state
        setTransactions((prev) => prev.map((t) => (t.id === updatedTransaction.id ? updatedTransaction : t)))
      } else {
        console.warn("setTransactions function is not provided, cannot update local state")
        // Find the transaction in the transactions array and update it directly
        const index = transactions.findIndex((t) => t.id === updatedTransaction.id)
        if (index !== -1) {
          transactions[index] = updatedTransaction
        }
      }

      // Reset editing state
      setEditingInlineId(null)
      setInlineFormData(null)

      // Show success toast
      toast({
        title: t("transactionModal.updateSuccess"),
        description: t("transactionModal.updateSuccessDesc"),
      })
    } catch (error) {
      console.error("Error saving inline edit:", error)
      toast({
        title: t("common.error"),
        description: t("transactionModal.updateError"),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle date change in the calendar
  const handleDateChange = (date: Date | undefined) => {
    if (!date || !inlineFormData) return

    // Format the date as YYYY-MM-DD for the input
    const formattedDate = date.toISOString().split("T")[0]
    setInlineFormData({ ...inlineFormData, date: formattedDate })
  }

  // Handle click outside to cancel inline editing
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (inlineFormRef.current && !inlineFormRef.current.contains(event.target as Node)) {
        cancelInlineEdit()
      }
    }

    // Add event listener if we're in edit mode
    if (editingInlineId !== null) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    // Clean up
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [editingInlineId])

  // Add a loading indicator at the top of the return statement
  return (
    <div className="space-y-6 overflow-x-hidden">
      {isLoading && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <Card className="border-border/40 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium">{t("transactions.filterTransactions")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label className="mb-2 block">{t("transactions.search")}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("transactions.searchPlaceholder")}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex-1 min-w-[200px]">
              <Label className="mb-2 block">{t("transactions.team")}</Label>
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("transactions.allTeams")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("transactions.allTeams")}</SelectItem>
                  <SelectItem value="Hotel">{t("common.hotel")}</SelectItem>
                  <SelectItem value="Hustle">{t("common.hustle")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <Label className="mb-2 block">{t("transactions.type")}</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("transactions.allTypes")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("transactions.allTypes")}</SelectItem>
                  <SelectItem value="Deposit">{t("common.deposit")}</SelectItem>
                  <SelectItem value="Withdrawal">{t("common.withdrawal")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <Label className="mb-2 block">{t("transactions.agent")}</Label>
              <Select
                value={selectedAgent || "all"}
                onValueChange={(value) => setSelectedAgent(value === "all" ? null : value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("transactions.allAgents")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("transactions.allAgents")}</SelectItem>
                  {Object.entries(agentOptions).map(([team, agents]) => (
                    <React.Fragment key={team}>
                      <SelectItem value={team} disabled className="font-semibold">
                        {team}
                      </SelectItem>
                      {agents.map((agent) => (
                        <SelectItem key={agent} value={agent}>
                          {t(`agents.${agent}`, agent)} {/* Fallback to agent name if translation missing */}
                        </SelectItem>
                      ))}
                    </React.Fragment>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Table */}
      <Card className="border-border/40 shadow-md">
        <div className="p-4 border-b border-border/40 flex justify-between items-center">
          <h2 className="text-lg font-semibold">{t("transactions.allTransactions")}</h2>
          <Button
            onClick={() => setShowTransactionModal(true)}
            className={
              primaryButtonClass ||
              "bg-gradient-to-r from-gray-900 to-black hover:from-black hover:to-gray-800 text-white shadow-lg dark:shadow-white/5 hover:shadow-black/25 dark:hover:shadow-white/10 transition-all duration-300"
            }
          >
            <Plus className="w-5 h-5" />
            <span>{t("transactions.addTransaction")}</span>
          </Button>
        </div>

        {/* Bulk Actions Bar */}
        {selectedTransactions.length > 0 && (
          <div className="p-3 bg-muted/50 border-b border-border/40 flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium mr-2">
              {t("bulkActions.selected", { count: selectedTransactions.length })}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentBulkAction("delete")}
              className="flex items-center gap-1"
            >
              <Trash2 className="h-4 w-4" />
              {t("bulkActions.delete")}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentBulkAction("changeType")}
              className="flex items-center gap-1"
            >
              <ArrowRightLeft className="h-4 w-4" />
              {t("bulkActions.changeType")}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentBulkAction("changeTeam")}
              className="flex items-center gap-1"
            >
              <Users className="h-4 w-4" />
              {t("bulkActions.changeTeam")}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentBulkAction("changeDate")}
              className="flex items-center gap-1"
            >
              <CalendarIcon className="h-4 w-4" />
              {t("bulkActions.changeDate")}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentBulkAction("changeAmount")}
              className="flex items-center gap-1"
            >
              <DollarSign className="h-4 w-4" />
              {t("bulkActions.changeAmount")}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedTransactions([])
                setSelectAll(false)
              }}
              className="ml-auto"
            >
              {t("bulkActions.cancel")}
            </Button>
          </div>
        )}

        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full hidden md:table">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <div className="flex items-center">
                    <Checkbox
                      checked={selectAll}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all transactions"
                    />
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t("transactions.team")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t("transactions.agent")}
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("date")}
                >
                  <div className="flex items-center space-x-1">
                    <span>{t("transactions.date")}</span>
                    <div className="flex flex-col">
                      <ArrowUp
                        className={cn(
                          "w-3 h-3",
                          sortField === "date" && sortDirection === "asc" ? "text-purple-600" : "text-muted-foreground",
                        )}
                      />
                      <ArrowDown
                        className={cn(
                          "w-3 h-3",
                          sortField === "date" && sortDirection === "desc"
                            ? "text-purple-600"
                            : "text-muted-foreground",
                        )}
                      />
                    </div>
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t("transactions.shopId")}
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("amount")}
                >
                  <div className="flex items-center space-x-1">
                    <span>{t("transactions.amount")}</span>
                    <div className="flex flex-col">
                      <ArrowUp
                        className={cn(
                          "w-3 h-3",
                          sortField === "amount" && sortDirection === "asc"
                            ? "text-purple-600"
                            : "text-muted-foreground",
                        )}
                      />
                      <ArrowDown
                        className={cn(
                          "w-3 h-3",
                          sortField === "amount" && sortDirection === "desc"
                            ? "text-purple-600"
                            : "text-muted-foreground",
                        )}
                      />
                    </div>
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t("transactions.type")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t("transactions.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {getPaginatedTransactions().map((transaction) =>
                editingInlineId === transaction.id ? (
                  // Inline editing row
                  <tr
                    key={transaction.id}
                    className={cn(
                      "bg-muted/30",
                      transaction.type === "Deposit"
                        ? "bg-green-100/70 dark:bg-green-900/30"
                        : "bg-red-100/70 dark:bg-red-900/30",
                    )}
                    ref={inlineFormRef}
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Checkbox
                        checked={selectedTransactions.includes(transaction.id)}
                        onCheckedChange={() => handleSelectTransaction(transaction.id)}
                        aria-label={`Select transaction ${transaction.id}`}
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Select
                        value={inlineFormData?.team}
                        onValueChange={(value) =>
                          setInlineFormData({ ...inlineFormData!, team: value as "Hotel" | "Hustle" })
                        }
                      >
                        <SelectTrigger className="h-8 w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Hotel">{t("common.hotel")}</SelectItem>
                          <SelectItem value="Hustle">{t("common.hustle")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Select
                        value={inlineFormData?.agent}
                        onValueChange={(value) => setInlineFormData({ ...inlineFormData!, agent: value })}
                      >
                        <SelectTrigger className="h-8 w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {agentOptions[inlineFormData?.team || "Hotel"].map((agent) => (
                            <SelectItem key={agent} value={agent}>
                              {t(`agents.${agent}`, agent)} {/* Fallback to agent name if translation missing */}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="relative">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="h-8 w-[180px] justify-start text-left font-normal">
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {inlineFormData?.date
                                ? formatMonthDay(inlineFormData.date)
                                : t("transactionModal.selectDate")}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={inlineFormData?.date ? new Date(inlineFormData.date) : undefined}
                              onSelect={(date) => handleDateChange(date)}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Input
                        type="text"
                        value={inlineFormData?.shopId}
                        onChange={(e) => setInlineFormData({ ...inlineFormData!, shopId: e.target.value })}
                        className="h-8...inlineFormData!, shopId: e.target.value})}
                        className="h-8 w-24"
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Input
                        type="number"
                        value={inlineFormData?.amount}
                        onChange={(e) => setInlineFormData({ ...inlineFormData!, amount: Number(e.target.value) })}
                        className="h-8 w-24"
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Select
                        value={inlineFormData?.type}
                        onValueChange={(value) =>
                          setInlineFormData({ ...inlineFormData!, type: value as "Deposit" | "Withdrawal" })
                        }
                      >
                        <SelectTrigger className="h-8 w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Deposit">{t("common.deposit")}</SelectItem>
                          <SelectItem value="Withdrawal">{t("common.withdrawal")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={saveInlineEdit}
                          className="h-8 w-8 p-0 text-green-600 hover:text-green-800 dark:text-green-500 dark:hover:text-green-400"
                        >
                          <Check className="h-5 w-5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={cancelInlineEdit}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-800 dark:text-red-500 dark:hover:text-red-400"
                        >
                          <X className="h-5 w-5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  // Normal row (not being edited)
                  <tr
                    key={transaction.id}
                    className={cn(
                      "hover:bg-muted/50 transition-colors cursor-pointer",
                      transaction.type === "Deposit"
                        ? "bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30"
                        : "bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30",
                    )}
                    onClick={(e) => {
                      // Don't trigger row edit if clicking on checkbox, delete button, or notes icon
                      if (
                        e.target instanceof HTMLElement &&
                        (e.target.closest("button") || e.target.closest('[role="checkbox"]'))
                      ) {
                        return
                      }
                      startInlineEdit(transaction)
                    }}
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Checkbox
                        checked={selectedTransactions.includes(transaction.id)}
                        onCheckedChange={() => handleSelectTransaction(transaction.id)}
                        aria-label={`Select transaction ${transaction.id}`}
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <TeamBadge team={transaction.team} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{t(`agents.${transaction.agent}`)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatMonthDay(transaction.date)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{transaction.shopId}</td>
                    <td className="px-4 py-3 whitespace-nowrap">${transaction.amount.toLocaleString()}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-xs font-semibold",
                          transaction.type === "Deposit"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
                        )}
                      >
                        {t(`common.${transaction.type.toLowerCase()}`)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation() // Prevent row click
                            deleteTransaction(transaction.id)
                          }}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                        {transaction.notes && (
                          <button
                            title={transaction.notes}
                            onClick={(e) => e.stopPropagation()} // Prevent row click
                            className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
                          >
                            <StickyNote className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>

          {/* Add mobile card view for small screens */}
          <div className="grid grid-cols-1 gap-4 md:hidden px-4 overflow-visible">
            {getPaginatedTransactions().map((transaction) =>
              editingInlineId === transaction.id ? (
                // Mobile editing view
                <div
                  key={transaction.id}
                  className={cn(
                    "p-4 rounded-lg border border-border/40",
                    transaction.type === "Deposit"
                      ? "bg-green-100/70 dark:bg-green-900/30"
                      : "bg-red-100/70 dark:bg-red-900/30",
                  )}
                  ref={inlineFormRef}
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-medium">{t("common.editTransaction")}</h3>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={saveInlineEdit}
                        className="h-8 w-8 p-0 text-green-600 hover:text-green-800 dark:text-green-500 dark:hover:text-green-400"
                      >
                        <Check className="h-5 w-5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={cancelInlineEdit}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-800 dark:text-red-500 dark:hover:text-red-400"
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="mobile-team" className="block mb-2">
                        {t("transactionModal.team")}
                      </Label>
                      <Select
                        value={inlineFormData?.team}
                        onValueChange={(value) =>
                          setInlineFormData({ ...inlineFormData!, team: value as "Hotel" | "Hustle" })
                        }
                      >
                        <SelectTrigger id="mobile-team" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Hotel">{t("common.hotel")}</SelectItem>
                          <SelectItem value="Hustle">{t("common.hustle")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="mobile-agent" className="block mb-2">
                        {t("transactionModal.agent")}
                      </Label>
                      <Select
                        value={inlineFormData?.agent}
                        onValueChange={(value) => setInlineFormData({ ...inlineFormData!, agent: value })}
                      >
                        <SelectTrigger id="mobile-agent" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {agentOptions[inlineFormData?.team || "Hotel"].map((agent) => (
                            <SelectItem key={agent} value={agent}>
                              {t(`agents.${agent}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="mobile-date" className="block mb-2">
                        {t("transactionModal.date")}
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            id="mobile-date"
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {inlineFormData?.date
                              ? formatMonthDay(inlineFormData.date)
                              : t("transactionModal.selectDate")}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={inlineFormData?.date ? new Date(inlineFormData.date) : undefined}
                            onSelect={(date) => handleDateChange(date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div>
                      <Label htmlFor="mobile-shopId" className="block mb-2">
                        {t("transactionModal.shopId")}
                      </Label>
                      <Input
                        id="mobile-shopId"
                        type="text"
                        value={inlineFormData?.shopId}
                        onChange={(e) => setInlineFormData({ ...inlineFormData!, shopId: e.target.value })}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <Label htmlFor="mobile-amount" className="block mb-2">
                        {t("transactionModal.amount")}
                      </Label>
                      <Input
                        id="mobile-amount"
                        type="number"
                        value={inlineFormData?.amount}
                        onChange={(e) => setInlineFormData({ ...inlineFormData!, amount: Number(e.target.value) })}
                        className="w-full"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <Label htmlFor="mobile-type" className="block mb-2">
                        {t("transactionModal.type")}
                      </Label>
                      <Select
                        value={inlineFormData?.type}
                        onValueChange={(value) =>
                          setInlineFormData({ ...inlineFormData!, type: value as "Deposit" | "Withdrawal" })
                        }
                      >
                        <SelectTrigger id="mobile-type" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Deposit">{t("common.deposit")}</SelectItem>
                          <SelectItem value="Withdrawal">{t("common.withdrawal")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ) : (
                // Normal mobile card view (not being edited)
                <div
                  key={transaction.id}
                  className={cn(
                    "p-4 rounded-lg border border-border/40",
                    transaction.type === "Deposit"
                      ? "bg-green-50 dark:bg-green-900/20"
                      : "bg-red-50 dark:bg-red-900/20",
                  )}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedTransactions.includes(transaction.id)}
                        onCheckedChange={() => handleSelectTransaction(transaction.id)}
                        aria-label={`Select transaction ${transaction.id}`}
                      />
                      <TeamBadge team={transaction.team} />
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => deleteTransaction(transaction.id)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                      {transaction.notes && (
                        <button
                          title={transaction.notes}
                          className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
                        >
                          <StickyNote className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <div className="font-medium">{t("transactions.agent")}</div>
                    <div>{t(`agents.${transaction.agent}`)}</div>

                    <div className="font-medium">{t("transactions.date")}</div>
                    <div>{formatMonthDay(transaction.date)}</div>

                    <div className="font-medium">{t("transactions.shopId")}</div>
                    <div>{transaction.shopId}</div>

                    <div className="font-medium">{t("transactions.amount")}</div>
                    <div>${transaction.amount.toLocaleString()}</div>

                    <div className="font-medium">{t("transactions.type")}</div>
                    <div>
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-xs font-semibold",
                          transaction.type === "Deposit"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
                        )}
                      >
                        {t(`common.${transaction.type.toLowerCase()}`)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-border/40 flex justify-end">
                    <Button size="sm" variant="outline" onClick={() => startInlineEdit(transaction)}>
                      <Edit className="w-4 h-4 mr-2" />
                      {t("common.edit")}
                    </Button>
                  </div>
                </div>
              ),
            )}
            <div className="px-4 py-2 bg-background rounded-lg border border-border/40">
              <div className="flex flex-col items-center gap-2">
                <div className="text-sm text-muted-foreground">
                  {t("pagination.showing", {
                    start: totalFilteredTransactions === 0 ? 0 : (currentPage - 1) * pageSize + 1,
                    end: Math.min(currentPage * pageSize, totalFilteredTransactions),
                    total: totalFilteredTransactions,
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    {t("pagination.previous")}
                  </Button>
                  <span className="text-sm">{t("pagination.pageOf", { current: currentPage, total: totalPages })}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || totalPages === 0}
                  >
                    {t("pagination.next")}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="px-4 border-t border-border/40">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
            <div className="text-sm text-muted-foreground">
              {totalFilteredTransactions > 0
                ? t("pagination.showing", {
                    start: (currentPage - 1) * pageSize + 1,
                    end: Math.min(currentPage * pageSize, totalFilteredTransactions),
                    total: totalFilteredTransactions,
                  })
                : t("pagination.noResults")}
            </div>

            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">{t("pagination.rowsPerPage")}</span>
                <Select
                  value={pageSize.toString()}
                  onValueChange={(value) => handlePageSizeChange(Number.parseInt(value))}
                >
                  <SelectTrigger className="h-8 w-[70px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 25, 50, 100].map((size) => (
                      <SelectItem key={size} value={size.toString()}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">{t("pagination.previous")}</span>
                </Button>

                <div className="flex items-center">
                  {(() => {
                    const pages = []
                    const maxPagesToShow = 5

                    if (totalPages <= maxPagesToShow) {
                      for (let i = 1; i <= totalPages; i++) {
                        pages.push(i)
                      }
                    } else {
                      pages.push(1)

                      let startPage = Math.max(2, currentPage - 1)
                      let endPage = Math.min(totalPages - 1, currentPage + 1)

                      if (currentPage <= 3) {
                        endPage = Math.min(4, totalPages - 1)
                      }

                      if (currentPage >= totalPages - 2) {
                        startPage = Math.max(2, totalPages - 3)
                      }

                      if (startPage > 2) {
                        pages.push(-1)
                      }

                      for (let i = startPage; i <= endPage; i++) {
                        pages.push(i)
                      }

                      if (endPage < totalPages - 1) {
                        pages.push(-2)
                      }

                      pages.push(totalPages)
                    }

                    return pages.map((page, index) => {
                      if (page < 0) {
                        return (
                          <div key={`ellipsis-${index}`} className="px-2">
                            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )
                      }

                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </Button>
                      )
                    })
                  })()}
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || totalPages === 0}
                >
                  <ChevronRight className="h-4 w-4" />
                  <span className="sr-only">{t("pagination.next")}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Add Floating Action Button */}
      <FloatingActionButton
        icon={<Plus className="h-6 w-6" />}
        onClick={() => {
          setEditingTransaction(null)
          setShowTransactionModal(true)
        }}
        label={t("transactions.addTransaction")}
      />

      {/* Bulk Delete Confirmation */}
      {currentBulkAction === "delete" && (
        <Dialog open={true} onOpenChange={() => setCurrentBulkAction(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("bulkActions.confirmDeleteTitle")}</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p>{t("bulkActions.confirmDeleteDesc", { count: selectedTransactions.length })}</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCurrentBulkAction(null)}>
                {t("bulkActions.cancel")}
              </Button>
              <Button variant="destructive" onClick={handleBulkDelete}>
                {t("bulkActions.delete")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Change Type Dialog */}
      {currentBulkAction === "changeType" && (
        <Dialog open={true} onOpenChange={() => setCurrentBulkAction(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("bulkActions.changeTypeTitle")}</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="type">{t("bulkActions.selectType")}</Label>
              <Select value={bulkActionValue} onValueChange={setBulkActionValue}>
                <SelectTrigger id="type" className="w-full mt-2">
                  <SelectValue placeholder={t("bulkActions.selectType")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Deposit">{t("common.deposit")}</SelectItem>
                  <SelectItem value="Withdrawal">{t("common.withdrawal")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCurrentBulkAction(null)}>
                {t("bulkActions.cancel")}
              </Button>
              <Button
                onClick={executeBulkAction}
                disabled={!bulkActionValue}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {t("bulkActions.apply")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Change Team Dialog */}
      {currentBulkAction === "changeTeam" && (
        <Dialog open={true} onOpenChange={() => setCurrentBulkAction(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("bulkActions.changeTeamTitle")}</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="team">{t("bulkActions.selectTeam")}</Label>
              <Select value={bulkActionValue} onValueChange={setBulkActionValue}>
                <SelectTrigger id="team" className="w-full mt-2">
                  <SelectValue placeholder={t("bulkActions.selectTeam")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Hotel">{t("common.hotel")}</SelectItem>
                  <SelectItem value="Hustle">{t("common.hustle")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCurrentBulkAction(null)}>
                {t("bulkActions.cancel")}
              </Button>
              <Button
                onClick={executeBulkAction}
                disabled={!bulkActionValue}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {t("bulkActions.apply")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Change Date Dialog */}
      {currentBulkAction === "changeDate" && (
        <Dialog open={true} onOpenChange={() => setCurrentBulkAction(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("bulkActions.changeDateTitle")}</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="date">{t("bulkActions.selectDate")}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button id="date" variant="outline" className="w-full mt-2 justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {bulkActionDate ? formatMonthDay(bulkActionDate) : t("bulkActions.selectDate")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={bulkActionDate ? new Date(bulkActionDate) : undefined}
                    onSelect={(date) => date && setBulkActionDate(date.toISOString().split("T")[0])}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCurrentBulkAction(null)}>
                {t("bulkActions.cancel")}
              </Button>
              <Button onClick={executeBulkAction} className="bg-purple-600 hover:bg-purple-700">
                {t("bulkActions.apply")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Change Amount Dialog */}
      {currentBulkAction === "changeAmount" && (
        <Dialog open={true} onOpenChange={() => setCurrentBulkAction(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("bulkActions.changeAmountTitle")}</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="amount">{t("bulkActions.enterAmount")}</Label>
              <Input
                id="amount"
                type="number"
                value={bulkActionAmount}
                onChange={(e) => setBulkActionAmount(Number(e.target.value))}
                min="0"
                step="0.01"
                className="w-full mt-2"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCurrentBulkAction(null)}>
                {t("bulkActions.cancel")}
              </Button>
              <Button onClick={executeBulkAction} className="bg-purple-600 hover:bg-purple-700">
                {t("bulkActions.apply")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
