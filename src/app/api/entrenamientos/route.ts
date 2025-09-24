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
  timezoneOffset?: number
}

function toDateOnly(value?: string | null) {
  if (!value) return null

  const parts = String(value)
    .split('T')[0]
    .split('-')
    .map((part) => Number(part))

  if (parts.length === 3 && parts.every((part) => Number.isFinite(part))) {
    const [year, month, day] = parts
    return new Date(Date.UTC(year, month - 1, day))
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  date.setUTCHours(0, 0, 0, 0)
  return date
}

function toIsoDateString(date: Date) {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function combineDateAndTime(date: string, time: string, timezoneOffset?: number) {
  if (!date || !time) return null

  const [year, month, day] = date.split('-').map((part) => Number(part))
  const [hours, minutes] = time.split(':').map((part) => Number(part))

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes)
  ) {
    return null
  }

  if (typeof timezoneOffset === 'number' && Number.isFinite(timezoneOffset)) {
    const utcMillis = Date.UTC(year, month - 1, day, hours, minutes) + timezoneOffset * 60 * 1000
    return new Date(utcMillis)
  }

  const base = new Date(`${date}T00:00:00`)
  if (Number.isNaN(base.getTime())) return null
  base.setHours(hours, minutes, 0, 0)
  return base
}

function buildSessions({ startDate, endDate, daysOfWeek, startTime, endTime, timezoneOffset }: CreateRequest) {
  const start = toDateOnly(startDate)
  const end = toDateOnly(endDate || startDate)
  if (!start || !end) return []

  const normalizedDays = Array.from(new Set(daysOfWeek.filter((day) => day >= 0 && day <= 6)))
  if (normalizedDays.length === 0) return []

  const sessions: { inicio: string; fin: string | null }[] = []
  const cursor = new Date(start)
  while (cursor.getTime() <= end.getTime()) {
    if (normalizedDays.includes(cursor.getUTCDay())) {
      const dateKey = toIsoDateString(cursor)
      const inicioDate = combineDateAndTime(dateKey, startTime, timezoneOffset)
      const finDate = endTime ? combineDateAndTime(dateKey, endTime, timezoneOffset) : null
      if (inicioDate) {
        sessions.push({
          inicio: inicioDate.toISOString(),
          fin: finDate && finDate.getTime() > inicioDate.getTime() ? finDate.toISOString() : null,
        })
      }
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1)
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
      timezoneOffset:
        typeof body.timezoneOffset === 'number' && Number.isFinite(body.timezoneOffset)
          ? body.timezoneOffset
          : undefined,
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
