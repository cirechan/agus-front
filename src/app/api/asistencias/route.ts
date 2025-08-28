import { NextResponse } from 'next/server';
import { asistenciasService } from '@/lib/api/services';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fecha = searchParams.get('fecha');
    const equipoId = Number(searchParams.get('equipoId'));
    if (!fecha || Number.isNaN(equipoId)) return NextResponse.json([]);
    const registros = await asistenciasService.getByFecha(equipoId, fecha);
    return NextResponse.json(registros);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: 'Error al cargar asistencias' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { fecha, registros, equipoId } = await req.json();
    if (!fecha || !Array.isArray(registros)) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }
    const nuevos = await asistenciasService.setForFecha(Number(equipoId), fecha, registros);
    return NextResponse.json(nuevos);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: 'Error al guardar asistencias' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fecha = searchParams.get('fecha');
    const equipoId = Number(searchParams.get('equipoId'));
    if (fecha && !Number.isNaN(equipoId)) {
      await asistenciasService.deleteByFecha(equipoId, fecha);
    }
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: 'Error al eliminar asistencias' }, { status: 500 });
  }
}
