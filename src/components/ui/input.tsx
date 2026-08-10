import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps extends React.ComponentProps<"input"> {
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error = false, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-xl border bg-white/70 dark:bg-slate-900/60 px-3.5 py-2 text-sm text-foreground ring-offset-background transition-all duration-200 backdrop-blur-sm file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm",
          error
            ? "border-red-500/80 focus-visible:ring-red-500/50"
            : "border-slate-200/80 dark:border-slate-800/80 focus-visible:ring-indigo-500/50 focus-visible:border-indigo-500/80",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
