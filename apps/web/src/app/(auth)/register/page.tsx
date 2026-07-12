// Register page.
import { Nav } from '@/components/Nav';
import { AuthForm } from '@/components/AuthForm';

export default function RegisterPage() {
  return (
    <>
      <Nav />
      <main className="container">
        <AuthForm mode="register" />
      </main>
    </>
  );
}
