"use client"

import * as React from "react"
import { Calendar as CalendarIcon } from "lucide-react"
import { format, addDays } from "date-fns"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface DatePickerWithPresetsProps {
  date: Date | null
  setDate: (date: Date | null) => void
}

export function DatePickerWithPresets({ date, setDate }: DatePickerWithPresetsProps) {
  const presets = [
    {
      label: "Tomorrow",
      value: addDays(new Date(), 1),
    },
    {
      label: "Next Week",
      value: addDays(new Date(), 7),
    },
    {
      label: "Next Month",
      value: addDays(new Date(), 30),
    },
    {
      label: "Next 3 Months",
      value: addDays(new Date(), 90),
    },
    {
      label: "Next 6 Months",
      value: addDays(new Date(), 180),
    },
    {
      label: "Next Year",
      value: addDays(new Date(), 365),
    },
  ]

  return (
    <div className="flex flex-col gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 w-4 h-4" />
            {date ? format(date, "PPP") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-auto" align="start">
          <Calendar
            mode="single"
            selected={date || undefined}
            onSelect={(day) => setDate(day || null)}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      <Select
        onValueChange={(value) => {
          const preset = presets.find((p) => p.label === value)
          if (preset) {
            setDate(preset.value)
          }
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select a preset" />
        </SelectTrigger>
        <SelectContent>
          {presets.map((preset) => (
            <SelectItem key={preset.label} value={preset.label}>
              {preset.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
} 