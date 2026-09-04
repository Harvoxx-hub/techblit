'use client';

import { Card, CardContent, Input, Textarea, Button } from '@/components/ui';

export interface FaqItem {
  question: string;
  answer: string;
}

interface ArticleExtrasProps {
  keyPoints: string[];
  faq: FaqItem[];
  onChange: (next: { keyPoints: string[]; faq: FaqItem[] }) => void;
}

/**
 * Editor block for the AI/answer-engine extras that render on the article
 * page: a "Key points" bullet summary (NewsArticle + a visible box) and a
 * Q&A list (rendered as an FAQ section + FAQPage structured data).
 *
 * Both are optional. Empty rows are stripped before saving by the caller.
 */
export default function ArticleExtras({ keyPoints, faq, onChange }: ArticleExtrasProps) {
  const setKeyPoints = (kp: string[]) => onChange({ keyPoints: kp, faq });
  const setFaq = (f: FaqItem[]) => onChange({ keyPoints, faq: f });

  return (
    <Card>
      <CardContent className="p-6 space-y-8">
        {/* Key points */}
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Key points</h3>
            <p className="text-xs text-gray-500">
              3–5 short, standalone bullets summarising the story. Shown in a box near
              the top of the article and used by AI answer engines.
            </p>
          </div>

          {keyPoints.map((point, i) => (
            <div key={i} className="flex gap-2">
              <Input
                value={point}
                placeholder={`Key point ${i + 1}`}
                onChange={(e) => {
                  const next = [...keyPoints];
                  next[i] = e.target.value;
                  setKeyPoints(next);
                }}
              />
              <Button
                type="button"
                variant="ghost"
                onClick={() => setKeyPoints(keyPoints.filter((_, idx) => idx !== i))}
              >
                Remove
              </Button>
            </div>
          ))}

          {keyPoints.length < 6 && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setKeyPoints([...keyPoints, ''])}
            >
              + Add key point
            </Button>
          )}
        </div>

        {/* FAQ */}
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Frequently asked questions
            </h3>
            <p className="text-xs text-gray-500">
              Optional. Phrase each question the way a reader would ask it; keep the
              answer to one or two sentences. Renders an FAQ section with FAQPage
              structured data.
            </p>
          </div>

          {faq.map((item, i) => (
            <div key={i} className="space-y-2 rounded-lg border border-gray-200 p-3">
              <Input
                value={item.question}
                placeholder="Question"
                onChange={(e) => {
                  const next = [...faq];
                  next[i] = { ...next[i], question: e.target.value };
                  setFaq(next);
                }}
              />
              <Textarea
                value={item.answer}
                placeholder="Answer"
                rows={2}
                onChange={(e) => {
                  const next = [...faq];
                  next[i] = { ...next[i], answer: e.target.value };
                  setFaq(next);
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setFaq(faq.filter((_, idx) => idx !== i))}
              >
                Remove question
              </Button>
            </div>
          ))}

          {faq.length < 10 && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setFaq([...faq, { question: '', answer: '' }])}
            >
              + Add question
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
