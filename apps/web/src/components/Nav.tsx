'use client';

// Top navigation bar. Shows login/signup when logged out, and the dashboard
// link plus a logout button when logged in.
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export function Nav() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push('/');
  }

  return (
    <nav className="nav">
      <div className="container nav-inner">
        <Link href="/" className="brand">
          url-shortner
        </Link>
        <div className="nav-actions">
          {loading ? null : user ? (
            <>
              <Link href="/dashboard" className="btn">
                Dashboard
              </Link>
              <button onClick={handleLogout}>Log out</button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn">
                Log in
              </Link>
              <Link href="/register" className="btn primary">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
