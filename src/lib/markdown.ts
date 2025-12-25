// Markdown rendering utility

import MarkdownIt from 'markdown-it';

// Initialize Markdown parser with same config as editor
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
});

/**
 * Convert Markdown to HTML
 * @param markdown - Markdown content to convert
 * @returns HTML string
 */
export function renderMarkdown(markdown: string): string {
  if (!markdown) return '';
  return md.render(markdown);
}

/**
 * Detect if content is Markdown (has Markdown syntax)
 * @param content - Content to check
 * @returns true if content appears to be Markdown
 */
export function isMarkdown(content: string): boolean {
  if (!content) return false;

  // Check for common Markdown patterns
  const markdownPatterns = [
    /^#{1,6}\s/m,              // Headings: # Title
    /\*\*[^*]+\*\*/g,          // Bold: **text**
    /\*[^*\n]+\*/g,            // Italic: *text*
    /__[^_]+__/g,              // Bold: __text__
    /_[^_\n]+_/g,              // Italic: _text_
    /\[.+?\]\(.+?\)/g,         // Links: [text](url)
    /^[-*+]\s/m,               // Unordered lists: - item
    /^\d+\.\s/m,               // Ordered lists: 1. item
    /^```/m,                   // Code blocks: ```
    /^>\s/m,                   // Blockquotes: > quote
    /!\[.*?\]\(.+?\)/g,        // Images: ![alt](url)
  ];

  return markdownPatterns.some(pattern => pattern.test(content));
}

/**
 * Render content as HTML, auto-detecting if it's Markdown
 * @param content - Content to render (can be HTML or Markdown)
 * @param contentHtml - Optional pre-rendered HTML content
 * @returns HTML string
 */
export function renderContent(content: string, contentHtml?: string): string {
  // If we have pre-rendered HTML, use that
  if (contentHtml) {
    return contentHtml;
  }

  // If content looks like Markdown, convert it
  if (isMarkdown(content)) {
    return renderMarkdown(content);
  }

  // Otherwise return as-is (might be HTML or plain text)
  return content;
}
