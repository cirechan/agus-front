"use client"

import * as React from "react"
import { 
  Select as SelectRoot,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"

interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface CustomSelectProps {
  options: SelectOption[]
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function CustomSelect({
  options,
  value,
  onValueChange,
  placeholder = "Seleccionar opción",
  disabled = false,
  className
}: CustomSelectProps) {
  // Filtrar opciones con valores vacíos para evitar errores
  const validOptions = options.filter(option => option.value !== "");
  
  return (
    <SelectRoot value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {validOptions.map((option) => (
            <SelectItem 
              key={option.value} 
              value={option.value || `option-${option.label}`} // Asegurar valor no vacío
              disabled={option.disabled}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </SelectRoot>
  )
}
