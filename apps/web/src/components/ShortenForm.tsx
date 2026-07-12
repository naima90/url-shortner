'use client';

// The shorten box on the landing page. Lets a logged-in user paste a URL (and
// optionally a custom alias), calls the API, and shows the resulting short link
// with a copy button. Logged-out users are nudged to sign up.
import { useState } from 'react';
import Link from 'next/link';
import type { LinkDto } from '@url-shortner/shared';
import { createLinkSchema } from '@url-shortner/shared';
import { api, ApiRequestError } from '@/lib/apiClient';
import { useAuth } from '@/hooks/useAuth';

interface CreateResponse {
  link: LinkDto;
  shortUrl: string;
}

export function ShortenForm() {
  const { user, loading } = useAuth();
  const [originalUrl, setOriginalUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [shortUrl, setShortUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setShortUrl(null);

    // Validate with the SAME schema the backend uses, so the user gets instant
    // feedback and we never send an obviously invalid request.
    const parsed = createLinkSchema.safeParse({
      originalUrl,
      customAlias: customAlias || undefined,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid input');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post<CreateResponse>('/api/links', parsed.data);
      setShortUrl(res.shortUrl);
      setOriginalUrl('');
      setCustomAlias('');
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.message);
      } else {
        setError('Something went wrong');
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function copy() {
    if (!shortUrl) return;
    await navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  // Logged-out visitors see a prompt to sign up (links belong to an account).
  if (!loading && !user) {
    return (
      <p className="muted">
        <Link href="/register">Sign up</Link> or <Link href="/login">log in</Link> to shorten a
        link and track its clicks.
      </p>
    );
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div className="shorten-row">
          <input
            type="text"
            placeholder="https://example.com/very/long/link"
            value={originalUrl}
            onChange={(e) => setOriginalUrl(e.target.value)}
            aria-label="URL to shorten"
          />
          <button type="submit" className="primary" disabled={submitting}>
            {submitting ? 'Shortening…' : 'Shorten'}
          </button>
        </div>
        <div className="shorten-row" style={{ marginTop: '0.5rem' }}>
          <input
            type="text"
            placeholder="Custom alias (optional)"
            value={customAlias}
            onChange={(e) => setCustomAlias(e.target.value)}
            aria-label="Custom alias"
          />
        </div>
      </form>

      {error && <p className="error">{error}</p>}

      {shortUrl && (
        <div className="result">
          <code>{shortUrl}</code>
          <button onClick={copy} style={{ marginLeft: 'auto', height: 30 }}>
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      )}
    </div>
  );
}
