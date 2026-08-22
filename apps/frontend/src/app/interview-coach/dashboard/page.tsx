'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { CoachOverview } from '@/components/sections/coach-overview';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { FeedbackState } from '@/components/ui/feedback-state';
import { LoadingState } from '@/components/ui/loading-state';
import { apiRequest, ApiClientError } from '@/lib/api-client';
import type { AuthUser } from '@/lib/contracts';
import { routes } from '@/lib/routes';

export default function DashboardPage() {
  const [status, setStatus] = useState<'loading' | 'ready' | 'unauthenticated' | 'error'>(
    'loading',
  );
  const [errorMessage, setErrorMessage] = useState('Unable to load your profile right now.');
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('aiic.accessToken');

    if (!token) {
      setStatus('unauthenticated');
      return;
    }

    const authToken: string = token;

    async function loadProfile(): Promise<void> {
      try {
        const profile = await apiRequest<AuthUser>('/users/me', {
          token: authToken,
        });
        setUser(profile);
        setStatus('ready');
      } catch (error: unknown) {
        if (error instanceof ApiClientError && error.status === 401) {
          localStorage.removeItem('aiic.accessToken');
          setStatus('unauthenticated');
          return;
        }

        if (error instanceof ApiClientError) {
          setErrorMessage(error.message);
        }
        setStatus('error');
      }
    }

    void loadProfile();
  }, []);

  return (
    <AppShell>
      <section className="stack">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            {status === 'ready' && user
              ? `Welcome back, ${user.fullName}. Track readiness, recent analyses, and interview momentum.`
              : 'Track readiness, recent analyses, and interview momentum.'}
          </p>
        </div>

        {status === 'loading' ? <LoadingState label="Loading your dashboard..." /> : null}

        {status === 'unauthenticated' ? (
          <EmptyState
            title="You are not logged in"
            message="Log in to access your personalized dashboard, readiness metrics, and interview history."
            action={
              <Link href={routes.login} className="btn btn-primary">
                Go to Login
              </Link>
            }
          />
        ) : null}

        {status === 'error' ? (
          <FeedbackState variant="error" title="Dashboard unavailable" message={errorMessage} />
        ) : null}

        {status === 'ready' ? <CoachOverview /> : null}
        {status === 'ready' ? (
          <section className="info-grid">
            <Card title="Quick Actions" eyebrow="Next Steps">
              <ul className="metric-list">
                <li>
                  <span>Analyze a new resume revision</span>
                  <strong>Now</strong>
                </li>
                <li>
                  <span>Schedule mock backend round</span>
                  <strong>Today</strong>
                </li>
                <li>
                  <span>Review improvement suggestions</span>
                  <strong>5 min</strong>
                </li>
              </ul>
            </Card>
            <Card title="Recent Analysis" eyebrow="Snapshot">
              <p className="muted">Match score improved from 74% to 82% in the latest update.</p>
            </Card>
          </section>
        ) : null}
      </section>
    </AppShell>
  );
}
