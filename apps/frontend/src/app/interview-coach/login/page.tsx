import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function LoginPage() {
  return (
    <AppShell>
      <Card title="Welcome Back" eyebrow="Authentication" className="stack">
        <div>
          <h1 className="page-title">Log in to continue your interview prep</h1>
          <p className="page-subtitle">Access recent analyses, interviews, and feedback history.</p>
        </div>
        <form className="form-grid">
          <label>
            Email
            <input className="input" type="email" placeholder="you@domain.com" />
          </label>
          <label>
            Password
            <input className="input" type="password" placeholder="Enter password" />
          </label>
          <Button type="submit">Log In</Button>
        </form>
      </Card>
    </AppShell>
  );
}
