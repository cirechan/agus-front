import { NextResponse } from 'next/server';
import { jugadoresService } from '@/lib/api/services';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const equipoId = searchParams.get('equipoId');
    if (id) {
      const jugador = await jugadoresService.getById(Number(id));
      return NextResponse.json(jugador || {});
    }
    if (equipoId) {
      const jugadores = await jugadoresService.getByEquipo(Number(equipoId));
      return NextResponse.json(jugadores);
    }
    const jugadores = await jugadoresService.getAll();
    return NextResponse.json(jugadores);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: 'Error al acceder a jugadores' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const nuevo = await jugadoresService.create(data);
    return NextResponse.json(nuevo);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: 'Error al crear jugador' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { id, ...rest } = await req.json();
    const actualizado = await jugadoresService.update(Number(id), rest);
    return NextResponse.json(actualizado);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: 'Error al actualizar jugador' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (id) {
      await jugadoresService.delete(Number(id));
    }
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: 'Error al eliminar jugador' }, { status: 500 });
  }
}
