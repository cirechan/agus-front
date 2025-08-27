import { NextResponse } from 'next/server';
import { asistenciasService } from '@/lib/api/services';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const fecha = searchParams.get('fecha');
  const equipoId = Number(searchParams.get('equipoId'));
  if (!fecha) return NextResponse.json([]);
  const registros = await asistenciasService.getByFecha(equipoId, fecha);
  return NextResponse.json(registros);
}

export async function POST(req: Request) {
  const { fecha, registros, equipoId } = await req.json();
  if (!fecha || !Array.isArray(registros)) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }
  await asistenciasService.setForFecha(Number(equipoId), fecha, registros);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const fecha = searchParams.get('fecha');
  const equipoId = Number(searchParams.get('equipoId'));
  if (fecha) {
    await asistenciasService.deleteByFecha(Number(equipoId), fecha);
  }
  return NextResponse.json({ ok: true });
}
