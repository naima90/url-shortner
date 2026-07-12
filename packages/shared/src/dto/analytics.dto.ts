// Response shapes for the per-link analytics view.

// One day's worth of clicks, used to draw the clicks-per-day chart.
export interface DailyClickDto {
  date: string; // YYYY-MM-DD
  count: number;
}

// A single recorded click. IP is never included: it is hashed and kept
// server-side only.
export interface ClickEventDto {
  clickedAt: string; // ISO timestamp
  referrer: string | null;
  userAgent: string | null;
}

// Everything the per-link detail page needs.
export interface LinkAnalyticsDto {
  linkId: string;
  code: string;
  originalUrl: string;
  totalClicks: number;
  dailyClicks: DailyClickDto[];
  recentClicks: ClickEventDto[];
}
