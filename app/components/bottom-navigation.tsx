"use client"

import { BarChart3, Table2, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"

type ViewType = "dashboard" | "tables" | "agents" | "notes"

interface BottomNavigationProps {
  currentView: ViewType
  setCurrentView: (view: ViewType) => void
}

export function BottomNavigation({ currentView, setCurrentView }: BottomNavigationProps) {
  const { t } = useTranslation()

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white dark:bg-gray-800 border-t border-border/40 shadow-lg">
      <div className="flex justify-around items-center h-16">
        <button
          onClick={() => setCurrentView("dashboard")}
          className={cn(
            "flex flex-col items-center justify-center w-full h-full",
            currentView === "dashboard"
              ? "text-primary bg-muted/50"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/30",
          )}
        >
          <BarChart3 className="w-5 h-5 mb-1" />
          <span className="text-xs">{t("nav.dashboard")}</span>
        </button>

        <button
          onClick={() => setCurrentView("tables")}
          className={cn(
            "flex flex-col items-center justify-center w-full h-full",
            currentView === "tables"
              ? "text-primary bg-muted/50"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/30",
          )}
        >
          <Table2 className="w-5 h-5 mb-1" />
          <span className="text-xs">{t("nav.transactions")}</span>
        </button>

        <button
          onClick={() => setCurrentView("agents")}
          className={cn(
            "flex flex-col items-center justify-center w-full h-full",
            currentView === "agents"
              ? "text-primary bg-muted/50"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/30",
          )}
        >
          <Users className="w-5 h-5 mb-1" />
          <span className="text-xs">{t("nav.agents")}</span>
        </button>
      </div>
    </div>
  )
}
