# Grok Tech Radar – Exact Prompt Library (v1.1 – Nigeria Tech Focus)

**Purpose:** These 8 prompts are production-ready, copy-paste exact strings used by the backend for Nigeria's tech ecosystem.

**Rules for all prompts:**
- Always add: `Output ONLY valid JSON. No explanations, no markdown, no extra text.`
- Always include the exact JSON schema at the end of each prompt.
- Use UTC timestamps and current date dynamically in code (`{{now}}`, `{{yesterday}}`, etc.).
- Focus: Nigeria-specific keywords (e.g., Nigerian startups, Lagos tech, fintech, agritech) to capture local trends, funding, and companies like Flutterwave, Paystack, Moniepoint, Andela, Jumia.

---

## 1. Breaking News (run every 15–30 min)

```
Search X for breaking Nigeria tech news in the last 90 minutes. Keywords: (outage OR downtime OR breach OR hack OR "data leak" OR "zero-day" OR ransomware OR exploit OR "critical vulnerability") AND (Nigeria OR Nigerian OR Lagos OR Abuja OR fintech OR agritech OR edtech OR healthtech OR startup). Use filter:verified min_replies:50 OR min_faves:300 since:{{now_minus_90min}}. Return maximum 8 stories, ranked by recency then engagement. Output ONLY valid JSON matching this schema:

{
  "category": "Breaking News",
  "stories": [
    {
      "title": "string",
      "summary": "string (2–4 sentences)",
      "x_post_ids": ["string"],
      "primary_link": "string",
      "engagement_score": number,
      "first_seen_at": "YYYY-MM-DDTHH:MM:SSZ"
    }
  ]
}
```

---

## 2. Trending Stories (run hourly)

```
Using X semantic + keyword search, find the top 10 currently trending Nigeria tech topics in the last 24 hours. Focus: Nigerian fintech, agritech, edtech, healthtech, AI, startups, Lagos ecosystem. Require min_faves:600 OR min_retweets:400. Exclude ads and promos. Diverse viewpoints required. Output ONLY valid JSON:

{
  "category": "Trending Stories",
  "stories": [
    {
      "title": "string",
      "summary": "string (2–4 sentences)",
      "x_post_ids": ["string"],
      "primary_link": "string",
      "engagement_score": number,
      "first_seen_at": "YYYY-MM-DDTHH:MM:SSZ"
    }
  ]
}
```

---

## 3. Company News (run every 2 hours)

```
Search X for major Nigerian tech company updates in last 48h: (Flutterwave OR Paystack OR Moniepoint OR Interswitch OR Jumia OR Andela OR Opay OR PiggyVest OR Jobberman OR MTN OR Airtel OR SystemSpecs) AND (earnings OR acquisition OR lawsuit OR partnership OR layoff OR "new feature" OR controversy OR funding). filter:news OR filter:verified min_faves:400. Max 10 stories. Output ONLY valid JSON (same schema).
```

---

## 4. Product Launches & Reviews (run hourly)

```
Find new Nigerian tech product launches, reviews, or benchmarks posted in last 72h: ("just launched" OR unboxing OR review OR benchmark OR "hands-on") AND (Nigeria OR Nigerian OR Lagos OR fintech app OR agritech tool OR edtech platform OR healthtech OR mobile money OR e-commerce). Require media (images/videos) + min_faves:350. Max 12 stories. Output ONLY valid JSON (same schema).
```

---

## 5. Funding & Investments (run every 4 hours)

```
Search X for Nigerian startup funding or M&A news in last 7 days: ("raised" OR "Series" OR seed OR "valuation" OR acquired OR IPO OR SPAC OR iDICE) AND (Nigeria OR Nigerian OR Lagos OR fintech OR agritech OR edtech OR healthtech OR startup). filter:verified OR filter:news min_faves:250. Include round size when mentioned. Max 10 stories. Output ONLY valid JSON (same schema).
```

---

## 6. Regulatory & Policy Changes (run daily at 09:00 UTC)

```
Find regulatory or policy news affecting Nigeria tech in last 48h: (antitrust OR CBN OR NITDA OR "data privacy" OR ban OR fine OR lawsuit OR bill OR regulation OR 3MTT OR iDICE) AND (Nigeria OR Nigerian OR Lagos OR fintech OR digital economy). filter:news min_faves:300. Max 8 stories. Output ONLY valid JSON (same schema).
```

---

## 7. Security & Hacking (run every 2 hours)

```
Search X for cybersecurity incidents or vulnerabilities in Nigeria tech in last 48h: (breach OR hack OR exploit OR CVE OR ransomware OR phishing OR "supply chain" OR patch) AND (Nigeria OR Nigerian OR Lagos OR fintech OR startup OR mobile money). Require min_faves:400 OR from known security accounts. Max 10 stories. Output ONLY valid JSON (same schema).
```

---

## 8. Emerging Technologies (run twice daily)

```
Using semantic search, find cutting-edge Nigeria tech breakthroughs in last 96h: (AI OR blockchain OR 5G OR agritech OR healthtech OR edtech OR voice tech OR gamification OR cybersecurity) AND (Nigeria OR Nigerian OR Lagos OR startup OR ecosystem). Require min_faves:500 + media. Diverse sources. Max 10 stories. Output ONLY valid JSON (same schema).
```

---

## JSON Story Object Schema (universal – enforce strictly)

```json
{
  "title": "string (catchy, <80 chars)",
  "summary": "string (2–4 neutral sentences)",
  "x_post_ids": ["string", "string"],
  "primary_link": "string (main X post URL)",
  "engagement_score": number,
  "first_seen_at": "string (ISO 8601 UTC)"
}
```
