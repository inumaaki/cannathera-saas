import * as React from "react"

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border border-hairline bg-white shadow-sm ${className || ""}`}
      {...props}
    >
      {children}
    </div>
  )
}
