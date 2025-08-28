import { NextResponse } from 'next/server';
import { scoutingService } from '@/lib/api/services';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const registros = await scoutingService.getAll();
    return NextResponse.json(registros);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: 'Error al obtener scouting' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const nuevo = await scoutingService.create(data);
    return NextResponse.json(nuevo);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: 'Error al crear scouting' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { id, ...rest } = await req.json();
    const actualizado = await scoutingService.update(Number(id), rest);
    return NextResponse.json(actualizado);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: 'Error al actualizar scouting' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (id) {
      await scoutingService.delete(Number(id));
    }
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: 'Error al eliminar scouting' }, { status: 500 });
  }
}
