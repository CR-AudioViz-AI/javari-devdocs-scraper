// ================================================================================
// DEVDOCS SCRAPER - MAIN LOGIC
// ================================================================================
// Scrapes documentation from DevDocs.io and stores in Supabase
// ================================================================================

import axios from 'axios'
import * as cheerio from 'cheerio'
import crypto from 'crypto'
import { supabaseAdmin } from './supabase'
import type {
  DevDocsDoc,
  DevDocsEntry,
  ScrapeResult,
  CodeSnippet,
  ScraperConfig,
} from './types'

const DEVDOCS_BASE = 'https://devdocs.io'
const DEVDOCS_API = 'https://devdocs.io/docs.json'

export class DevDocsScraper {
  private config: ScraperConfig
  private sourceId: string | null = null

  constructor(config?: Partial<ScraperConfig>) {
    this.config = {
      concurrency: config?.concurrency || 3,
      delayMs: config?.delayMs || 1000,
      timeoutMs: config?.timeoutMs || 30000,
      maxRetries: config?.maxRetries || 3,
      rateLimitPerMinute: config?.rateLimitPerMinute || 60,
      rateLimitPerHour: config?.rateLimitPerHour || 1000,
    }
  }

  /**
   * Get list of all available documentation sets from DevDocs
   */
  async getAvailableDocs(): Promise<DevDocsDoc[]> {
    try {
      const response = await axios.get<DevDocsDoc[]>(DEVDOCS_API, {
        timeout: this.config.timeoutMs,
        headers: {
          'User-Agent': 'Javari-DevDocs-Scraper/1.0',
        },
      })
      return response.data
    } catch (error) {
      console.error('Error fetching DevDocs list:', error)
      throw error
    }
  }

  /**
   * Get entries (individual pages) for a specific documentation set
   */
  async getDocEntries(docSlug: string): Promise<DevDocsEntry[]> {
    try {
      const indexUrl = `${DEVDOCS_BASE}/docs/${docSlug}/index.json`
      const response = await axios.get<{ entries: DevDocsEntry[] }>(indexUrl, {
        timeout: this.config.timeoutMs,
        headers: {
          'User-Agent': 'Javari-DevDocs-Scraper/1.0',
        },
      })
      return response.data.entries
    } catch (error) {
      console.error(`Error fetching entries for ${docSlug}:`, error)
      throw error
    }
  }

