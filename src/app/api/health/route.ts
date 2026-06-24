import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    
    // Check database connection
    let dbStatus = 'unknown';
    try {
      const { data, error } = await supabase
        .from('shared_reports')
        .select('count')
        .limit(1);
      
      if (error) {
        dbStatus = 'error';
        console.error('[HEALTH] Database error:', error);
      } else {
        dbStatus = 'ok';
      }
    } catch (dbError) {
      dbStatus = 'error';
      console.error('[HEALTH] Database connection error:', dbError);
    }

    // Check environment variables
    const envStatus = {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      anthropicKey: !!process.env.ANTHROPIC_API_KEY,
    };

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
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
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
