"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { ArrowDown, ArrowUp, Activity, ChevronLeft, DollarSign, Users, Wallet, BarChart3 } from "lucide-react"
import { HotelLogo, HustleLogo } from "./team-logos"
import { Button } from "@/components/ui/button"

// Import the useTranslation hook
import { useTranslation } from "react-i18next"

// Add keyframe animation for glowing effect
const glowAnimation = `
  @keyframes glow {
    0% {
      box-shadow: 0 0 5px rgba(59, 130, 246, 0.5);
    }
    50% {
      box-shadow: 0 0 15px rgba(59, 130, 246, 0.8);
    }
    100% {
      box-shadow: 0 0 5px rgba(59, 130, 246, 0.5);
    }
  }

  @keyframes orangeGlow {
    0% {
      box-shadow: 0 0 5px rgba(249, 115, 22, 0.5);
    }
    50% {
      box-shadow: 0 0 15px rgba(249, 115, 22, 0.8);
    }
    100% {
      box-shadow: 0 0 5px rgba(249, 115, 22, 0.5);
    }
  }

  .glow-blue {
    animation: glow 3s infinite ease-in-out;
  }

  .glow-orange {
    animation: orangeGlow 3s infinite ease-in-out;
  }

  @keyframes scaleOnPress {
    0% { transform: scale(1); }
    50% { transform: scale(0.95); }
    100% { transform: scale(1); }
  }

  .scale-on-press:active {
    animation: scaleOnPress 0.2s ease-in-out;
  }
`

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
}

type AgentDetails = {
  name: string
  team: "Hotel" | "Hustle"
  stats: {
    totalTransactions: number
    totalDeposits: number
    totalWithdrawals: number
    netBalance: number
    transactions: Transaction[]
  }
}

