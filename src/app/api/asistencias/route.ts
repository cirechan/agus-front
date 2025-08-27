import { NextResponse } from 'next/server';
import { asistenciasService } from '@/lib/api/services';

export async function POST(req: Request) {
  const { fecha, registros, equipoId } = await req.json();
  if (!fecha || !Array.isArray(registros)) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }
  for (const r of registros) {
    await asistenciasService.create({
      jugadorId: Number(r.jugadorId),
      equipoId: Number(equipoId),
      fecha,
      asistio: r.asistio,
      motivo: r.motivo || '',
    });
  }
  return NextResponse.json({ ok: true });
}
