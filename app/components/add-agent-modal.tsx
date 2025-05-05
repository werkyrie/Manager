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
import { useTranslation } from "react-i18next"
import { HotelLogo, HustleLogo } from "./team-logos"

type AddAgentModalProps = {
  onClose: () => void
  onAddAgent: (team: "Hotel" | "Hustle", agentName: string) => Promise<boolean>
  agentOptions: Record<string, string[]>
}

export function AddAgentModal({ onClose, onAddAgent, agentOptions }: AddAgentModalProps) {
  const { t } = useTranslation()
  const [team, setTeam] = useState<"Hotel" | "Hustle">("Hotel")
  const [agentName, setAgentName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    // Validate agent name
    if (!agentName.trim()) {
      setError(t("validation.allFieldsRequired"))
      setIsSubmitting(false)
      return
    }

    try {
      const success = await onAddAgent(team, agentName.trim())

      if (success) {
        toast({
          title: t("agentModal.addAgent"),
          description: `${agentName} has been added to the ${team} team.`,
        })

        // Add a reminder about translations
        toast({
          title: "Translation Reminder",
          description: "Don't forget to add a Chinese translation for this agent in the Translation Manager.",
          duration: 5000,
        })

        onClose()
      } else {
        setError(`Agent "${agentName}" already exists in the ${team} team.`)
        setIsSubmitting(false)
      }
    } catch (err) {
      console.error("Error adding agent:", err)
      setError(err instanceof Error ? err.message : "An error occurred while adding the agent")
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md border-border/40 shadow-lg animate-in fade-in-0 zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-4 border-b border-border/40">
          <h2 className="text-xl font-semibold">{t("agentModal.addNewAgent")}</h2>
          <button
            onClick={onClose}
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
                {t("transactions.team")}
              </Label>
              <Select value={team} onValueChange={(value) => setTeam(value as "Hotel" | "Hustle")}>
                <SelectTrigger id="team" className="w-full">
                  <SelectValue placeholder="Select Team">
                    {team && (
                      <div className="flex items-center gap-2">
                        {team === "Hotel" ? <HotelLogo className="w-5 h-5" /> : <HustleLogo className="w-5 h-5" />}
                        <span>{t(`common.${team.toLowerCase()}`)}</span>
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
              <Label htmlFor="agentName" className="block mb-2">
                {t("agentModal.agentName")}
              </Label>
              <Input
                id="agentName"
                type="text"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                placeholder={t("agentModal.enterAgentName")}
                required
                className="w-full"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 mt-4 border-t border-border/40">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              {t("transactionModal.cancel")}
            </Button>
            <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                  {t("common.saving")}
                </>
              ) : (
                t("agentModal.addAgent")
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
