import { NextResponse } from 'next/server';
import { objetivosService } from '@/lib/api/services';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const equipoId = searchParams.get('equipoId');
    if (equipoId) {
      const objetivos = await objetivosService.getByEquipo(Number(equipoId));
      return NextResponse.json(objetivos);
    }
    const objetivos = await objetivosService.getAll();
    return NextResponse.json(objetivos);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: 'Error al acceder a objetivos' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const nuevo = await objetivosService.create(data);
    return NextResponse.json(nuevo);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: 'Error al crear objetivo' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { id, ...rest } = await req.json();
    const actualizado = await objetivosService.update(Number(id), rest);
    return NextResponse.json(actualizado);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: 'Error al actualizar objetivo' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (id) {
      await objetivosService.delete(Number(id));
    }
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: 'Error al eliminar objetivo' }, { status: 500 });
  }
}
