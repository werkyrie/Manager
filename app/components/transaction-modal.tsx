"use client"

import type React from "react"

import { useState } from "react"
import { X } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"

// Import the useTranslation hook
import { useTranslation } from "react-i18next"
import { HotelLogo, HustleLogo } from "./team-logos"

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
  firebaseId?: string
}

// Add a loading state to the component
export function TransactionModal({
  editingTransaction,
  setEditingTransaction,
  setShowTransactionModal,
  addTransaction,
  updateTransaction,
  agentOptions,
}: {
  editingTransaction: Transaction | null
  setEditingTransaction: (transaction: Transaction | null) => void
  setShowTransactionModal: (show: boolean) => void
  addTransaction: (transaction: Omit<Transaction, "id">) => void
  updateTransaction: (transaction: Transaction) => void
  agentOptions: Record<string, string[]>
}) {
  const { t } = useTranslation()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<Omit<Transaction, "id">>({
    team: editingTransaction?.team || "Hotel",
    agent: editingTransaction?.agent || "",
    date: editingTransaction?.date || new Date().toISOString().split("T")[0],
    shopId: editingTransaction?.shopId || "",
    amount: editingTransaction?.amount || 0,
    type: editingTransaction?.type || "Deposit",
    notes: editingTransaction?.notes || "",
    ...(editingTransaction?.firebaseId ? { firebaseId: editingTransaction.firebaseId } : {}),
  })

  // Update the transaction modal to use the validation translation key
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate all required fields
    if (!formData.team || !formData.agent || !formData.date || !formData.shopId || !formData.amount || !formData.type) {
      setError(t("validation.allFieldsRequired"))
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      if (editingTransaction) {
        // For editing, ensure we have the firebaseId
        const firebaseId = editingTransaction.firebaseId || formData.firebaseId

        // Show a toast to indicate the process is in progress
        toast({
          title: "Updating Transaction",
          description: "Please wait while we update your transaction...",
        })

        // Close the modal immediately for better UX
        setShowTransactionModal(false)

        try {
          // Include both possible sources of firebaseId
          await updateTransaction({
            ...formData,
            id: editingTransaction.id,
            firebaseId: firebaseId,
          })

          // Clear the editing state after successful update
          setEditingTransaction(null)

          // Show success toast
          toast({
            title: "Transaction Updated",
            description: "Transaction has been successfully updated.",
          })
        } catch (updateError) {
          console.error("Error updating transaction:", updateError)
          toast({
            title: "Error",
            description: updateError instanceof Error ? updateError.message : "Failed to update transaction",
            variant: "destructive",
          })
        }
      } else {
        // For new transactions
        // Show a toast to indicate the process is in progress
        toast({
          title: "Adding Transaction",
          description: "Please wait while we add your transaction...",
        })

        // Close the modal immediately for better UX
        setShowTransactionModal(false)
        setEditingTransaction(null)

        // Then process the transaction
        const { firebaseId, ...newTransaction } = formData as any

        try {
          await addTransaction(newTransaction)

          // Show success toast
          toast({
            title: "Transaction Added",
            description: "New transaction has been successfully added.",
          })
        } catch (addError) {
          console.error("Error adding transaction:", addError)
          toast({
            title: "Error",
            description: "Failed to add transaction. Please try again.",
            variant: "destructive",
          })
        }
      }
    } catch (err) {
      console.error("Error submitting transaction:", err)
      setError(err instanceof Error ? err.message : "An error occurred while saving the transaction")
      setIsSubmitting(false) // Only reset submitting state on error
    }
  }

  // Function to translate agent names
  const translateAgentName = (name: string) => {
    return t(`agents.${name}`)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md border-border/40 shadow-lg animate-in fade-in-0 zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-4 border-b border-border/40">
          <h2 className="text-xl font-semibold">
            {editingTransaction ? t("transactionModal.editTransaction") : t("transactionModal.addTransaction")}
          </h2>
          <button
            onClick={() => {
              setShowTransactionModal(false)
              setEditingTransaction(null)
            }}
            className="text-muted-foreground hover:text-foreground transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <Label htmlFor="team" className="block mb-2">
                {t("transactionModal.team")}
              </Label>
              <Select
                value={formData.team}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, team: value as "Hotel" | "Hustle" }))}
                required
              >
                <SelectTrigger id="team" className="w-full">
                  <SelectValue placeholder={t("transactionModal.selectTeam")}>
                    {formData.team && (
                      <div className="flex items-center gap-2">
                        {formData.team === "Hotel" ? (
                          <HotelLogo className="w-5 h-5" />
                        ) : (
                          <HustleLogo className="w-5 h-5" />
                        )}
                        <span>{t(`common.${formData.team.toLowerCase()}`)}</span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Hotel">
                    <div className="flex items-center gap-2">
                      <HotelLogo className="w-5 h-5" />
                      <span>{t("common.hotel")}</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Hustle">
                    <div className="flex items-center gap-2">
                      <HustleLogo className="w-5 h-5" />
                      <span>{t("common.hustle")}</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="agent" className="block mb-2">
                {t("transactionModal.agent")}
              </Label>
              <Select
                value={formData.agent}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, agent: value }))}
                required
              >
                <SelectTrigger id="agent" className="w-full">
                  <SelectValue placeholder={t("transactionModal.selectAgent")} />
                </SelectTrigger>
                <SelectContent>
                  {agentOptions[formData.team].map((agent) => (
                    <SelectItem key={agent} value={agent}>
                      {translateAgentName(agent)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="date" className="block mb-2">
                {t("transactionModal.date")}
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                required
                className="w-full"
              />
            </div>

            <div>
              <Label htmlFor="shopId" className="block mb-2">
                {t("transactionModal.shopId")}
              </Label>
              <Input
                id="shopId"
                type="text"
                value={formData.shopId}
                onChange={(e) => setFormData((prev) => ({ ...prev, shopId: e.target.value }))}
                required
                className="w-full"
              />
            </div>

            <div>
              <Label htmlFor="amount" className="block mb-2">
                {t("transactionModal.amount")}
              </Label>
              <Input
                id="amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData((prev) => ({ ...prev, amount: Number(e.target.value) }))}
                required
                min="0"
                step="0.01"
                className="w-full"
              />
            </div>

            <div>
              <Label htmlFor="type" className="block mb-2">
                {t("transactionModal.type")}
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value as "Deposit" | "Withdrawal" }))}
                required
              >
                <SelectTrigger id="type" className="w-full">
                  <SelectValue placeholder={t("transactionModal.selectType")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Deposit">{t("common.deposit")}</SelectItem>
                  <SelectItem value="Withdrawal">{t("common.withdrawal")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes" className="block mb-2">
                {t("transactionModal.notes")}
              </Label>
              <Input
                id="notes"
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                className="w-full"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 mt-4 border-t border-border/40">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowTransactionModal(false)
                setEditingTransaction(null)
              }}
              disabled={isSubmitting}
            >
              {t("transactionModal.cancel")}
            </Button>
            <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                  {t("common.saving")}
                </>
              ) : editingTransaction ? (
                t("transactionModal.update")
              ) : (
                t("transactionModal.add")
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
