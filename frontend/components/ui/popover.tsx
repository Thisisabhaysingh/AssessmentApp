'use client';

import * as React from "react"
import { cn } from "@/lib/utils"

const PopoverContext = React.createContext<{
  open: boolean
  setOpen: (open: boolean) => void
}>({
  open: false,
  setOpen: () => {},
})

const Popover = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = React.useState(false)
  
  return (
    <PopoverContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block">
        {children}
      </div>
    </PopoverContext.Provider>
  )
}

const PopoverTrigger = ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => {
  const { setOpen } = React.useContext(PopoverContext)
  
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as any, {
      onClick: (e: any) => {
        children.props.onClick?.(e)
        setOpen(true)
      },
    })
  }
  
  return (
    <button onClick={() => setOpen(true)}>
      {children}
    </button>
  )
}

const PopoverContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { align?: 'start' | 'center' | 'end' }
>(({ className, children, align = 'center', ...props }, ref) => {
  const { open, setOpen } = React.useContext(PopoverContext)
  const contentRef = React.useRef<HTMLDivElement>(null)
  
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
        const trigger = contentRef.current.parentElement?.querySelector('[role="button"]')
        if (trigger && !trigger.contains(event.target as Node)) {
          setOpen(false)
        }
      }
    }
    
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open, setOpen])
  
  if (!open) return null
  
  const alignmentClasses = {
    start: 'left-0',
    center: 'left-1/2 -translate-x-1/2',
    end: 'right-0',
  }
  
  return (
    <div
      ref={contentRef}
      className={cn(
        "absolute z-50 mt-2 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none animate-in fade-in-80 data-[side=bottom]:slide-in-from-top-2",
        alignmentClasses[align],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})
PopoverContent.displayName = "PopoverContent"

export { Popover, PopoverTrigger, PopoverContent }
