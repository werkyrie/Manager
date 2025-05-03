import { cn } from "@/lib/utils"

export function HotelLogo({ className }: { className?: string }) {
  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect x="2" y="6" width="20" height="14" rx="2" className="fill-blue-600 dark:fill-blue-500" />
        <path
          d="M4 10H20V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V10Z"
          className="fill-blue-500 dark:fill-blue-400"
        />
        <path d="M12 6V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M7 14H10V17H7V14Z" className="fill-white" />
        <path d="M14 14H17V17H14V14Z" className="fill-white" />
      </svg>
      <span className="absolute text-[8px] font-bold text-white bottom-1">HOTEL</span>
    </div>
  )
}

export function HustleLogo({ className }: { className?: string }) {
  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <path
          d="M12 2L4 6V12C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12V6L12 2Z"
          className="fill-orange-600 dark:fill-orange-500"
        />
        <path
          d="M12 4L6 7V12C6 15.3137 8.68629 18 12 18C15.3137 18 18 15.3137 18 12V7L12 4Z"
          className="fill-orange-500 dark:fill-orange-400"
        />
        <path
          d="M9 10L10.5 14M14.5 10L13 14M10.5 14H13M10.5 14V15M13 14V15"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="absolute text-[8px] font-bold text-white bottom-1">HUSTLE</span>
    </div>
  )
}

export function TeamBadge({ team }: { team: "Hotel" | "Hustle" }) {
  return (
    <div
      className={cn(
        "inline-flex items-center space-x-1 rounded-full px-2 py-0.5 text-xs font-semibold",
        team === "Hotel"
          ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
          : "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
      )}
    >
      {team === "Hotel" ? <HotelLogo className="w-3 h-3 mr-1" /> : <HustleLogo className="w-3 h-3 mr-1" />}
      <span>{team}</span>
    </div>
  )
}
