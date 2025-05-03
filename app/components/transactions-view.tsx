"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  ArrowDown,
  ArrowUp,
  Edit,
  Plus,
  Search,
  StickyNote,
  Trash2,
  Calendar,
  DollarSign,
  Users,
  ArrowRightLeft,
  FileImage,
  Loader2,
} from "lucide-react"
import { TeamBadge } from "./team-logos"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { FloatingActionButton } from "@/components/ui/floating-action-button"

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
}

type SortDirection = "asc" | "desc" | null
type SortField = "date" | "amount" | null

type BulkActionType = "delete" | "changeType" | "changeTeam" | "changeDate" | "changeAmount" | null

const AGENT_OPTIONS = {
  Hotel: ["Primo", "Cu", "Kel", "Mar", "Vivian", "Jhe", "Thac", "Lovely", "Ken", "Kyrie", "Annie"],
  Hustle: ["Joie", "Elocin", "Aubrey", "Xela"],
}

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
}: {
  transactions: Transaction[]
  searchQuery: string
  setSearchQuery: (query: string) => void
  selectedTeam: string
  setSelectedTeam: (team: string) => void
  selectedType: string
  setSelectedType: (type: string) => void
  selectedAgent: string | null
  setSelectedAgent: (agent: string | null) => void
  sortField: SortField
  sortDirection: SortDirection
  handleSort: (field: SortField) => void
  getFilteredAndSortedTransactions: () => Transaction[]
  setEditingTransaction: (transaction: Transaction | null) => void
  setShowTransactionModal: (show: boolean) => void
  deleteTransaction: (id: number) => void
  formatTableDate: (date: string) => string
}) {
  // Add the translation hook
  const { t } = useTranslation()
  const { toast } = useToast()

  // State for bulk actions
  const [selectedTransactions, setSelectedTransactions] = useState<number[]>([])
  const [selectAll, setSelectAll] = useState(false)
  const [currentBulkAction, setCurrentBulkAction] = useState<BulkActionType>(null)

  // State for viewing receipt
  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null)

  // State for bulk action dialogs
  const [bulkActionValue, setBulkActionValue] = useState<string>("")
  const [bulkActionDate, setBulkActionDate] = useState<string>(new Date().toISOString().split("T")[0])
  const [bulkActionAmount, setBulkActionAmount] = useState<number>(0)

  // Add isLoading state
  const [isLoading, setIsLoading] = useState(false)

  // Get filtered transactions
  const filteredTransactions = getFilteredAndSortedTransactions()

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
        setIsLoading(true)

        // Get the transactions to delete
        const transactionsToDelete = transactions.filter((t) => selectedTransactions.includes(t.id))

        // Delete transactions in Firebase
        await bulkDeleteTransactions(selectedTransactions)

        // Delete each selected transaction
        selectedTransactions.forEach((id) => {
          deleteTransaction(id)
        })

        // Clear selection
        setSelectedTransactions([])
        setSelectAll(false)

        // Show success toast
        toast({
          title: t("bulkActions.deleteSuccess"),
          description: t("bulkActions.deleteSuccessDesc", { count: selectedTransactions.length }),
        })
      } catch (error) {
        console.error("Error bulk deleting transactions:", error)
        toast({
          title: "Error",
          description: "Failed to delete transactions. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
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
      transactions.splice(0, transactions.length, ...updatedTransactions)

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
        title: "Error",
        description: "Failed to update transactions. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Add a loading indicator at the top of the return statement
  return (
    <div className="space-y-6">
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
                  <SelectValue placeholder="All Teams" />
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
                  <SelectValue placeholder="All Types" />
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
                  <SelectValue placeholder="All Agents" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("transactions.allAgents")}</SelectItem>
                  {Object.entries(AGENT_OPTIONS).map(([team, agents]) => (
                    <SelectItem key={team} value={team} disabled className="font-semibold">
                      {team}
                    </SelectItem>
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
            className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700"
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
              <Calendar className="h-4 w-4" />
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

        <div className="overflow-x-auto">
          <table className="w-full">
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
                  {t("receipt.receipt")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t("transactions.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-muted/50 transition-colors">
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
                  <td className="px-4 py-3 whitespace-nowrap">{formatTableDate(transaction.date)}</td>
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
                    {transaction.receipt ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewingReceipt(transaction.receipt)}
                        className="p-0 h-8 w-8"
                      >
                        <FileImage className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </Button>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setEditingTransaction(transaction)
                          setShowTransactionModal(true)
                        }}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
              <Input
                id="date"
                type="date"
                value={bulkActionDate}
                onChange={(e) => setBulkActionDate(e.target.value)}
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

      {/* Receipt Viewer Dialog */}
      {viewingReceipt && (
        <Dialog open={true} onOpenChange={() => setViewingReceipt(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t("receipt.viewReceipt")}</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <div className="border rounded-md overflow-hidden">
                <img src={viewingReceipt || "/placeholder.svg"} alt={t("receipt.receipt")} className="w-full h-auto" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewingReceipt(null)}>
                {t("receipt.close")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
