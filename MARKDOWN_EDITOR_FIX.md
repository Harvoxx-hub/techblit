# Fix: Add Markdown Support to Rich Text Editor

## Problem
TipTap editor doesn't parse Markdown content when pasted. It only works with HTML.

## Solution: Add Markdown Parsing

### Step 1: Install Dependencies

```bash
npm install @tiptap/extension-typography markdown-it
```

### Step 2: Update RichTextEditor.tsx

Add these imports at the top:

```typescript
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Typography from '@tiptap/extension-typography'; // ADD THIS
import Image from '@tiptap/extension-image';
// ... rest of imports

// ADD THIS: Markdown parser utility
import MarkdownIt from 'markdown-it';
const md = new MarkdownIt();
```

### Step 3: Add Typography Extension

In the `useEditor` configuration (around line 55), add Typography:

```typescript
const editor = useEditor({
  extensions: [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3, 4, 5, 6],
      },
    }),
    Typography, // ADD THIS LINE
    Image.configure({
      HTMLAttributes: {
        class: 'max-w-full h-auto rounded-lg my-4',
      },
    }),
    // ... rest of extensions
  ],
  // ... rest of config
});
```

### Step 4: Add Markdown Paste Handler

Replace the paste event handler (lines 179-199) with this enhanced version:

```typescript
// Listen for paste events to handle both WordPress URLs and Markdown
useEffect(() => {
  if (!editor) return;

  const handlePaste = (event: ClipboardEvent) => {
    const text = event.clipboardData?.getData('text/plain');
    const html = event.clipboardData?.getData('text/html');

    // Check for Markdown patterns (headings, lists, bold, italic, etc.)
    const hasMarkdown = text && (
      /^#{1,6}\s/.test(text) ||           // Headings: # Title
      /^\*\*.*\*\*/.test(text) ||          // Bold: **text**
      /^\*.*\*/.test(text) ||              // Italic: *text*
      /^\[.*\]\(.*\)/.test(text) ||        // Links: [text](url)
      /^[-*+]\s/.test(text) ||             // Lists: - item
      /^\d+\.\s/.test(text) ||             // Ordered lists: 1. item
      /^```/.test(text)                    // Code blocks: ```
    );

    if (hasMarkdown && text) {
      // Convert Markdown to HTML
      event.preventDefault();
      const htmlContent = md.render(text);
      editor.commands.insertContent(htmlContent);
      return;
    }

    // Check for WordPress URLs
    if (html && sanitizeWordPressUrls(html) !== html) {
      setTimeout(() => {
        console.warn('⚠️ WordPress image URLs detected in pasted content. They will be automatically removed. Please use the image upload button to add images.');
      }, 100);
    }
  };

  const editorElement = editor.view.dom;
  editorElement.addEventListener('paste', handlePaste);

  return () => {
    editorElement.removeEventListener('paste', handlePaste);
  };
}, [editor]);
```

### Step 5: Optional - Add "Import Markdown" Button

Add a new button to the toolbar to explicitly import Markdown:

```typescript
const importMarkdown = useCallback(() => {
  const markdown = window.prompt('Paste your Markdown content:');
  if (markdown) {
    const htmlContent = md.render(markdown);
    editor?.commands.setContent(htmlContent);
  }
}, [editor]);
```

Then add the button in the toolbar (around line 360):

```typescript
<Button
  variant="ghost"
  size="sm"
  onClick={importMarkdown}
  className="h-8 px-2 text-gray-600 hover:text-gray-900"
  title="Import Markdown"
>
  <span className="text-xs font-mono">MD</span>
</Button>
```

---

## Alternative Solution: Convert Markdown to HTML Before Pasting

If you don't want to modify the editor, you can:

1. **Use an online converter:**
   - https://markdowntohtml.com/
   - Convert your .md content to HTML
   - Paste the HTML into the editor

2. **Use VS Code:**
   - Open .md file in VS Code
   - Install "Markdown Preview Enhanced" extension
   - Copy rendered HTML from preview

---

## Testing

After implementing, test with this Markdown:

```markdown
# Heading 1

## Heading 2

This is **bold** and this is *italic*.

- Bullet point 1
- Bullet point 2

1. Numbered item
2. Another item

[Link text](https://example.com)

> This is a quote

`inline code`

​```
code block
​```
```

Paste this into the editor - it should now format correctly!

---

## Notes

- **Typography extension** adds smart quotes, dashes, and other typographic enhancements
- **markdown-it** is a lightweight, fast Markdown parser
- The paste handler detects common Markdown patterns automatically
- You can still use the visual toolbar for formatting

---

**Estimated Implementation Time:** 15-30 minutes
