'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { InterviewSessionCard } from '@/components/interview/interview-session-card';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { FeedbackState } from '@/components/ui/feedback-state';
import { LoadingState } from '@/components/ui/loading-state';
import { PageContainer } from '@/components/ui/page-container';
import { SectionHeading } from '@/components/ui/section-heading';
import { ApiClientError, apiRequest } from '@/lib/api-client';
import type { CreateInterviewSessionRequest, InterviewSessionSummary } from '@/lib/contracts';
import { routes } from '@/lib/routes';

const FALLBACK_FOCUS_SUGGESTIONS = [
  'Backend Engineering',
  'System Design',
  'APIs',
  'Databases',
  'Microservices',
] as const;

export default function InterviewsPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'ready' | 'unauthenticated' | 'error'>(
    'loading',
  );
  const [createStatus, setCreateStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [filter, setFilter] = useState<'all' | 'in-progress' | 'completed'>('all');
  const [errorMessage, setErrorMessage] = useState('Unable to load sessions.');
  const [focusArea, setFocusArea] = useState('backend engineering');
  const [sessions, setSessions] = useState<InterviewSessionSummary[]>([]);

  const suggestedFocusAreas = useMemo(() => {
    const dynamic = Array.from(
      new Set(
        sessions
          .map((session) => session.focusArea?.trim())
          .filter((value): value is string => Boolean(value)),
      ),
    );

    if (dynamic.length > 0) {
      return dynamic.slice(0, 6);
    }

    return [...FALLBACK_FOCUS_SUGGESTIONS];
  }, [sessions]);

  const filteredSessions = useMemo(() => {
    if (filter === 'all') {
      return sessions;
    }

    if (filter === 'completed') {
      return sessions.filter((session) => session.status === 'COMPLETED');
    }

    return sessions.filter((session) => session.status !== 'COMPLETED');
  }, [filter, sessions]);

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

      setErrorMessage("Couldn't load your interviews.");
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
      setErrorMessage('Please add a focus area before starting.');
      return;
    }

    setCreateStatus('loading');
    setErrorMessage("Couldn't load your interviews.");

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

      setErrorMessage("Couldn't start the interview.");
      setCreateStatus('error');
    }
  }

  return (
    <AppShell>
      <PageContainer>
        <SectionHeading
          title="Interview Practice"
          subtitle="Practice tailored questions, review your performance, and track your progress."
        />

        <Card
          title="Start a New Interview"
          eyebrow="Configuration"
          className="interview-start-card"
        >
          <div className="form-grid">
            <p className="muted">Choose what you'd like to focus on for this practice session.</p>

            <div className="chip-row">
              {suggestedFocusAreas.map((focus) => (
                <button
                  key={focus}
                  type="button"
                  className="chip chip-button"
                  onClick={() => setFocusArea(focus)}
                >
                  {focus}
                </button>
              ))}
            </div>

            <label className="form-grid">
              <span>Focus Area</span>
              <input
                className="input"
                value={focusArea}
                onChange={(event) => setFocusArea(event.target.value)}
                maxLength={100}
              />
            </label>

            <p className="muted">Personalized using your resume and target role.</p>

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
              {createStatus === 'loading' ? 'Starting...' : 'Start Interview'}
            </Button>
          </div>
        </Card>

        {status === 'loading' ? <LoadingState label="Loading your interviews..." /> : null}

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

        {status === 'ready' ? (
          <section className="stack">
            <SectionHeading title="Your Interviews" />
            <div className="filter-row" role="tablist" aria-label="Interview filter">
              <button
                type="button"
                className={`filter-pill ${filter === 'all' ? 'filter-pill-active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All
              </button>
              <button
                type="button"
                className={`filter-pill ${filter === 'in-progress' ? 'filter-pill-active' : ''}`}
                onClick={() => setFilter('in-progress')}
              >
                In Progress
              </button>
              <button
                type="button"
                className={`filter-pill ${filter === 'completed' ? 'filter-pill-active' : ''}`}
                onClick={() => setFilter('completed')}
              >
                Completed
              </button>
            </div>

            {sessions.length === 0 ? (
              <EmptyState
                title="No interviews yet"
                message="Start your first tailored practice session."
                action={<Button onClick={createSession}>Start Interview</Button>}
              />
            ) : null}

            {sessions.length > 0 && filteredSessions.length === 0 ? (
              <EmptyState
                variant="subtle"
                title="No sessions in this filter"
                message="Switch filters or start a new interview session."
              />
            ) : null}

            <section className="interview-session-grid">
              {filteredSessions.map((session) => (
                <InterviewSessionCard key={session.id} session={session} />
              ))}
            </section>
          </section>
        ) : null}
      </PageContainer>
    </AppShell>
  );
}
