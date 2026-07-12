// Root layout. Wraps every page, imports the global styles, and sets the tab
// title. Kept minimal since styling is intentionally light.
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'url-shortner',
  description: 'Shorten links and track clicks.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
