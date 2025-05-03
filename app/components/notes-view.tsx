"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { FloatingActionButton } from "@/components/ui/floating-action-button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import {
  Search,
  Pin,
  PinOff,
  Trash2,
  Edit,
  Save,
  Clock,
  Tag,
  ChevronDown,
  ChevronUp,
  X,
  RotateCcw,
  Palette,
  Check,
  Filter,
  Plus,
} from "lucide-react"

// Import the useTranslation hook
import { useTranslation } from "react-i18next"

// Types
type Note = {
  id: string
  title: string
  content: string
  isPinned: boolean
  createdAt: string
  updatedAt: string
  color: string
  labels: string[]
  isCollapsed: boolean
}

// Add these imports at the top
import {
  fetchNotes,
  fetchDeletedNotes,
  addNote as addNoteToFirebase,
  updateNote as updateNoteInFirebase,
  deleteNote as deleteNoteFromFirebase,
  restoreNote as restoreNoteFromFirebase,
  permanentlyDeleteNote as permanentlyDeleteNoteFromFirebase,
  fetchLabels,
  saveLabels,
} from "../lib/firebase-service"

type NoteFilter = {
  search: string
  pinned: "all" | "pinned" | "unpinned"
  sortBy: "updatedAt" | "createdAt" | "title"
  sortDirection: "asc" | "desc"
  labels: string[]
}

// Color options for notes
const COLOR_OPTIONS = [
  { name: "Default", value: "bg-card" },
  { name: "Red", value: "bg-red-50 dark:bg-red-900/20" },
  { name: "Orange", value: "bg-orange-50 dark:bg-orange-900/20" },
  { name: "Yellow", value: "bg-yellow-50 dark:bg-yellow-900/20" },
  { name: "Green", value: "bg-green-50 dark:bg-green-900/20" },
  { name: "Blue", value: "bg-blue-50 dark:bg-blue-900/20" },
  { name: "Purple", value: "bg-purple-50 dark:bg-purple-900/20" },
  { name: "Pink", value: "bg-pink-50 dark:bg-pink-900/20" },
]

// Sample notes
const SAMPLE_NOTES: Note[] = [
  {
    id: "1",
    title: "Hotel Team Meeting Notes",
    content: "Discuss monthly targets with Primo and Cu. Review performance metrics for Q1.",
    isPinned: true,
    createdAt: "2023-04-15T10:30:00Z",
    updatedAt: "2023-04-15T11:45:00Z",
    color: "bg-blue-50 dark:bg-blue-900/20",
    labels: ["Meeting", "Important"],
    isCollapsed: false,
  },
  {
    id: "2",
    title: "Hustle Team Onboarding",
    content: "New agent Xela joining next week. Prepare training materials and access credentials.",
    isPinned: true,
    createdAt: "2023-04-10T14:20:00Z",
    updatedAt: "2023-04-12T09:15:00Z",
    color: "bg-green-50 dark:bg-green-900/20",
    labels: ["Onboarding", "Training"],
    isCollapsed: false,
  },
  {
    id: "3",
    title: "Transaction Process Updates",
    content:
      "Starting next month, all withdrawals over $500 require additional approval. Update the team on new procedures.",
    isPinned: false,
    createdAt: "2023-04-05T16:45:00Z",
    updatedAt: "2023-04-05T16:45:00Z",
    color: "bg-yellow-50 dark:bg-yellow-900/20",
    labels: ["Process", "Updates"],
    isCollapsed: false,
  },
  {
    id: "4",
    title: "Weekly Report Template",
    content:
      "Team performance metrics\n- Total transactions\n- Deposit/withdrawal ratio\n- Top performing agents\n- Issues to address",
    isPinned: false,
    createdAt: "2023-03-28T11:20:00Z",
    updatedAt: "2023-04-01T13:10:00Z",
    color: "bg-purple-50 dark:bg-purple-900/20",
    labels: ["Template", "Reporting"],
    isCollapsed: false,
  },
]

// Generate a unique ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
}

// Format date for display
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

