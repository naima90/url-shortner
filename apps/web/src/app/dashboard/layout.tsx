// Layout for all dashboard pages. Renders the shared nav around the content.
// Route protection is handled by src/middleware.ts (checks for the session
// cookie before these pages render).
import { Nav } from '@/components/Nav';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <main className="container page">{children}</main>
    </>
  );
}
