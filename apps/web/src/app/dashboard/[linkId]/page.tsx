'use client';

// Per-link detail: total clicks, a clicks-per-day bar chart, and recent activity.
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { LinkAnalyticsDto } from '@url-shortner/shared';
import { api } from '@/lib/apiClient';

export default function LinkDetailPage() {
  const params = useParams<{ linkId: string }>();
  const [data, setData] = useState<LinkAnalyticsDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<LinkAnalyticsDto>(`/api/links/${params.linkId}/analytics`)
      .then(setData)
      .catch(() => setError('Could not load analytics'));
  }, [params.linkId]);

  if (error) return <p className="error">{error}</p>;
  if (!data) return <p className="muted">Loading…</p>;

  // Scale the bars to the busiest day so the tallest bar fills the chart.
  const maxCount = Math.max(1, ...data.dailyClicks.map((d) => d.count));

  return (
    <div>
      <p>
        <Link href="/dashboard">← Back to dashboard</Link>
      </p>
      <h1 className="mono" style={{ marginBottom: 0 }}>
        /{data.code}
      </h1>
      <p className="muted" style={{ marginTop: 4 }}>
        → {data.originalUrl}
      </p>

      <div className="metrics" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        <div className="metric">
          <div className="label">Total clicks</div>
          <div className="value">{data.totalClicks.toLocaleString()}</div>
        </div>
        <div className="metric">
          <div className="label">Active days (last 30)</div>
          <div className="value">{data.dailyClicks.length}</div>
        </div>
      </div>

      <h3>Clicks per day</h3>
      {data.dailyClicks.length === 0 ? (
        <p className="muted">No clicks yet. Share the link to start tracking.</p>
      ) : (
        <>
          <div className="chart">
            {data.dailyClicks.map((d) => (
              <div
                key={d.date}
                className="bar"
                style={{ height: `${(d.count / maxCount) * 100}%` }}
                title={`${d.date}: ${d.count} clicks`}
              />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }} className="muted">
            <span>{data.dailyClicks[0]?.date}</span>
            <span>{data.dailyClicks[data.dailyClicks.length - 1]?.date}</span>
          </div>
        </>
      )}

      <h3 style={{ marginTop: '2rem' }}>Recent activity</h3>
      {data.recentClicks.length === 0 ? (
        <p className="muted">No clicks recorded yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>When</th>
              <th>Referrer</th>
              <th>User agent</th>
            </tr>
          </thead>
          <tbody>
            {data.recentClicks.map((c, i) => (
              <tr key={i}>
                <td className="muted">{new Date(c.clickedAt).toLocaleString()}</td>
                <td className="muted">{c.referrer ?? 'direct'}</td>
                <td className="muted" style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.userAgent ?? 'unknown'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
