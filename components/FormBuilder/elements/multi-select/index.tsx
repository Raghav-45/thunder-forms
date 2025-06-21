'use client'

// components/FormBuilder/elements/multi-select/index.tsx
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Check, ChevronsUpDown, X } from 'lucide-react'
import React, { useState } from 'react'
import { FieldProps } from '../../types/types'
import { MultiSelectConfig } from './types'

const MultiSelect: React.FC<FieldProps<MultiSelectConfig>> = ({
  field,
  value = [],
  onChange,
  onBlur,
  error,
}) => {
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')

  const selectedValues = Array.isArray(value) ? value : []

  const handleSelect = (optionValue: string) => {
    const newValues = selectedValues.includes(optionValue)
      ? selectedValues.filter((v) => v !== optionValue)
      : [...selectedValues, optionValue]

    // Check max selections
    if (field.maxSelections && newValues.length > field.maxSelections) {
      return
    }

    onChange(newValues)
  }

  const handleRemove = (optionValue: string) => {
    const newValues = selectedValues.filter((v) => v !== optionValue)
    onChange(newValues)
  }

  const handleAddCustomValue = () => {
    if (!field.allowCustomValues || !searchValue.trim()) return

    const customValue = searchValue.trim()
    if (!selectedValues.includes(customValue)) {
      const newValues = [...selectedValues, customValue]
      if (field.maxSelections && newValues.length > field.maxSelections) {
        return
      }
      onChange(newValues)
    }
    setSearchValue('')
  }

  const getSelectedOptions = () => {
    return selectedValues.map((val) => {
      const option = field.options.find((opt) => opt.value === val)
      return option || { label: val, value: val }
    })
  }

  const getAvailableOptions = () => {
    return field.options.filter(
      (option) =>
        !searchValue ||
        option.label.toLowerCase().includes(searchValue.toLowerCase())
    )
  }

  const fieldId = `field-${field.id}`
  const canAddMore =
    !field.maxSelections || selectedValues.length < field.maxSelections

  return (
    <div className="space-y-2">
      <Label
        htmlFor={fieldId}
        className={`text-sm font-medium ${
          field.required
            ? "after:content-['*'] after:text-red-500 after:ml-1"
            : ''
        }`}
      >
        {field.label}
      </Label>

      {field.description && (
        <p className="text-sm text-muted-foreground">{field.description}</p>
      )}

      <div className="space-y-2">
        {selectedValues.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {getSelectedOptions().map((option) => (
              <Badge key={option.value} variant="secondary" className="text-xs">
                {option.label}
                <button
                  type="button"
                  onClick={() => handleRemove(option.value)}
                  disabled={field.disabled}
                  className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                  aria-label={`Remove ${option.label}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              aria-haspopup="listbox"
              className={`w-full justify-between ${
                error ? 'border-red-500' : ''
              }`}
              disabled={field.disabled || !canAddMore}
            >
              {selectedValues.length === 0
                ? field.placeholder || 'Select options...'
                : `${selectedValues.length} selected`}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>

          <PopoverContent className="w-full p-0" align="start">
            <Command>
              {field.searchable && (
                <CommandInput
                  value={searchValue}
                  onValueChange={setSearchValue}
                  placeholder="Search options..."
                />
              )}

              <CommandEmpty>
                {field.allowCustomValues && searchValue.trim() ? (
                  <div className="p-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleAddCustomValue}
                      className="w-full"
                    >
                      Add "{searchValue}"
                    </Button>
                  </div>
                ) : (
                  'No options found.'
                )}
              </CommandEmpty>

              <CommandGroup className="max-h-64 overflow-auto">
                {getAvailableOptions().map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => handleSelect(option.value)}
                    disabled={option.disabled}
                    className="cursor-pointer"
                  >
                    <Check
                      className={`mr-2 h-4 w-4 ${
                        selectedValues.includes(option.value)
                          ? 'opacity-100'
                          : 'opacity-0'
                      }`}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {field.minSelections && selectedValues.length < field.minSelections && (
        <p className="text-sm text-muted-foreground">
          Select at least {field.minSelections} option
          {field.minSelections > 1 ? 's' : ''}
        </p>
      )}

      {error && (
        <p
          id={`${fieldId}-error`}
          className="text-sm text-red-500"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  )
}

export default MultiSelect
