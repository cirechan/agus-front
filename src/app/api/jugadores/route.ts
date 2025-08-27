import { NextResponse } from 'next/server';
import { jugadoresService } from '@/lib/api/services';

export async function GET(req: Request) {
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
}

export async function POST(req: Request) {
  const data = await req.json();
  const nuevo = await jugadoresService.create(data);
  return NextResponse.json(nuevo);
}

export async function PUT(req: Request) {
  const { id, ...rest } = await req.json();
  const actualizado = await jugadoresService.update(Number(id), rest);
  return NextResponse.json(actualizado);
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (id) {
    await jugadoresService.delete(Number(id));
  }
  return NextResponse.json({ ok: true });
}
