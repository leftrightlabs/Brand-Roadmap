import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// Health endpoint for Railway. Probes the DB and reports env-var presence.
export async function GET() {
  try {
    const startTime = Date.now();

    // Check database connection — SELECT 1 is the cheapest possible probe
    let dbStatus = 'unknown';
    try {
      await sql`SELECT 1`;
      dbStatus = 'ok';
    } catch (dbError) {
      dbStatus = 'error';
      console.error('[HEALTH] Database connection error:', dbError);
    }

    const envStatus = {
      databaseUrl: !!process.env.DATABASE_URL,
      anthropicKey: !!process.env.ANTHROPIC_API_KEY,
    };

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      responseTime: `${Date.now() - startTime}ms`,
      database: dbStatus,
      environment: envStatus,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    });
  } catch (error) {
    console.error('[HEALTH] Health check error:', error);
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
