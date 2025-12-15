# Grok-Powered Tech Radar

**Automated Trending & Breaking Tech Stories Feed**

| **Version** | 1.0 |
|-------------|-----|
| **Date** | December 2025 |
| **Status** | Planning |

---

## 1. Objective

Build an internal tech blog/dashboard that automatically surfaces the most relevant trending and breaking technology stories from X (Twitter) every hour, using xAI's Grok API as the primary intelligence engine.

**Goal:** Reduce manual curation time by ≥90% while delivering fresher, more diverse, and higher-signal content than RSS + manual scanning.

---

## 2. Users & Personas

| **Type** | **Users** |
|----------|-----------|
| Primary | Tech writers, internal comms team, engineering leads |
| Secondary | Any employee who wants to stay on top of tech news |

---

## 3. Core Features (MVP)

### P0 – Must Have

| Feature | Description |
|---------|-------------|
| Scheduled Grok API Calls | Cron / Cloud Scheduler runs every 30–60 min (configurable) |
| Multi-Category Query Engine | 8 predefined categories with optimized prompts (see appendix) |
| Structured JSON Output from Grok | Force Grok to respond in strict JSON schema |
| Deduplication & Persistence | Store stories in Firebase with unique X post IDs |
| Internal Dashboard | Simple web UI showing "New → Reviewed → Published" pipeline |
| One-Click Draft Creation | Generate 200–400-word blog draft (via follow-up Grok call) |

### P2 – Nice to Have

| Feature | Description |
|---------|-------------|
| Relevance Scoring | Auto-score stories 1–10 based on engagement + source credibility |
| Category & Keyword Management UI | Non-technical editors can add/remove keywords without code deploy |
| Weekly Digest Email | Top 10 stories of the week, auto-sent Monday morning |

---

## 4. Data Schema (Story Object)

```json
{
  "id": "uuid",
  "x_post_ids": ["1876543210987654321"],
  "category": "Breaking News | Product Launch | Funding | etc.",
  "title": "Auto-generated catchy title",
  "summary": "2–4 sentence neutral summary",
  "draft_body": "Optional 200–400 word draft (generated on demand)",
  "key_quotes": ["quote1", "quote2"],
  "primary_links": ["https://x.com/user/status/123..."],
  "media_urls": ["image or video links"],
  "engagement_score": 8472,
  "author_handles": ["@verified_handle"],
  "first_seen_at": "2025-12-10T14:23:11Z",
  "status": "new | under_review | approved | rejected | published",
  "published_url": "https://internal.blog/2025/12/..."
}
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique UUID for the story |
| `x_post_ids` | `string[]` | Array of X (Twitter) post IDs related to this story |
| `category` | `string` | One of the 8 predefined categories |
| `title` | `string` | Auto-generated catchy headline (<80 chars) |
| `summary` | `string` | 2–4 sentence neutral summary |
| `draft_body` | `string?` | Optional 200–400 word blog draft |
| `key_quotes` | `string[]` | Notable quotes from the posts |
| `primary_links` | `string[]` | Canonical X post URLs |
| `media_urls` | `string[]` | Images or video links |
| `engagement_score` | `number` | Combined faves + retweets + replies |
| `author_handles` | `string[]` | X handles of original posters |
| `first_seen_at` | `string` | ISO 8601 UTC timestamp |
| `status` | `enum` | Workflow status (see below) |
| `published_url` | `string?` | Final published blog URL |

### Status Workflow

```
┌─────────┐    ┌──────────────┐    ┌──────────┐    ┌───────────┐
│   new   │ →  │ under_review │ →  │ approved │ →  │ published │
└─────────┘    └──────────────┘    └──────────┘    └───────────┘
                      │
                      ↓
               ┌──────────┐
               │ rejected │
               └──────────┘
