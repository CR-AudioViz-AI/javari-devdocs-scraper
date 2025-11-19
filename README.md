# Javari DevDocs Scraper

Autonomous documentation scraper for DevDocs.io - feeds knowledge to Javari AI.

## Features

- ✅ Scrapes 12+ documentation sets (React, TypeScript, Next.js, etc.)
- ✅ Runs automatically every 6 hours via Vercel Cron
- ✅ Stores in Supabase knowledge_content table
- ✅ Rate-limited and error-resilient
- ✅ Batch processing for efficiency

## Documentation Sets

- React
- TypeScript
- JavaScript
- Node.js
- Next.js 14
- Tailwind CSS
- PostgreSQL
- Git
- HTML/CSS/DOM
- HTTP

## Architecture

```
DevDocs API
    ↓
Scraper (this repo)
    ↓
Supabase (knowledge_content)
    ↓
Javari AI (RAG queries)
```

## Environment Variables

Required in Vercel:

```env
NEXT_PUBLIC_SUPABASE_URL=https://kteobfyferrukqeolofj.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
CRON_SECRET=random_secret_string
```

## Deployment

```bash
# Deploy to Vercel
vercel --prod

# Test manually
curl -X POST https://javari-devdocs-scraper.vercel.app/api/scrape \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Cron Schedule

- **Frequency**: Every 6 hours (0 */6 * * *)
- **Times**: 12am, 6am, 12pm, 6pm UTC
- **Duration**: ~5-10 minutes per run
- **Volume**: ~1,000+ docs per run

## Database Schema

Writes to `knowledge_content` table:

```sql
{
  source_id: uuid,
  title: text,
  content_type: 'documentation',
  url: text,
  content: text,
  summary: text,
  metadata: jsonb,
  scraped_at: timestamp
}
```

## Monitoring

Check Vercel logs for:
- ✅ Successful scrapes
- ⚠️  Rate limit warnings
- ❌ API errors
- 📊 Performance metrics

## Part of Javari AI Ecosystem

This scraper is one of 11 learning mechanisms that make Javari autonomous:

1. **DevDocs scraper** (this repo) ← YOU ARE HERE
2. MDN scraper
3. FreeCodeCamp scraper
4. News crawler
5. Conversation learning
6. Code learning
7. Admin manual feed
8. Document uploads
9. RSS feeds
10. GitHub repo learning
11. Stack Overflow Q&A

---

**Built by Roy Henderson & Claude**  
**CR AudioViz AI, LLC**
