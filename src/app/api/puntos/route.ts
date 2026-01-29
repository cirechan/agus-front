import { NextResponse } from 'next/server';
import { get, run, ready, hasDatabaseConnection } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DATA_ID = 'default';
const corsOrigin = process.env.CORS_ORIGIN || '';
const corsHeaders = corsOrigin
  ? {
      'Access-Control-Allow-Origin': corsOrigin,
      'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  : {};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET() {
  try {
    if (!hasDatabaseConnection()) {
      return NextResponse.json({ error: 'DATABASE_URL not configured' }, { status: 500, headers: corsHeaders });
    }

    await ready;
    const row = await get('SELECT payload FROM puntos_data WHERE id = $1', [DATA_ID]);
    if (!row) {
      return new NextResponse(null, { status: 204, headers: corsHeaders });
    }
    return NextResponse.json(row.payload ?? {}, { headers: corsHeaders });
  } catch (err) {
    console.error('Error al cargar puntos', err);
    return NextResponse.json({ error: 'Error al cargar puntos' }, { status: 500, headers: corsHeaders });
  }
}

export async function PUT(req: Request) {
  try {
    if (!hasDatabaseConnection()) {
      return NextResponse.json({ error: 'DATABASE_URL not configured' }, { status: 500, headers: corsHeaders });
    }

    const payload = await req.json();
    if (!payload || typeof payload !== 'object') {
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400, headers: corsHeaders });
    }

    await ready;
    await run(
      `INSERT INTO puntos_data (id, payload, updated_at)
       VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (id)
       DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()`
      ,
      [DATA_ID, JSON.stringify(payload)]
    );

    return NextResponse.json({ ok: true }, { headers: corsHeaders });
  } catch (err) {
    console.error('Error al guardar puntos', err);
    return NextResponse.json({ error: 'Error al guardar puntos' }, { status: 500, headers: corsHeaders });
  }
}
