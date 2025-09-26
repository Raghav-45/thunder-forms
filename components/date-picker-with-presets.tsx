'use client'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { addDays, format, setHours, setMinutes } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { useState } from 'react'

interface DatePickerWithPresetsProps {
  date: Date | null
  setDate: (date: Date | null) => void
  className?: string
}

export function DatePickerWithPresets({
  date,
  setDate,
  className = '',
}: DatePickerWithPresetsProps) {
  const [selectedTime, setSelectedTime] = useState<string>('09:00')

  // Sentinel date system: 2075+ is considered immortal, 3025 is the actual sentinel
  const IMMORTAL_THRESHOLD_YEAR = 2075
  const IMMORTAL_SENTINEL_DATE = new Date(3025, 0, 1) // January 1st, 3025

  // Helper function to check if a date is considered "immortal"
  const isImmortalDate = (checkDate: Date | null): boolean => {
    if (!checkDate) return true // null is also immortal
    return checkDate.getFullYear() >= IMMORTAL_THRESHOLD_YEAR
  }
  
  // Generate time slots from 9:00 AM to 6:00 PM in 15-minute intervals
  const timeSlots = Array.from({ length: 37 }, (_, i) => {
    const totalMinutes = i * 15
    const hour = Math.floor(totalMinutes / 60) + 9
    const minute = totalMinutes % 60
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
  })

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) {
      // If no date selected, set to sentinel date
      const [hours, minutes] = selectedTime.split(':').map(Number)
      const immortalDateWithTime = setMinutes(setHours(IMMORTAL_SENTINEL_DATE, hours), minutes)
      setDate(immortalDateWithTime)
      return
    }
    
    // Parse the selected time and set it on the date
    const [hours, minutes] = selectedTime.split(':').map(Number)
    const dateWithTime = setMinutes(setHours(selectedDate, hours), minutes)
    setDate(dateWithTime)
  }

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time)
    
    if (date) {
      const [hours, minutes] = time.split(':').map(Number)
      const dateWithTime = setMinutes(setHours(date, hours), minutes)
      setDate(dateWithTime)
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={'outline'}
          className={cn(
            'w-full justify-start text-left font-normal',
            !date && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className="mr-2 w-4 h-4" />
          {date && !isImmortalDate(date) ? (
            `${format(date, 'PPP')} at ${format(date, 'p')}`
          ) : (
            <span>Immortal ⚡</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="flex flex-col space-y-2 p-2 w-auto"
      >
        <Select
          onValueChange={(value) => {
            if (value === 'never') {
              const [hours, minutes] = selectedTime.split(':').map(Number)
              const immortalDateWithTime = setMinutes(setHours(IMMORTAL_SENTINEL_DATE, hours), minutes)
              setDate(immortalDateWithTime)
            } else {
              const newDate = addDays(new Date(), parseInt(value))
              const [hours, minutes] = selectedTime.split(':').map(Number)
              const dateWithTime = setMinutes(setHours(newDate, hours), minutes)
              setDate(dateWithTime)
            }
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="never">Never expires</SelectItem>
            <SelectItem value="1">Tomorrow</SelectItem>
            <SelectItem value="3">After 3 days</SelectItem>
            <SelectItem value="7">After a week</SelectItem>
            <SelectItem value="30">After a month</SelectItem>
            <SelectItem value="90">After 3 months</SelectItem>
            <SelectItem value="180">After 6 months</SelectItem>
            <SelectItem value="365">After a year</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <div className="border rounded-md">
            <Calendar
              mode="single"
              selected={date || undefined}
              onSelect={handleDateSelect}
              disabled={(date) =>
                date <= new Date() || date.getFullYear() > 5000
              }
              autoFocus
            />
          </div>
          <div className="flex flex-col w-24">
            <div className="text-sm font-medium mb-2 px-1">Time</div>
            <ScrollArea className="h-64 border rounded-md">
              <div className="grid gap-1 p-1">
                {timeSlots.map((time) => (
                  <Button
                    key={time}
                    variant={selectedTime === time ? "default" : "outline"}
                    onClick={() => handleTimeSelect(time)}
                    className="w-full text-xs h-8 shadow-none"
                    size="sm"
                  >
                    {time}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
