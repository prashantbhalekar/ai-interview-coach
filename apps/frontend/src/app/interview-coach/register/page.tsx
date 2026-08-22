import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function RegisterPage() {
  return (
    <AppShell>
      <Card title="Create Your Account" eyebrow="Authentication" className="stack">
        <div>
          <h1 className="page-title">Start structured interview practice</h1>
          <p className="page-subtitle">Set up your profile and begin resume-aware coaching.</p>
        </div>
        <form className="form-grid">
          <label>
            Full Name
            <input className="input" type="text" placeholder="Your name" />
          </label>
          <label>
            Email
            <input className="input" type="email" placeholder="you@domain.com" />
          </label>
          <label>
            Password
            <input className="input" type="password" placeholder="Create password" />
          </label>
          <Button type="submit">Create Account</Button>
        </form>
      </Card>
    </AppShell>
  );
}
