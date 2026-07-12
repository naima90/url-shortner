'use client';

// Dashboard: the user's links plus summary metrics.
// Fetches links from the API (with the session cookie) and derives the metric
// numbers on the client.
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { LinkListDto, LinkDto } from '@url-shortner/shared';
import { api } from '@/lib/apiClient';
import { API_URL } from '@/lib/env';

export default function DashboardPage() {
  const [links, setLinks] = useState<LinkDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get<LinkListDto>('/api/links');
      setLinks(res.links);
    } catch {
      setError('Could not load your links');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Summary numbers for the metric cards.
  const metrics = useMemo(() => {
    const totalLinks = links.length;
    const totalClicks = links.reduce((sum, l) => sum + l.clickCount, 0);
    const today = new Date().toISOString().slice(0, 10);
    // We do not have per-day counts in the list payload, so "created today" is a
    // simple, honest stand-in for a clicks-today figure at the list level.
    const createdToday = links.filter((l) => l.createdAt.slice(0, 10) === today).length;
    return { totalLinks, totalClicks, createdToday };
  }, [links]);

  async function remove(id: string) {
    await api.delete(`/api/links/${id}`);
    setLinks((prev) => prev.filter((l) => l.id !== id));
  }

  return (
    <div>
      <h1>Your links</h1>

      <div className="metrics">
        <div className="metric">
          <div className="label">Total links</div>
          <div className="value">{metrics.totalLinks}</div>
        </div>
        <div className="metric">
          <div className="label">Total clicks</div>
          <div className="value">{metrics.totalClicks.toLocaleString()}</div>
        </div>
        <div className="metric">
          <div className="label">Created today</div>
          <div className="value">{metrics.createdToday}</div>
        </div>
      </div>

      {loading ? (
        <p className="muted">Loading…</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : links.length === 0 ? (
        <p className="muted">
          No links yet. <Link href="/">Shorten your first one</Link>.
        </p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Short link</th>
              <th>Destination</th>
              <th style={{ textAlign: 'right' }}>Clicks</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {links.map((link) => (
              <tr key={link.id}>
                <td>
                  <a className="mono" href={`${API_URL}/${link.code}`} target="_blank" rel="noreferrer">
                    /{link.code}
                  </a>
                  {link.isCustomAlias && <span className="badge">custom</span>}
                </td>
                <td className="muted" style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {link.originalUrl}
                </td>
                <td style={{ textAlign: 'right' }}>{link.clickCount}</td>
                <td className="muted">{link.createdAt.slice(0, 10)}</td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <Link href={`/dashboard/${link.id}`} className="btn" style={{ height: 30 }}>
                    Details
                  </Link>{' '}
                  <button onClick={() => remove(link.id)} style={{ height: 30 }}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
