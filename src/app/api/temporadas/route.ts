import { NextResponse } from 'next/server';
import { temporadasService } from '@/lib/api/services';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get('actual')) {
    const actual = await temporadasService.getActual();
    return NextResponse.json(actual || null);
  }
  const todas = await temporadasService.getAll();
  return NextResponse.json(todas);
}
