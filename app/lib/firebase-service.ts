import { db } from "./firebase"
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
  getDoc,
  setDoc,
  writeBatch, // Add this import
} from "firebase/firestore"
// Add the missing import for getAuth
import { getAuth } from "firebase/auth"

// Types
export type Transaction = {
  id: number
  team: "Hotel" | "Hustle"
  agent: string
  date: string
  shopId: string
  amount: number
  type: "Deposit" | "Withdrawal"
  notes?: string
  firebaseId?: string // Add this to track Firestore document ID
}

export type Note = {
  id: string
  title: string
  content: string
  isPinned: boolean
  createdAt: string
  updatedAt: string
  color: string
  labels: string[]
  isCollapsed: boolean
  firebaseId?: string // Add this to track Firestore document ID
}

// Collection names
const TRANSACTIONS_COLLECTION = "transactions"
const NOTES_COLLECTION = "notes"
const DELETED_NOTES_COLLECTION = "deletedNotes"
const LABELS_COLLECTION = "labels"

// Transaction Services
// Update the fetchTransactions function to handle authentication checks
export const fetchTransactions = async (): Promise<Transaction[]> => {
  try {
    // Check if user is authenticated by getting the current user from Firebase Auth
    const auth = getAuth()
    if (!auth.currentUser) {
      console.log("User not authenticated, returning empty transactions array")
      return []
    }

    const q = query(collection(db, TRANSACTIONS_COLLECTION), orderBy("date", "desc"))
    const querySnapshot = await getDocs(q)

    return querySnapshot.docs.map((doc) => {
      const data = doc.data() as Transaction
      return { ...data, firebaseId: doc.id }
    })
  } catch (error) {
    console.error("Error fetching transactions:", error)
    // Return empty array instead of throwing error to prevent app crashes
    return []
  }
}

// Simplify the updateTransaction function to handle receipt uploads more reliably
export const updateTransaction = async (transaction: Transaction): Promise<Transaction> => {
  try {
    console.log("Firebase service: updating transaction", {
      id: transaction.id,
      firebaseId: transaction.firebaseId,
    })

    if (!transaction.firebaseId) {
      console.log("Transaction missing firebaseId, searching in Firestore...")

      // Try to find the transaction in Firestore by its id
      const q = query(collection(db, TRANSACTIONS_COLLECTION))
      const querySnapshot = await getDocs(q)

      let foundDoc = null
      for (const doc of querySnapshot.docs) {
        const data = doc.data() as Transaction
        if (data.id === transaction.id) {
          foundDoc = doc
          console.log("Found matching transaction in Firestore with id:", doc.id)
          break
        }
      }

      if (foundDoc) {
        transaction.firebaseId = foundDoc.id
        console.log("Set transaction.firebaseId to:", foundDoc.id)
      } else {
        console.error("Could not find transaction in Firestore with id:", transaction.id)
        throw new Error("Transaction doesn't have a Firestore ID and couldn't be found in Firestore")
      }
    }

    // Update the transaction in Firestore
    const transactionRef = doc(db, TRANSACTIONS_COLLECTION, transaction.firebaseId)
    await updateDoc(transactionRef, {
      ...transaction,
      updatedAt: new Date().toISOString(),
    })

    console.log("Transaction updated successfully in Firestore")

    // Return the updated transaction
    return transaction
  } catch (error) {
    console.error("Error updating transaction:", error)
    throw error
  }
}

// Simplify the addTransaction function to handle receipt uploads more reliably
export const addTransaction = async (transaction: Omit<Transaction, "id" | "firebaseId">): Promise<Transaction> => {
  try {
    // Create a clean transaction object without the firebaseId field
    const { firebaseId, ...cleanTransaction } = transaction as any

    // Generate a unique ID that includes a timestamp and random component
    const uniqueId = transaction.id || Date.now() + Math.floor(Math.random() * 10000)

    // Add the transaction to Firestore
    const docRef = await addDoc(collection(db, TRANSACTIONS_COLLECTION), {
      ...cleanTransaction,
      id: uniqueId,
      createdAt: new Date().toISOString(),
    })

    // Return the transaction with the Firestore ID
    return {
      ...transaction,
      id: uniqueId,
      firebaseId: docRef.id,
    } as Transaction
  } catch (error) {
    console.error("Error adding transaction:", error)
    throw error
  }
}

