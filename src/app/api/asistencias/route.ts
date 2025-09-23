import { NextResponse } from 'next/server';
import { asistenciasService, entrenamientosService } from '@/lib/api/services';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const equipoId = Number(searchParams.get('equipoId'));
    if (Number.isNaN(equipoId)) return NextResponse.json([]);

    const entrenamientoId = searchParams.get('entrenamientoId');
    if (entrenamientoId) {
      const registros = await asistenciasService.getByEntrenamiento(
        equipoId,
        Number(entrenamientoId)
      );
      return NextResponse.json(registros);
    }

    const fecha = searchParams.get('fecha');
    if (!fecha) return NextResponse.json([]);
    const registros = await asistenciasService.getByFecha(equipoId, fecha);
    return NextResponse.json(registros);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: 'Error al cargar asistencias' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { fecha: fechaEntrada, registros, equipoId, entrenamientoId } = await req.json();
    const equipoIdNumber = Number(equipoId);
    if (Number.isNaN(equipoIdNumber) || !Array.isArray(registros)) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    let fecha = fechaEntrada as string | null;
    const entrenamientoNumber = entrenamientoId ? Number(entrenamientoId) : null;

    if (entrenamientoNumber) {
      if (!fecha) {
        const entrenamiento = await entrenamientosService.getById(entrenamientoNumber);
        if (entrenamiento?.inicio) {
          const start = new Date(entrenamiento.inicio);
          if (!Number.isNaN(start.getTime())) {
            fecha = start.toISOString().slice(0, 10);
          }
        }
      }
      if (!fecha) {
        return NextResponse.json({ error: 'Fecha no disponible para el entrenamiento' }, { status: 400 });
      }
      const nuevos = await asistenciasService.setForEntrenamiento(
        equipoIdNumber,
        entrenamientoNumber,
        fecha,
        registros
      );
      return NextResponse.json(nuevos);
    }

    if (!fecha) {
      return NextResponse.json({ error: 'Fecha requerida' }, { status: 400 });
    }

    const nuevos = await asistenciasService.setForFecha(equipoIdNumber, fecha, registros);
    return NextResponse.json(nuevos);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: 'Error al guardar asistencias' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const equipoId = Number(searchParams.get('equipoId'));
    if (Number.isNaN(equipoId)) {
      return NextResponse.json({ ok: true });
    }
    const entrenamientoId = searchParams.get('entrenamientoId');
    if (entrenamientoId) {
      await asistenciasService.deleteByEntrenamiento(equipoId, Number(entrenamientoId));
      return NextResponse.json({ ok: true });
    }
    const fecha = searchParams.get('fecha');
    if (fecha) {
      await asistenciasService.deleteByFecha(equipoId, fecha);
    }
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: 'Error al eliminar asistencias' }, { status: 500 });
  }
}
