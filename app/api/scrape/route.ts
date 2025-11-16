// ================================================================================
// API ROUTE: /api/scrape
// Triggers scraping of DevDocs documentation
// ================================================================================

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { devdocsScraper } from '@/lib/devdocs-scraper'

export const maxDuration = 300 // 5 minutes max execution time
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { docSlug, priority = 5 } = body

    if (!docSlug) {
      return NextResponse.json(
        { error: 'docSlug is required' },
        { status: 400 }
      )
    }

    // Get or create knowledge source for DevDocs
    let sourceId: string

    const { data: existingSource } = await supabaseAdmin
      .from('knowledge_sources')
      .select('id')
      .eq('url', 'https://devdocs.io')
      .single()

    if (existingSource) {
      sourceId = existingSource.id
    } else {
      const { data: newSource, error: createError } = await supabaseAdmin
        .from('knowledge_sources')
        .insert({
          name: 'DevDocs',
          source_type: 'documentation',
          url: 'https://devdocs.io',
          base_domain: 'devdocs.io',
          category: 'web_development',
          priority,
          trust_level: 'verified',
          status: 'active',
          scrape_enabled: true,
          scrape_frequency: 'weekly',
          tags: ['documentation', 'multi-language', 'api-reference'],
        })
        .select('id')
        .single()

      if (createError || !newSource) {
        throw new Error('Failed to create knowledge source')
      }

      sourceId = newSource.id
    }

    // Create scraping job
    const { data: job, error: jobError } = await supabaseAdmin
      .from('scraping_jobs')
      .insert({
        source_id: sourceId,
        job_type: 'full_scrape',
        scheduled_at: new Date().toISOString(),
        status: 'pending',
        total_urls: 0,
        urls_processed: 0,
        urls_failed: 0,
        progress_percentage: 0,
        items_scraped: 0,
        items_new: 0,
        items_updated: 0,
        items_unchanged: 0,
        retry_count: 0,
        max_retries: 3,
        config: { docSlug },
      })
      .select()
      .single()

    if (jobError || !job) {
      throw new Error('Failed to create scraping job')
    }

    // Start scraping in background (don't await)
    scrapeInBackground(job.id, docSlug, sourceId)

    return NextResponse.json({
      success: true,
      jobId: job.id,
      message: `Scraping started for ${docSlug}`,
    })
  } catch (error) {
    console.error('Scrape API error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get list of available docs
    const docs = await devdocsScraper.getAvailableDocs()

    // Get already scraped docs
    const { data: scrapedJobs } = await supabaseAdmin
      .from('scraping_jobs')
      .select('config, status')
      .eq('status', 'completed')

    const scrapedDocs = new Set(
      scrapedJobs?.map((job: any) => job.config?.docSlug).filter(Boolean) || []
    )

    // Mark which docs are already scraped
    const docsWithStatus = docs.map((doc) => ({
      ...doc,
      scraped: scrapedDocs.has(doc.slug),
    }))

    return NextResponse.json({
      success: true,
      count: docs.length,
      docs: docsWithStatus,
    })
  } catch (error) {
    console.error('Get docs API error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * Background scraping function
 */
async function scrapeInBackground(
  jobId: string,
  docSlug: string,
  sourceId: string
) {
  try {
    await devdocsScraper.scrapeDoc(jobId, docSlug)

    // Update source last_scraped_at
    await supabaseAdmin
      .from('knowledge_sources')
      .update({
        last_scraped_at: new Date().toISOString(),
      })
      .eq('id', sourceId)
  } catch (error) {
    console.error('Background scraping error:', error)

    // Update job with error
    await supabaseAdmin
      .from('scraping_jobs')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId)
  }
}
