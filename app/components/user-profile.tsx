"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "../context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, User } from "lucide-react"
import { useTranslation } from "react-i18next"

export function UserProfile() {
  const { user, logout, updateUserProfile } = useAuth()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [displayName, setDisplayName] = useState(user?.displayName || "")
  const [isLoading, setIsLoading] = useState(false)
  const { t } = useTranslation()

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await updateUserProfile(displayName)
      setIsProfileOpen(false)
    } catch (error) {
      console.error("Update profile error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="relative">
        <button
          className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center"
          onClick={() => setIsProfileOpen(true)}
          title={user?.displayName || user?.email || "User profile"}
        >
          <User className="w-6 h-6 text-purple-600 dark:text-purple-300" />
        </button>
      </div>

      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("auth.profile")}</DialogTitle>
            <DialogDescription>{t("auth.profileDescription")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t("auth.email")}</Label>
              <div className="p-2 bg-muted rounded-md">{user?.email}</div>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">{t("auth.name")}</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={t("auth.enterName")}
                />
              </div>

              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => logout()}>
                  {t("auth.signOut")}
                </Button>

                <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("auth.updating")}
                    </>
                  ) : (
                    t("auth.updateProfile")
                  )}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