// Agents View Component
export function AgentsView({
  selectedAgent,
  setSelectedAgent,
  getAgentStats,
  formatTableDate,
  agentOptions = { Hotel: [], Hustle: [] },
  onAddAgent,
  onManageAgents,
  onManageTranslations,
  primaryButtonClass,
}: {
  selectedAgent: string | null
  setSelectedAgent: (agent: string | null) => void
  getAgentStats: (agent: string) => AgentDetails
  formatTableDate: (date: string) => string
  agentOptions?: { Hotel: string[]; Hustle: string[] }
  onAddAgent: () => void
  onManageAgents: () => void
  onManageTranslations: () => void
  primaryButtonClass?: string
}) {
  // Add the translation hook
  const { t, i18n } = useTranslation()
  const [isMobile, setIsMobile] = useState(false)

  // Function to translate agent names - FIXED VERSION
  const translateAgentName = (name: string) => {
    // Check if the translation exists
    const translationKey = `agents.${name}`
    const hasTranslation = i18n.exists(translationKey)

    // If translation exists, use it; otherwise, use the original name
    return hasTranslation ? t(translationKey) : name
  }

  // Check if we're on mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)

    return () => {
      window.removeEventListener("resize", checkIfMobile)
    }
  }, [])

  // Function to get agent icon color based on team
  const getAgentIconColor = (team: string, isTopPerformer: boolean) => {
    if (team === "Hotel") {
      return isTopPerformer
        ? "bg-gradient-to-br from-blue-400 to-blue-600 dark:from-blue-500 dark:to-blue-700"
        : "bg-gradient-to-br from-blue-300 to-blue-500 dark:from-blue-600 dark:to-blue-800"
    } else {
      return isTopPerformer
        ? "bg-gradient-to-br from-orange-400 to-orange-600 dark:from-orange-500 dark:to-orange-700"
        : "bg-gradient-to-br from-orange-300 to-orange-500 dark:from-orange-600 dark:to-orange-800"
    }
  }

  // Prepare agent data for both teams
  const prepareAgentData = () => {
    const hotelAgents = (agentOptions?.Hotel || [])
      .map((agent) => {
        const stats = getAgentStats(agent)
        return { agent, stats: stats.stats, team: stats.team }
      })
      .sort((a, b) => b.stats.netBalance - a.stats.netBalance)

    const hustleAgents = (agentOptions?.Hustle || [])
      .map((agent) => {
        const stats = getAgentStats(agent)
        return { agent, stats: stats.stats, team: stats.team }
      })
      .sort((a, b) => b.stats.netBalance - a.stats.netBalance)

    return { hotelAgents, hustleAgents }
  }

  const { hotelAgents, hustleAgents } = prepareAgentData()

  return (
    <div className="space-y-6">
      <style jsx global>
        {glowAnimation}
      </style>
      {selectedAgent ? (
        // Agent Details View
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <button
              onClick={() => setSelectedAgent(null)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>{t("agents.backToAllAgents")}</span>
            </button>
          </div>

          {/* Agent Header */}
          {(() => {
            const agentData = getAgentStats(selectedAgent)
            return (
              <>
                <Card className="border-border/40 shadow-md overflow-hidden">
                  <CardContent className="p-6 relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent"></div>
                    <div className="relative z-10 flex items-center space-x-4">
                      <div
                        className={cn(
                          "w-16 h-16 rounded-full flex items-center justify-center",
                          agentData.team === "Hotel"
                            ? "bg-blue-100 dark:bg-blue-900/30"
                            : "bg-orange-100 dark:bg-orange-900/30",
                        )}
                      >
                        {agentData.team === "Hotel" ? (
                          <HotelLogo className="w-10 h-10" />
                        ) : (
                          <HustleLogo className="w-10 h-10" />
                        )}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">{translateAgentName(agentData.name)}</h2>
                        <p className="text-muted-foreground">
                          {t(`common.${agentData.team.toLowerCase()}`)} {t("common.team")}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="border-border/40 shadow-md overflow-hidden">
                    <CardContent className="p-6 relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent"></div>
                      <div className="relative z-10 flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground font-medium">{t("agents.totalTransactions")}</p>
                          <p className="text-3xl font-bold mt-2">{agentData.stats.totalTransactions}</p>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                          <Activity className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border/40 shadow-md overflow-hidden">
                    <CardContent className="p-6 relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent"></div>
                      <div className="relative z-10 flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground font-medium">{t("agents.totalDeposits")}</p>
                          <p className="text-3xl font-bold mt-2 text-green-600 dark:text-green-400">
                            ${agentData.stats.totalDeposits.toLocaleString()}
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                          <ArrowUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border/40 shadow-md overflow-hidden">
                    <CardContent className="p-6 relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent"></div>
                      <div className="relative z-10 flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground font-medium">{t("agents.totalWithdrawals")}</p>
                          <p className="text-3xl font-bold mt-2 text-red-600 dark:text-red-400">
                            ${agentData.stats.totalWithdrawals.toLocaleString()}
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                          <ArrowDown className="w-6 h-6 text-red-600 dark:text-red-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border/40 shadow-md overflow-hidden">
                    <CardContent className="p-6 relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent"></div>
                      <div className="relative z-10 flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground font-medium">{t("agents.netBalance")}</p>
                          <p className="text-3xl font-bold mt-2">${agentData.stats.netBalance.toLocaleString()}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                          <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* All Transactions */}
                <Card className="border-border/40 shadow-md">
                  <CardHeader className="pb-0">
                    <CardTitle className="text-lg font-medium">{t("agents.allTransactions")}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              {t("transactions.date")}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              {t("transactions.amount")}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              {t("transactions.type")}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              {t("agents.shopId")}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              {t("agents.notes")}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {agentData.stats.transactions.map((transaction) => (
                            <tr key={transaction.id} className="hover:bg-muted/50 transition-colors">
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
                              <td className="px-4 py-3 whitespace-nowrap">{transaction.shopId}</td>
                              <td className="px-4 py-3">{transaction.notes || "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </>
            )
          })()}
        </div>
      ) : (
        // Agents Grid View
        <div className="space-y-6">
          {/* Unified Agent Management Button */}
          <div className="flex justify-end">
            <Button
              onClick={onManageAgents}
              className={
                primaryButtonClass ||
                "bg-gradient-to-r from-gray-900 to-black hover:from-black hover:to-gray-800 text-white shadow-lg dark:shadow-white/5 hover:shadow-black/25 dark:hover:shadow-white/10 transition-all duration-300"
              }
            >
              <Users className="w-4 h-4 mr-2" />
              {t("agentModal.manageAgents")}
            </Button>
          </div>

          {isMobile ? (
            // Mobile App Icon View
            <div className="space-y-6">
              {/* Hotel Team */}
              <div>
                <h3 className="text-lg font-semibold mb-3 px-1">{t("dashboard.hotelTeam")}</h3>
                <div className="grid grid-cols-3 gap-3">
                  {hotelAgents.map((item, index) => {
                    const isTopPerformer = index === 0
                    return (
                      <button
                        key={item.agent}
                        onClick={() => setSelectedAgent(item.agent)}
                        className="scale-on-press focus:outline-none"
                      >
                        <div className="flex flex-col items-center">
                          <div
                            className={cn(
                              "w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg relative",
                              getAgentIconColor("Hotel", isTopPerformer),
                              isTopPerformer ? "glow-blue" : "",
                            )}
                          >
                            <div className="absolute inset-0 bg-white/10 rounded-2xl"></div>
                            <div className="relative">
                              <HotelLogo className="w-10 h-10 text-white" />
                              {isTopPerformer && (
                                <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                                  1
                                </div>
                              )}
                            </div>
                          </div>
                          <span className="mt-2 text-sm font-medium truncate w-20 text-center">
                            {translateAgentName(item.agent)}
                          </span>
                          <span
                            className={cn(
                              "text-xs",
                              item.stats.netBalance > 0
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400",
                            )}
                          >
                            ${item.stats.netBalance.toLocaleString()}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Hustle Team */}
              <div>
                <h3 className="text-lg font-semibold mb-3 px-1">{t("dashboard.hustleTeam")}</h3>
                <div className="grid grid-cols-3 gap-3">
                  {hustleAgents.map((item, index) => {
                    const isTopPerformer = index === 0
                    return (
                      <button
                        key={item.agent}
                        onClick={() => setSelectedAgent(item.agent)}
                        className="scale-on-press focus:outline-none"
                      >
                        <div className="flex flex-col items-center">
                          <div
                            className={cn(
                              "w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg relative",
                              getAgentIconColor("Hustle", isTopPerformer),
                              isTopPerformer ? "glow-orange" : "",
                            )}
                          >
                            <div className="absolute inset-0 bg-white/10 rounded-2xl"></div>
                            <div className="relative">
                              <HustleLogo className="w-10 h-10 text-white" />
                              {isTopPerformer && (
                                <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                                  1
                                </div>
                              )}
                            </div>
                          </div>
                          <span className="mt-2 text-sm font-medium truncate w-20 text-center">
                            {translateAgentName(item.agent)}
                          </span>
                          <span
                            className={cn(
                              "text-xs",
                              item.stats.netBalance > 0
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400",
                            )}
                          >
                            ${item.stats.netBalance.toLocaleString()}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Quick Stats Icons */}
              <div>
                <h3 className="text-lg font-semibold mb-3 px-1">{t("agents.quickStats")}</h3>
                <div className="grid grid-cols-3 gap-3">
                  {/* Top Performer */}
                  <div className="flex flex-col items-center">
                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-purple-400 to-purple-600 dark:from-purple-500 dark:to-purple-700 relative">
                      <div className="absolute inset-0 bg-white/10 rounded-2xl"></div>
                      <BarChart3 className="w-10 h-10 text-white" />
                    </div>
                    <span className="mt-2 text-sm font-medium text-center">{t("agents.topPerformer")}</span>
                    <span className="text-xs text-purple-600 dark:text-purple-400">
                      {hotelAgents.length > 0 ? translateAgentName(hotelAgents[0].agent) : "-"}
                    </span>
                  </div>

                  {/* Total Agents */}
                  <div className="flex flex-col items-center">
                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-green-400 to-green-600 dark:from-green-500 dark:to-green-700 relative">
                      <div className="absolute inset-0 bg-white/10 rounded-2xl"></div>
                      <Users className="w-10 h-10 text-white" />
                    </div>
                    <span className="mt-2 text-sm font-medium text-center">{t("agents.totalAgents")}</span>
                    <span className="text-xs text-green-600 dark:text-green-400">
                      {hotelAgents.length + hustleAgents.length}
                    </span>
                  </div>

                  {/* Total Balance */}
                  <div className="flex flex-col items-center">
                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-blue-400 to-blue-600 dark:from-blue-500 dark:to-blue-700 relative">
                      <div className="absolute inset-0 bg-white/10 rounded-2xl"></div>
                      <Wallet className="w-10 h-10 text-white" />
                    </div>
                    <span className="mt-2 text-sm font-medium text-center">{t("agents.totalBalance")}</span>
                    <span className="text-xs text-blue-600 dark:text-blue-400">
                      $
                      {[...hotelAgents, ...hustleAgents]
                        .reduce((sum, agent) => sum + agent.stats.netBalance, 0)
                        .toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Desktop Card View
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Hotel Team */}
              <Card className="border-border/40 shadow-md">
                <CardHeader className="pb-0">
                  <CardTitle className="text-lg font-medium">{t("dashboard.hotelTeam")}</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {hotelAgents.map((item, index) => {
                      const isTopPerformer = index === 0
                      return (
                        <button
                          key={item.agent}
                          onClick={() => setSelectedAgent(item.agent)}
                          className={cn(
                            "p-4 rounded-lg hover:bg-muted transition-colors text-left hover:shadow-md",
                            isTopPerformer
                              ? "bg-blue-100/50 dark:bg-blue-900/30 border-2 border-blue-300 dark:border-blue-700 glow-blue"
                              : "bg-muted/50",
                          )}
                        >
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                              <HotelLogo className="w-7 h-7" />
                            </div>
                            <div className="relative">
                              <p className="font-medium">{translateAgentName(item.agent)}</p>
                              <p className="text-sm text-muted-foreground">
                                {t(`common.${item.team.toLowerCase()}`)} {t("common.team")}
                              </p>
                              {isTopPerformer && (
                                <div className="absolute -right-7 -top-2 bg-blue-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                                  #1
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">{t("common.transactions")}</span>
                              <span>{item.stats.totalTransactions}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">{t("common.netBalance")}</span>
                              <span className={isTopPerformer ? "font-bold text-blue-600 dark:text-blue-400" : ""}>
                                ${item.stats.netBalance.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Hustle Team */}
              <Card className="border-border/40 shadow-md">
                <CardHeader className="pb-0">
                  <CardTitle className="text-lg font-medium">{t("dashboard.hustleTeam")}</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {hustleAgents.map((item, index) => {
                      const isTopPerformer = index === 0
                      return (
                        <button
                          key={item.agent}
                          onClick={() => setSelectedAgent(item.agent)}
                          className={cn(
                            "p-4 rounded-lg hover:bg-muted transition-colors text-left hover:shadow-md",
                            isTopPerformer
                              ? "bg-orange-100/50 dark:bg-orange-900/30 border-2 border-orange-300 dark:border-orange-700 glow-orange"
                              : "bg-muted/50",
                          )}
                        >
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                              <HustleLogo className="w-7 h-7" />
                            </div>
                            <div className="relative">
                              <p className="font-medium">{translateAgentName(item.agent)}</p>
                              <p className="text-sm text-muted-foreground">
                                {t(`common.${item.team.toLowerCase()}`)} {t("common.team")}
                              </p>
                              {isTopPerformer && (
                                <div className="absolute -right-7 -top-2 bg-orange-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                                  #1
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">{t("common.transactions")}</span>
                              <span>{item.stats.totalTransactions}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">{t("common.netBalance")}</span>
                              <span className={isTopPerformer ? "font-bold text-orange-600 dark:text-orange-400" : ""}>
                                ${item.stats.netBalance.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
