// Landing page. Public. Shows the shorten box (which itself handles the
// logged-in vs logged-out states).
import { Nav } from '@/components/Nav';
import { ShortenForm } from '@/components/ShortenForm';

export default function HomePage() {
  return (
    <>
      <Nav />
      <main className="container">
        <div className="hero">
          <h1>Shorten any link in seconds</h1>
          <p>Paste a long URL, get a short one you can share and track.</p>
          <ShortenForm />
        </div>
      </main>
    </>
  );
}