```

---

## 5. Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Node.js |
| Scheduler | Cloud Scheduler / Firebase Functions |
| Database | Firestore |
| Frontend Dashboard | Next.js |
| Grok API Client | Official xAI JS SDK |

---

## 6. Prompt Strategy (8 Categories)

Each category has a dedicated prompt optimized for Nigeria's tech ecosystem. See full prompt library in:

📄 **[`grok_prompt_library_nigeria.md`](./grok_prompt_library_nigeria.md)**

### Categories Overview

| # | Category | Run Frequency | Focus |
|---|----------|---------------|-------|
| 1 | Breaking News | Every 15–30 min | Outages, breaches, critical incidents |
| 2 | Trending Stories | Hourly | Top trending tech topics |
| 3 | Company News | Every 2 hours | Major Nigerian tech company updates |
| 4 | Product Launches & Reviews | Hourly | New product launches, reviews, benchmarks |
| 5 | Funding & Investments | Every 4 hours | Startup funding, M&A, IPOs |
| 6 | Regulatory & Policy Changes | Daily at 09:00 UTC | CBN, NITDA, policy news |
| 7 | Security & Hacking | Every 2 hours | Cybersecurity incidents |
| 8 | Emerging Technologies | Twice daily | AI, blockchain, 5G breakthroughs |

---

## 7. API Integration

### Grok API Request Flow

```
┌─────────────────┐     ┌─────────────┐     ┌──────────────┐
│ Cloud Scheduler │ →   │ Cloud Func  │ →   │ Grok API     │
│ (cron trigger)  │     │ (Node.js)   │     │ (xAI)        │
└─────────────────┘     └─────────────┘     └──────────────┘
                              │
                              ↓
                        ┌───────────┐
                        │ Firestore │
                        │ (stories) │
                        └───────────┘
                              │
                              ↓
                        ┌───────────┐
                        │ Dashboard │
                        │ (Next.js) │
                        └───────────┘
```

### Example API Call

```javascript
const response = await grok.chat.completions.create({
  model: "grok-3",
  messages: [
    {
      role: "system",
      content: "You are a tech news analyst. Output ONLY valid JSON."
    },
    {
      role: "user",
      content: PROMPT_BREAKING_NEWS // From prompt library
    }
  ],
  temperature: 0.3,
  response_format: { type: "json_object" }
});

const stories = JSON.parse(response.choices[0].message.content);
```

---

## 8. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Grok occasionally hallucinates links | Medium | High | Always store raw X post IDs and fetch canonical URLs server-side |
| Too much noise/spam | High | Medium | Start with conservative thresholds (`min_faves:150+`) and tune weekly |
| API cost overruns | Medium | High | Daily budget cap + alert at 80% of monthly limit |
| Breaking stories missed | Low | Medium | Run "Breaking News" category every 15 min during business hours |
| Rate limiting | Medium | Medium | Implement exponential backoff and request queuing |

---

## 9. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Curation time saved | ≥90% reduction | Time spent manually scanning news |
| Story freshness | <2 hours from first X post | `first_seen_at` vs X post timestamp |
| False positive rate | <15% | Rejected stories / Total fetched |
| Dashboard adoption | 80% of team using weekly | Analytics tracking |
| Published stories/week | 10–20 | Stories reaching "published" status |

---

## 10. Implementation Phases

### Phase 1: Foundation (Week 1–2)
- [ ] Set up Firebase project and Firestore collections
- [ ] Create Cloud Function for scheduled Grok API calls
- [ ] Implement 3 core prompts (Breaking News, Trending, Company News)
- [ ] Basic deduplication logic

### Phase 2: Dashboard (Week 3–4)
- [ ] Build Next.js admin dashboard
- [ ] Story list view with filtering/sorting
- [ ] Status workflow UI (approve/reject)
- [ ] One-click draft generation

### Phase 3: Refinement (Week 5–6)
- [ ] Add remaining 5 prompt categories
- [ ] Implement relevance scoring
- [ ] Add engagement threshold tuning UI
- [ ] Set up monitoring and alerting

### Phase 4: Polish (Week 7–8)
- [ ] Weekly digest email automation
- [ ] Category/keyword management UI
- [ ] Performance optimization
- [ ] Documentation and training

---

## 11. Related Documents

- 📄 [Prompt Library (Nigeria Focus)](./grok_prompt_library_nigeria.md)
- 📄 [Firebase Admin Setup](./FIREBASE_ADMIN_SETUP.md)
- 📄 [SEO Implementation](./SEO_IMPLEMENTATION_SUMMARY.md)

---

## Appendix A: Environment Variables

```env
# Grok API
XAI_API_KEY=xai-xxxxxxxxxxxxxxxxxxxxx
GROK_MODEL=grok-3

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=...
FIREBASE_CLIENT_EMAIL=...

# Scheduler
BREAKING_NEWS_INTERVAL=15  # minutes
DEFAULT_FETCH_INTERVAL=60  # minutes

# Thresholds
MIN_ENGAGEMENT_SCORE=150
MAX_STORIES_PER_CATEGORY=10
```

---

*Last updated: December 2025*


