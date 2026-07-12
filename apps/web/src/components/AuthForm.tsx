'use client';

// Shared login/register form. The `mode` prop switches the labels and which
// auth action runs. On success it sends the user to the dashboard.
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { loginSchema, registerSchema } from '@url-shortner/shared';
import { ApiRequestError } from '@/lib/apiClient';
import { useAuth } from '@/hooks/useAuth';

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const { login, register } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isRegister = mode === 'register';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validate against the same schema the API uses.
    const schema = isRegister ? registerSchema : loginSchema;
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid input');
      return;
    }

    setSubmitting(true);
    try {
      if (isRegister) {
        await register(email, password);
      } else {
        await login(email, password);
      }
      router.push('/dashboard');
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

  return (
    <div className="card narrow" style={{ margin: '3rem auto' }}>
      <h2 style={{ textAlign: 'center', marginTop: 0 }}>
        {isRegister ? 'Create an account' : 'Welcome back'}
      </h2>
      <p className="muted" style={{ textAlign: 'center', marginTop: 0 }}>
        {isRegister ? 'Sign up to start shortening links.' : 'Log in to manage your links.'}
      </p>

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
          />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>
        <button type="submit" className="primary" style={{ width: '100%' }} disabled={submitting}>
          {submitting ? 'Please wait…' : isRegister ? 'Sign up' : 'Log in'}
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      <p className="muted" style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.85rem' }}>
        {isRegister ? (
          <>
            Already have an account? <Link href="/login">Log in</Link>
          </>
        ) : (
          <>
            New here? <Link href="/register">Create an account</Link>
          </>
        )}
      </p>
    </div>
  );
}
