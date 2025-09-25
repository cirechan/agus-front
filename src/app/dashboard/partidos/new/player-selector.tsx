'use client'

import { useEffect, useState } from 'react'

interface Player {
  id: number
  nombre: string
  posicion: string | null
  dorsal: number | null
}

interface Props {
  players: Player[]
  teamColor: string
  goalkeeperColor: string
  textColor: string
  defaultStarters?: number[]
  defaultBench?: number[]
  defaultExcluded?: number[]
  maxStarters?: number
}

export default function PlayerSelector({
  players,
  teamColor,
  goalkeeperColor,
  textColor,
  defaultStarters = [],
  defaultBench = [],
  defaultExcluded = [],
  maxStarters = 11,
}: Props) {
  const [tab, setTab] = useState<'starters' | 'bench' | 'excluded'>('starters')
  const [starters, setStarters] = useState<number[]>(defaultStarters)
  const [bench, setBench] = useState<number[]>(defaultBench)
  const [excluded, setExcluded] = useState<number[]>(defaultExcluded)

  useEffect(() => {
    setStarters(defaultStarters)
  }, [defaultStarters])

  useEffect(() => {
    setBench(defaultBench)
  }, [defaultBench])

  useEffect(() => {
    setExcluded(defaultExcluded)
  }, [defaultExcluded])

  function toggle(id: number) {
    if (tab === 'starters') {
      setStarters(prev =>
        prev.includes(id)
          ? prev.filter(p => p !== id)
          : prev.length >= maxStarters
            ? prev
            : [...prev, id]
      )
      setBench(prev => prev.filter(p => p !== id))
      setExcluded(prev => prev.filter(p => p !== id))
    } else if (tab === 'bench') {
      setBench(prev =>
        prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
      )
      setStarters(prev => prev.filter(p => p !== id))
      setExcluded(prev => prev.filter(p => p !== id))
    } else {
      setExcluded(prev =>
        prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
      )
      setStarters(prev => prev.filter(p => p !== id))
      setBench(prev => prev.filter(p => p !== id))
    }
  }

  const cardHighlight = (id: number) => {
    const isStarter = starters.includes(id)
    const isBench = bench.includes(id)
    const isExcluded = excluded.includes(id)
    if (tab === 'starters') {
      if (isStarter) return 'ring-2 ring-primary'
      if (isBench || isExcluded) return 'opacity-40'
    } else if (tab === 'bench') {
      if (isBench) return 'ring-2 ring-primary'
      if (isStarter || isExcluded) return 'opacity-40'
    } else {
      if (isExcluded) return 'ring-2 ring-red-500'
      if (isStarter || isBench) return 'opacity-40'
    }
    return ''
  }

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => setTab('starters')}
          className={`px-3 py-1 rounded-full text-sm transition-colors ${
            tab === 'starters'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          Titulares ({starters.length}/{maxStarters})
        </button>
        <button
          type="button"
          onClick={() => setTab('bench')}
          className={`px-3 py-1 rounded-full text-sm transition-colors ${
            tab === 'bench'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          Suplentes ({bench.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('excluded')}
          className={`px-3 py-1 rounded-full text-sm transition-colors ${
            tab === 'excluded'
              ? 'bg-destructive text-destructive-foreground'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          Desconvocados ({excluded.length})
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {players.map(p => {
          const bg = p.posicion === 'Portero' ? goalkeeperColor : teamColor
          return (
            <div
              key={p.id}
              onClick={() => toggle(p.id)}
              className={`border rounded-md p-2 flex flex-col items-center gap-2 cursor-pointer select-none ${cardHighlight(
                p.id
              )}`}
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
      {excluded.map(id => (
        <input key={`e-${id}`} type="hidden" name="excluded" value={id} />
      ))}
    </div>
  )
}

