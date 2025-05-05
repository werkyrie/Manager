"use client"

import type React from "react"

import { useState } from "react"
import { X, Trash2, UserPlus } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTranslation } from "react-i18next"
import { HotelLogo, HustleLogo } from "./team-logos"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type ManageAgentsProps = {
  agentOptions: Record<string, string[]>
  onAddAgent: (team: "Hotel" | "Hustle", agentName: string) => Promise<boolean>
  onDeleteAgent: (team: "Hotel" | "Hustle", agentName: string) => Promise<boolean>
  onClose: () => void
}

export function ManageAgents({ agentOptions, onAddAgent, onDeleteAgent, onClose }: ManageAgentsProps) {
  const { t } = useTranslation()
  const [team, setTeam] = useState<"Hotel" | "Hustle">("Hotel")
  const [agentName, setAgentName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("hotel")

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
        setAgentName("")
      } else {
        setError(`Agent "${agentName}" already exists in the ${team} team.`)
      }
    } catch (err) {
      console.error("Error adding agent:", err)
      setError(err instanceof Error ? err.message : "An error occurred while adding the agent")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteAgent = async (team: "Hotel" | "Hustle", agentName: string) => {
    if (window.confirm(`Are you sure you want to delete ${agentName} from the ${team} team?`)) {
      try {
        await onDeleteAgent(team, agentName)
      } catch (error) {
        console.error("Error deleting agent:", error)
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl border-border/40 shadow-lg animate-in fade-in-0 zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-4 border-b border-border/40">
          <h2 className="text-xl font-semibold">{t("agentModal.manageAgents")}</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4">
          <Tabs defaultValue="hotel" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="hotel">Hotel Team</TabsTrigger>
              <TabsTrigger value="hustle">Hustle Team</TabsTrigger>
            </TabsList>
            <TabsContent value="hotel" className="mt-4">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Hotel Team Agents</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {agentOptions.Hotel.map((agent) => (
                    <div
                      key={agent}
                      className="flex items-center justify-between p-2 border border-border/40 rounded-md"
                    >
                      <div className="flex items-center gap-2">
                        <HotelLogo className="w-5 h-5" />
                        <span>{agent}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAgent("Hotel", agent)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
            <TabsContent value="hustle" className="mt-4">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Hustle Team Agents</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {agentOptions.Hustle.map((agent) => (
                    <div
                      key={agent}
                      className="flex items-center justify-between p-2 border border-border/40 rounded-md"
                    >
                      <div className="flex items-center gap-2">
                        <HustleLogo className="w-5 h-5" />
                        <span>{agent}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAgent("Hustle", agent)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <form onSubmit={handleSubmit} className="mt-6 pt-4 border-t border-border/40">
            <h3 className="text-lg font-medium mb-4">Add New Agent</h3>
            {error && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="team" className="block mb-2">
                  {t("transactions.team")}
                </Label>
                <Select
                  value={team}
                  onValueChange={(value) => {
                    setTeam(value as "Hotel" | "Hustle")
                    setActiveTab(value.toLowerCase())
                  }}
                >
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

              <div className="md:col-span-2">
                <Label htmlFor="agentName" className="block mb-2">
                  {t("agentModal.agentName")}
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="agentName"
                    type="text"
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    placeholder={t("agentModal.enterAgentName")}
                    className="flex-1"
                  />
                  <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                        {t("common.saving")}
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        {t("agentModal.addAgent")}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </form>

          <div className="flex justify-end mt-6 pt-4 border-t border-border/40">
            <Button onClick={onClose}>{t("common.close")}</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
