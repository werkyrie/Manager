"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { X, ArrowUpCircle, ArrowDownCircle } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

// Import the useTranslation hook
import { useTranslation } from "react-i18next"
import { HotelLogo, HustleLogo } from "./team-logos"

import { getAuth } from "firebase/auth"
import { collection, getDocs, query } from "firebase/firestore"
import { db } from "../lib/firebase"

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
  primaryButtonClass,
}: {
  editingTransaction: Transaction | null
  setEditingTransaction: (transaction: Transaction | null) => void
  setShowTransactionModal: (show: boolean) => void
  addTransaction: (transaction: Omit<Transaction, "id">) => void
  updateTransaction: (transaction: Transaction) => void
  agentOptions: Record<string, string[]>
  primaryButtonClass?: string
}) {
  const { t } = useTranslation()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [shopIdSuggestions, setShopIdSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

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

  // Add escape key handler
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowTransactionModal(false)
        setEditingTransaction(null)
      }
    }

    // Add event listener
    document.addEventListener("keydown", handleEscapeKey)

    // Clean up
    return () => {
      document.removeEventListener("keydown", handleEscapeKey)
    }
  }, [setShowTransactionModal, setEditingTransaction])

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
          title: t("transactionModal.updatingTransaction"),
          description: t("transactionModal.updatingTransactionDesc"),
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
            title: t("transactionModal.transactionUpdated"),
            description: t("transactionModal.transactionUpdatedDesc"),
          })
        } catch (updateError) {
          console.error("Error updating transaction:", updateError)
          toast({
            title: t("common.error"),
            description: updateError instanceof Error ? updateError.message : t("transactionModal.updateError"),
            variant: "destructive",
          })
        }
      } else {
        // For new transactions
        // Show a toast to indicate the process is in progress
        toast({
          title: t("transactionModal.addingTransaction"),
          description: t("transactionModal.addingTransactionDesc"),
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
            title: t("transactionModal.transactionAdded"),
            description: t("transactionModal.newTransactionAddedDesc"),
          })
        } catch (addError) {
          console.error("Error adding transaction:", addError)
          toast({
            title: t("common.error"),
            description: t("transactionModal.addError"),
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

  // Function to get unique shop IDs for the selected agent
  const getShopIdSuggestionsForAgent = (agent: string) => {
    // Import transactions from the parent component
    const auth = getAuth()
    if (!auth.currentUser) return []

    // We need to fetch transactions from Firebase
    const fetchAgentShopIds = async () => {
      try {
        const q = query(collection(db, "transactions"))
        const querySnapshot = await getDocs(q)

        // Filter transactions for the selected agent and extract unique shop IDs
        const shopIds = querySnapshot.docs
          .map((doc) => doc.data() as Transaction)
          .filter((t) => t.agent === agent)
          .map((t) => t.shopId)

        // Return unique shop IDs
        return [...new Set(shopIds)]
      } catch (error) {
        console.error("Error fetching shop IDs:", error)
        return []
      }
    }

    // Call the function and update state
    fetchAgentShopIds().then((shopIds) => {
      setShopIdSuggestions(shopIds)
    })
  }

  // Update shop ID suggestions when agent changes
  useEffect(() => {
    if (formData.agent) {
      getShopIdSuggestionsForAgent(formData.agent)
    } else {
      setShopIdSuggestions([])
    }
  }, [formData.agent])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="w-full max-w-md border-border/40 shadow-lg animate-in fade-in-0 zoom-in-95 duration-200 my-8">
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

          <div className="space-y-5 max-h-[70vh] overflow-y-auto px-1">
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

            <div className="relative">
              <Label htmlFor="shopId" className="block mb-2">
                {t("transactionModal.shopId")}
              </Label>
              <Input
                id="shopId"
                type="text"
                value={formData.shopId}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, shopId: e.target.value }))
                  setShowSuggestions(true)
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => {
                  // Delay hiding suggestions to allow for clicks
                  setTimeout(() => setShowSuggestions(false), 200)
                }}
                required
                className="w-full"
                autoComplete="off"
              />

              {/* Shop ID Suggestions */}
              {showSuggestions && shopIdSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-md max-h-40 overflow-y-auto">
                  {shopIdSuggestions
                    .filter((id) => id.toLowerCase().includes(formData.shopId.toLowerCase()))
                    .map((shopId, index) => (
                      <div
                        key={index}
                        className="px-3 py-2 hover:bg-muted cursor-pointer"
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, shopId }))
                          setShowSuggestions(false)
                        }}
                      >
                        {shopId}
                      </div>
                    ))}
                </div>
              )}
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
                  <SelectValue placeholder={t("transactionModal.selectType")}>
                    {formData.type && (
                      <div className="flex items-center gap-2">
                        {formData.type === "Deposit" ? (
                          <ArrowUpCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <ArrowDownCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span>{t(`common.${formData.type.toLowerCase()}`)}</span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Deposit">
                    <div className="flex items-center gap-2">
                      <ArrowUpCircle className="w-4 h-4 text-green-500" />
                      <span>{t("common.deposit")}</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Withdrawal">
                    <div className="flex items-center gap-2">
                      <ArrowDownCircle className="w-4 h-4 text-red-500" />
                      <span>{t("common.withdrawal")}</span>
                    </div>
                  </SelectItem>
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

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 space-y-2 space-y-reverse sm:space-y-0 pt-4 mt-4 border-t border-border/40">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowTransactionModal(false)
                setEditingTransaction(null)
              }}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              {t("transactionModal.cancel")}
            </Button>
            <Button
              type="submit"
              className={cn(
                "w-full sm:w-auto",
                primaryButtonClass ||
                  "bg-gradient-to-r from-gray-900 to-black hover:from-black hover:to-gray-800 text-white shadow-lg dark:shadow-white/5 hover:shadow-black/25 dark:hover:shadow-white/10 transition-all duration-300",
              )}
              disabled={isSubmitting}
            >
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
