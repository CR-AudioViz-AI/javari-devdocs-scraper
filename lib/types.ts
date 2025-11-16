// ================================================================================
// TYPE DEFINITIONS FOR JAVARI DEVDOCS SCRAPER
// ================================================================================

export interface KnowledgeSource {
  id: string
  name: string
  source_type: string
  url: string
  base_domain: string
  category: string
  scrape_enabled: boolean
  scrape_frequency: string
  last_scraped_at: string | null
  next_scrape_at: string | null
  priority: number
  quality_score: number
  trust_level: string
  status: string
  error_count: number
  last_error: string | null
  tags: string[]
  notes: string | null
  created_at: string
  updated_at: string
  created_by: string
}

export interface KnowledgeContent {
  id: string
  source_id: string
  url: string
  title: string
  content_type: string
  content: string
  raw_html: string | null
  markdown: string | null
  code_snippets: CodeSnippet[]
  author: string | null
  published_at: string | null
  word_count: number
  character_count: number
  processed: boolean
  processed_at: string | null
  embedding_generated: boolean
  usefulness_score: number
  accuracy_verified: boolean
  keywords: string[]
  topics: string[]
  content_hash: string
  version: number
  created_at: string
  updated_at: string
}

export interface CodeSnippet {
  language: string
  code: string
  description?: string
}

export interface ScrapingJob {
  id: string
  source_id: string
  job_type: string
  scheduled_at: string
  started_at: string | null
  completed_at: string | null
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'paused'
  total_urls: number
  urls_processed: number
  urls_failed: number
  progress_percentage: number
  items_scraped: number
  items_new: number
  items_updated: number
  items_unchanged: number
  error_message: string | null
  retry_count: number
  max_retries: number
  duration_seconds: number | null
  avg_time_per_url: number | null
  config: Record<string, any>
  results: Record<string, any>
  created_at: string
  updated_at: string
}

export interface LearningSession {
  id: string
  session_type: string
  source_id: string | null
  content_processed: number
  new_knowledge_items: number
  updated_knowledge_items: number
  start_time: string
  end_time: string | null
  duration_seconds: number | null
  success: boolean
  skills_acquired: string[]
  improvements_made: string[]
  errors_encountered: string[]
  api_calls_made: number
  tokens_used: number
  cost_usd: number
  summary: string | null
  metadata: Record<string, any>
  created_at: string
}

export interface DevDocsDoc {
  name: string
  slug: string
  type: string
  version?: string
  release?: string
  links: {
    home: string
    code?: string
  }
  index_path?: string
}

export interface DevDocsEntry {
  name: string
  path: string
  type: string
}

export interface ScraperConfig {
  concurrency: number
  delayMs: number
  timeoutMs: number
  maxRetries: number
  rateLimitPerMinute: number
  rateLimitPerHour: number
}

export interface ScrapeResult {
  success: boolean
  url: string
  title: string
  content: string
  markdown?: string
  codeSnippets: CodeSnippet[]
  wordCount: number
  characterCount: number
  keywords: string[]
  topics: string[]
  error?: string
}

export interface JobProgress {
  jobId: string
  status: string
  progress: number
  totalUrls: number
  processedUrls: number
  failedUrls: number
  itemsScraped: number
  startedAt: string
  estimatedCompletion?: string
}
