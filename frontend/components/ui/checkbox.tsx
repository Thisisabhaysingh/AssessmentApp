'use client';

import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, ...props }, ref) => {
    const [internalChecked, setInternalChecked] = React.useState(checked || false)
    
    const isChecked = checked !== undefined ? checked : internalChecked
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newChecked = e.target.checked
      if (checked === undefined) {
        setInternalChecked(newChecked)
      }
      onCheckedChange?.(newChecked)
    }
    
    return (
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          className="sr-only"
          ref={ref}
          checked={isChecked}
          onChange={handleChange}
          {...props}
        />
        <div
          className={cn(
            "h-4 w-4 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer",
            isChecked && "bg-primary text-primary-foreground",
            className
          )}
          onClick={() => {
            const newChecked = !isChecked
            if (checked === undefined) {
              setInternalChecked(newChecked)
            }
            onCheckedChange?.(newChecked)
          }}
        >
          {isChecked && (
            <Check className="h-4 w-4" />
          )}
        </div>
      </div>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
