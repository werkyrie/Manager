"use client"

import type React from "react"

import { useState } from "react"
import { X, UserPlus, Users, Globe, Trash2, Check } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { useTranslation } from "react-i18next"
import { HotelLogo, HustleLogo } from "./team-logos"
import i18n from "../i18n/i18n"

// Import English and Chinese translations
import enTranslations from "../i18n/locales/en.json"
import zhTranslations from "../i18n/locales/zh.json"

type UnifiedAgentManagerProps = {
  agentOptions: Record<string, string[]>
  onAddAgent: (team: "Hotel" | "Hustle", agentName: string) => Promise<boolean>
  onDeleteAgent: (team: "Hotel" | "Hustle", agentName: string) => Promise<boolean>
  onClose: () => void
  primaryButtonClass?: string
}

export function UnifiedAgentManager({
  agentOptions,
  onAddAgent,
  onDeleteAgent,
  onClose,
  primaryButtonClass,
}: UnifiedAgentManagerProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("add")
  const [selectedTeam, setSelectedTeam] = useState<"Hotel" | "Hustle">("Hotel")
  const [agentName, setAgentName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedLanguage, setSelectedLanguage] = useState("zh")
  const [translations, setTranslations] = useState<Record<string, string>>({})
  const [isTranslationLoading, setIsTranslationLoading] = useState(false)

  // Load current translations when team or language changes
  const loadTranslations = () => {
    const currentTranslations: Record<string, string> = {}
    const translationSource = selectedLanguage === "zh" ? zhTranslations : enTranslations

    // Get all agents for the selected team
    const agents = agentOptions[selectedTeam] || []

    // Create a mapping of agent name to translation (or empty string if not found)
    agents.forEach((agent) => {
      currentTranslations[agent] = translationSource.agents?.[agent] || ""
    })

    setTranslations(currentTranslations)
  }

  // Handle team change across all tabs
  const handleTeamChange = (value: "Hotel" | "Hustle") => {
    setSelectedTeam(value)
    // Reload translations if on translations tab
    if (activeTab === "translations") {
      loadTranslations()
    }
  }

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    if (value === "translations") {
      loadTranslations()
    }
  }

  // Handle translation change
  const handleTranslationChange = (agent: string, value: string) => {
    setTranslations((prev) => ({
      ...prev,
      [agent]: value,
    }))
  }

  // Save translations
  const saveTranslations = () => {
    setIsTranslationLoading(true)

    try {
      // Get the current translations resource
      const resources = i18n.getResourceBundle(selectedLanguage, "translation")

      // Create a new resource with updated translations
      const updatedResources = {
        ...resources,
        agents: {
          ...resources.agents,
          ...translations,
        },
      }

      // Update the resource bundle
      i18n.addResourceBundle(selectedLanguage, "translation", updatedResources, true, true)

      // Force a language reload to apply changes
      const currentLanguage = i18n.language
      i18n.changeLanguage(currentLanguage)

      toast({
        title: "Translations saved",
        description: "Agent translations have been updated successfully.",
      })
    } catch (error) {
      console.error("Error saving translations:", error)
      toast({
        title: "Error",
        description: "Failed to save translations. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsTranslationLoading(false)
    }
  }

  // Handle add agent form submission
  const handleAddAgent = async (e: React.FormEvent) => {
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
      const success = await onAddAgent(selectedTeam, agentName.trim())

      if (success) {
        toast({
          title: t("agentModal.agentAdded"),
          description: `${agentName} has been added to the ${selectedTeam} team.`,
        })
        setAgentName("")

        // Switch to manage tab to show the new agent
        setActiveTab("manage")
      } else {
        setError(`Agent "${agentName}" already exists in the ${selectedTeam} team.`)
      }
    } catch (err) {
      console.error("Error adding agent:", err)
      setError(err instanceof Error ? err.message : "An error occurred while adding the agent")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle delete agent
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="w-full max-w-3xl border-border/40 shadow-lg animate-in fade-in-0 zoom-in-95 duration-200 max-h-[90vh] flex flex-col my-8">
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

        <div className="p-4 flex-grow overflow-auto">
          <div className="flex items-center space-x-4 mb-4">
            <Label htmlFor="team-select" className="whitespace-nowrap">
              {t("transactions.team")}:
            </Label>
            <Select value={selectedTeam} onValueChange={(value: "Hotel" | "Hustle") => handleTeamChange(value)}>
              <SelectTrigger id="team-select" className="w-40">
                <SelectValue placeholder="Select Team">
                  {selectedTeam && (
                    <div className="flex items-center gap-2">
                      {selectedTeam === "Hotel" ? (
                        <HotelLogo className="w-5 h-5" />
                      ) : (
                        <HustleLogo className="w-5 h-5" />
                      )}
                      <span>{t(`common.${selectedTeam.toLowerCase()}`)}</span>
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

          <Tabs defaultValue="add" value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-0">
              <TabsTrigger value="add" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                {t("agentModal.addAgent")}
              </TabsTrigger>
              <TabsTrigger value="manage" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                {t("agentModal.manageAgents")}
              </TabsTrigger>
              <TabsTrigger value="translations" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Translations
              </TabsTrigger>
            </TabsList>

            {/* Add Agent Tab */}
            <TabsContent value="add" className="mt-4 space-y-4">
              {error && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-md text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleAddAgent} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="agentName">{t("agentModal.agentName")}</Label>
                  <div className="flex gap-2">
                    <Input
                      id="agentName"
                      value={agentName}
                      onChange={(e) => setAgentName(e.target.value)}
                      placeholder={t("agentModal.enterAgentName")}
                      className="flex-1"
                    />
                    <Button
                      type="submit"
                      className={
                        primaryButtonClass ||
                        "bg-gradient-to-r from-gray-900 to-black hover:from-black hover:to-gray-800 text-white shadow-lg dark:shadow-white/5 hover:shadow-black/25 dark:hover:shadow-white/10 transition-all duration-300"
                      }
                      disabled={isSubmitting}
                    >
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
              </form>

              <div className="text-sm text-muted-foreground mt-4 space-y-1">
                <p>• {t("agentModal.tips.uniqueNames")}</p>
                <p>• {t("agentModal.tips.addTranslations")}</p>
                <p>• {t("agentModal.tips.immediateAvailability")}</p>
              </div>
            </TabsContent>

            {/* Manage Agents Tab */}
            <TabsContent value="manage" className="mt-4">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">{selectedTeam} Team Agents</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {agentOptions[selectedTeam].length > 0 ? (
                    agentOptions[selectedTeam].map((agent) => (
                      <div
                        key={agent}
                        className="flex items-center justify-between p-2 border border-border/40 rounded-md"
                      >
                        <div className="flex items-center gap-2">
                          {selectedTeam === "Hotel" ? (
                            <HotelLogo className="w-5 h-5" />
                          ) : (
                            <HustleLogo className="w-5 h-5" />
                          )}
                          <span>{agent}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAgent(selectedTeam, agent)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 text-center py-8 text-muted-foreground">
                      <p>{t("agentModal.noAgents")}</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Translations Tab */}
            <TabsContent value="translations" className="mt-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-4 mb-4">
                  <Label htmlFor="language">Language:</Label>
                  <Select
                    value={selectedLanguage}
                    onValueChange={(value) => {
                      setSelectedLanguage(value)
                      // Reload translations when language changes
                      setTimeout(loadTranslations, 0)
                    }}
                  >
                    <SelectTrigger id="language" className="w-40">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="zh">Chinese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="border rounded-md p-4 max-h-[300px] overflow-y-auto">
                  <div className="space-y-4">
                    {Object.keys(translations).length === 0 ? (
                      <p className="text-center text-muted-foreground">No agents found for this team.</p>
                    ) : (
                      Object.entries(translations).map(([agent, translation]) => (
                        <div key={agent} className="grid grid-cols-2 gap-4 items-center">
                          <div>
                            <Label htmlFor={`translation-${agent}`}>{agent}</Label>
                          </div>
                          <div>
                            <Input
                              id={`translation-${agent}`}
                              value={translation}
                              onChange={(e) => handleTranslationChange(agent, e.target.value)}
                              placeholder={`Enter ${selectedLanguage === "zh" ? "Chinese" : "English"} translation`}
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <Button
                  onClick={saveTranslations}
                  disabled={isTranslationLoading || Object.keys(translations).length === 0}
                  className="bg-purple-600 hover:bg-purple-700 mt-2"
                >
                  {isTranslationLoading ? (
                    <>
                      <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Save Translations
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex justify-end p-4 border-t border-border/40">
          <Button onClick={onClose}>{t("common.close")}</Button>
        </div>
      </Card>
    </div>
  )
}
