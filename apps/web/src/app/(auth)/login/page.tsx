// Login page.
import { Nav } from '@/components/Nav';
import { AuthForm } from '@/components/AuthForm';

export default function LoginPage() {
  return (
    <>
      <Nav />
      <main className="container">
        <AuthForm mode="login" />
      </main>
    </>
  );
}
