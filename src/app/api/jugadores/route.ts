import { NextResponse } from 'next/server'
import { jugadoresService } from '@/lib/api/services'
import { revalidatePath } from 'next/cache'

export async function GET() {
  try {
    const jugadores = await jugadoresService.getAll()
    return NextResponse.json(jugadores)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al obtener jugadores' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const nuevo = await jugadoresService.create(body)
    revalidatePath('/dashboard/jugadores')
    return NextResponse.json(nuevo, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al crear jugador' }, { status: 500 })
  }
}
