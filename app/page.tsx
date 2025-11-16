'use client'

import { useState, useEffect } from 'react'

interface Job {
  id: string
  status: string
  config: { docSlug: string }
  progress_percentage: number
  urls_processed: number
  total_urls: number
  items_scraped: number
  created_at: string
  completed_at: string | null
  error_message: string | null
}

interface Doc {
  name: string
  slug: string
  type: string
  version?: string
  scraped: boolean
}

export default function Dashboard() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)
  const [scraping, setScraping] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState('')
  const [filter, setFilter] = useState<'all' | 'scraped' | 'not_scraped'>('not_scraped')

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 5000) // Refresh every 5 seconds
    return () => clearInterval(interval)
  }, [])

  async function loadData() {
    try {
      // Load jobs
      const jobsRes = await fetch('/api/jobs')
      const jobsData = await jobsRes.json()
      if (jobsData.success) {
        setJobs(jobsData.jobs)
      }

      // Load available docs
      const docsRes = await fetch('/api/scrape')
      const docsData = await docsRes.json()
      if (docsData.success) {
        setDocs(docsData.docs)
      }

      setLoading(false)
    } catch (error) {
      console.error('Error loading data:', error)
      setLoading(false)
    }
  }

  async function startScraping() {
    if (!selectedDoc) return

    setScraping(true)
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docSlug: selectedDoc }),
      })

      const data = await res.json()
      if (data.success) {
        alert(`Scraping started for ${selectedDoc}`)
        setSelectedDoc('')
        loadData()
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      alert('Failed to start scraping')
    } finally {
      setScraping(false)
    }
  }

  const filteredDocs = docs.filter((doc) => {
    if (filter === 'scraped') return doc.scraped
    if (filter === 'not_scraped') return !doc.scraped
    return true
  })

  const runningJobs = jobs.filter((j) => j.status === 'running')
  const completedJobs = jobs.filter((j) => j.status === 'completed')

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Javari DevDocs Scraper
          </h1>
          <p className="text-gray-600">
            Autonomous documentation scraper for Javari AI knowledge base
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Total Docs</div>
            <div className="text-3xl font-bold text-gray-900">{docs.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Scraped</div>
            <div className="text-3xl font-bold text-green-600">
              {docs.filter((d) => d.scraped).length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Running Jobs</div>
            <div className="text-3xl font-bold text-blue-600">
              {runningJobs.length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Completed Jobs</div>
            <div className="text-3xl font-bold text-gray-900">
              {completedJobs.length}
            </div>
          </div>
        </div>

        {/* Start New Scrape */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Start New Scrape</h2>
          <div className="flex gap-4">
            <select
              value={selectedDoc}
              onChange={(e) => setSelectedDoc(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={scraping}
            >
              <option value="">Select documentation...</option>
              {docs
                .filter((d) => !d.scraped)
                .map((doc) => (
                  <option key={doc.slug} value={doc.slug}>
                    {doc.name} {doc.version ? `(${doc.version})` : ''}
                  </option>
                ))}
            </select>
            <button
              onClick={startScraping}
              disabled={!selectedDoc || scraping}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {scraping ? 'Starting...' : 'Start Scraping'}
            </button>
          </div>
        </div>

        {/* Running Jobs */}
        {runningJobs.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">Running Jobs</h2>
            <div className="space-y-4">
              {runningJobs.map((job) => (
                <div key={job.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-semibold">{job.config.docSlug}</div>
                      <div className="text-sm text-gray-600">
                        {job.urls_processed} / {job.total_urls} pages
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        {job.progress_percentage.toFixed(0)}%
                      </div>
                      <div className="text-sm text-gray-600">
                        {job.items_scraped} items
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${job.progress_percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Available Documentation */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Available Documentation</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('scraped')}
                className={`px-4 py-2 rounded-lg ${
                  filter === 'scraped'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                Scraped
              </button>
              <button
                onClick={() => setFilter('not_scraped')}
                className={`px-4 py-2 rounded-lg ${
                  filter === 'not_scraped'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                Not Scraped
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
            {filteredDocs.map((doc) => (
              <div
                key={doc.slug}
                className={`border rounded-lg p-4 ${
                  doc.scraped
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-200'
                }`}
              >
                <div className="font-semibold">{doc.name}</div>
                {doc.version && (
                  <div className="text-sm text-gray-600">{doc.version}</div>
                )}
                <div className="text-xs text-gray-500 mt-1">{doc.type}</div>
                {doc.scraped && (
                  <div className="text-xs text-green-600 mt-2">✓ Scraped</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Recent Jobs */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Recent Jobs</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Documentation</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-right py-2">Progress</th>
                  <th className="text-right py-2">Items</th>
                  <th className="text-left py-2">Started</th>
                </tr>
              </thead>
              <tbody>
                {jobs.slice(0, 10).map((job) => (
                  <tr key={job.id} className="border-b">
                    <td className="py-3">{job.config.docSlug}</td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          job.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : job.status === 'running'
                            ? 'bg-blue-100 text-blue-800'
                            : job.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      {job.progress_percentage.toFixed(0)}%
                    </td>
                    <td className="py-3 text-right">{job.items_scraped}</td>
                    <td className="py-3">
                      {new Date(job.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
