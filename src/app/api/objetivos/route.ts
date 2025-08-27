import { NextResponse } from 'next/server';
import { objetivosService } from '@/lib/api/services';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const equipoId = searchParams.get('equipoId');
  if (equipoId) {
    const objetivos = await objetivosService.getByEquipo(Number(equipoId));
    return NextResponse.json(objetivos);
  }
  const objetivos = await objetivosService.getAll();
  return NextResponse.json(objetivos);
}

export async function POST(req: Request) {
  const data = await req.json();
  const nuevo = await objetivosService.create(data);
  return NextResponse.json(nuevo);
}

export async function PUT(req: Request) {
  const { id, ...rest } = await req.json();
  const actualizado = await objetivosService.update(Number(id), rest);
  return NextResponse.json(actualizado);
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (id) {
    await objetivosService.delete(Number(id));
  }
  return NextResponse.json({ ok: true });
}
