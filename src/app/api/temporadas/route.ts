import { NextResponse } from 'next/server';
import { temporadasService } from '@/lib/api/services';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    if (searchParams.get('actual')) {
      const actual = await temporadasService.getActual();
      return NextResponse.json(actual || null);
    }
    const todas = await temporadasService.getAll();
    return NextResponse.json(todas);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: 'Error al obtener temporadas' }, { status: 500 });
  }
}
