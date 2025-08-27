import { NextResponse } from 'next/server';
import { scoutingService } from '@/lib/api/services';

export async function GET() {
  const registros = await scoutingService.getAll();
  return NextResponse.json(registros);
}

export async function POST(req: Request) {
  const data = await req.json();
  const nuevo = await scoutingService.create(data);
  return NextResponse.json(nuevo);
}

export async function PUT(req: Request) {
  const { id, ...rest } = await req.json();
  const actualizado = await scoutingService.update(Number(id), rest);
  return NextResponse.json(actualizado);
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (id) {
    await scoutingService.delete(Number(id));
  }
  return NextResponse.json({ ok: true });
}
