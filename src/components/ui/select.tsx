"use client"

import * as React from "react"
import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface SelectProps {
  options: SelectOption[]
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  emptyMessage?: string
}

export function Select({
  options,
  value,
  onValueChange,
  placeholder = "Seleccionar opción",
  disabled = false,
  className,
  emptyMessage = "No hay opciones disponibles",
}: SelectProps) {
  const [open, setOpen] = React.useState(false)

  // Filtrar opciones para asegurar que no haya valores vacíos
  const validOptions = options.filter(option => option.value !== "");
  
  const selectedOption = validOptions.find(option => option.value === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          {selectedOption ? selectedOption.label : placeholder}
          <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Buscar..." className="h-9" />
          <CommandEmpty>{emptyMessage}</CommandEmpty>
          <CommandGroup>
            {validOptions.map((option) => (
              <CommandItem
                key={option.value}
                value={option.value || `option-${option.label}`} // Asegurar que siempre haya un valor no vacío
                onSelect={() => {
                  onValueChange?.(option.value)
                  setOpen(false)
                }}
                disabled={option.disabled}
              >
                {option.label}
                {option.value === value && (
                  <CheckIcon className="ml-auto h-4 w-4" />
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
