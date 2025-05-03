"use client"

import type React from "react"

import { useState } from "react"
import { X } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ReceiptUploader } from "./receipt-uploader"

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
  receipt?: string | null
}

const AGENT_OPTIONS = {
  Hotel: ["Primo", "Cu", "Kel", "Mar", "Vivian", "Jhe", "Thac", "Lovely", "Ken", "Kyrie", "Annie"],
  Hustle: ["Joie", "Elocin", "Aubrey", "Xela"],
}

// Transaction Modal Component
export function TransactionModal({
  editingTransaction,
  setEditingTransaction,
  setShowTransactionModal,
  addTransaction,
  updateTransaction,
}: {
  editingTransaction: Transaction | null
  setEditingTransaction: (transaction: Transaction | null) => void
  setShowTransactionModal: (show: boolean) => void
  addTransaction: (transaction: Omit<Transaction, "id">) => void
  updateTransaction: (transaction: Transaction) => void
}) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<string>("details")

  const [formData, setFormData] = useState<Omit<Transaction, "id">>({
    team: editingTransaction?.team || "Hotel",
    agent: editingTransaction?.agent || "",
    date: editingTransaction?.date || new Date().toISOString().split("T")[0],
    shopId: editingTransaction?.shopId || "",
    amount: editingTransaction?.amount || 0,
    type: editingTransaction?.type || "Deposit",
    notes: editingTransaction?.notes || "",
    receipt: editingTransaction?.receipt || null,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingTransaction) {
      updateTransaction({ ...formData, id: editingTransaction.id })
    } else {
      addTransaction(formData)
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
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full">
              <TabsTrigger value="details">{t("transactionModal.details")}</TabsTrigger>
              <TabsTrigger value="receipt">{t("receipt.receipt")}</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-5 py-2">
              <div>
                <Label htmlFor="team" className="block mb-2">
                  {t("transactionModal.team")}
                </Label>
                <Select
                  value={formData.team}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, team: value as "Hotel" | "Hustle" }))}
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
                >
                  <SelectTrigger id="agent" className="w-full">
                    <SelectValue placeholder={t("transactionModal.selectAgent")} />
                  </SelectTrigger>
                  <SelectContent>
                    {AGENT_OPTIONS[formData.team].map((agent) => (
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
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, type: value as "Deposit" | "Withdrawal" }))
                  }
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
            </TabsContent>

            <TabsContent value="receipt" className="py-2">
              <div className="space-y-4">
                <Label htmlFor="receipt" className="block mb-2">
                  {t("receipt.receiptImage")}
                </Label>
                <ReceiptUploader
                  value={formData.receipt}
                  onChange={(receipt) => setFormData((prev) => ({ ...prev, receipt }))}
                />
                <p className="text-xs text-muted-foreground mt-2">{t("receipt.uploadInstructions")}</p>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-3 pt-4 mt-4 border-t border-border/40">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowTransactionModal(false)
                setEditingTransaction(null)
              }}
            >
              {t("transactionModal.cancel")}
            </Button>
            <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
              {editingTransaction ? t("transactionModal.update") : t("transactionModal.add")}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
