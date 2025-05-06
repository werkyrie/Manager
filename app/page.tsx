"use client"

import { useState, useEffect } from "react"
import {
  Wallet,
  BarChart3,
  Table2,
  UserRound,
  Moon,
  Sun,
  Menu,
  RefreshCw,
  Check,
  FileUp,
  FileDown,
  StickyNote,
  Loader2,
  Server,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"

// Import toast components
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { ToastAction } from "@/components/ui/toast"

// Import view components
import { DashboardView } from "./components/dashboard-view"
import { TransactionModal } from "./components/transaction-modal"
import { TransactionsView } from "./components/transactions-view"
import { AgentsView } from "./components/agents-view"
import { CSVImport } from "./components/csv-import"
import { CSVExport } from "./components/csv-export"
import { NotesView } from "./components/notes-view"
import { Button } from "@/components/ui/button"
import { BottomNavigation } from "./components/bottom-navigation"

// Import the useTranslation hook and LanguageSwitcher component
import { useTranslation } from "react-i18next"
import { LanguageSwitcher } from "./components/language-switcher"

// Import Firebase services
import {
  fetchTransactions,
  addTransaction as addTransactionToFirebase,
  updateTransaction as updateTransactionInFirebase,
  deleteTransaction as deleteTransactionFromFirebase,
  type Transaction,
  fetchAgents,
  addAgent as addAgentToFirebase,
  deleteAgent as deleteAgentFromFirebase,
} from "./lib/firebase-service"

// Import Protected Route
import ProtectedRoute from "./components/protected-route"

// Import UserProfile component
import { UserProfile } from "./components/user-profile"

// Add the missing import if needed
import { getAuth, onAuthStateChanged } from "firebase/auth"

// Update the Page component to use the new UnifiedAgentManager component
// First, add the import at the top with other imports:
import { UnifiedAgentManager } from "./components/unified-agent-manager"

// Types
type DashboardFilters = {
  team: string
  month: string
  year: string
}

type SortDirection = "asc" | "desc" | null
type SortField = "date" | "amount" | null

// Constants
const agentOptionsInitialState: Record<string, string[]> = {
  Hotel: ["Primo", "Cu", "Kel", "Mar", "Vivian", "Jhe", "Lovely", "Ken", "Kyrie"],
  Hustle: ["Joie", "Elocin", "Aubrey", "Xela"],
}

// Sample transactions
const SAMPLE_TRANSACTIONS: Transaction[] = [
  {
    id: 1,
    team: "Hotel",
    agent: "Primo",
    date: "2023-01-05",
    shopId: "SH001",
    amount: 500,
    type: "Deposit",
    notes: "January deposit",
    receipt: null,
  },
  {
    id: 2,
    team: "Hotel",
    agent: "Cu",
    date: "2023-01-15",
    shopId: "SH002",
    amount: 300,
    type: "Withdrawal",
    notes: "January expense",
    receipt: null,
  },
  {
    id: 3,
    team: "Hustle",
    agent: "Joie",
    date: "2023-02-05",
    shopId: "SH003",
    amount: 750,
    type: "Deposit",
    notes: "February revenue",
    receipt: null,
  },
  {
    id: 4,
    team: "Hotel",
    agent: "Kel",
    date: "2023-02-10",
    shopId: "SH001",
    amount: 200,
    type: "Deposit",
    notes: "February funds",
    receipt: null,
  },
  {
    id: 5,
    team: "Hustle",
    agent: "Elocin",
    date: "2023-03-12",
    shopId: "SH004",
    amount: 425,
    type: "Withdrawal",
    notes: "March expenses",
    receipt: null,
  },
  {
    id: 6,
    team: "Hotel",
    agent: "Thac",
    date: "2023-03-15",
    shopId: "SH005",
    amount: 600,
    type: "Deposit",
    notes: "March payment",
    receipt: null,
  },
  {
    id: 7,
    team: "Hotel",
    agent: "Primo",
    date: "2023-04-10",
    shopId: "SH001",
    amount: 480,
    type: "Deposit",
    notes: "April deposit",
    receipt: null,
  },
  {
    id: 8,
    team: "Hustle",
    agent: "Aubrey",
    date: "2023-04-20",
    shopId: "SH003",
    amount: 550,
    type: "Deposit",
    notes: "April revenue",
    receipt: null,
  },
  {
    id: 9,
    team: "Hotel",
    agent: "Cu",
    date: "2023-05-05",
    shopId: "SH002",
    amount: 320,
    type: "Withdrawal",
    notes: "May expense",
    receipt: null,
  },
  {
    id: 10,
    team: "Hustle",
    agent: "Xela",
    date: "2023-05-15",
    shopId: "SH004",
    amount: 680,
    type: "Deposit",
    notes: "May revenue",
    receipt: null,
  },
]

// Inside the Page component, add the useTranslation hook
export default function Page() {
  // Toast hook
  const { toast } = useToast()
  // Add the translation hook
  const { t } = useTranslation()

  // State
  const [darkMode, setDarkMode] = useState(true)
  const [sideNavOpen, setSideNavOpen] = useState(false)
  const [currentView, setCurrentView] = useState<"dashboard" | "tables" | "agents" | "notes">("dashboard")
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [nextId, setNextId] = useState(25)
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTeam, setSelectedTeam] = useState<string>("")
  const [selectedType, setSelectedType] = useState<string>("")
  const [sortField, setSortField] = useState<SortField>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  // Replace them with a single state variable:
  const [showAgentManager, setShowAgentManager] = useState(false)
  const [agentOptions, setAgentOptions] = useState<Record<string, string[]>>(agentOptionsInitialState)
  // Add this state in the Page component

  // Add state for background operations
  const [backgroundOperations, setBackgroundOperations] = useState<{
    adding: boolean
    editing: boolean
    deleting: boolean
  }>({
    adding: false,
    editing: false,
    deleting: false,
  })

  // Dashboard filters
  const [dashboardFilters, setDashboardFilters] = useState<DashboardFilters>({
    team: "all",
    month: "all",
    year: new Date().getFullYear().toString(),
  })

  // Move these functions inside the component
  const addAgentToTeam = async (team: "Hotel" | "Hustle", agentName: string) => {
    try {
      // Check if agent already exists locally
      if (agentOptions[team].includes(agentName)) {
        console.log(`${agentName} already exists in ${team} team`)
        return false
      }

      // Optimistically update UI
      setAgentOptions((prev) => ({
        ...prev,
        [team]: [...prev[team], agentName],
      }))

      // Add agent to Firebase
      const success = await addAgentToFirebase(team, agentName)

      if (!success) {
        // Revert UI if operation failed
        setAgentOptions((prev) => ({
          ...prev,
          [team]: prev[team].filter((agent) => agent !== agentName),
        }))

        toast({
          title: t("agentModal.addError"),
          description: t("agentModal.addError"),
          variant: "destructive",
        })
        return false
      }

      console.log(`Added ${agentName} to ${team} team`)
      return success
    } catch (error) {
      console.error("Error adding agent:", error)

      // Revert UI on error
      setAgentOptions((prev) => ({
        ...prev,
        [team]: prev[team].filter((agent) => agent !== agentName),
      }))

      toast({
        title: t("agentModal.addError"),
        description: t("agentModal.addError"),
        variant: "destructive",
      })
      return false
    }
  }

  // Add a new function to delete agents
  const deleteAgentFromTeam = async (team: "Hotel" | "Hustle", agentName: string) => {
    try {
      // Check if agent is used in any transactions
      const agentTransactions = transactions.filter((t) => t.team === team && t.agent === agentName)

      if (agentTransactions.length > 0) {
        toast({
          title: t("agentModal.cannotDelete"),
          description: t("agentModal.hasTransactions", { count: agentTransactions.length }),
          variant: "destructive",
        })
        return false
      }

      // Optimistically update UI
      const originalAgents = [...agentOptions[team]]
      setAgentOptions((prev) => ({
        ...prev,
        [team]: prev[team].filter((agent) => agent !== agentName),
      }))

      // Delete agent from Firebase
      const success = await deleteAgentFromFirebase(team, agentName)

      if (!success) {
        // Revert UI if operation failed
        setAgentOptions((prev) => ({
          ...prev,
          [team]: originalAgents,
        }))

        toast({
          title: t("agentModal.deleteError"),
          description: t("agentModal.deleteError"),
          variant: "destructive",
        })
        return false
      }

      toast({
        title: t("agentModal.agentDeleted"),
        description: t("agentModal.agentDeletedDesc", { name: agentName, team: t(`common.${team.toLowerCase()}`) }),
      })
      return success
    } catch (error) {
      console.error("Error deleting agent:", error)

      // Revert UI on error
      toast({
        title: t("agentModal.deleteError"),
        description: t("agentModal.deleteError"),
        variant: "destructive",
      })
      return false
    }
  }

  // Initialize
  useEffect(() => {
    // Set dark mode by default
    setDarkMode(true)
    document.documentElement.classList.add("dark")

    const auth = getAuth()

    // Define the loadData function
    const loadData = async () => {
      try {
        setIsLoading(true)

        // Fetch transactions and agents in parallel
        const [fetchedTransactions, fetchedAgents] = await Promise.all([fetchTransactions(), fetchAgents()])

        setTransactions(fetchedTransactions)

        // Merge default agents with fetched agents to ensure we always have some agents
        const mergedAgents = {
          Hotel: [...new Set([...agentOptionsInitialState.Hotel, ...(fetchedAgents.Hotel || [])])],
          Hustle: [...new Set([...agentOptionsInitialState.Hustle, ...(fetchedAgents.Hustle || [])])],
        }
        setAgentOptions(mergedAgents)

        // Set the next ID based on the highest ID in the fetched transactions
        if (fetchedTransactions.length > 0) {
          const maxId = Math.max(...fetchedTransactions.map((t) => t.id))
          setNextId(maxId + 1)
        }
      } catch (error) {
        console.error("Error loading data:", error)
        toast({
          title: t("common.error"),
          description: t("common.loadError"),
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    // Use onAuthStateChanged to trigger data loading only when the user is authenticated
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("User is authenticated, loading data")
        loadData()
      } else {
        console.log("User is not authenticated, skipping data fetch")
        setTransactions([]) // Clear transactions if user is logged out
        setIsLoading(false) // Ensure loading is set to false
      }
    })

    // Clean up the subscription
    return () => unsubscribe()
  }, [toast, t])

  // Apply dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [darkMode])

  // Format date as MM/DD
  const formatTableDate = (dateString: string) => {
    const date = new Date(dateString)
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  // Sort transactions
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : prev === "desc" ? null : "asc"))
      if (sortDirection === "desc") {
        setSortField(null)
      }
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Filter and sort transactions
  const getFilteredAndSortedTransactions = () => {
    let filtered = [...transactions]

    // Apply filters
    if (searchQuery) {
      filtered = filtered.filter(
        (t) =>
          t.agent.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.shopId.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.notes?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    if (selectedTeam && selectedTeam !== "all") {
      filtered = filtered.filter((t) => t.team === selectedTeam)
    }

    if (selectedType && selectedType !== "all") {
      filtered = filtered.filter((t) => t.type === selectedType)
    }

    // Apply sorting
    if (sortField && sortDirection) {
      filtered.sort((a, b) => {
        if (sortField === "date") {
          const dateA = new Date(a.date).getTime()
          const dateB = new Date(b.date).getTime()
          return sortDirection === "asc" ? dateA - dateB : dateB - dateA
        } else if (sortField === "amount") {
          return sortDirection === "asc" ? a.amount - b.amount : b.amount - a.amount
        }
        return 0
      })
    }

    return filtered
  }

  // Filter dashboard transactions
  const getFilteredDashboardTransactions = () => {
    let filtered = [...transactions]

    if (dashboardFilters.team !== "all") {
      filtered = filtered.filter((t) => t.team === dashboardFilters.team)
    }

    if (dashboardFilters.month !== "all") {
      filtered = filtered.filter((t) => {
        const transactionMonth = t.date.split("-")[1]
        return transactionMonth === dashboardFilters.month
      })
    }

    return filtered
  }

  // CRUD operations with toast notifications and Firebase integration
  const addTransaction = async (transaction: Omit<Transaction, "id" | "firebaseId">) => {
    try {
      // Create a temporary ID for optimistic UI update
      const tempId = Date.now() + Math.floor(Math.random() * 1000) // Add randomness to ensure uniqueness
      const actualId = nextId

      // Create a temporary transaction object for the UI
      const tempTransaction: Transaction = {
        ...transaction,
        id: tempId,
      }

      // Optimistically update the UI immediately
      setTransactions((prev) => [...prev, tempTransaction])

      // Close the modal immediately to improve perceived performance
      setShowTransactionModal(false)

      // Set background operation flag
      setBackgroundOperations((prev) => ({ ...prev, adding: true }))

      // Actually save the transaction in the background
      try {
        const newTransaction = await addTransactionToFirebase({
          ...transaction,
          id: actualId,
        })

        // Update the transactions list with the real transaction from Firebase
        setTransactions((prev) => prev.map((t) => (t.id === tempId ? newTransaction : t)))

        setNextId((prev) => prev + 1)

        // Show success toast
        toast({
          title: t("transactionModal.transactionAdded"),
          description: t("transactionModal.transactionAddedDesc", {
            type: t(`common.${transaction.type.toLowerCase()}`),
          }),
          action: (
            <ToastAction altText={t("common.close")}>
              <Check className="h-4 w-4" />
            </ToastAction>
          ),
        })

        return newTransaction
      } catch (error) {
        console.error("Error adding transaction:", error)

        // Remove the temporary transaction on error
        setTransactions((prev) => prev.filter((t) => t.id !== tempId))

        toast({
          title: t("common.error"),
          description: t("transactionModal.addError"),
          variant: "destructive",
        })
        throw error
      } finally {
        setBackgroundOperations((prev) => ({ ...prev, adding: false }))
      }
    } catch (error) {
      console.error("Error in add transaction flow:", error)
      toast({
        title: t("common.error"),
        description: t("transactionModal.addError"),
        variant: "destructive",
      })
      throw error
    }
  }

  const updateTransaction = async (transaction: Transaction) => {
    try {
      // Store the original transaction for rollback if needed
      const originalTransactions = [...transactions]
      const originalTransaction = originalTransactions.find((t) => t.id === transaction.id)

      if (!originalTransaction) {
        throw new Error("Transaction not found")
      }

      // Optimistically update the UI
      setTransactions((prev) => prev.map((t) => (t.id === transaction.id ? transaction : t)))

      // Close the modal immediately
      setEditingTransaction(null)
      setShowTransactionModal(false)

      // Set background operation flag
      setBackgroundOperations((prev) => ({ ...prev, editing: true }))

      try {
        // Check if firebaseId exists, if not, try to find it
        if (!transaction.firebaseId) {
          console.log("Transaction missing firebaseId, searching in existing transactions...")
          // Find the existing transaction to get its firebaseId
          const existingTransaction = originalTransactions.find((t) => t.id === transaction.id)

          if (existingTransaction && existingTransaction.firebaseId) {
            console.log("Found matching transaction with firebaseId:", existingTransaction.firebaseId)
            transaction.firebaseId = existingTransaction.firebaseId
          } else {
            console.error("Could not find transaction with id:", transaction.id)
            throw new Error("Transaction doesn't have a Firestore ID and couldn't be found in local state")
          }
        }

        const updatedTransaction = await updateTransactionInFirebase(transaction)

        // Update the transactions state with the updated transaction from Firebase
        setTransactions((prev) => prev.map((t) => (t.id === transaction.id ? updatedTransaction : t)))

        // Show success toast
        toast({
          title: t("transactionModal.transactionUpdated"),
          description: t("transactionModal.transactionUpdatedDesc"),
          action: (
            <ToastAction altText={t("common.close")}>
              <Check className="h-4 w-4" />
            </ToastAction>
          ),
        })

        return updatedTransaction
      } catch (error) {
        console.error("Error updating transaction:", error)

        // Revert to original state on error
        setTransactions(originalTransactions)

        toast({
          title: t("common.error"),
          description: error instanceof Error ? error.message : t("transactionModal.updateError"),
          variant: "destructive",
        })

        throw error
      } finally {
        setBackgroundOperations((prev) => ({ ...prev, editing: false }))
      }
    } catch (error) {
      console.error("Error in update transaction flow:", error)
      toast({
        title: t("common.error"),
        description: "Failed to update transaction. Please try again.",
        variant: "destructive",
      })
      throw error
    }
  }

  const deleteTransaction = async (id: number) => {
    // Store the transaction for potential rollback
    const transactionToDelete = transactions.find((t) => t.id === id)

    if (!transactionToDelete) {
      toast({
        title: t("common.error"),
        description: t("transactionModal.notFound"),
        variant: "destructive",
      })
      return
    }

    // Optimistically update UI
    setTransactions((prev) => prev.filter((t) => t.id !== id))

    // Set background operation flag
    setBackgroundOperations((prev) => ({ ...prev, deleting: true }))

    try {
      // Delete from Firebase in the background
      await deleteTransactionFromFirebase(transactionToDelete)

      // Show success toast
      toast({
        title: t("transactionModal.transactionDeleted"),
        description: t("transactionModal.transactionDeletedDesc"),
        action: (
          <ToastAction altText={t("common.close")}>
            <Check className="h-4 w-4" />
          </ToastAction>
        ),
      })
    } catch (error) {
      console.error("Error deleting transaction:", error)

      // Restore the transaction on error
      setTransactions((prev) => [...prev, transactionToDelete])

      toast({
        title: t("common.error"),
        description: t("transactionModal.deleteError"),
        variant: "destructive",
      })
    } finally {
      setBackgroundOperations((prev) => ({ ...prev, deleting: false }))
    }
  }

  // Handle CSV import
  const handleImportCSV = async (importedTransactions: Omit<Transaction, "id" | "firebaseId">[]) => {
    try {
      setIsLoading(true)
      let newId = nextId
      const newTransactions: Transaction[] = []

      // Add each transaction to Firebase
      for (const transaction of importedTransactions) {
        const newTransaction = await addTransactionToFirebase({
          ...transaction,
          id: newId++,
        })
        newTransactions.push(newTransaction)
      }

      setTransactions((prev) => [...prev, ...newTransactions])
      setNextId(newId)
      setShowImportModal(false)

      toast({
        title: t("import.importSuccess"),
        description: t("import.importSuccessDesc", { count: importedTransactions.length }),
        action: (
          <ToastAction altText={t("common.close")}>
            <Check className="h-4 w-4" />
          </ToastAction>
        ),
      })
    } catch (error) {
      console.error("Error importing transactions:", error)
      toast({
        title: t("common.error"),
        description: t("import.importError"),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Get agent stats
  const getAgentStats = (agentName: string) => {
    const agentTransactions = transactions.filter((t) => t.agent === agentName)
    const team = agentOptions.Hotel.includes(agentName) ? "Hotel" : "Hustle"

    const totalDeposits = agentTransactions.filter((t) => t.type === "Deposit").reduce((sum, t) => sum + t.amount, 0)

    const totalWithdrawals = agentTransactions
      .filter((t) => t.type === "Withdrawal")
      .reduce((sum, t) => sum + t.amount, 0)

    // Sort transactions by date (newest first)
    const sortedTransactions = [...agentTransactions].sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    })

    return {
      name: agentName,
      team,
      stats: {
        totalTransactions: agentTransactions.length,
        totalDeposits,
        totalWithdrawals,
        netBalance: totalDeposits - totalWithdrawals,
        transactions: sortedTransactions,
      },
    }
  }

  // Custom button style class for consistent styling across the app
  const primaryButtonClass =
    "bg-gradient-to-r from-gray-900 to-black hover:from-black hover:to-gray-800 text-white shadow-lg dark:shadow-white/5 hover:shadow-black/25 dark:hover:shadow-white/10 transition-all duration-300"

  // Improve the mobile sidebar toggle behavior
  const toggleSidebar = () => {
    setSideNavOpen(!sideNavOpen)
    // If we're on mobile and opening the sidebar, add a class to prevent body scrolling
    if (!sideNavOpen && window.innerWidth < 768) {
      document.body.classList.add("overflow-hidden")
    } else {
      document.body.classList.remove("overflow-hidden")
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        {/* Navigation */}
        <nav
          className={cn(
            "fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-800 shadow-lg transition-transform duration-200 ease-in-out z-30 border-r border-border/40",
            sideNavOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          )}
        >
          <div className="p-4 flex items-center justify-between border-b border-border/40">
            <div className="flex items-center space-x-2">
              <Wallet className="w-8 h-8 text-gray-700 dark:text-gray-300" />
              <span className="text-xl font-bold">{t("appName")}</span>
            </div>
            {/* Close button for mobile */}
            <button
              onClick={() => setSideNavOpen(false)}
              className="md:hidden p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-6 px-4">
            {/* Core navigation items - visible on all devices */}
            <button
              onClick={() => {
                setCurrentView("dashboard")
                if (window.innerWidth < 768) setSideNavOpen(false)
              }}
              className={cn(
                "w-full flex items-center space-x-2 px-4 py-3 rounded-lg transition-colors",
                currentView === "dashboard"
                  ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700",
              )}
            >
              <BarChart3 className="w-5 h-5" />
              <span>{t("nav.dashboard")}</span>
            </button>

            <button
              onClick={() => {
                setCurrentView("tables")
                if (window.innerWidth < 768) setSideNavOpen(false)
              }}
              className={cn(
                "w-full flex items-center space-x-2 px-4 py-3 rounded-lg transition-colors mt-2",
                currentView === "tables"
                  ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700",
              )}
            >
              <Table2 className="w-5 h-5" />
              <span>{t("nav.transactions")}</span>
            </button>

            <button
              onClick={() => {
                setCurrentView("agents")
                if (window.innerWidth < 768) setSideNavOpen(false)
              }}
              className={cn(
                "w-full flex items-center space-x-2 px-4 py-3 rounded-lg transition-colors mt-2",
                currentView === "agents"
                  ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700",
              )}
            >
              <UserRound className="w-5 h-5" />
              <span>{t("nav.agents")}</span>
            </button>

            {/* Additional items - only visible on desktop */}
            <div className="hidden md:block">
              <button
                onClick={() => setCurrentView("notes")}
                className={cn(
                  "w-full flex items-center space-x-2 px-4 py-3 rounded-lg transition-colors mt-2",
                  currentView === "notes"
                    ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700",
                )}
              >
                <StickyNote className="w-5 h-5" />
                <span>{t("nav.notes")}</span>
              </button>

              <a
                href="https://sellerglobal.net/admin/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center space-x-2 px-4 py-3 rounded-lg transition-colors mt-2 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Server className="w-5 h-5" />
                <span>{t("nav.backend")}</span>
              </a>
            </div>
          </div>

          {/* Bottom actions - only visible on desktop */}
          <div className="absolute bottom-4 left-4 right-4 space-y-2 hidden md:block">
            <div className="flex space-x-2">
              <Button
                variant="outline"
                className="flex-1 flex items-center justify-center"
                onClick={() => setShowImportModal(true)}
              >
                <FileUp className="w-4 h-4 mr-2" />
                {t("nav.import")}
              </Button>
              <Button
                variant="outline"
                className="flex-1 flex items-center justify-center"
                onClick={() => setShowExportModal(true)}
              >
                <FileDown className="w-4 h-4 mr-2" />
                {t("nav.export")}
              </Button>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              <span>{t("nav.toggleTheme")}</span>
            </button>
          </div>
        </nav>

        {/* Main Content */}
        <div className="md:ml-64 p-4 pb-20 md:pb-4">
          <header className="flex justify-between items-center mb-6 bg-background p-4 rounded-lg shadow-sm border border-border/40">
            <div className="flex items-center">
              <button
                onClick={toggleSidebar}
                className="md:hidden mr-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Menu className="w-6 h-6" />
              </button>
              <h1 className="text-2xl font-bold">
                {currentView === "dashboard" && t("nav.dashboard")}
                {currentView === "tables" && t("nav.transactions")}
                {currentView === "agents" && t("nav.agents")}
                {currentView === "notes" && t("nav.notes")}
              </h1>
            </div>

            {/* Update the header section to include a manage agents button */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Mobile-only controls */}
              <div className="md:hidden flex items-center space-x-2">
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
                <div className="relative group">
                  <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                    <FileUp className="w-5 h-5" />
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-border/40 hidden group-hover:block z-50">
                    <div className="p-2">
                      <button
                        onClick={() => setShowImportModal(true)}
                        className="w-full text-left px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                      >
                        <FileUp className="w-4 h-4 mr-2" />
                        {t("nav.import")}
                      </button>
                      <button
                        onClick={() => setShowExportModal(true)}
                        className="w-full text-left px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                      >
                        <FileDown className="w-4 h-4 mr-2" />
                        {t("nav.export")}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <LanguageSwitcher />
              <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <RefreshCw className="w-5 h-5" />
              </button>
              <UserProfile />
            </div>
          </header>

          {/* Show loading indicator only for initial load, not for background operations */}
          {isLoading && (
            <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading data...</p>
              </div>
            </div>
          )}

          {/* Dashboard View */}
          {currentView === "dashboard" && (
            <DashboardView
              transactions={getFilteredDashboardTransactions()}
              filters={dashboardFilters}
              setFilters={setDashboardFilters}
            />
          )}

          {/* Transactions View */}
          {currentView === "tables" && (
            <TransactionsView
              transactions={getFilteredAndSortedTransactions()}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedTeam={selectedTeam}
              setSelectedTeam={setSelectedTeam}
              selectedType={selectedType}
              setSelectedType={setSelectedType}
              selectedAgent={selectedAgent}
              setSelectedAgent={setSelectedAgent}
              sortField={sortField}
              sortDirection={sortDirection}
              handleSort={handleSort}
              getFilteredAndSortedTransactions={getFilteredAndSortedTransactions}
              setEditingTransaction={setEditingTransaction}
              setShowTransactionModal={setShowTransactionModal}
              deleteTransaction={deleteTransaction}
              formatTableDate={formatTableDate}
              setTransactions={setTransactions}
              updateTransaction={updateTransaction}
              agentOptions={agentOptions}
              primaryButtonClass={primaryButtonClass}
            />
          )}

          {/* Agents View */}
          {currentView === "agents" && (
            <AgentsView
              selectedAgent={selectedAgent}
              setSelectedAgent={setSelectedAgent}
              getAgentStats={getAgentStats}
              formatTableDate={formatTableDate}
              agentOptions={agentOptions}
              onManageAgents={() => setShowAgentManager(true)}
              primaryButtonClass={primaryButtonClass}
            />
          )}

          {/* Notes View */}
          {currentView === "notes" && <NotesView />}

          {/* Transaction Modal */}
          {showTransactionModal && (
            <TransactionModal
              editingTransaction={editingTransaction}
              setEditingTransaction={setEditingTransaction}
              setShowTransactionModal={setShowTransactionModal}
              addTransaction={addTransaction}
              updateTransaction={updateTransaction}
              agentOptions={agentOptions}
              primaryButtonClass={primaryButtonClass}
            />
          )}

          {/* CSV Import Modal */}
          {showImportModal && (
            <CSVImport onImport={handleImportCSV} onCancel={() => setShowImportModal(false)} nextId={nextId} />
          )}

          {/* CSV Export Modal */}
          {showExportModal && <CSVExport transactions={transactions} onCancel={() => setShowExportModal(false)} />}

          {/* Bottom Navigation for Mobile */}
          <BottomNavigation
            currentView={currentView}
            setCurrentView={(view) => {
              setCurrentView(view)
              setSideNavOpen(false)
            }}
          />
        </div>

        {/* Toaster */}
        <Toaster />
      </div>
      {/* Unified Agent Manager */}
      {showAgentManager && (
        <UnifiedAgentManager
          agentOptions={agentOptions}
          onAddAgent={addAgentToTeam}
          onDeleteAgent={deleteAgentFromTeam}
          onClose={() => setShowAgentManager(false)}
          primaryButtonClass={primaryButtonClass}
        />
      )}
      {sideNavOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setSideNavOpen(false)}
          aria-hidden="true"
        />
      )}
    </ProtectedRoute>
  )
}
