'use client';

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"

export interface CalendarProps {
  mode?: 'single'
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  disabled?: (date: Date) => boolean
  initialFocus?: boolean
  className?: string
}

const Calendar = ({
  mode = 'single',
  selected,
  onSelect,
  disabled,
  className,
}: CalendarProps) => {
  const [currentMonth, setCurrentMonth] = React.useState(selected || new Date())
  
  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate()
  
  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay()
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  
  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
  
  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }
  
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }
  
  const handleDateClick = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    if (disabled && disabled(date)) return
    onSelect?.(date)
  }
  
  const isSelected = (day: number) => {
    if (!selected) return false
    return (
      selected.getDate() === day &&
      selected.getMonth() === currentMonth.getMonth() &&
      selected.getFullYear() === currentMonth.getFullYear()
    )
  }
  
  const isDisabled = (day: number) => {
    if (!disabled) return false
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    return disabled(date)
  }
  
  const days = []
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="p-2" />)
  }
  
  for (let day = 1; day <= daysInMonth; day++) {
    const disabled = isDisabled(day)
    const selected = isSelected(day)
    
    days.push(
      <button
        key={day}
        type="button"
        className={cn(
          "p-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground",
          selected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
          disabled && "text-muted-foreground opacity-50 cursor-not-allowed hover:bg-transparent",
          !selected && !disabled && "hover:bg-accent"
        )}
        onClick={() => !disabled && handleDateClick(day)}
        disabled={disabled}
      >
        {day}
      </button>
    )
  }
  
  return (
    <div className={cn("p-3 bg-background border rounded-md shadow-sm", className)}>
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          size="icon"
          onClick={previousMonth}
          type="button"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="font-semibold">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={nextMonth}
          type="button"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map(day => (
          <div key={day} className="p-2 text-sm font-medium text-center text-muted-foreground">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {days}
      </div>
    </div>
  )
}

export { Calendar }
