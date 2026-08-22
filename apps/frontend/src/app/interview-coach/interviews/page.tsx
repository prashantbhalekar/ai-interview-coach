'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { FeedbackState } from '@/components/ui/feedback-state';
import { LoadingState } from '@/components/ui/loading-state';
import { ApiClientError, apiRequest } from '@/lib/api-client';
import type { CreateInterviewSessionRequest, InterviewSessionSummary } from '@/lib/contracts';
import { routes } from '@/lib/routes';

export default function InterviewsPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'ready' | 'unauthenticated' | 'error'>(
    'loading',
  );
  const [createStatus, setCreateStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('Unable to load sessions.');
  const [focusArea, setFocusArea] = useState('backend engineering');
  const [sessions, setSessions] = useState<InterviewSessionSummary[]>([]);

  async function loadSessions(token: string): Promise<void> {
    try {
      const response = await apiRequest<InterviewSessionSummary[]>('/interviews/sessions', {
        token,
      });
      setSessions(response);
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

  useEffect(() => {
    const token = localStorage.getItem('aiic.accessToken');

    if (!token) {
      setStatus('unauthenticated');
      return;
    }

    void loadSessions(token);
  }, []);

  async function createSession(): Promise<void> {
    const token = localStorage.getItem('aiic.accessToken');
    if (!token) {
      setStatus('unauthenticated');
      return;
    }

    const normalizedFocusArea = focusArea.trim();
    if (!normalizedFocusArea) {
      setCreateStatus('error');
      setErrorMessage('Please add a focus area before starting a session.');
      return;
    }

    setCreateStatus('loading');
    setErrorMessage('Unable to load sessions.');

    try {
      const payload: CreateInterviewSessionRequest = {
        focusArea: normalizedFocusArea,
      };

      const created = await apiRequest<{ id: string }, CreateInterviewSessionRequest>(
        '/interviews/sessions',
        {
          method: 'POST',
          token,
          body: payload,
        },
      );

      router.push(routes.interview(created.id));
    } catch (error: unknown) {
      if (error instanceof ApiClientError && error.status === 401) {
        localStorage.removeItem('aiic.accessToken');
        setStatus('unauthenticated');
        return;
      }

      if (error instanceof ApiClientError) {
        setErrorMessage(error.message);
      }
      setCreateStatus('error');
    }
  }

  return (
    <AppShell>
      <section className="stack">
        <div>
          <h1 className="page-title">Interview Sessions</h1>
          <p className="page-subtitle">
            Start sessions, continue Q&A, and review evaluation history.
          </p>
        </div>

        <Card title="Start New Session" eyebrow="Milestone B">
          <div className="form-grid">
            <label>
              Focus Area
              <input
                className="input"
                value={focusArea}
                onChange={(event) => setFocusArea(event.target.value)}
                maxLength={100}
              />
            </label>
            {createStatus === 'error' ? (
              <FeedbackState
                variant="error"
                title="Unable to create session"
                message={errorMessage}
              />
            ) : null}
            <Button
              onClick={createSession}
              disabled={createStatus === 'loading' || status === 'unauthenticated'}
            >
              {createStatus === 'loading' ? 'Creating...' : 'Start Interview Session'}
            </Button>
          </div>
        </Card>

        {status === 'loading' ? <LoadingState label="Loading your interview history..." /> : null}

        {status === 'unauthenticated' ? (
          <EmptyState
            title="You are not logged in"
            message="Log in to start and review interview sessions."
            action={
              <Link className="btn btn-primary" href={routes.login}>
                Go to Login
              </Link>
            }
          />
        ) : null}

        {status === 'error' ? (
          <FeedbackState variant="error" title="History unavailable" message={errorMessage} />
        ) : null}

        {status === 'ready' && sessions.length === 0 ? (
          <EmptyState
            title="No interview sessions yet"
            message="Create your first session to begin the Q&A and evaluation loop."
          />
        ) : null}

        <section className="section-grid">
          {status === 'ready'
            ? sessions.map((session) => (
                <Card key={session.id} title={session.title} eyebrow={session.status}>
                  <p className="muted">
                    {session.answeredCount}/{session.questionCount} answers submitted
                  </p>
                  <p className="muted">
                    Latest score: {session.overallScore ?? 'Pending'} | Updated{' '}
                    {new Date(session.updatedAt).toLocaleString()}
                  </p>
                  <div className="hero-actions">
                    <Link className="btn btn-secondary" href={routes.interview(session.id)}>
                      Open Session
                    </Link>
                    <Link className="btn btn-ghost" href={routes.results(session.id)}>
                      View Results
                    </Link>
                  </div>
                </Card>
              ))
            : null}
        </section>
      </section>
    </AppShell>
  );
}
