import { NextResponse } from 'next/server'
import { equiposService } from '@/lib/api/services'
import { revalidatePath } from 'next/cache'

export async function GET() {
  try {
    const equipos = await equiposService.getAll()
    return NextResponse.json(equipos)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al obtener equipos' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const nuevo = await equiposService.create(body)
    revalidatePath('/dashboard/equipos')
    return NextResponse.json(nuevo, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al crear equipo' }, { status: 500 })
  }
}