// Notes View Component
export function NotesView() {
  const { toast } = useToast()
  const { t } = useTranslation()
  // Replace the useState for notes, deletedNotes, and availableLabels with:
  const [notes, setNotes] = useState<Note[]>([])
  const [deletedNotes, setDeletedNotes] = useState<Note[]>([])
  const [availableLabels, setAvailableLabels] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [isCreatingNote, setIsCreatingNote] = useState(false)
  const [showRecycleBin, setShowRecycleBin] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [filters, setFilters] = useState<NoteFilter>({
    search: "",
    pinned: "all",
    sortBy: "updatedAt",
    sortDirection: "desc",
    labels: [],
  })
  const [newLabel, setNewLabel] = useState("")
  const [showLabelInput, setShowLabelInput] = useState(false)
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [unsavedChanges, setUnsavedChanges] = useState<Note | null>(null)
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false)

  // Load notes from localStorage on component mount
  // Replace the useEffect for loading notes with:
  // Load notes from Firebase on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        const [fetchedNotes, fetchedDeletedNotes, fetchedLabels] = await Promise.all([
          fetchNotes(),
          fetchDeletedNotes(),
          fetchLabels(),
        ])

        setNotes(fetchedNotes)
        setDeletedNotes(fetchedDeletedNotes)

        if (fetchedLabels.length > 0) {
          setAvailableLabels(fetchedLabels)
        } else {
          // If no labels in Firebase, use default ones
          setAvailableLabels([
            "Meeting",
            "Important",
            "Onboarding",
            "Training",
            "Process",
            "Updates",
            "Template",
            "Reporting",
          ])
        }
      } catch (error) {
        console.error("Error loading notes data:", error)
        toast({
          title: "Error",
          description: "Failed to load notes. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // Save notes to localStorage when they change
  // Replace the useEffect for saving notes with:
  // Save labels to Firebase when they change
  useEffect(() => {
    if (availableLabels.length > 0) {
      saveLabels(availableLabels).catch((error) => {
        console.error("Error saving labels:", error)
      })
    }
  }, [availableLabels])

  // Check for unsaved drafts on component mount
  useEffect(() => {
    const unsavedDraft = localStorage.getItem("unsavedDraft")
    if (unsavedDraft) {
      const draft = JSON.parse(unsavedDraft)
      setUnsavedChanges(draft)
      setShowUnsavedDialog(true)
    }
  }, [])

  // Filter and sort notes
  const getFilteredNotes = () => {
    let filtered = [...notes]

    // Filter by tab
    if (activeTab === "pinned") {
      filtered = filtered.filter((note) => note.isPinned)
    }

    // Filter by search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(
        (note) => note.title.toLowerCase().includes(searchLower) || note.content.toLowerCase().includes(searchLower),
      )
    }

    // Filter by pinned status
    if (filters.pinned === "pinned") {
      filtered = filtered.filter((note) => note.isPinned)
    } else if (filters.pinned === "unpinned") {
      filtered = filtered.filter((note) => !note.isPinned)
    }

    // Filter by labels
    if (filters.labels.length > 0) {
      filtered = filtered.filter((note) => filters.labels.some((label) => note.labels.includes(label)))
    }

    // Sort notes
    filtered.sort((a, b) => {
      // Always keep pinned notes at the top
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1

      // Then apply the selected sort
      const aValue = a[filters.sortBy]
      const bValue = b[filters.sortBy]

      if (filters.sortDirection === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    return filtered
  }

  // Create a new note
  // Replace the createNote function with:
  // Create a new note
  const createNote = () => {
    const newNote: Note = {
      id: generateId(),
      title: "",
      content: "",
      isPinned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      color: "bg-card",
      labels: [],
      isCollapsed: false,
    }

    setEditingNote(newNote)
    setIsCreatingNote(true)
  }

  // Save a note
  // Replace the saveNote function with:
  // Save a note
  const saveNote = async (note: Note) => {
    try {
      setIsLoading(true)
      const now = new Date().toISOString()
      const updatedNote = { ...note, updatedAt: now }

      if (isCreatingNote) {
        const savedNote = await addNoteToFirebase(updatedNote)
        setNotes((prev) => [savedNote, ...prev])
        toast({
          title: "Note Created",
          description: "Your note has been created successfully.",
        })
      } else {
        const savedNote = await updateNoteInFirebase(updatedNote)
        setNotes((prev) => prev.map((n) => (n.id === note.id ? savedNote : n)))
        toast({
          title: "Note Updated",
          description: "Your note has been updated successfully.",
        })
      }

      setEditingNote(null)
      setIsCreatingNote(false)

      // Clear any autosave timer
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
        autoSaveTimerRef.current = null
      }

      // Clear unsaved draft
      localStorage.removeItem("unsavedDraft")
    } catch (error) {
      console.error("Error saving note:", error)
      toast({
        title: "Error",
        description: "Failed to save note. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-save draft
  const autoSaveDraft = (note: Note) => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }

    autoSaveTimerRef.current = setTimeout(() => {
      localStorage.setItem("unsavedDraft", JSON.stringify(note))
      toast({
        title: "Draft Saved",
        description: "Your changes have been saved as a draft.",
      })
    }, 5000) // Auto-save after 5 seconds of inactivity
  }

  // Restore unsaved draft
  const restoreUnsavedDraft = () => {
    if (unsavedChanges) {
      setEditingNote(unsavedChanges)
      setIsCreatingNote(!notes.some((note) => note.id === unsavedChanges.id))
      setShowUnsavedDialog(false)
    }
  }

  // Discard unsaved draft
  const discardUnsavedDraft = () => {
    localStorage.removeItem("unsavedDraft")
    setUnsavedChanges(null)
    setShowUnsavedDialog(false)
  }

  // Delete a note
  // Replace the deleteNote function with:
  // Delete a note
  const deleteNote = async (id: string) => {
    try {
      setIsLoading(true)
      const noteToDelete = notes.find((note) => note.id === id)
      if (noteToDelete) {
        await deleteNoteFromFirebase(noteToDelete)

        setNotes((prev) => prev.filter((note) => note.id !== id))
        // The deleted note will be fetched in the next load of deleted notes
        const updatedDeletedNotes = await fetchDeletedNotes()
        setDeletedNotes(updatedDeletedNotes)

        toast({
          title: "Note Moved to Recycle Bin",
          description: "The note has been moved to the recycle bin.",
        })
      }
    } catch (error) {
      console.error("Error deleting note:", error)
      toast({
        title: "Error",
        description: "Failed to delete note. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Restore a note from recycle bin
  // Replace the restoreNote function with:
  // Restore a note from recycle bin
  const restoreNote = async (id: string) => {
    try {
      setIsLoading(true)
      const noteToRestore = deletedNotes.find((note) => note.id === id)
      if (noteToRestore) {
        const restoredNote = await restoreNoteFromFirebase(noteToRestore)

        setDeletedNotes((prev) => prev.filter((note) => note.id !== id))
        setNotes((prev) => [restoredNote, ...prev])

        toast({
          title: "Note Restored",
          description: "The note has been restored successfully.",
        })
      }
    } catch (error) {
      console.error("Error restoring note:", error)
      toast({
        title: "Error",
        description: "Failed to restore note. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Permanently delete a note
  // Replace the permanentlyDeleteNote function with:
  // Permanently delete a note
  const permanentlyDeleteNote = async (id: string) => {
    try {
      setIsLoading(true)
      const noteToDelete = deletedNotes.find((note) => note.id === id)
      if (noteToDelete) {
        await permanentlyDeleteNoteFromFirebase(noteToDelete)
        setDeletedNotes((prev) => prev.filter((note) => note.id !== id))

        toast({
          title: "Note Deleted",
          description: "The note has been permanently deleted.",
        })
      }
    } catch (error) {
      console.error("Error permanently deleting note:", error)
      toast({
        title: "Error",
        description: "Failed to delete note. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Empty recycle bin
  // Replace the emptyRecycleBin function with:
  // Empty recycle bin
  const emptyRecycleBin = async () => {
    try {
      setIsLoading(true)
      // Delete each note in the recycle bin
      for (const note of deletedNotes) {
        await permanentlyDeleteNoteFromFirebase(note)
      }

      setDeletedNotes([])

      toast({
        title: "Recycle Bin Emptied",
        description: "All deleted notes have been permanently removed.",
      })
    } catch (error) {
      console.error("Error emptying recycle bin:", error)
      toast({
        title: "Error",
        description: "Failed to empty recycle bin. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Toggle pin status
  // Replace the togglePin function with:
  // Toggle pin status
  const togglePin = async (id: string) => {
    try {
      const noteToUpdate = notes.find((note) => note.id === id)
      if (noteToUpdate) {
        const updatedNote = {
          ...noteToUpdate,
          isPinned: !noteToUpdate.isPinned,
          updatedAt: new Date().toISOString(),
        }

        await updateNoteInFirebase(updatedNote)

        setNotes((prev) =>
          prev.map((note) => {
            if (note.id === id) {
              return updatedNote
            }
            return note
          }),
        )
      }
    } catch (error) {
      console.error("Error toggling pin status:", error)
      toast({
        title: "Error",
        description: "Failed to update note. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Toggle collapse status
  // Replace the toggleCollapse function with:
  // Toggle collapse status
  const toggleCollapse = (id: string) => {
    setNotes((prev) =>
      prev.map((note) => {
        if (note.id === id) {
          return { ...note, isCollapsed: !note.isCollapsed }
        }
        return note
      }),
    )
  }

  // Add a new label
  // Replace the addNewLabel function with:
  // Add a new label
  const addNewLabel = async () => {
    if (newLabel && !availableLabels.includes(newLabel)) {
      try {
        const updatedLabels = [...availableLabels, newLabel]
        setAvailableLabels(updatedLabels)
        await saveLabels(updatedLabels)

        setNewLabel("")
        setShowLabelInput(false)
      } catch (error) {
        console.error("Error adding new label:", error)
        toast({
          title: "Error",
          description: "Failed to add new label. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  // Handle drag and drop reordering
  const handleDragEnd = (result: any) => {
    if (!result.destination) return

    const items = Array.from(getFilteredNotes())
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Update the order in the original notes array
    const updatedNotes = [...notes]
    getFilteredNotes().forEach((note, index) => {
      const originalIndex = updatedNotes.findIndex((n) => n.id === note.id)
      if (originalIndex !== -1) {
        updatedNotes[originalIndex] = items[index]
      }
    })

    setNotes(updatedNotes)
  }

  // Note Editor Component
  const NoteEditor = ({
    note,
    onSave,
    onCancel,
  }: { note: Note; onSave: (note: Note) => void; onCancel: () => void }) => {
    const [editedNote, setEditedNote] = useState<Note>(note)
    const [showColorPicker, setShowColorPicker] = useState(false)
    const [showLabelSelector, setShowLabelSelector] = useState(false)

    // Update note and trigger auto-save
    const updateNote = (updates: Partial<Note>) => {
      const updatedNote = { ...editedNote, ...updates }
      setEditedNote(updatedNote)
      autoSaveDraft(updatedNote)
    }

    // Toggle label selection
    const toggleLabel = (label: string) => {
      if (editedNote.labels.includes(label)) {
        updateNote({ labels: editedNote.labels.filter((l) => l !== label) })
      } else {
        updateNote({ labels: [...editedNote.labels, label] })
      }
    }

    return (
      <div className="space-y-4">
        <Input
          placeholder="Title"
          value={editedNote.title}
          onChange={(e) => updateNote({ title: e.target.value })}
          className="text-lg font-medium"
        />

        <Textarea
          placeholder="Note content..."
          value={editedNote.content}
          onChange={(e) => updateNote({ content: e.target.value })}
          className="min-h-[200px] resize-y"
        />

        <div className="flex flex-wrap items-center gap-2">
          {editedNote.labels.map((label) => (
            <Badge key={label} variant="secondary" className="flex items-center gap-1">
              {label}
              <X className="h-3 w-3 cursor-pointer" onClick={() => toggleLabel(label)} />
            </Badge>
          ))}
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Popover open={showColorPicker} onOpenChange={setShowColorPicker}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Palette className="h-4 w-4 mr-2" />
                  Color
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64">
                <div className="grid grid-cols-4 gap-2">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color.value}
                      className={cn(
                        "h-8 w-full rounded-md border flex items-center justify-center",
                        color.value,
                        editedNote.color === color.value && "ring-2 ring-primary",
                      )}
                      onClick={() => {
                        updateNote({ color: color.value })
                        setShowColorPicker(false)
                      }}
                      title={color.name}
                    >
                      {editedNote.color === color.value && <Check className="h-4 w-4" />}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <Popover open={showLabelSelector} onOpenChange={setShowLabelSelector}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Tag className="h-4 w-4 mr-2" />
                  Labels
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64">
                <div className="space-y-2">
                  <div className="font-medium">Select Labels</div>
                  <div className="space-y-1">
                    {availableLabels.map((label) => (
                      <div key={label} className="flex items-center space-x-2">
                        <Checkbox
                          id={`label-${label}`}
                          checked={editedNote.labels.includes(label)}
                          onCheckedChange={() => toggleLabel(label)}
                        />
                        <Label htmlFor={`label-${label}`}>{label}</Label>
                      </div>
                    ))}
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex items-center space-x-2">
                      <Input
                        placeholder="New label"
                        value={newLabel}
                        onChange={(e) => setNewLabel(e.target.value)}
                        className="h-8"
                      />
                      <Button size="sm" onClick={addNewLabel} disabled={!newLabel}>
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Button variant="outline" size="sm" onClick={() => updateNote({ isPinned: !editedNote.isPinned })}>
              {editedNote.isPinned ? (
                <>
                  <PinOff className="h-4 w-4 mr-2" />
                  Unpin
                </>
              ) : (
                <>
                  <Pin className="h-4 w-4 mr-2" />
                  Pin
                </>
              )}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => onSave(editedNote)}
              disabled={!editedNote.title.trim()}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Note Card Component
  const NoteCard = ({ note }: { note: Note }) => {
    return (
      <Card className={cn("transition-all duration-200 hover:shadow-md border-border/40", note.color)}>
        <CardHeader className="p-4 pb-0">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-lg flex items-center gap-2">
                {note.isPinned && <Pin className="h-4 w-4 text-muted-foreground" />}
                <span className="truncate">{note.title}</span>
              </CardTitle>
              <div className="flex flex-wrap gap-1 mt-1">
                {note.labels.map((label) => (
                  <Badge key={label} variant="outline" className="text-xs">
                    {label}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => toggleCollapse(note.id)}>
                {note.isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent
          className={cn(
            "p-4 transition-all duration-200",
            note.isCollapsed ? "max-h-0 overflow-hidden p-0" : "max-h-[500px]",
          )}
        >
          <div className="whitespace-pre-wrap mb-4">{note.content}</div>

          <div className="flex justify-between items-center text-xs text-muted-foreground mt-4 pt-2 border-t border-border/40">
            <div className="flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              <span>Updated {formatDate(note.updatedAt)}</span>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => togglePin(note.id)}
                title={note.isPinned ? "Unpin" : "Pin"}
              >
                {note.isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => {
                  setEditingNote(note)
                  setIsCreatingNote(false)
                }}
                title="Edit"
              >
                <Edit className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
                onClick={() => deleteNote(note.id)}
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Recycle Bin Component
  const RecycleBin = () => {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">{t("notes.recycleBin")}</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowRecycleBin(false)}>
              {t("notes.backToNotes")}
            </Button>
            <Button variant="destructive" size="sm" onClick={emptyRecycleBin} disabled={deletedNotes.length === 0}>
              {t("notes.emptyBin")}
            </Button>
          </div>
        </div>

        {deletedNotes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>{t("notes.noDeletedNotes")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {deletedNotes.map((note) => (
              <Card key={note.id} className={cn("border-border/40", note.color)}>
                <CardHeader className="p-4 pb-0">
                  <CardTitle className="text-lg">{note.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="whitespace-pre-wrap mb-4 line-clamp-3">{note.content}</div>

                  <div className="flex justify-between items-center text-xs text-muted-foreground mt-4 pt-2 border-t border-border/40">
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>Deleted {formatDate(note.updatedAt)}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => restoreNote(note.id)}
                        title="Restore"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
                        onClick={() => permanentlyDeleteNote(note.id)}
                        title="Delete Permanently"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Filter Component
  const NotesFilter = () => {
    const [isFilterOpen, setIsFilterOpen] = useState(false)
    const [searchInput, setSearchInput] = useState(filters.search)
    const searchDebounceRef = useRef<NodeJS.Timeout | null>(null)

    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder={t("notes.searchNotes")}
              value={searchInput}
              onChange={(e) => {
                const value = e.target.value
                setSearchInput(value)

                // Clear any existing timeout
                if (searchDebounceRef.current) {
                  clearTimeout(searchDebounceRef.current)
                }

                // Set a new timeout to update the filters after typing stops
                searchDebounceRef.current = setTimeout(() => {
                  setFilters((prev) => ({ ...prev, search: value }))
                }, 300) // 300ms debounce
              }}
              className="pl-9"
            />
          </div>

          <div className="flex gap-2">
            <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span className="hidden sm:inline">{t("notes.filterAndSort")}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">{t("notes.filterByPinned")}</h4>
                    <Select
                      value={filters.pinned}
                      onValueChange={(value) =>
                        setFilters((prev) => ({ ...prev, pinned: value as "all" | "pinned" | "unpinned" }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("notes.selectFilter")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("notes.allNotes")}</SelectItem>
                        <SelectItem value="pinned">{t("notes.pinnedOnly")}</SelectItem>
                        <SelectItem value="unpinned">{t("notes.unpinnedOnly")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">{t("notes.filterByLabels")}</h4>
                    <div className="space-y-2">
                      {availableLabels.map((label) => (
                        <div key={label} className="flex items-center space-x-2">
                          <Checkbox
                            id={`filter-label-${label}`}
                            checked={filters.labels.includes(label)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFilters((prev) => ({ ...prev, labels: [...prev.labels, label] }))
                              } else {
                                setFilters((prev) => ({
                                  ...prev,
                                  labels: prev.labels.filter((l) => l !== label),
                                }))
                              }
                            }}
                          />
                          <Label htmlFor={`filter-label-${label}`}>{label}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">{t("notes.sortBy")}</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <Select
                        value={filters.sortBy}
                        onValueChange={(value) =>
                          setFilters((prev) => ({
                            ...prev,
                            sortBy: value as "updatedAt" | "createdAt" | "title",
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("notes.selectSortField")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="updatedAt">{t("notes.lastUpdated")}</SelectItem>
                          <SelectItem value="createdAt">{t("notes.dateCreated")}</SelectItem>
                          <SelectItem value="title">{t("notes.title")}</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select
                        value={filters.sortDirection}
                        onValueChange={(value) =>
                          setFilters((prev) => ({ ...prev, sortDirection: value as "asc" | "desc" }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("notes.selectSortDirection")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="asc">{t("notes.ascending")}</SelectItem>
                          <SelectItem value="desc">{t("notes.descending")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFilters({
                          search: "",
                          pinned: "all",
                          sortBy: "updatedAt",
                          sortDirection: "desc",
                          labels: [],
                        })
                        setSearchInput("")
                      }}
                    >
                      {t("notes.resetFilters")}
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Button
              variant={activeTab === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("all")}
              className={activeTab === "all" ? "bg-purple-600 hover:bg-purple-700" : ""}
            >
              {t("notes.all")}
            </Button>

            <Button
              variant={activeTab === "pinned" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("pinned")}
              className={activeTab === "pinned" ? "bg-purple-600 hover:bg-purple-700" : ""}
            >
              <Pin className="h-4 w-4 mr-2" />
              {t("notes.pinned")}
            </Button>

            <Button variant="outline" size="sm" onClick={() => setShowRecycleBin(true)}>
              <Trash2 className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{t("notes.recycleBin")}</span>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Main render
  if (showRecycleBin) {
    return <RecycleBin />
  }

  if (editingNote) {
    return (
      <div className="max-w-3xl mx-auto">
        <NoteEditor note={editingNote} onSave={saveNote} onCancel={() => setEditingNote(null)} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <NotesFilter />

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {getFilteredNotes().map((note) => (
          <NoteCard key={note.id} note={note} />
        ))}
      </div>

      {/* Empty State */}
      {getFilteredNotes().length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">{t("notes.noNotes")}</p>
          <Button onClick={createNote} className="bg-purple-600 hover:bg-purple-700">
            <Plus className="h-4 w-4 mr-2" />
            {t("notes.createNote")}
          </Button>
        </div>
      )}

      {/* Add Floating Action Button */}
      <FloatingActionButton icon={<Plus className="h-6 w-6" />} onClick={createNote} label={t("notes.createNote")} />

      {/* Unsaved Draft Dialog */}
      {showUnsavedDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>{t("notes.unsavedChanges")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{t("notes.unsavedChangesDesc")}</p>
            </CardContent>
            <div className="flex justify-end p-4 space-x-2">
              <Button variant="outline" onClick={discardUnsavedDraft}>
                {t("notes.discard")}
              </Button>
              <Button onClick={restoreUnsavedDraft} className="bg-purple-600 hover:bg-purple-700">
                {t("notes.restore")}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