// Finally, let's fix the bulkDeleteTransactions function to handle receipt deletion better
export const bulkDeleteTransactions = async (transactionIds: number[]): Promise<void> => {
  try {
    // Get all transactions that match the IDs
    const q = query(collection(db, TRANSACTIONS_COLLECTION))
    const querySnapshot = await getDocs(q)

    // Create a batch using writeBatch
    const batch = writeBatch(db)
    const processedIds: number[] = []

    querySnapshot.docs.forEach((docSnapshot) => {
      const transaction = docSnapshot.data() as Transaction
      if (transactionIds.includes(transaction.id)) {
        processedIds.push(transaction.id)
        const transactionRef = doc(db, TRANSACTIONS_COLLECTION, docSnapshot.id)
        batch.delete(transactionRef)
      }
    })

    // Check if all transactions were found
    if (processedIds.length !== transactionIds.length) {
      const missingIds = transactionIds.filter((id) => !processedIds.includes(id))
      console.warn(`Some transactions were not found in Firestore: ${missingIds.join(", ")}`)
    }

    // Commit the batch to delete transactions
    await batch.commit()

    return Promise.resolve()
  } catch (error) {
    console.error("Error bulk deleting transactions:", error)
    return Promise.reject(error)
  }
}

// Notes Services
// Also update fetchNotes to handle authentication checks
export const fetchNotes = async (): Promise<Note[]> => {
  try {
    // Check if user is authenticated
    const auth = getAuth()
    if (!auth.currentUser) {
      console.log("User not authenticated, returning empty notes array")
      return []
    }

    const q = query(collection(db, NOTES_COLLECTION), orderBy("updatedAt", "desc"))
    const querySnapshot = await getDocs(q)

    return querySnapshot.docs.map((doc) => {
      const data = doc.data() as Note
      return { ...data, firebaseId: doc.id }
    })
  } catch (error) {
    console.error("Error fetching notes:", error)
    // Return empty array instead of throwing error
    return []
  }
}

// Update fetchDeletedNotes to handle authentication checks
export const fetchDeletedNotes = async (): Promise<Note[]> => {
  try {
    // Check if user is authenticated
    const auth = getAuth()
    if (!auth.currentUser) {
      console.log("User not authenticated, returning empty deleted notes array")
      return []
    }

    const q = query(collection(db, DELETED_NOTES_COLLECTION), orderBy("updatedAt", "desc"))
    const querySnapshot = await getDocs(q)

    return querySnapshot.docs.map((doc) => {
      const data = doc.data() as Note
      return { ...data, firebaseId: doc.id }
    })
  } catch (error) {
    console.error("Error fetching deleted notes:", error)
    // Return empty array instead of throwing error
    return []
  }
}

export const addNote = async (note: Omit<Note, "firebaseId">): Promise<Note> => {
  try {
    // Add the note to Firestore
    const docRef = await addDoc(collection(db, NOTES_COLLECTION), {
      ...note,
      createdAt: note.createdAt || new Date().toISOString(),
      updatedAt: note.updatedAt || new Date().toISOString(),
    })

    // Return the note with the Firestore ID
    return {
      ...note,
      firebaseId: docRef.id,
    }
  } catch (error) {
    console.error("Error adding note:", error)
    throw error
  }
}

export const updateNote = async (note: Note): Promise<Note> => {
  try {
    if (!note.firebaseId) {
      throw new Error("Note doesn't have a Firestore ID")
    }

    // Update the note in Firestore
    const noteRef = doc(db, NOTES_COLLECTION, note.firebaseId)
    await updateDoc(noteRef, {
      ...note,
      updatedAt: new Date().toISOString(),
    })

    // Return the updated note
    return note
  } catch (error) {
    console.error("Error updating note:", error)
    throw error
  }
}

export const deleteNote = async (note: Note): Promise<void> => {
  try {
    if (!note.firebaseId) {
      throw new Error("Note doesn't have a Firestore ID")
    }

    // Move the note to the deleted notes collection
    await addDoc(collection(db, DELETED_NOTES_COLLECTION), {
      ...note,
      deletedAt: new Date().toISOString(),
    })

    // Delete the note from the notes collection
    const noteRef = doc(db, NOTES_COLLECTION, note.firebaseId)
    await deleteDoc(noteRef)
  } catch (error) {
    console.error("Error deleting note:", error)
    throw error
  }
}

export const restoreNote = async (note: Note): Promise<Note> => {
  try {
    if (!note.firebaseId) {
      throw new Error("Note doesn't have a Firestore ID")
    }

    // Add the note back to the notes collection
    const restoredNote = await addNote(note)

    // Delete the note from the deleted notes collection
    const deletedNoteRef = doc(db, DELETED_NOTES_COLLECTION, note.firebaseId)
    await deleteDoc(deletedNoteRef)

    return restoredNote
  } catch (error) {
    console.error("Error restoring note:", error)
    throw error
  }
}

