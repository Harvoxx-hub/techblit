'use client';

import { useState, useEffect, useRef } from 'react';
import apiService from '@/lib/apiService';
import { Modal, Button } from '@/components/ui';

const PLATFORMS = [
  { key: 'x', label: 'X (Twitter)' },
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'tiktok', label: 'TikTok' },
];

interface SocialPostResult {
  results: Array<{ success: boolean; message: string; platform: string; accountName?: string }>;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  title: string;
  excerpt: string;
  featuredImageUrl: string | null;
  category: string;
  slug: string;
}

export function SocialPostDialog({ isOpen, onClose, postId, title, excerpt, featuredImageUrl, category, slug }: Props) {
  const [platforms, setPlatforms] = useState<Set<string>>(new Set(['x', 'linkedin']));
  const [postText, setPostText] = useState('');

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const previewBlobRef = useRef<Blob | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [result, setResult] = useState<SocialPostResult | null>(null);

  const [history, setHistory] = useState<Array<{ platforms: string[]; successful: number }>>([]);

  async function generatePreview() {
    if (!featuredImageUrl) {
      setGenError('This post has no featured image — needed to generate the Breaking News image.');
      return;
    }
    setGenerating(true);
    setGenError(null);
    try {
      const blob = await apiService.generateBreakingNewsPreview({ title, excerpt, featuredImageUrl, category, slug });
      previewBlobRef.current = blob;
      setPreviewUrl(prev => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(blob);
      });
    } catch (err) {
      setGenError(err instanceof Error ? err.message : String(err));
    } finally {
      setGenerating(false);
    }
  }

  useEffect(() => {
    if (!isOpen) return;
    setResult(null);
    setPostError(null);
    setPostText([title, excerpt, `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.techblit.com'}/${slug}`].filter(Boolean).join('\n\n'));
    generatePreview();
    apiService.getSocialStatus(postId).then(data => setHistory(data.socialPosts || [])).catch(() => {});
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, postId]);

  function togglePlatform(key: string) {
    setPlatforms(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function submit() {
    if (!previewBlobRef.current) {
      setPostError('No image ready to post yet.');
      return;
    }
    if (platforms.size === 0) {
      setPostError('Select at least one platform.');
      return;
    }
    if (!postText.trim()) {
      setPostError('Caption cannot be empty.');
      return;
    }

    setPosting(true);
    setPostError(null);
    try {
      const res = await apiService.postToSocial({
        postId,
        platforms: Array.from(platforms),
        postText,
        image: previewBlobRef.current,
      });
      setResult(res);
    } catch (err) {
      setPostError(err instanceof Error ? err.message : String(err));
    } finally {
      setPosting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Post to Social" className="max-w-lg">
      <div className="space-y-4">
        {history.length > 0 && (
          <div className="text-xs text-gray-500 rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
            Already posted {history.reduce((n, h) => n + h.successful, 0)}× —{' '}
            {Array.from(new Set(history.flatMap(h => h.platforms))).join(', ')}
          </div>
        )}

        {/* Image preview */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Breaking News image</label>
            <button
              onClick={generatePreview}
              disabled={generating}
              className="text-xs text-gray-500 hover:text-gray-900 disabled:opacity-50"
            >
              {generating ? 'Generating…' : '↻ Regenerate'}
            </button>
          </div>
          <div className="rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center" style={{ minHeight: 160 }}>
            {generating && <span className="text-xs text-gray-500 py-8">Rendering image…</span>}
            {!generating && genError && <span className="text-xs text-red-600 py-8 px-4 text-center">{genError}</span>}
            {!generating && !genError && previewUrl && (
              <img src={previewUrl} alt="Breaking News preview" className="w-full object-cover max-h-64" />
            )}
          </div>
        </div>

        {/* Platforms */}
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">Platforms</label>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map(p => (
              <button
                key={p.key}
                onClick={() => togglePlatform(p.key)}
                className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
                  platforms.has(p.key)
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Caption */}
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 block">Caption</label>
          <textarea
            value={postText}
            onChange={e => setPostText(e.target.value)}
            rows={5}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            placeholder="What goes out with this post"
          />
          {platforms.has('x') && postText.length > 280 && (
            <span className="text-xs text-amber-600 mt-1 block">{postText.length} chars — over X&apos;s ~280 char limit</span>
          )}
        </div>

        {postError && (
          <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {postError}
          </div>
        )}

        {result && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block">Results</label>
            {result.results.map((r, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 text-sm px-3 py-2 rounded-md border ${
                  r.success ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'
                }`}
              >
                <span>{r.success ? '✓' : '✕'}</span>
                <span className="capitalize">{r.platform}</span>
                {r.accountName && <span className="text-gray-500">— {r.accountName}</span>}
                {!r.success && <span className="text-gray-500 ml-auto truncate">{r.message}</span>}
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button onClick={submit} disabled={posting || generating || !previewUrl} variant="primary">
            {posting ? 'Posting…' : result ? 'Post Again' : 'Post Now'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
