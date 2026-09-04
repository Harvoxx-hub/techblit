import type { MetadataRoute } from 'next'

const SITE_URL = 'https://www.techblit.com'

const PRIVATE_PATHS = ['/admin/', '/api/', '/newsletter/', '/preview/']

// AI *retrieval* crawlers — the ones that fetch a page to answer a live
// user question and cite it. We want these: they drive visibility in
// ChatGPT Search, Perplexity, Claude, Siri, and Alexa answers.
const AI_RETRIEVAL_BOTS = [
  'OAI-SearchBot', // ChatGPT Search index
  'ChatGPT-User', // ChatGPT browsing on user request
  'PerplexityBot', // Perplexity index
  'Perplexity-User', // Perplexity live fetch
  'Claude-User', // Claude browsing on user request
  'Claude-SearchBot', // Claude search index
  'Applebot', // Siri / Spotlight / Apple Intelligence
  'Amazonbot', // Alexa answers
]

// AI *training* crawlers — collect content to train foundation models.
// Blocked: an independent newsroom keeps its archive out of training sets
// (and its licensing leverage) while still allowing the retrieval bots
// above, so AI-answer citations are unaffected.
const AI_TRAINING_BOTS = [
  'GPTBot', // OpenAI model training
  'ClaudeBot', // Anthropic model training
  'anthropic-ai', // Anthropic (legacy)
  'CCBot', // Common Crawl (feeds many training corpora)
  'Google-Extended', // Gemini / Vertex training & grounding (not AI Overviews)
  'Applebot-Extended', // Apple foundation-model training
  'Bytespider', // ByteDance / TikTok training
  'Meta-ExternalAgent', // Meta AI training
  'FacebookBot', // Meta AI training
  'cohere-ai', // Cohere
  'Diffbot',
  'Omgilibot',
  'ImagesiftBot',
  'Timpibot',
  'PanguBot',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: PRIVATE_PATHS,
      },
      {
        userAgent: AI_RETRIEVAL_BOTS,
        allow: '/',
        disallow: PRIVATE_PATHS,
      },
      {
        userAgent: AI_TRAINING_BOTS,
        disallow: '/',
      },
    ],
    sitemap: [`${SITE_URL}/sitemap.xml`, `${SITE_URL}/news-sitemap.xml`],
  }
}
