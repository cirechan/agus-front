'use client'

import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Player {
  id: number
  nombre: string
  posicion: string | null
  dorsal: number | null
}

interface FormationOption {
  value: string
  label: string
  positions: string[]
}

interface Props {
  players: Player[]
  teamColor: string
  goalkeeperColor: string
  textColor: string
  formations: FormationOption[]
  defaultFormation: string
  initialStarters?: number[]
  initialBench?: number[]
  initialUnavailable?: number[]
  initialFormation?: string
}

export default function PlayerSelector({
  players,
  teamColor,
  goalkeeperColor,
  textColor,
  formations,
  defaultFormation,
  initialStarters = [],
  initialBench = [],
  initialUnavailable = [],
  initialFormation,
}: Props) {
  const [tab, setTab] = useState<'starters' | 'bench' | 'unavailable'>('starters')
  const [starters, setStarters] = useState<number[]>(initialStarters)
  const [bench, setBench] = useState<number[]>(initialBench)
  const [unavailable, setUnavailable] = useState<number[]>(initialUnavailable)
  const [formation, setFormation] = useState(initialFormation ?? defaultFormation)
  const [limitWarning, setLimitWarning] = useState<string | null>(null)

  const activeFormation = useMemo(
    () => formations.find(f => f.value === formation) ?? formations[0],
    [formation, formations]
  )
  const maxStarters = activeFormation?.positions.length ?? 11

  function enforceStarterLimit(nextStarters: number[]) {
    if (nextStarters.length <= maxStarters) {
      setStarters(nextStarters)
      return
    }
    setLimitWarning(
      `Solo puedes elegir ${maxStarters} titulares para la formación ${activeFormation?.label ?? formation}.`
    )
  }

  function toggle(id: number) {
    setLimitWarning(null)
    if (tab === 'starters') {
      enforceStarterLimit(
        starters.includes(id)
          ? starters.filter(p => p !== id)
          : [...starters, id]
      )
      setBench(prev => prev.filter(p => p !== id))
      setUnavailable(prev => prev.filter(p => p !== id))
    } else {
      if (tab === 'bench') {
        setBench(prev =>
          prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        )
        setStarters(prev => prev.filter(p => p !== id))
        setUnavailable(prev => prev.filter(p => p !== id))
      } else {
        setUnavailable(prev =>
          prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        )
        setStarters(prev => prev.filter(p => p !== id))
        setBench(prev => prev.filter(p => p !== id))
      }
    }
  }

  function handleCardClick(id: number, isUnavailable: boolean) {
    if (isUnavailable && tab !== 'unavailable') {
      setLimitWarning('Este jugador está desconvocado. Cambia a la pestaña de desconvocados para modificarlo.')
      return
    }
    toggle(id)
  }

  const cardHighlight = (id: number) => {
    const isStarter = starters.includes(id)
    const isBench = bench.includes(id)
    const isUnavailable = unavailable.includes(id)
    if (isStarter) return 'ring-2 ring-emerald-500'
    if (isBench) return 'ring-2 ring-sky-500'
    if (isUnavailable) return 'ring-2 ring-muted'
    if (tab === 'starters' && isBench) return 'opacity-40'
    if (tab === 'bench' && isStarter) return 'opacity-40'
    if (tab === 'unavailable' && (isStarter || isBench)) return 'opacity-40'
    return ''
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <p className="text-sm font-medium">Formación</p>
          <p className="text-xs text-muted-foreground">
            Titulares seleccionados: {starters.length}/{maxStarters}
          </p>
        </div>
        <Select
          value={formation}
          onValueChange={value => {
            setFormation(value)
            const formationData = formations.find(f => f.value === value)
            const limit = formationData?.positions.length ?? maxStarters
            if (starters.length > limit) {
              setStarters(prev => prev.slice(0, limit))
            }
            setLimitWarning(null)
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Selecciona formación" />
          </SelectTrigger>
          <SelectContent>
            {formations.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {limitWarning ? (
        <p className="text-xs text-destructive">{limitWarning}</p>
      ) : null}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab('starters')}
          className={cn(
            'px-3 py-1 rounded-full text-sm transition-colors',
            tab === 'starters'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground'
          )}
        >
          Titulares ({starters.length}/{maxStarters})
        </button>
        <button
          type="button"
          onClick={() => setTab('bench')}
          className={cn(
            'px-3 py-1 rounded-full text-sm transition-colors',
            tab === 'bench'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground'
          )}
        >
          Suplentes ({bench.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('unavailable')}
          className={cn(
            'px-3 py-1 rounded-full text-sm transition-colors',
            tab === 'unavailable'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground'
          )}
        >
          Desconvocados ({unavailable.length})
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {players.map(p => {
          const bg = p.posicion === 'Portero' ? goalkeeperColor : teamColor
          const isUnavailable = unavailable.includes(p.id)
          const disabled = isUnavailable && tab !== 'unavailable'
          return (
            <div
              key={p.id}
              onClick={() => {
                if (disabled) return
                handleCardClick(p.id, isUnavailable)
              }}
              className={cn(
                'border rounded-md p-2 flex flex-col items-center gap-2 select-none transition-shadow hover:shadow-sm',
                disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
                cardHighlight(p.id)
              )}
              aria-disabled={disabled}
            >
              <div
                className="w-12 h-12 flex items-center justify-center rounded"
                style={{ backgroundColor: bg, color: p.posicion === 'Portero' ? '#fff' : textColor }}
              >
                {p.dorsal ?? '-'}
              </div>
              <span className="text-xs text-center leading-tight">
                {p.nombre}
              </span>
            </div>
          )
        })}
      </div>
      {starters.map(id => (
        <input key={`s-${id}`} type="hidden" name="starters" value={id} />
      ))}
      {bench.map(id => (
        <input key={`b-${id}`} type="hidden" name="bench" value={id} />
      ))}
      {unavailable.map(id => (
        <input key={`u-${id}`} type="hidden" name="unavailable" value={id} />
      ))}
      <input type="hidden" name="formation" value={formation} />
    </div>
  )
}

