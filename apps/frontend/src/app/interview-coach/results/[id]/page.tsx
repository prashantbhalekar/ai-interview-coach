'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { FeedbackState } from '@/components/ui/feedback-state';
import { LoadingState } from '@/components/ui/loading-state';
import { Progress } from '@/components/ui/progress';
import { ApiClientError, apiRequest } from '@/lib/api-client';
import type { InterviewResultsResponse } from '@/lib/contracts';
import { routes } from '@/lib/routes';

export default function ResultsPage() {
  const params = useParams<{ id: string }>();
  const sessionId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [status, setStatus] = useState<'loading' | 'ready' | 'unauthenticated' | 'error'>(
    'loading',
  );
  const [errorMessage, setErrorMessage] = useState('Unable to load interview results.');
  const [results, setResults] = useState<InterviewResultsResponse | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('aiic.accessToken');

    if (!token) {
      setStatus('unauthenticated');
      return;
    }

    const authToken: string = token;

    async function loadResults(): Promise<void> {
      try {
        const response = await apiRequest<InterviewResultsResponse>(
          `/interviews/sessions/${sessionId}/results`,
          {
            token: authToken,
          },
        );

        setResults(response);
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

    void loadResults();
  }, [sessionId]);

  return (
    <AppShell>
      <section className="stack">
        <div>
          <h1 className="page-title">Interview Results</h1>
          <p className="page-subtitle">Session ID: {sessionId}</p>
        </div>

        {status === 'loading' ? <LoadingState label="Loading evaluation summary..." /> : null}

        {status === 'unauthenticated' ? (
          <EmptyState
            title="You are not logged in"
            message="Log in to review interview evaluation history."
            action={
              <Link href={routes.login} className="btn btn-primary">
                Go to Login
              </Link>
            }
          />
        ) : null}

        {status === 'error' ? (
          <FeedbackState
            variant="error"
            title="Results unavailable"
            message={errorMessage}
            actions={
              <Link href={routes.interview(sessionId)} className="btn btn-secondary">
                Return to Session
              </Link>
            }
          />
        ) : null}

        {status === 'ready' && results ? (
          <>
            <Card title="Overall Score" eyebrow={results.status}>
              <Progress label="Interview Performance" value={results.overallScore} />
              <p className="muted">{results.title}</p>
            </Card>

            <section className="info-grid">
              <Card title="Strengths" eyebrow="Evaluation">
                <ul className="metric-list">
                  {results.strengths.map((strength) => (
                    <li key={strength}>
                      <span>{strength}</span>
                      <strong>Strong</strong>
                    </li>
                  ))}
                </ul>
              </Card>
              <Card title="Improvements" eyebrow="Evaluation">
                <ul className="metric-list">
                  {results.improvements.map((improvement) => (
                    <li key={improvement}>
                      <span>{improvement}</span>
                      <strong>Focus</strong>
                    </li>
                  ))}
                </ul>
              </Card>
            </section>

            <Card title="Follow-up Plan" eyebrow="Next Session Prep">
              <ul className="metric-list">
                {results.followUpPlan.map((item) => (
                  <li key={item}>
                    <span>{item}</span>
                    <strong>Next</strong>
                  </li>
                ))}
              </ul>
            </Card>

            <Card title="Answer History" eyebrow="Transcript">
              <ul className="metric-list">
                {results.answers.map((answer) => (
                  <li key={answer.id}>
                    <span>
                      Q{answer.order + 1}: {answer.questionText.slice(0, 58)}...
                    </span>
                    <strong>{answer.score}</strong>
                  </li>
                ))}
              </ul>
            </Card>
          </>
        ) : null}
      </section>
    </AppShell>
  );
}
