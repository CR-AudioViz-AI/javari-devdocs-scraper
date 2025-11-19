import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// DevDocs API base URL
const DEVDOCS_API = 'https://devdocs.io';

// Priority documentation sets to scrape
const DOCS_TO_SCRAPE = [
  'react',
  'typescript',
  'javascript',
  'node',
  'nextjs~14',
  'tailwindcss',
  'postgresql',
  'git',
  'html',
  'css',
  'dom',
  'http'
];

export default async function handler(req, res) {
  // Only allow POST from Vercel Cron
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify cron secret
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('🚀 DevDocs scraper started');
    const startTime = Date.now();
    let totalScraped = 0;
    let totalErrors = 0;

    // Get or create source
    const { data: source, error: sourceError } = await supabase
      .from('knowledge_sources')
      .upsert({
        name: 'DevDocs',
        source_type: 'documentation',
        base_url: 'https://devdocs.io',
        scrape_frequency: 'every_6_hours',
        is_active: true,
        last_scraped_at: new Date().toISOString()
      }, {
        onConflict: 'name',
        returning: 'representation'
      })
      .select()
      .single();

    if (sourceError) {
      console.error('Source error:', sourceError);
      return res.status(500).json({ error: 'Failed to create source', details: sourceError });
    }

    console.log(`✅ Source: ${source.name} (ID: ${source.id})`);

    // Scrape each documentation set
    for (const docSlug of DOCS_TO_SCRAPE) {
      try {
        console.log(`\n📚 Scraping: ${docSlug}`);
        
        // Fetch index for this doc
        const indexResponse = await fetch(`${DEVDOCS_API}/docs/${docSlug}/index.json`);
        if (!indexResponse.ok) {
          console.error(`  ❌ Failed to fetch ${docSlug}: ${indexResponse.status}`);
          totalErrors++;
          continue;
        }

        const index = await indexResponse.json();
        const entries = index.entries || [];
        
        console.log(`  Found ${entries.length} entries`);

        // Process entries in batches
        const batchSize = 50;
        for (let i = 0; i < entries.length; i += batchSize) {
          const batch = entries.slice(i, i + batchSize);
          
          // Prepare content records
          const contentRecords = batch.map(entry => ({
            source_id: source.id,
            title: entry.name || 'Untitled',
            content_type: 'documentation',
            url: `${DEVDOCS_API}/${docSlug}/${entry.path}`,
            content: entry.name || '',
            summary: entry.type || '',
            metadata: {
              doc_slug: docSlug,
              entry_type: entry.type,
              path: entry.path
            },
            scraped_at: new Date().toISOString()
          }));

          // Insert batch
          const { error: insertError } = await supabase
            .from('knowledge_content')
            .upsert(contentRecords, {
              onConflict: 'url',
              ignoreDuplicates: false
            });

          if (insertError) {
            console.error(`  ⚠️  Batch ${i}-${i + batch.length} error:`, insertError.message);
            totalErrors++;
          } else {
            totalScraped += batch.length;
            console.log(`  ✅ Batch ${i}-${i + batch.length}: ${batch.length} entries`);
          }

          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        console.log(`  ✅ Completed ${docSlug}: ${entries.length} entries`);
        
      } catch (error) {
        console.error(`  ❌ Error scraping ${docSlug}:`, error.message);
        totalErrors++;
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    // Update source stats
    await supabase
      .from('knowledge_sources')
      .update({
        last_scraped_at: new Date().toISOString(),
        metadata: {
          last_scrape_duration: duration,
          last_scrape_count: totalScraped,
          last_scrape_errors: totalErrors
        }
      })
      .eq('id', source.id);

    const response = {
      success: true,
      source: 'DevDocs',
      scraped: totalScraped,
      errors: totalErrors,
      duration: `${duration}s`,
      timestamp: new Date().toISOString()
    };

    console.log('\n✅ Scraping complete:', response);
    return res.status(200).json(response);

  } catch (error) {
    console.error('❌ Fatal error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
