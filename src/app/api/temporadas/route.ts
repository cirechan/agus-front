import { NextResponse } from 'next/server'
import { temporadasService } from '@/lib/api/services'
import { revalidatePath } from 'next/cache'

export async function GET() {
  try {
    const temporadas = await temporadasService.getAll()
    return NextResponse.json(temporadas)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al obtener temporadas' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const nueva = await temporadasService.create(body)
    revalidatePath('/dashboard/horarios')
    return NextResponse.json(nueva, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al crear temporada' }, { status: 500 })
  }
}
