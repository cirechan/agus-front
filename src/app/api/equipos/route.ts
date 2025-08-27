import { NextResponse } from 'next/server';
import { equiposService } from '@/lib/api/services';

export async function GET(req: Request) {
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
}

export async function POST(req: Request) {
  const data = await req.json();
  const nuevo = await equiposService.create(data);
  return NextResponse.json(nuevo);
}

export async function PUT(req: Request) {
  const { id, ...rest } = await req.json();
  const actualizado = await equiposService.update(Number(id), rest);
  return NextResponse.json(actualizado);
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (id) {
    await equiposService.delete(Number(id));
  }
  return NextResponse.json({ ok: true });
}
