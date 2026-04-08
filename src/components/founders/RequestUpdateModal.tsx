'use client';

import { useState } from 'react';
import apiService from '@/lib/apiService';
import { Button, Input, Textarea, Alert, Modal } from '@/components/ui';

export default function RequestUpdateModal({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await apiService.requestFounderProfileUpdate(slug, { email, message });
      setSent(true);
      setEmail('');
      setMessage('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setSent(false);
          setError('');
        }}
        className="rounded-2xl border border-stone-200 bg-white px-5 py-2.5 text-sm font-semibold text-stone-800 shadow-sm transition hover:border-stone-300 hover:bg-stone-50"
      >
        Request profile update
      </button>

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Request a profile update">
        {sent ? (
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/80 px-4 py-5 text-center">
            <p className="font-medium text-emerald-900">Thanks — we&apos;ve notified the team.</p>
            <p className="mt-1 text-sm text-emerald-800/90">We&apos;ll follow up by email if we need anything else.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-5">
            {error && (
              <Alert variant="danger" className="rounded-xl">
                {error}
              </Alert>
            )}
            <Input
              label="Email on file"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              isRequired
              helperText="Must match the email you applied with"
              variant="filled"
            />
            <Textarea
              label="What would you like to update?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              isRequired
              variant="filled"
            />
            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={loading} className="rounded-xl font-semibold shadow-md shadow-blue-600/15">
                Submit request
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
