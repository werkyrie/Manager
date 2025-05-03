"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { ArrowDown, ArrowUp, Activity, ChevronLeft, DollarSign } from "lucide-react"
import { HotelLogo, HustleLogo } from "./team-logos"

// Import the useTranslation hook
import { useTranslation } from "react-i18next"

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

const AGENT_OPTIONS = {
  Hotel: ["Primo", "Cu", "Kel", "Mar", "Vivian", "Jhe", "Lovely", "Ken", "Kyrie"],
  Hustle: ["Joie", "Elocin", "Aubrey", "Xela"],
}

// Agents View Component
export function AgentsView({
  selectedAgent,
  setSelectedAgent,
  getAgentStats,
  formatTableDate,
}: {
  selectedAgent: string | null
  setSelectedAgent: (agent: string | null) => void
  getAgentStats: (agent: string) => AgentDetails
  formatTableDate: (date: string) => string
}) {
  // Add the translation hook
  const { t } = useTranslation()

  // Function to translate agent names
  const translateAgentName = (name: string) => {
    return t(`agents.${name}`)
  }

  return (
    <div className="space-y-6">
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Hotel Team */}
          <Card className="border-border/40 shadow-md">
            <CardHeader className="pb-0">
              <CardTitle className="text-lg font-medium">{t("dashboard.hotelTeam")}</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {AGENT_OPTIONS.Hotel.map((agent) => {
                  const stats = getAgentStats(agent)
                  return (
                    <button
                      key={agent}
                      onClick={() => setSelectedAgent(agent)}
                      className="bg-muted/50 p-4 rounded-lg hover:bg-muted transition-colors text-left hover:shadow-md"
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <HotelLogo className="w-7 h-7" />
                        </div>
                        <div>
                          <p className="font-medium">{translateAgentName(agent)}</p>
                          <p className="text-sm text-muted-foreground">
                            {t(`common.${stats.team.toLowerCase()}`)} {t("common.team")}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{t("common.transactions")}</span>
                          <span>{stats.stats.totalTransactions}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{t("common.netBalance")}</span>
                          <span>${stats.stats.netBalance.toLocaleString()}</span>
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
                {AGENT_OPTIONS.Hustle.map((agent) => {
                  const stats = getAgentStats(agent)
                  return (
                    <button
                      key={agent}
                      onClick={() => setSelectedAgent(agent)}
                      className="bg-muted/50 p-4 rounded-lg hover:bg-muted transition-colors text-left hover:shadow-md"
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                          <HustleLogo className="w-7 h-7" />
                        </div>
                        <div>
                          <p className="font-medium">{translateAgentName(agent)}</p>
                          <p className="text-sm text-muted-foreground">
                            {t(`common.${stats.team.toLowerCase()}`)} {t("common.team")}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{t("common.transactions")}</span>
                          <span>{stats.stats.totalTransactions}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{t("common.netBalance")}</span>
                          <span>${stats.stats.netBalance.toLocaleString()}</span>
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
  )
}
