"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const Pagination = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn("mx-auto w-full max-w-sm [&>button]:px-1", className)} {...props} />
  },
)
Pagination.displayName = "Pagination"

const PaginationContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn("flex w-full items-center justify-center", className)} {...props} />
  },
)
PaginationContent.displayName = "PaginationContent"

const PaginationItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn("w-8 h-8", className)} {...props} />
  },
)
PaginationItem.displayName = "PaginationItem"

const PaginationLink = React.forwardRef<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  React.AnchorHTMLAttributes<HTMLAnchorElement>
>(({ className, ...props }, ref) => {
  return (
    <a
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-secondary/80 h-8 w-8",
        className,
      )}
      {...props}
    />
  )
})
PaginationLink.displayName = "PaginationLink"

const PaginationEllipsis = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn("flex h-8 w-8 items-center justify-center text-sm font-medium", className)}
        {...props}
      >
        ...
      </span>
    )
  },
)
PaginationEllipsis.displayName = "PaginationEllipsis"

const PaginationPrevious = React.forwardRef<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  React.AnchorHTMLAttributes<HTMLAnchorElement>
>(({ className, ...props }, ref) => {
  return (
    <a
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-secondary/80 h-8 w-8",
        className,
      )}
      {...props}
    />
  )
})
PaginationPrevious.displayName = "PaginationPrevious"

const PaginationNext = React.forwardRef<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  React.AnchorHTMLAttributes<HTMLAnchorElement>
>(({ className, ...props }, ref) => {
  return (
    <a
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-secondary/80 h-8 w-8",
        className,
      )}
      {...props}
    />
  )
})
PaginationNext.displayName = "PaginationNext"

export {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationEllipsis,
  PaginationPrevious,
  PaginationNext,
}
