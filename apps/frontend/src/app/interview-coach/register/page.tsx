'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FeedbackState } from '@/components/ui/feedback-state';
import { apiRequest, ApiClientError } from '@/lib/api-client';
import type { AuthResponse, RegisterRequest } from '@/lib/contracts';
import { routes } from '@/lib/routes';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('Unable to create account. Please try again.');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setStatus('loading');
    setErrorMessage('Unable to create account. Please try again.');

    try {
      const payload: RegisterRequest = {
        fullName,
        email,
        password,
      };

      const response = await apiRequest<AuthResponse, RegisterRequest>('/auth/register', {
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
      <Card title="Create Your Account" eyebrow="Authentication" className="stack">
        <div>
          <h1 className="page-title">Start structured interview practice</h1>
          <p className="page-subtitle">Set up your profile and begin resume-aware coaching.</p>
        </div>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Full Name
            <input
              className="input"
              type="text"
              placeholder="Your name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
            />
          </label>
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
              placeholder="Create password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
            />
          </label>
          {status === 'success' ? (
            <FeedbackState
              variant="success"
              title="Account created"
              message="Redirecting you to your dashboard..."
            />
          ) : null}
          {status === 'error' ? (
            <FeedbackState variant="error" title="Registration failed" message={errorMessage} />
          ) : null}
          <Button type="submit" disabled={status === 'loading'}>
            {status === 'loading' ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>
      </Card>
    </AppShell>
  );
}
