"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { useTranslation } from "react-i18next"
import i18n from "../i18n/i18n"

// Import English and Chinese translations
import enTranslations from "../i18n/locales/en.json"
import zhTranslations from "../i18n/locales/zh.json"

export function TranslationManager({
  onClose,
  agentOptions,
}: {
  onClose: () => void
  agentOptions: { Hotel: string[]; Hustle: string[] }
}) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [selectedLanguage, setSelectedLanguage] = useState("zh")
  const [selectedTeam, setSelectedTeam] = useState<"Hotel" | "Hustle">("Hotel")
  const [translations, setTranslations] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  // Load current translations
  useEffect(() => {
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

    loadTranslations()
  }, [selectedLanguage, selectedTeam, agentOptions])

  // Handle translation change
  const handleTranslationChange = (agent: string, value: string) => {
    setTranslations((prev) => ({
      ...prev,
      [agent]: value,
    }))
  }

  // Save translations
  const saveTranslations = () => {
    setIsLoading(true)

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

      // In a real app, you would also save these to your backend/files
      console.log("Updated translations:", translations)
    } catch (error) {
      console.error("Error saving translations:", error)
      toast({
        title: "Error",
        description: "Failed to save translations. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Manage Agent Translations</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex-1">
              <Label htmlFor="language">Language</Label>
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger id="language">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="zh">Chinese</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <Label htmlFor="team">Team</Label>
              <Select value={selectedTeam} onValueChange={(value: "Hotel" | "Hustle") => setSelectedTeam(value)}>
                <SelectTrigger id="team">
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Hotel">Hotel</SelectItem>
                  <SelectItem value="Hustle">Hustle</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border rounded-md p-4 max-h-[300px] overflow-y-auto">
            <div className="space-y-4">
              {Object.keys(translations).length === 0 ? (
                <p className="text-center text-muted-foreground">No agents found for this team.</p>
              ) : (
                Object.entries(translations).map(([agent, translation]) => (
                  <div key={agent} className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={saveTranslations} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Translations"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
