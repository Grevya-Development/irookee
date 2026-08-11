import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 shrink-0 select-none",
  {
    variants: {
      variant: {
        default:
          "border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 backdrop-blur-sm",
        primary:
          "border-transparent bg-indigo-600 text-white shadow-sm",
        secondary:
          "border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200",
        destructive:
          "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400",
        success:
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
        warning:
          "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
        glow:
          "border-indigo-500/40 bg-gradient-to-r from-indigo-500/15 via-purple-500/15 to-pink-500/15 text-indigo-900 dark:text-indigo-200 shadow-glow-sm backdrop-blur-md",
        outline: "border-slate-300 dark:border-slate-700 text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
