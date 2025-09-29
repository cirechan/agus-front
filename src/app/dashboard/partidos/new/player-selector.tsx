'use client'

import { useEffect, useMemo, useState } from 'react'
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
  initialAssignments?: { position: string; playerId: number | null }[]
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
  initialAssignments,
}: Props) {
  const [tab, setTab] = useState<'starters' | 'bench' | 'unavailable'>('starters')
  const [starters, setStarters] = useState<number[]>(initialStarters)
  const [bench, setBench] = useState<number[]>(initialBench)
  const [unavailable, setUnavailable] = useState<number[]>(initialUnavailable)
  const [formation, setFormation] = useState(initialFormation ?? defaultFormation)
  const [limitWarning, setLimitWarning] = useState<string | null>(null)
  const [assignments, setAssignments] = useState<{ position: string; playerId: number | null }[]>([])

  const activeFormation = useMemo(
    () => formations.find(f => f.value === formation) ?? formations[0],
    [formation, formations]
  )
  const maxStarters = activeFormation?.positions.length ?? 11

  const POSITION_LABELS: Record<string, string> = useMemo(
    () => ({
      GK: 'Portero',
      LB: 'Lateral izquierdo',
      LCB: 'Central izquierdo',
      CB: 'Central',
      RCB: 'Central derecho',
      RB: 'Lateral derecho',
      LM: 'Extremo izquierdo',
      LCM: 'Centrocampista izquierdo',
      CM: 'Centrocampista',
      RCM: 'Centrocampista derecho',
      RM: 'Extremo derecho',
      LDM: 'Pivote izquierdo',
      RDM: 'Pivote derecho',
      CAM: 'Mediapunta',
      LW: 'Extremo izquierdo',
      LS: 'Delantero izquierdo',
      ST: 'Delantero centro',
      RS: 'Delantero derecho',
      RW: 'Extremo derecho',
    }),
    []
  )

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

  const initialAssignmentsList = useMemo(
    () => initialAssignments ?? [],
    [initialAssignments]
  )

  useEffect(() => {
    setAssignments(prev => {
      const positions = activeFormation?.positions ?? []
      const useInitial = prev.length === 0
      const initialMap = new Map(initialAssignmentsList.map(item => [item.position, item.playerId]))
      const next: { position: string; playerId: number | null }[] = []
      const alreadyAssigned = new Set<number>()

      positions.forEach(position => {
        let playerId: number | null = null
        const previous = prev.find(slot => slot.position === position)
        if (previous) {
          playerId = previous.playerId
        } else if (useInitial && initialMap.has(position)) {
          playerId = initialMap.get(position) ?? null
        }

        if (playerId != null) {
          if (!starters.includes(playerId) || alreadyAssigned.has(playerId)) {
            playerId = null
          }
        }

        if (playerId != null) {
          alreadyAssigned.add(playerId)
        }
        next.push({ position, playerId })
      })

      const remaining = starters.filter(id => !alreadyAssigned.has(id))
      return next.map(slot => {
        if (slot.playerId != null) {
          return slot
        }
        const nextPlayer = remaining.shift() ?? null
        return { ...slot, playerId: nextPlayer }
      })
    })
  }, [activeFormation, starters, initialAssignmentsList])

  useEffect(() => {
    setAssignments(prev =>
      prev.map(slot =>
        slot.playerId != null && !starters.includes(slot.playerId)
          ? { ...slot, playerId: null }
          : slot
      )
    )
  }, [starters])

  function assignPlayerToSlot(position: string, value: string) {
    setAssignments(prev => {
      const playerId = value === 'none' ? null : Number(value)
      const next = prev.map(slot => ({ ...slot }))
      const target = next.find(slot => slot.position === position)
      if (!target) {
        return prev
      }

      if (playerId != null && !Number.isFinite(playerId)) {
        return prev
      }

      next.forEach(slot => {
        if (slot.position !== position && slot.playerId === playerId) {
          slot.playerId = null
        }
      })

      target.playerId = playerId
      return next
    })
  }

  const starterOptions = useMemo(
    () =>
      starters
        .map(id => players.find(p => p.id === id) ?? null)
        .filter((p): p is Player => Boolean(p)),
    [players, starters]
  )

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
    <div className="space-y-4 min-w-0">
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
      <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
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
      {assignments.map(slot => {
        const hiddenValue =
          slot.playerId != null
            ? `${slot.position}:${slot.playerId}`
            : `${slot.position}:`;
        return (
          <input
            key={`slot-${slot.position}`}
            type="hidden"
            name="starterSlot"
            value={hiddenValue}
          />
        );
      })}
      {starterOptions.length > 0 && (
        <div className="mt-4 space-y-3">
          <p className="text-sm font-medium">Posición de los titulares</p>
          <div className="grid gap-3">
            {assignments.map(slot => (
              <div key={slot.position} className="grid gap-1">
                <span className="text-xs font-medium text-muted-foreground">
                  {POSITION_LABELS[slot.position] ?? slot.position}
                </span>
                <Select
                  value={slot.playerId != null ? String(slot.playerId) : 'none'}
                  onValueChange={value => assignPlayerToSlot(slot.position, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona jugador" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin asignar</SelectItem>
                    {starterOptions.map(player => (
                      <SelectItem key={player.id} value={String(player.id)}>
                        {player.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

