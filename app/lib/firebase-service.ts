import { db, storage } from "./firebase"
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
} from "firebase/firestore"
import { ref, uploadString, getDownloadURL, deleteObject } from "firebase/storage"
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
  receipt?: string | null
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

export const addTransaction = async (transaction: Omit<Transaction, "id" | "firebaseId">): Promise<Transaction> => {
  try {
    // If there's a receipt (base64 string), upload it to Firebase Storage
    let receiptUrl = transaction.receipt
    if (transaction.receipt && transaction.receipt.startsWith("data:")) {
      const storageRef = ref(storage, `receipts/${Date.now()}`)
      await uploadString(storageRef, transaction.receipt, "data_url")
      receiptUrl = await getDownloadURL(storageRef)
    }

    // Add the transaction to Firestore
    const docRef = await addDoc(collection(db, TRANSACTIONS_COLLECTION), {
      ...transaction,
      receipt: receiptUrl,
      createdAt: new Date().toISOString(),
    })

    // Return the transaction with the Firestore ID
    return {
      ...transaction,
      id: Date.now(), // Use timestamp as ID for now
      receipt: receiptUrl,
      firebaseId: docRef.id,
    } as Transaction
  } catch (error) {
    console.error("Error adding transaction:", error)
    throw error
  }
}

export const updateTransaction = async (transaction: Transaction): Promise<Transaction> => {
  try {
    if (!transaction.firebaseId) {
      throw new Error("Transaction doesn't have a Firestore ID")
    }

    // If there's a new receipt (base64 string), upload it to Firebase Storage
    let receiptUrl = transaction.receipt
    if (transaction.receipt && transaction.receipt.startsWith("data:")) {
      // Delete old receipt if it exists
      if (transaction.receipt && transaction.receipt.includes("firebasestorage")) {
        try {
          const oldReceiptRef = ref(storage, transaction.receipt)
          await deleteObject(oldReceiptRef)
        } catch (error) {
          console.warn("Error deleting old receipt:", error)
        }
      }

      // Upload new receipt
      const storageRef = ref(storage, `receipts/${Date.now()}`)
      await uploadString(storageRef, transaction.receipt, "data_url")
      receiptUrl = await getDownloadURL(storageRef)
    }

    // Update the transaction in Firestore
    const transactionRef = doc(db, TRANSACTIONS_COLLECTION, transaction.firebaseId)
    await updateDoc(transactionRef, {
      ...transaction,
      receipt: receiptUrl,
      updatedAt: new Date().toISOString(),
    })

    // Return the updated transaction
    return {
      ...transaction,
      receipt: receiptUrl,
    }
  } catch (error) {
    console.error("Error updating transaction:", error)
    throw error
  }
}

export const deleteTransaction = async (transaction: Transaction): Promise<void> => {
  try {
    if (!transaction.firebaseId) {
      throw new Error("Transaction doesn't have a Firestore ID")
    }

    // Delete receipt from storage if it exists
    if (transaction.receipt && transaction.receipt.includes("firebasestorage")) {
      try {
        const receiptRef = ref(storage, transaction.receipt)
        await deleteObject(receiptRef)
      } catch (error) {
        console.warn("Error deleting receipt:", error)
      }
    }

    // Delete the transaction from Firestore
    const transactionRef = doc(db, TRANSACTIONS_COLLECTION, transaction.firebaseId)
    await deleteDoc(transactionRef)
  } catch (error) {
    console.error("Error deleting transaction:", error)
    throw error
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

    const batch = db.batch()

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

export const bulkDeleteTransactions = async (transactionIds: number[]): Promise<void> => {
  try {
    // Get all transactions that match the IDs
    const q = query(collection(db, TRANSACTIONS_COLLECTION))
    const querySnapshot = await getDocs(q)

    const batch = db.batch()

    querySnapshot.docs.forEach((docSnapshot) => {
      const transaction = docSnapshot.data() as Transaction
      if (transactionIds.includes(transaction.id)) {
        const transactionRef = doc(db, TRANSACTIONS_COLLECTION, docSnapshot.id)
        batch.delete(transactionRef)

        // Also delete receipt if it exists
        if (transaction.receipt && transaction.receipt.includes("firebasestorage")) {
          try {
            const receiptRef = ref(storage, transaction.receipt)
            deleteObject(receiptRef).catch((err) => console.warn("Error deleting receipt:", err))
          } catch (error) {
            console.warn("Error creating receipt reference:", error)
          }
        }
      }
    })

    await batch.commit()
  } catch (error) {
    console.error("Error bulk deleting transactions:", error)
    throw error
  }
}
