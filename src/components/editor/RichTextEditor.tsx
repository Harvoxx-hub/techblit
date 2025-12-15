'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { useState, useCallback, useEffect, useRef } from 'react';
import { 
  BoldIcon, 
  ItalicIcon, 
  LinkIcon,
  PhotoIcon,
  ListBulletIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  Bars3Icon,
  EyeIcon,
  EyeSlashIcon,
  CheckIcon,
  PlusIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui';
import { sanitizeWordPressUrls } from '@/lib/imageUrlUtils';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  showToolbar?: boolean;
  showCharacterCount?: boolean;
  maxLength?: number;
  onImageUpload?: (file: File) => Promise<string>;
}

export default function RichTextEditor({
  content,
  onChange,
  placeholder = 'Start writing...',
  showToolbar = true,
  showCharacterCount = false,
  maxLength = 10000,
  onImageUpload,
}: RichTextEditorProps) {
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg my-4',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline hover:text-blue-800',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      CharacterCount.configure({
        limit: maxLength,
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse border border-gray-300 my-4',
        },
      }),
      TableRow.configure({
        HTMLAttributes: {
          class: 'border border-gray-300',
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 bg-gray-100 px-4 py-2 font-semibold',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 px-4 py-2',
        },
      }),
    ],
    content,
    editable: !isPreviewMode,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      // Pass content to parent - WordPress URLs will be sanitized on save
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none p-4 min-h-[300px]',
      },
    },
  });

  // Sync editor content when content prop changes (for pre-filled data)
  useEffect(() => {
    if (editor && content !== undefined && editor.getHTML() !== content) {
      // Only update if content actually changed to avoid unnecessary updates
      const currentContent = editor.getHTML();
      if (currentContent !== content) {
        editor.commands.setContent(content, { 
          emitUpdate: false // Don't trigger onUpdate callback
        });
      }
    }
  }, [content, editor]);

  const addImage = useCallback(async () => {
    if (!onImageUpload) return;
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const url = await onImageUpload(file);
          editor?.chain().focus().setImage({ src: url }).run();
        } catch (error) {
          console.error('Error uploading image:', error);
          alert('Failed to upload image. Please try again.');
        }
      }
    };
    input.click();
  }, [editor, onImageUpload]);

  const addLink = useCallback(() => {
    const url = window.prompt('Enter URL:');
    if (url) {
      editor?.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  const addTable = useCallback(() => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  const addYouTubeEmbed = useCallback(() => {
    const url = window.prompt('Enter YouTube URL:');
    if (url) {
      const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
      if (videoId) {
        const embedHtml = `<div class="youtube-embed my-4"><iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen class="rounded-lg"></iframe></div>`;
        editor?.chain().focus().insertContent(embedHtml).run();
      }
    }
  }, [editor]);

  const addTwitterEmbed = useCallback(() => {
    const url = window.prompt('Enter Twitter URL:');
    if (url) {
      const embedHtml = `<div class="twitter-embed my-4"><blockquote class="twitter-tweet"><a href="${url}"></a></blockquote></div>`;
      editor?.chain().focus().insertContent(embedHtml).run();
    }
  }, [editor]);

  // Listen for paste events to detect WordPress URLs
  useEffect(() => {
    if (!editor) return;

    const handlePaste = (event: ClipboardEvent) => {
      const html = event.clipboardData?.getData('text/html');
      if (html && sanitizeWordPressUrls(html) !== html) {
        // WordPress URLs detected - they'll be sanitized in onUpdate
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

  if (!editor) {
    return (
      <div className="border border-gray-300 rounded-lg p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading editor...</p>
      </div>
    );
  }

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm">
      {showToolbar && (
        <div className="border-b border-gray-300 bg-gray-50 p-3 flex flex-wrap gap-2 items-center">
          {/* History */}
          <div className="flex gap-1 border-r border-gray-300 pr-2 mr-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              className="h-8 w-8 p-0"
            >
              <ArrowUturnLeftIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              className="h-8 w-8 p-0"
            >
              <ArrowUturnRightIcon className="h-4 w-4" />
            </Button>
          </div>

          {/* Text Formatting */}
          <div className="flex gap-1 border-r border-gray-300 pr-2 mr-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`h-8 w-8 p-0 ${editor.isActive('bold') ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
            >
              <BoldIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`h-8 w-8 p-0 ${editor.isActive('italic') ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
            >
              <ItalicIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={`h-8 w-8 p-0 ${editor.isActive('strike') ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
            >
              <span className="text-sm font-bold line-through">S</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleCode().run()}
              className={`h-8 w-8 p-0 ${editor.isActive('code') ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
            >
              <span className="text-sm font-mono">&lt;/&gt;</span>
            </Button>
          </div>

          {/* Headings */}
          <div className="flex gap-1 border-r border-gray-300 pr-2 mr-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={`h-8 px-2 ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
            >
              H1
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={`h-8 px-2 ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
            >
              H2
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className={`h-8 px-2 ${editor.isActive('heading', { level: 3 }) ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
            >
              H3
            </Button>
          </div>

          {/* Lists */}
          <div className="flex gap-1 border-r border-gray-300 pr-2 mr-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`h-8 w-8 p-0 ${editor.isActive('bulletList') ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
            >
              <ListBulletIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`h-8 w-8 p-0 ${editor.isActive('orderedList') ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
            >
              <DocumentTextIcon className="h-4 w-4" />
            </Button>
          </div>

          {/* Media & Embeds */}
          <div className="flex gap-1 border-r border-gray-300 pr-2 mr-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={addImage}
              className="h-8 w-8 p-0 text-gray-600 hover:text-gray-900"
              title="Add Image"
            >
              <PhotoIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={addLink}
              className="h-8 w-8 p-0 text-gray-600 hover:text-gray-900"
              title="Add Link"
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={addTable}
              className="h-8 w-8 p-0 text-gray-600 hover:text-gray-900"
              title="Add Table"
            >
              <Bars3Icon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={addYouTubeEmbed}
              className="h-8 w-8 p-0 text-gray-600 hover:text-gray-900"
              title="Add YouTube Video"
            >
              <span className="text-xs font-bold">YT</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={addTwitterEmbed}
              className="h-8 w-8 p-0 text-gray-600 hover:text-gray-900"
              title="Add Twitter Embed"
            >
              <span className="text-xs font-bold">🐦</span>
            </Button>
          </div>

          {/* Block Elements */}
          <div className="flex gap-1 border-r border-gray-300 pr-2 mr-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={`h-8 w-8 p-0 ${editor.isActive('blockquote') ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
              title="Quote"
            >
              <ChatBubbleLeftRightIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              className={`h-8 w-8 p-0 ${editor.isActive('codeBlock') ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
              title="Code Block"
            >
              <span className="text-xs font-mono">{ }</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              className="h-8 w-8 p-0 text-gray-600 hover:text-gray-900"
              title="Horizontal Rule"
            >
              <Bars3Icon className="h-4 w-4" />
            </Button>
          </div>

          {/* Preview Toggle */}
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className={`h-8 w-8 p-0 ${isPreviewMode ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
              title={isPreviewMode ? 'Edit Mode' : 'Preview Mode'}
            >
              {isPreviewMode ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      )}

      <div className="relative">
        {isPreviewMode ? (
          <div 
            className="prose prose-lg max-w-none preview-content p-6 min-h-[300px] bg-white"
            dangerouslySetInnerHTML={{ __html: editor.getHTML() }}
          />
        ) : (
          <EditorContent 
            editor={editor} 
            className="prose prose-lg max-w-none focus:outline-none"
          />
        )}
      </div>

      {showCharacterCount && (
        <div className="border-t border-gray-300 bg-gray-50 px-4 py-2 text-sm text-gray-600 flex justify-between items-center">
          <span>{editor.storage.characterCount.characters()}/{maxLength} characters</span>
          <span>{editor.storage.characterCount.words()} words</span>
        </div>
      )}

      <style jsx global>{`
        .ProseMirror {
          padding: 1.5rem;
          min-height: 300px;
          outline: none;
          color: #000000 !important;
        }
        
        .preview-content {
          color: #000000 !important;
        }
        .preview-content h1 {
          color: #000000 !important;
          font-size: 2rem !important;
          font-weight: 700 !important;
          margin-top: 1.5rem !important;
          margin-bottom: 1rem !important;
          line-height: 1.2 !important;
        }
        .preview-content h2 {
          color: #000000 !important;
          font-size: 1.5rem !important;
          font-weight: 600 !important;
          margin-top: 1.25rem !important;
          margin-bottom: 0.75rem !important;
          line-height: 1.3 !important;
        }
        .preview-content h3 {
          color: #000000 !important;
          font-size: 1.25rem !important;
          font-weight: 600 !important;
          margin-top: 1rem !important;
          margin-bottom: 0.5rem !important;
          line-height: 1.4 !important;
        }
        .preview-content h4 {
          color: #000000 !important;
          font-size: 1.125rem !important;
          font-weight: 600 !important;
          margin-top: 0.875rem !important;
          margin-bottom: 0.5rem !important;
          line-height: 1.4 !important;
        }
        .preview-content h5 {
          color: #000000 !important;
          font-size: 1rem !important;
          font-weight: 600 !important;
          margin-top: 0.75rem !important;
          margin-bottom: 0.5rem !important;
          line-height: 1.5 !important;
        }
        .preview-content h6 {
          color: #000000 !important;
          font-size: 0.875rem !important;
          font-weight: 600 !important;
          margin-top: 0.75rem !important;
          margin-bottom: 0.5rem !important;
          line-height: 1.5 !important;
        }
        .preview-content p {
          color: #000000 !important;
          margin-top: 1.25rem !important;
          margin-bottom: 1.25rem !important;
          line-height: 1.75 !important;
        }
        .preview-content li {
          color: #000000 !important;
        }
        .preview-content strong {
          color: #000000 !important;
        }
        .preview-content em {
          color: #000000 !important;
        }
        .preview-content blockquote {
          color: #000000 !important;
        }
        .preview-content code {
          color: #000000 !important;
        }
        .preview-content td,
        .preview-content th {
          color: #000000 !important;
        }
        
        .ProseMirror p {
          margin-top: 1.25rem !important;
          margin-bottom: 1.25rem !important;
          line-height: 1.75 !important;
          color: #000000;
        }
        
        .ProseMirror h1 {
          font-size: 2rem;
          font-weight: 700;
          margin-top: 1.5rem !important;
          margin-bottom: 1rem !important;
          line-height: 1.2;
          color: #000000;
        }
        
        .ProseMirror h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-top: 1.25rem !important;
          margin-bottom: 0.75rem !important;
          line-height: 1.3;
          color: #000000;
        }
        
        .ProseMirror h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 1rem !important;
          margin-bottom: 0.5rem !important;
          line-height: 1.4;
          color: #000000;
        }
        
        .ProseMirror ul, .ProseMirror ol {
          margin-top: 0.75rem !important;
          margin-bottom: 0.75rem !important;
          padding-left: 1.5rem;
          color: #000000;
        }
        
        .ProseMirror li {
          margin: 0.25rem 0 !important;
          color: #000000;
        }
        
        .ProseMirror blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 1rem;
          margin: 1rem 0;
          font-style: italic;
          color: #000000;
        }
        
        .ProseMirror strong {
          color: #000000;
          font-weight: 600;
        }
        
        .ProseMirror em {
          color: #000000;
          font-style: italic;
        }
        
        .ProseMirror code {
          background-color: #f3f4f6;
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          font-family: 'Courier New', monospace;
          font-size: 0.875rem;
          color: #000000;
        }
        
        .ProseMirror pre {
          background-color: #1f2937;
          color: #f9fafb;
          padding: 1rem;
          border-radius: 0.5rem;
          margin: 1rem 0;
          overflow-x: auto;
        }
        
        .ProseMirror pre code {
          background-color: transparent;
          padding: 0;
          color: inherit;
        }
        
        .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 1rem 0;
        }
        
        .ProseMirror table {
          border-collapse: collapse;
          margin: 1rem 0;
          width: 100%;
        }
        
        .ProseMirror th,
        .ProseMirror td {
          border: 1px solid #d1d5db;
          padding: 0.5rem;
          text-align: left;
        }
        
        .ProseMirror th {
          background-color: #f9fafb;
          font-weight: 600;
        }
        
        .ProseMirror hr {
          border: none;
          border-top: 2px solid #e5e7eb;
          margin: 2rem 0;
        }
        
        .ProseMirror a {
          color: #2563eb;
          text-decoration: underline;
        }
        
        .ProseMirror a:hover {
          color: #1d4ed8;
        }
        
        .ProseMirror:focus {
          outline: none;
        }
        
        .ProseMirror .is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #9ca3af;
          pointer-events: none;
          height: 0;
        }
      `}</style>
    </div>
  );
}