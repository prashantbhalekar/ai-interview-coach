'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FeedbackState } from '@/components/ui/feedback-state';
import { apiRequest, ApiClientError } from '@/lib/api-client';
import type { AuthResponse, LoginRequest } from '@/lib/contracts';
import { routes } from '@/lib/routes';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('Unable to sign in. Please try again.');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setStatus('loading');
    setErrorMessage('Unable to sign in. Please try again.');

    try {
      const payload: LoginRequest = {
        email,
        password,
      };

      const response = await apiRequest<AuthResponse, LoginRequest>('/auth/login', {
        method: 'POST',
        body: payload,
      });

      localStorage.setItem('aiic.accessToken', response.accessToken);
      setStatus('success');
      router.push(routes.dashboard);
    } catch (error: unknown) {
      if (error instanceof ApiClientError) {
        setErrorMessage(error.message);
      }
      setStatus('error');
    }
  }

  return (
    <AppShell>
      <Card title="Welcome Back" eyebrow="Authentication" className="stack">
        <div>
          <h1 className="page-title">Log in to continue your interview prep</h1>
          <p className="page-subtitle">Access recent analyses, interviews, and feedback history.</p>
        </div>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              className="input"
              type="email"
              placeholder="you@domain.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              className="input"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          {status === 'success' ? (
            <FeedbackState
              variant="success"
              title="Login successful"
              message="Redirecting you to your dashboard..."
            />
          ) : null}
          {status === 'error' ? (
            <FeedbackState variant="error" title="Login failed" message={errorMessage} />
          ) : null}
          <Button type="submit" disabled={status === 'loading'}>
            {status === 'loading' ? 'Logging in...' : 'Log In'}
          </Button>
        </form>
      </Card>
    </AppShell>
  );
}
