// ================================================================================
// API ROUTE: /api/jobs
// Get scraping job status and history
// ================================================================================

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('id')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Get specific job by ID
    if (jobId) {
      const { data: job, error } = await supabaseAdmin
        .from('scraping_jobs')
        .select('*')
        .eq('id', jobId)
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        job,
      })
    }

    // Get jobs list
    let query = supabaseAdmin
      .from('scraping_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (status) {
      query = query.eq('status', status)
    }

    const { data: jobs, error } = await query

    if (error) {
      throw error
    }

    // Get summary stats
    const { data: stats } = await supabaseAdmin
      .from('scraping_jobs')
      .select('status, id')

    const summary = {
      total: stats?.length || 0,
      pending: stats?.filter((j: any) => j.status === 'pending').length || 0,
      running: stats?.filter((j: any) => j.status === 'running').length || 0,
      completed: stats?.filter((j: any) => j.status === 'completed').length || 0,
      failed: stats?.filter((j: any) => j.status === 'failed').length || 0,
    }

    return NextResponse.json({
      success: true,
      jobs,
      summary,
    })
  } catch (error) {
    console.error('Jobs API error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
