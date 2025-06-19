import * as React from "react"
import { cn } from "../../lib/utils"

const Progress = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value?: number
    max?: number
    variant?: "default" | "success" | "warning" | "destructive"
    showShimmer?: boolean
  }
>(({ className, value = 0, max = 100, variant = "default", showShimmer = true, ...props }, ref) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
  
  const variantClasses = {
    default: "from-blue-500 to-purple-600",
    success: "from-green-500 to-emerald-600",
    warning: "from-yellow-500 to-orange-600",
    destructive: "from-red-500 to-red-600",
  }

  return (
    <div
      ref={ref}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full glass backdrop-blur-lg bg-white/20 border border-white/10",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "h-full w-full flex-1 bg-gradient-to-r transition-all duration-1000 ease-out relative rounded-full",
          variantClasses[variant]
        )}
        style={{
          transform: `translateX(-${100 - percentage}%)`,
        }}
      >
        {showShimmer && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-[shimmer_2s_infinite]" />
        )}
      </div>
    </div>
  )
})
Progress.displayName = "Progress"

export { Progress }