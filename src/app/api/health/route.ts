import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    app: 'dp4',
    timestamp: new Date().toISOString(),
  });
}
