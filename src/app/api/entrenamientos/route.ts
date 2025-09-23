import { NextResponse } from 'next/server'
import { entrenamientosService } from '@/lib/api/services'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type CreateRequest = {
  equipoId: number
  startDate: string
  endDate?: string
  daysOfWeek: number[]
  startTime: string
  endTime?: string
}

function toDateOnly(value?: string | null) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  date.setHours(0, 0, 0, 0)
  return date
}

function combineDateAndTime(base: Date, time: string) {
  const [hours, minutes] = time.split(':').map((part) => Number(part))
  const result = new Date(base)
  result.setHours(Number.isFinite(hours) ? hours : 0, Number.isFinite(minutes) ? minutes : 0, 0, 0)
  return result
}

function buildSessions({ startDate, endDate, daysOfWeek, startTime, endTime }: CreateRequest) {
  const start = toDateOnly(startDate)
  const end = toDateOnly(endDate || startDate)
  if (!start || !end) return []

  const normalizedDays = Array.from(new Set(daysOfWeek.filter((day) => day >= 0 && day <= 6)))
  if (normalizedDays.length === 0) return []

  const sessions: { inicio: string; fin: string | null }[] = []
  const cursor = new Date(start)
  while (cursor.getTime() <= end.getTime()) {
    if (normalizedDays.includes(cursor.getDay())) {
      const inicio = combineDateAndTime(cursor, startTime)
      const fin = endTime ? combineDateAndTime(cursor, endTime) : null
      sessions.push({
        inicio: inicio.toISOString(),
        fin: fin && fin.getTime() > inicio.getTime() ? fin.toISOString() : null,
      })
    }
    cursor.setDate(cursor.getDate() + 1)
  }

  return sessions
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const equipoId = Number(searchParams.get('equipoId'))
    if (Number.isNaN(equipoId)) {
      return NextResponse.json([])
    }
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const entrenamientos = await entrenamientosService.getByEquipo(equipoId, { from: from ?? undefined, to: to ?? undefined })
    return NextResponse.json(entrenamientos)
  } catch (error) {
    console.error('Error al cargar los entrenamientos', error)
    return NextResponse.json({ error: 'Error al cargar los entrenamientos' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CreateRequest
    const equipoId = Number(body.equipoId)
    if (
      Number.isNaN(equipoId) ||
      !body.startDate ||
      !body.startTime ||
      !Array.isArray(body.daysOfWeek) ||
      body.daysOfWeek.length === 0
    ) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }

    const sessions = buildSessions({
      startDate: body.startDate,
      endDate: body.endDate || body.startDate,
      daysOfWeek: body.daysOfWeek,
      startTime: body.startTime,
      endTime: body.endTime,
      equipoId,
    })

    if (sessions.length === 0) {
      return NextResponse.json({ error: 'No se generaron entrenamientos con los datos proporcionados' }, { status: 400 })
    }

    const creados = await entrenamientosService.createMany(equipoId, sessions)
    return NextResponse.json(creados)
  } catch (error) {
    console.error('Error al crear entrenamientos', error)
    return NextResponse.json({ error: 'Error al crear entrenamientos' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = Number(searchParams.get('id'))
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: 'Identificador inválido' }, { status: 400 })
    }
    await entrenamientosService.delete(id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error al eliminar entrenamiento', error)
    return NextResponse.json({ error: 'Error al eliminar entrenamiento' }, { status: 500 })
  }
}
