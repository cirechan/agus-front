import { NextResponse } from 'next/server';
import { valoracionesService } from '@/lib/api/services';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const jugadorIdParam = searchParams.get('jugadorId');
    const jugadorId = jugadorIdParam ? Number(jugadorIdParam) : undefined;
    const valoraciones = jugadorId
      ? await valoracionesService.getByJugador(jugadorId)
      : await valoracionesService.getAll();
    return NextResponse.json(valoraciones);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: 'Error al cargar valoraciones' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const payload = { ...data, jugadorId: Number(data.jugadorId) };
    let resultado;
    if (payload.id) {
      resultado = await valoracionesService.update(Number(payload.id), payload);
    } else {
      resultado = await valoracionesService.create(payload);
    }
    return NextResponse.json(resultado);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: 'Error al guardar valoración' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (id) {
      await valoracionesService.delete(Number(id));
    }
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: 'Error al eliminar valoración' }, { status: 500 });
  }
}
