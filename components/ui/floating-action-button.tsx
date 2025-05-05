"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { motion } from "framer-motion"
import type { ReactNode } from "react"

interface FloatingActionButtonProps {
  icon: ReactNode
  onClick: () => void
  label: string
  className?: string
  variant?: "default" | "secondary" | "destructive" | "outline" | "ghost" | "link"
}

export function FloatingActionButton({
  icon,
  onClick,
  label,
  className,
  variant = "default",
}: FloatingActionButtonProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            className={cn("fixed bottom-6 right-6 z-50", className)}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Button
              onClick={onClick}
              size="lg"
              variant={variant}
              className={cn(
                "rounded-full w-14 h-14 shadow-lg",
                variant === "default" &&
                  "bg-gradient-to-r from-gray-900 to-black hover:from-black hover:to-gray-800 text-white shadow-lg dark:shadow-white/5 hover:shadow-black/25 dark:hover:shadow-white/10 transition-all duration-300",
              )}
            >
              {icon}
            </Button>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