  /**
   * Scrape a single documentation page
   */
  async scrapePage(
    docSlug: string,
    entry: DevDocsEntry
  ): Promise<ScrapeResult> {
    const url = `${DEVDOCS_BASE}/${docSlug}/${entry.path}`

    try {
      // Fetch the page
      const response = await axios.get(url, {
        timeout: this.config.timeoutMs,
        headers: {
          'User-Agent': 'Javari-DevDocs-Scraper/1.0',
        },
      })

      const html = response.data
      const $ = cheerio.load(html)

      // Extract main content
      const content = $('._content').text().trim()
      
      // Extract code snippets
      const codeSnippets: CodeSnippet[] = []
      $('._content pre code').each((_, elem) => {
        const code = $(elem).text().trim()
        const language = $(elem).attr('class')?.replace('language-', '') || 'plaintext'
        if (code) {
          codeSnippets.push({ language, code })
        }
      })

      // Generate markdown (simplified version)
      const markdown = this.htmlToMarkdown($, $('._content'))

      // Extract keywords and topics
      const keywords = this.extractKeywords(content)
      const topics = [docSlug, entry.type, ...entry.name.split('/').slice(0, 2)]

      // Count words and characters
      const wordCount = content.split(/\s+/).filter(Boolean).length
      const characterCount = content.length

      return {
        success: true,
        url,
        title: entry.name,
        content,
        markdown,
        codeSnippets,
        wordCount,
        characterCount,
        keywords,
        topics,
      }
    } catch (error) {
      return {
        success: false,
        url,
        title: entry.name,
        content: '',
        codeSnippets: [],
        wordCount: 0,
        characterCount: 0,
        keywords: [],
        topics: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Scrape an entire documentation set
   */
  async scrapeDoc(
    docSlug: string,
    jobId: string,
    onProgress?: (progress: number, total: number) => void
  ): Promise<{
    success: number
    failed: number
    total: number
  }> {
    console.log(`Starting scrape of ${docSlug}...`)

    // Get all entries for this documentation
    const entries = await this.getDocEntries(docSlug)
    const total = entries.length

    console.log(`Found ${total} pages in ${docSlug}`)

    let successCount = 0
    let failedCount = 0

    // Update job with total URLs
    await this.updateJob(jobId, {
      total_urls: total,
      status: 'running',
      started_at: new Date().toISOString(),
    })

    // Process entries in batches
    for (let i = 0; i < entries.length; i += this.config.concurrency) {
      const batch = entries.slice(i, i + this.config.concurrency)

      const results = await Promise.all(
        batch.map((entry) => this.scrapePage(docSlug, entry))
      )

      // Save results to database
      for (const result of results) {
        if (result.success) {
          await this.saveContent(result, docSlug)
          successCount++
        } else {
          failedCount++
        }

        // Update job progress
        const processed = successCount + failedCount
        const progress = (processed / total) * 100

        await this.updateJob(jobId, {
          urls_processed: processed,
          urls_failed: failedCount,
          progress_percentage: progress,
          items_scraped: successCount,
        })

        // Call progress callback
        if (onProgress) {
          onProgress(processed, total)
        }
      }

      // Delay between batches
      if (i + this.config.concurrency < entries.length) {
        await this.delay(this.config.delayMs)
      }
    }

    // Mark job as complete
    await this.updateJob(jobId, {
      status: 'completed',
      completed_at: new Date().toISOString(),
    })

    return {
      success: successCount,
      failed: failedCount,
      total,
    }
  }

  /**
   * Save scraped content to Supabase
   */
  private async saveContent(result: ScrapeResult, docSlug: string) {
    try {
      // Get or create knowledge source
      if (!this.sourceId) {
        const { data: source } = await supabaseAdmin
          .from('knowledge_sources')
          .select('id')
          .eq('url', DEVDOCS_BASE)
          .single()

        this.sourceId = source?.id || null
      }

      if (!this.sourceId) {
        console.error('No source ID found for DevDocs')
        return
      }

      // Generate content hash
      const contentHash = crypto
        .createHash('sha256')
        .update(result.content)
        .digest('hex')

      // Check if content already exists
      const { data: existing } = await supabaseAdmin
        .from('knowledge_content')
        .select('id, content_hash')
        .eq('url', result.url)
        .single()

      if (existing && existing.content_hash === contentHash) {
        // Content unchanged, skip
        return
      }

      // Insert or update content
      const contentData = {
        source_id: this.sourceId,
        url: result.url,
        title: result.title,
        content_type: 'documentation_page',
        content: result.content,
        markdown: result.markdown,
        code_snippets: result.codeSnippets,
        word_count: result.wordCount,
        character_count: result.characterCount,
        keywords: result.keywords,
        topics: result.topics,
        content_hash: contentHash,
        processed: false,
      }

      if (existing) {
        // Update existing
        await supabaseAdmin
          .from('knowledge_content')
          .update(contentData)
          .eq('id', existing.id)
      } else {
        // Insert new
        await supabaseAdmin
          .from('knowledge_content')
          .insert(contentData)
      }
    } catch (error) {
      console.error('Error saving content:', error)
    }
  }

  /**
   * Update scraping job status
   */
  private async updateJob(jobId: string, updates: Record<string, any>) {
    try {
      await supabaseAdmin
        .from('scraping_jobs')
        .update(updates)
        .eq('id', jobId)
    } catch (error) {
      console.error('Error updating job:', error)
    }
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Extract keywords from content
   */
  private extractKeywords(content: string): string[] {
    // Simple keyword extraction (can be improved with NLP)
    const words = content
      .toLowerCase()
      .split(/\W+/)
      .filter((word) => word.length > 3)

    const frequency: Record<string, number> = {}
    words.forEach((word) => {
      frequency[word] = (frequency[word] || 0) + 1
    })

    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word)
  }

  /**
   * Convert HTML to simplified Markdown
   */
  private htmlToMarkdown($: cheerio.CheerioAPI, element: cheerio.Cheerio<any>): string {
    let markdown = ''

    element.find('h1, h2, h3, h4, h5, h6').each((_, el) => {
      const level = parseInt(el.tagName[1])
      markdown += '#'.repeat(level) + ' ' + $(el).text().trim() + '\n\n'
    })

    element.find('p').each((_, el) => {
      markdown += $(el).text().trim() + '\n\n'
    })

    element.find('pre code').each((_, el) => {
      const code = $(el).text().trim()
      const language = $(el).attr('class')?.replace('language-', '') || ''
      markdown += '```' + language + '\n' + code + '\n```\n\n'
    })

    return markdown.trim()
  }
}

// Export singleton instance
export const devdocsScraper = new DevDocsScraper()
