"use client"

import * as React from "react"
import { Clock } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

interface TimePickerProps {
  value?: string
  onChange?: (time: string) => void
  className?: string
  disabled?: boolean
}

export function TimePicker({
  value = "",
  onChange,
  className,
  disabled = false,
}: TimePickerProps) {
  const [timeValue, setTimeValue] = React.useState(value)

  // Actualizar el estado local cuando cambia el valor de prop
  React.useEffect(() => {
    setTimeValue(value)
  }, [value])

  // Validar y formatear la hora
  const handleTimeChange = (newTime: string) => {
    setTimeValue(newTime)
    
    // Validar formato de hora (HH:MM)
    const isValidTime = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(newTime)
    
    if (isValidTime && onChange) {
      onChange(newTime)
    }
  }

  // Opciones de horas comunes
  const commonTimes = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", 
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
    "18:00", "18:30", "19:00", "19:30", "20:00", "20:30"
  ]

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <Clock className="mr-2 h-4 w-4" />
          {timeValue ? timeValue : <span>Seleccionar hora</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="start">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Hora</label>
            <Input
              type="time"
              value={timeValue}
              onChange={(e) => handleTimeChange(e.target.value)}
              className="mt-1"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Horas comunes</label>
            <div className="grid grid-cols-4 gap-2">
              {commonTimes.map((time) => (
                <Button
                  key={time}
                  variant="outline"
                  size="sm"
                  onClick={() => handleTimeChange(time)}
                  className={cn(
                    "text-xs",
                    timeValue === time && "bg-primary text-primary-foreground"
                  )}
                >
                  {time}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
