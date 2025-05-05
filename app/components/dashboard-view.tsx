"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { ArrowDown, ArrowUp, ArrowUpRight, DollarSign } from "lucide-react"
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

type DashboardFilters = {
  team: string
  month: string
  year: string
}

// Dashboard View Component with Team and Month filters
export function DashboardView({
  transactions,
  filters,
  setFilters,
}: {
  transactions: Transaction[]
  filters: DashboardFilters
  setFilters: React.Dispatch<React.SetStateAction<DashboardFilters>>
}) {
  // Add the translation hook
  const { t } = useTranslation()

  // Replace the month labels
  const MONTHS = [
    { value: "all", label: t("dashboard.allMonths") },
    { value: "01", label: t("months.january") },
    { value: "02", label: t("months.february") },
    { value: "03", label: t("months.march") },
    { value: "04", label: t("months.april") },
    { value: "05", label: t("months.may") },
    { value: "06", label: t("months.june") },
    { value: "07", label: t("months.july") },
    { value: "08", label: t("months.august") },
    { value: "09", label: t("months.september") },
    { value: "10", label: t("months.october") },
    { value: "11", label: t("months.november") },
    { value: "12", label: t("months.december") },
  ]

  // Calculate team statistics
  const hotelTransactions = transactions.filter((t) => t.team === "Hotel")
  const hustleTransactions = transactions.filter((t) => t.team === "Hustle")

  const hotelDeposits = hotelTransactions.filter((t) => t.type === "Deposit").reduce((sum, t) => sum + t.amount, 0)
  const hotelWithdrawals = hotelTransactions
    .filter((t) => t.type === "Withdrawal")
    .reduce((sum, t) => sum + t.amount, 0)
  const hotelNet = hotelDeposits - hotelWithdrawals

  const hustleDeposits = hustleTransactions.filter((t) => t.type === "Deposit").reduce((sum, t) => sum + t.amount, 0)
  const hustleWithdrawals = hustleTransactions
    .filter((t) => t.type === "Withdrawal")
    .reduce((sum, t) => sum + t.amount, 0)
  const hustleNet = hustleDeposits - hustleWithdrawals

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="border-border/40 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium">{t("dashboard.filters")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label className="mb-2 block">{t("dashboard.team")}</Label>
              <Select value={filters.team} onValueChange={(value) => setFilters((prev) => ({ ...prev, team: value }))}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("dashboard.allTeams")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("dashboard.allTeams")}</SelectItem>
                  <SelectItem value="Hotel">{t("common.hotel")}</SelectItem>
                  <SelectItem value="Hustle">{t("common.hustle")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <Label className="mb-2 block">{t("dashboard.month")}</Label>
              <Select
                value={filters.month}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, month: value }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Months" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/40 shadow-md overflow-hidden">
          <CardContent className="p-6 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">{t("dashboard.totalTransactions")}</p>
                <p className="text-3xl font-bold mt-2">{transactions.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <ArrowUpRight className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40 shadow-md overflow-hidden">
          <CardContent className="p-6 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">{t("dashboard.totalDeposits")}</p>
                <p className="text-3xl font-bold mt-2 text-green-600 dark:text-green-400">
                  $
                  {transactions
                    .filter((t) => t.type === "Deposit")
                    .reduce((sum, t) => sum + t.amount, 0)
                    .toLocaleString()}
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
                <p className="text-sm text-muted-foreground font-medium">{t("dashboard.totalWithdrawals")}</p>
                <p className="text-3xl font-bold mt-2 text-red-600 dark:text-red-400">
                  $
                  {transactions
                    .filter((t) => t.type === "Withdrawal")
                    .reduce((sum, t) => sum + t.amount, 0)
                    .toLocaleString()}
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
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">{t("dashboard.netBalance")}</p>
                <p className="text-3xl font-bold mt-2">
                  $
                  {transactions
                    .reduce((sum, t) => sum + (t.type === "Deposit" ? t.amount : -t.amount), 0)
                    .toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Performance Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hotel Team Card */}
        <Card className="border-border/40 shadow-md overflow-hidden">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div className="flex items-center space-x-2">
              <HotelLogo className="w-8 h-8" />
              <CardTitle className="text-lg font-medium">{t("dashboard.hotelTeam")}</CardTitle>
            </div>
            <div className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-1 rounded-md text-xs font-semibold">
              {hotelTransactions.length} {t("common.transactions")}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">{t("dashboard.deposits")}</p>
                  <p className="text-xl font-bold text-green-600 dark:text-green-400">
                    ${hotelDeposits.toLocaleString()}
                  </p>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">{t("dashboard.withdrawals")}</p>
                  <p className="text-xl font-bold text-red-600 dark:text-red-400">
                    ${hotelWithdrawals.toLocaleString()}
                  </p>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">{t("dashboard.netBalance")}</p>
                  <p
                    className={cn(
                      "text-xl font-bold",
                      hotelNet >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400",
                    )}
                  >
                    ${hotelNet.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <p className="text-sm text-muted-foreground">
                  {t("dashboard.topAgent")}:{" "}
                  {hotelTransactions.length > 0
                    ? Object.entries(
                        hotelTransactions.reduce(
                          (acc, t) => {
                            acc[t.agent] = (acc[t.agent] || 0) + (t.type === "Deposit" ? t.amount : -t.amount)
                            return acc
                          },
                          {} as Record<string, number>,
                        ),
                      ).sort((a, b) => b[1] - a[1])[0]?.[0] || t("common.none")
                    : t("common.none")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hustle Team Card */}
        <Card className="border-border/40 shadow-md overflow-hidden">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div className="flex items-center space-x-2">
              <HustleLogo className="w-8 h-8" />
              <CardTitle className="text-lg font-medium">{t("dashboard.hustleTeam")}</CardTitle>
            </div>
            <div className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 px-2 py-1 rounded-md text-xs font-semibold">
              {hustleTransactions.length} {t("common.transactions")}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">{t("dashboard.deposits")}</p>
                  <p className="text-xl font-bold text-green-600 dark:text-green-400">
                    ${hustleDeposits.toLocaleString()}
                  </p>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">{t("dashboard.withdrawals")}</p>
                  <p className="text-xl font-bold text-red-600 dark:text-red-400">
                    ${hustleWithdrawals.toLocaleString()}
                  </p>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">{t("dashboard.netBalance")}</p>
                  <p
                    className={cn(
                      "text-xl font-bold",
                      hustleNet >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400",
                    )}
                  >
                    ${hustleNet.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <p className="text-sm text-muted-foreground">
                  {t("dashboard.topAgent")}:{" "}
                  {hustleTransactions.length > 0
                    ? Object.entries(
                        hustleTransactions.reduce(
                          (acc, t) => {
                            acc[t.agent] = (acc[t.agent] || 0) + (t.type === "Deposit" ? t.amount : -t.amount)
                            return acc
                          },
                          {} as Record<string, number>,
                        ),
                      ).sort((a, b) => b[1] - a[1])[0]?.[0] || t("common.none")
                    : t("common.none")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
