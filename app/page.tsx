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
} from "./lib/firebase-service"

// Import Protected Route
import ProtectedRoute from "./components/protected-route"

// Import UserProfile component
import { UserProfile } from "./components/user-profile"

// Add the missing import if needed
import { getAuth } from "firebase/auth"

// Types
type DashboardFilters = {
  team: string
  month: string
  year: string
}

type SortDirection = "asc" | "desc" | null
type SortField = "date" | "amount" | null

// Constants
const AGENT_OPTIONS = {
  Hotel: ["Primo", "Cu", "Kel", "Mar", "Vivian", "Jhe", "Thac", "Lovely", "Ken", "Kyrie", "Annie"],
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

  // Dashboard filters
  const [dashboardFilters, setDashboardFilters] = useState<DashboardFilters>({
    team: "all",
    month: "all",
    year: new Date().getFullYear().toString(),
  })

  // Initialize
  useEffect(() => {
    // Set dark mode by default
    setDarkMode(true)
    document.documentElement.classList.add("dark")

    // Fetch transactions from Firebase
    const loadTransactions = async () => {
      try {
        // Check authentication state before fetching
        const auth = getAuth()
        if (!auth.currentUser) {
          console.log("User not authenticated yet, skipping transaction fetch")
          return
        }

        setIsLoading(true)
        const fetchedTransactions = await fetchTransactions()
        setTransactions(fetchedTransactions)

        // Set the next ID based on the highest ID in the fetched transactions
        if (fetchedTransactions.length > 0) {
          const maxId = Math.max(...fetchedTransactions.map((t) => t.id))
          setNextId(maxId + 1)
        }
      } catch (error) {
        console.error("Error loading transactions:", error)
        toast({
          title: "Error",
          description: "Failed to load transactions. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadTransactions()
  }, [])

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
      setIsLoading(true)
      const newTransaction = await addTransactionToFirebase({
        ...transaction,
        id: nextId,
      })

      setTransactions((prev) => [...prev, newTransaction])
      setNextId((prev) => prev + 1)
      setShowTransactionModal(false)

      // Show success toast
      toast({
        title: "Transaction Added",
        description: `Successfully added a new ${transaction.type.toLowerCase()} transaction.`,
        action: (
          <ToastAction altText="Close">
            <Check className="h-4 w-4" />
          </ToastAction>
        ),
      })
    } catch (error) {
      console.error("Error adding transaction:", error)
      toast({
        title: "Error",
        description: "Failed to add transaction. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const updateTransaction = async (transaction: Transaction) => {
    try {
      setIsLoading(true)
      const updatedTransaction = await updateTransactionInFirebase(transaction)

      setTransactions((prev) => prev.map((t) => (t.id === transaction.id ? updatedTransaction : t)))

      setEditingTransaction(null)
      setShowTransactionModal(false)

      // Show success toast
      toast({
        title: "Transaction Updated",
        description: `Successfully updated the transaction.`,
        action: (
          <ToastAction altText="Close">
            <Check className="h-4 w-4" />
          </ToastAction>
        ),
      })
    } catch (error) {
      console.error("Error updating transaction:", error)
      toast({
        title: "Error",
        description: "Failed to update transaction. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const deleteTransaction = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      try {
        setIsLoading(true)
        const transactionToDelete = transactions.find((t) => t.id === id)

        if (!transactionToDelete) {
          throw new Error("Transaction not found")
        }

        await deleteTransactionFromFirebase(transactionToDelete)

        setTransactions((prev) => prev.filter((t) => t.id !== id))

        // Show success toast
        toast({
          title: "Transaction Deleted",
          description: "The transaction has been deleted successfully.",
          action: (
            <ToastAction altText="Close">
              <Check className="h-4 w-4" />
            </ToastAction>
          ),
        })
      } catch (error) {
        console.error("Error deleting transaction:", error)
        toast({
          title: "Error",
          description: "Failed to delete transaction. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
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
        title: "Import Successful",
        description: `Successfully imported ${importedTransactions.length} transactions.`,
        action: (
          <ToastAction altText="Close">
            <Check className="h-4 w-4" />
          </ToastAction>
        ),
      })
    } catch (error) {
      console.error("Error importing transactions:", error)
      toast({
        title: "Error",
        description: "Failed to import transactions. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Get agent stats
  const getAgentStats = (agentName: string) => {
    const agentTransactions = transactions.filter((t) => t.agent === agentName)
    const team = AGENT_OPTIONS.Hotel.includes(agentName) ? "Hotel" : "Hustle"

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
          <div className="p-4 flex items-center space-x-2 border-b border-border/40">
            <Wallet className="w-8 h-8 text-purple-600" />
            <span className="text-xl font-bold">{t("appName")}</span>
          </div>

          <div className="mt-8 px-4">
            <button
              onClick={() => setCurrentView("dashboard")}
              className={cn(
                "w-full flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors",
                currentView === "dashboard"
                  ? "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700",
              )}
            >
              <BarChart3 className="w-5 h-5" />
              <span>{t("nav.dashboard")}</span>
            </button>

            <button
              onClick={() => setCurrentView("tables")}
              className={cn(
                "w-full flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors mt-2",
                currentView === "tables"
                  ? "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700",
              )}
            >
              <Table2 className="w-5 h-5" />
              <span>{t("nav.transactions")}</span>
            </button>

            <button
              onClick={() => setCurrentView("agents")}
              className={cn(
                "w-full flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors mt-2",
                currentView === "agents"
                  ? "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700",
              )}
            >
              <UserRound className="w-5 h-5" />
              <span>{t("nav.agents")}</span>
            </button>

            <button
              onClick={() => setCurrentView("notes")}
              className={cn(
                "w-full flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors mt-2",
                currentView === "notes"
                  ? "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700",
              )}
            >
              <StickyNote className="w-5 h-5" />
              <span>{t("nav.notes")}</span>
            </button>
          </div>

          <div className="absolute bottom-4 left-4 right-4 space-y-2">
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
        <div className="md:ml-64 p-4">
          <header className="flex justify-between items-center mb-6 bg-background p-4 rounded-lg shadow-sm border border-border/40">
            <div className="flex items-center">
              <button
                onClick={() => setSideNavOpen(!sideNavOpen)}
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

            <div className="flex items-center space-x-4">
              <LanguageSwitcher />
              <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <RefreshCw className="w-5 h-5" />
              </button>
              <UserProfile />
            </div>
          </header>

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
              transactions={transactions}
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
            />
          )}

          {/* Agents View */}
          {currentView === "agents" && (
            <AgentsView
              selectedAgent={selectedAgent}
              setSelectedAgent={setSelectedAgent}
              getAgentStats={getAgentStats}
              formatTableDate={formatTableDate}
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
            />
          )}

          {/* CSV Import Modal */}
          {showImportModal && (
            <CSVImport onImport={handleImportCSV} onCancel={() => setShowImportModal(false)} nextId={nextId} />
          )}

          {/* CSV Export Modal */}
          {showExportModal && <CSVExport transactions={transactions} onCancel={() => setShowExportModal(false)} />}
        </div>

        {/* Toaster */}
        <Toaster />
      </div>
    </ProtectedRoute>
  )
}
