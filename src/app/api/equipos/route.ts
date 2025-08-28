import { NextResponse } from 'next/server';
import { equiposService } from '@/lib/api/services';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const temporadaId = searchParams.get('temporadaId');
    if (id) {
      const equipo = await equiposService.getById(Number(id));
      return NextResponse.json(equipo || {});
    }
    if (temporadaId) {
      const equipos = await equiposService.getByTemporada(temporadaId);
      return NextResponse.json(equipos);
    }
    const equipos = await equiposService.getAll();
    return NextResponse.json(equipos);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: 'Error al acceder a equipos' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const nuevo = await equiposService.create(data);
    return NextResponse.json(nuevo);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: 'Error al crear equipo' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { id, ...rest } = await req.json();
    const actualizado = await equiposService.update(Number(id), rest);
    return NextResponse.json(actualizado);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: 'Error al actualizar equipo' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (id) {
      await equiposService.delete(Number(id));
    }
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: 'Error al eliminar equipo' }, { status: 500 });
  }
}
