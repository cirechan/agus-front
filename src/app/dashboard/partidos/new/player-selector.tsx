'use client'

import { useState } from 'react'

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
}

export default function PlayerSelector({ players, teamColor, goalkeeperColor, textColor }: Props) {
  const [tab, setTab] = useState<'starters' | 'bench'>('starters')
  const [starters, setStarters] = useState<number[]>([])
  const [bench, setBench] = useState<number[]>([])

  function toggle(id: number) {
    if (tab === 'starters') {
      setStarters(prev =>
        prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
      )
      setBench(prev => prev.filter(p => p !== id))
    } else {
      setBench(prev =>
        prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
      )
      setStarters(prev => prev.filter(p => p !== id))
    }
  }

  const cardHighlight = (id: number) => {
    const isStarter = starters.includes(id)
    const isBench = bench.includes(id)
    if (tab === 'starters') {
      if (isStarter) return 'ring-2 ring-primary'
      if (isBench) return 'opacity-40'
    } else {
      if (isBench) return 'ring-2 ring-primary'
      if (isStarter) return 'opacity-40'
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
          Titulares ({starters.length})
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
    </div>
  )
}

