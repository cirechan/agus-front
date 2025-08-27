import { NextResponse } from 'next/server';
import { valoracionesService } from '@/lib/api/services';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const jugadorId = searchParams.get('jugadorId');
  const valoraciones = jugadorId
    ? await valoracionesService.getByJugador(Number(jugadorId))
    : await valoracionesService.getAll();
  return NextResponse.json(valoraciones);
}

export async function POST(req: Request) {
  const data = await req.json();
  let resultado;
  if (data.id) {
    resultado = await valoracionesService.update(Number(data.id), data);
  } else {
    resultado = await valoracionesService.create(data);
  }
  return NextResponse.json(resultado);
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (id) {
    await valoracionesService.delete(Number(id));
  }
  return NextResponse.json({ ok: true });
}
