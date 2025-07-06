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
import { cn } from '@/lib/utils'
import { addDays, format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'

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
          {date ? (
            `${format(date, 'PPP')} at ${format(new Date(date), 'p')}`
          ) : (
            // <span>Pick a date</span>
            // <span>Currently it never expires</span>
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
              setDate(null)
            } else {
              setDate(addDays(new Date(), parseInt(value)))
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
        <div className="border rounded-md">
          {/* TODO: Add a way to select time */}
          <Calendar
            mode="single"
            selected={date || undefined}
            onSelect={(day) => setDate(day || null)}
            disabled={(date) =>
              date <= new Date() || date > new Date('2075-01-01')
            }
            autoFocus
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
