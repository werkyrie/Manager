"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import {
  type User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from "firebase/auth"
import { auth } from "../lib/firebase"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

type AuthContextType = {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string, rememberMe: boolean) => Promise<void>
  signUp: (email: string, password: string, displayName: string) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updateUserProfile: (displayName: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Inactivity timeout in milliseconds (1 hour)
const INACTIVITY_TIMEOUT = 60 * 60 * 1000

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter()
  const [inactivityTimer, setInactivityTimer] = useState<NodeJS.Timeout | null>(null)

  // Function to reset the inactivity timer
  const resetInactivityTimer = () => {
    if (inactivityTimer) {
      clearTimeout(inactivityTimer)
    }

    // Only set a new timer if the user is logged in
    if (user) {
      const timer = setTimeout(() => {
        // Auto logout after inactivity
        if (user) {
          toast({
            title: "Session expired",
            description: "You have been logged out due to inactivity.",
          })
          logout()
        }
      }, INACTIVITY_TIMEOUT)

      setInactivityTimer(timer)
    }
  }

  // Set up activity listeners
  useEffect(() => {
    if (!user) return

    // Events to track for user activity
    const activityEvents = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click"]

    // Event handler for any user activity
    const handleUserActivity = () => {
      resetInactivityTimer()
    }

    // Add event listeners
    activityEvents.forEach((event) => {
      window.addEventListener(event, handleUserActivity)
    })

    // Initial timer setup
    resetInactivityTimer()

    // Cleanup
    return () => {
      if (inactivityTimer) {
        clearTimeout(inactivityTimer)
      }

      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleUserActivity)
      })
    }
  }, [user]) // Reset when user changes

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)

      // Reset inactivity timer when auth state changes
      if (user) {
        resetInactivityTimer()
      }
    })

    return () => unsubscribe()
  }, [])

  const signIn = async (email: string, password: string, rememberMe: boolean) => {
    try {
      setLoading(true)

      // Set persistence based on remember me option
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence)

      await signInWithEmailAndPassword(auth, email, password)
      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      })
      router.push("/")
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      })
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      setLoading(true)
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)

      // Update profile with display name
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName })
      }

      toast({
        title: "Account created!",
        description: "Your account has been successfully created.",
      })
      router.push("/")
    } catch (error: any) {
      toast({
        title: "Sign up failed",
        description: error.message || "Please try again with different credentials.",
        variant: "destructive",
      })
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      // Clear the inactivity timer
      if (inactivityTimer) {
        clearTimeout(inactivityTimer)
        setInactivityTimer(null)
      }

      await signOut(auth)
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      })
      router.push("/login")
    } catch (error: any) {
      toast({
        title: "Sign out failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      })
    }
  }

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email)
      toast({
        title: "Password reset email sent",
        description: "Check your email for a link to reset your password.",
      })
    } catch (error: any) {
      toast({
        title: "Password reset failed",
        description: error.message || "Please check your email and try again.",
        variant: "destructive",
      })
      throw error
    }
  }

  const updateUserProfile = async (displayName: string) => {
    try {
      if (user) {
        await updateProfile(user, { displayName })
        // Force refresh the user object
        setUser({ ...user, displayName })
        toast({
          title: "Profile updated",
          description: "Your profile has been successfully updated.",
        })
      }
    } catch (error: any) {
      toast({
        title: "Profile update failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      })
      throw error
    }
  }

  const value = {
    user,
    loading,
    signIn,
    signUp,
    logout,
    resetPassword,
    updateUserProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
