import { NextResponse } from 'next/server';
import { horariosService } from '@/lib/api/services';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const equipoId = Number(searchParams.get('equipoId'));
  const horarios = await horariosService.getByEquipo(equipoId);
  return NextResponse.json(horarios);
}

export async function POST(req: Request) {
  const { equipoId, horarios } = await req.json();
  const res = await horariosService.setForEquipo(Number(equipoId), horarios);
  return NextResponse.json(res);
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (id) {
    await horariosService.delete(Number(id));
  }
  return NextResponse.json({ ok: true });
}