export const permanentlyDeleteNote = async (note: Note): Promise<void> => {
  try {
    if (!note.firebaseId) {
      throw new Error("Note doesn't have a Firestore ID")
    }

    // Delete the note from the deleted notes collection
    const deletedNoteRef = doc(db, DELETED_NOTES_COLLECTION, note.firebaseId)
    await deleteDoc(deletedNoteRef)
  } catch (error) {
    console.error("Error permanently deleting note:", error)
    throw error
  }
}

// Labels Services
export const fetchLabels = async (): Promise<string[]> => {
  try {
    const labelsDoc = await getDoc(doc(db, "settings", "labels"))
    if (labelsDoc.exists()) {
      return labelsDoc.data().labels || []
    }
    return []
  } catch (error) {
    console.error("Error fetching labels:", error)
    throw error
  }
}

export const saveLabels = async (labels: string[]): Promise<void> => {
  try {
    await setDoc(doc(db, "settings", "labels"), { labels })
  } catch (error) {
    console.error("Error saving labels:", error)
    throw error
  }
}

// Bulk operations
export const bulkUpdateTransactions = async (
  transactionIds: number[],
  updates: Partial<Transaction>,
): Promise<void> => {
  try {
    // Get all transactions that match the IDs
    const q = query(collection(db, TRANSACTIONS_COLLECTION))
    const querySnapshot = await getDocs(q)

    // Create a batch using writeBatch instead of db.batch
    const batch = writeBatch(db)

    querySnapshot.docs.forEach((docSnapshot) => {
      const transaction = docSnapshot.data() as Transaction
      if (transactionIds.includes(transaction.id)) {
        const transactionRef = doc(db, TRANSACTIONS_COLLECTION, docSnapshot.id)
        batch.update(transactionRef, {
          ...updates,
          updatedAt: new Date().toISOString(),
        })
      }
    })

    await batch.commit()
  } catch (error) {
    console.error("Error bulk updating transactions:", error)
    throw error
  }
}

export const deleteTransaction = async (transaction: Transaction): Promise<void> => {
  try {
    if (!transaction.firebaseId) {
      throw new Error("Transaction doesn't have a Firestore ID")
    }

    const transactionRef = doc(db, TRANSACTIONS_COLLECTION, transaction.firebaseId)
    await deleteDoc(transactionRef)
  } catch (error) {
    console.error("Error deleting transaction:", error)
    throw error
  }
}

// Add these functions at the end of the file

// Agent management functions
export const fetchAgents = async (): Promise<Record<string, string[]>> => {
  try {
    const agentsDoc = await getDoc(doc(db, "settings", "agents"))
    if (agentsDoc.exists()) {
      return agentsDoc.data().agents || { Hotel: [], Hustle: [] }
    }
    return { Hotel: [], Hustle: [] }
  } catch (error) {
    console.error("Error fetching agents:", error)
    throw error
  }
}

export const saveAgents = async (agents: Record<string, string[]>): Promise<void> => {
  try {
    await setDoc(doc(db, "settings", "agents"), { agents })
  } catch (error) {
    console.error("Error saving agents:", error)
    throw error
  }
}

export const addAgent = async (team: "Hotel" | "Hustle", agentName: string): Promise<boolean> => {
  try {
    // Get current agents
    const currentAgents = await fetchAgents()

    // Check if agent already exists
    if (currentAgents[team] && currentAgents[team].includes(agentName)) {
      return false
    }

    // Add the new agent
    if (!currentAgents[team]) {
      currentAgents[team] = []
    }
    currentAgents[team].push(agentName)

    // Save updated agents
    await saveAgents(currentAgents)
    return true
  } catch (error) {
    console.error("Error adding agent:", error)
    throw error
  }
}

export const deleteAgent = async (team: "Hotel" | "Hustle", agentName: string): Promise<boolean> => {
  try {
    // Get current agents
    const currentAgents = await fetchAgents()

    // Check if agent exists
    if (!currentAgents[team] || !currentAgents[team].includes(agentName)) {
      return false
    }

    // Remove the agent
    currentAgents[team] = currentAgents[team].filter((agent) => agent !== agentName)

    // Save updated agents
    await saveAgents(currentAgents)
    return true
  } catch (error) {
    console.error("Error deleting agent:", error)
    throw error
  }
}
