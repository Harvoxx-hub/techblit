/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://techblit.com',
  generateRobotsTxt: true,
  generateIndexSitemap: false,
  // /newsletter/* URLs carry one-time confirm and per-subscriber
  // unsubscribe tokens — they must never be crawled or indexed.
  exclude: ['/admin/*', '/api/*', '/newsletter/*'],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/newsletter/'],
      },
    ],
  },
};
