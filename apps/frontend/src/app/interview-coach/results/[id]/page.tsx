'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { QuestionReviewItem } from '@/components/interview/question-review-item';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { PageContainer } from '@/components/ui/page-container';
import { SectionHeading } from '@/components/ui/section-heading';
import { StatusBadge } from '@/components/ui/status-badge';
import { ApiClientError, apiRequest } from '@/lib/api-client';
import type { InterviewResultsResponse } from '@/lib/contracts';
import { routes } from '@/lib/routes';

export default function ResultsPage() {
  const params = useParams<{ id: string }>();
  const sessionId = Array.isArray(params.id) ? params.id[0] : (params.id ?? '');

  const [status, setStatus] = useState<'loading' | 'ready' | 'unauthenticated' | 'error'>(
    'loading',
  );
  const [errorMessage, setErrorMessage] = useState("Couldn't load interview results.");
  const [results, setResults] = useState<InterviewResultsResponse | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setErrorMessage('Interview session is missing.');
      setStatus('error');
      return;
    }

    const token = localStorage.getItem('aiic.accessToken');

    if (!token) {
      setStatus('unauthenticated');
      return;
    }

    const authToken: string = token;
    setStatus('loading');

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

        setErrorMessage("Results couldn't be loaded right now.");
        setStatus('error');
      }
    }

    void loadResults();
  }, [sessionId]);

  const scoreLabel = useMemo(() => {
    if (!results) {
      return '';
    }

    if (results.overallScore >= 80) {
      return 'Strong';
    }

    if (results.overallScore >= 60) {
      return 'Developing';
    }

    return 'Needs Improvement';
  }, [results]);

  return (
    <AppShell>
      <PageContainer>
        <SectionHeading
          title="Interview Results"
          subtitle="Here’s how you performed and what to focus on next."
        />

        {status === 'loading' ? (
          <section className="analysis-loading-sections">
            <LoadingState label="Loading results..." />
            <Card>
              <span className="skeleton skeleton-lg" />
              <span className="skeleton" />
              <span className="skeleton" />
            </Card>
          </section>
        ) : null}

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
          <EmptyState
            title="Results couldn't be loaded"
            message={errorMessage}
            action={
              <div className="hero-actions">
                <Link href={routes.interview(sessionId)} className="btn btn-secondary">
                  Return to Session
                </Link>
              </div>
            }
          />
        ) : null}

        {status === 'ready' && results ? (
          <>
            <section className="analysis-context-row">
              <div className="analysis-context-main">
                <StatusBadge label={results.status} tone="info" />
                <div className="analysis-context-copy">
                  <p>
                    <strong>{results.title}</strong>
                  </p>
                  <p className="muted">
                    {results.answers.length} questions · Completed{' '}
                    {new Date(
                      results.answers[results.answers.length - 1]?.createdAt ?? Date.now(),
                    ).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Link href={routes.interviews} className="btn btn-ghost">
                Back to Interviews
              </Link>
            </section>

            <Card className="analysis-hero-card" interactive>
              <div className="analysis-hero-score">
                <div
                  className="analysis-score-ring"
                  aria-hidden="true"
                  style={{
                    background: `conic-gradient(from 180deg, var(--cyan) 0 ${results.overallScore}%, rgba(255, 255, 255, 0.1) ${results.overallScore}% 100%)`,
                  }}
                >
                  <span>{results.overallScore}%</span>
                </div>
                <p className="analysis-score-label">Interview Score</p>
                <StatusBadge
                  label={scoreLabel}
                  tone={results.overallScore >= 80 ? 'success' : 'info'}
                />
              </div>

              <div className="analysis-hero-copy">
                <h3>{results.title}</h3>
                <p className="muted">
                  {results.strengths[0] ??
                    'You completed the interview. Review your detailed answers and feedback below.'}
                </p>
              </div>
            </Card>

            <section className="analysis-two-col">
              <Card title="What You Did Well" eyebrow="Strengths">
                <ul className="analysis-list">
                  {(results.strengths.length > 0
                    ? results.strengths
                    : ['Continue practicing to generate more strength insights.']
                  ).map((strength) => (
                    <li key={strength}>
                      <span className="analysis-list-icon" aria-hidden="true">
                        ✓
                      </span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card title="Areas to Improve" eyebrow="Improvements">
                <ul className="analysis-list">
                  {(results.improvements.length > 0
                    ? results.improvements
                    : ['Continue practicing to unlock focused improvement guidance.']
                  ).map((improvement) => (
                    <li key={improvement}>
                      <span className="analysis-list-icon" aria-hidden="true">
                        →
                      </span>
                      <span>{improvement}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </section>

            <section className="stack">
              <SectionHeading title="Question Breakdown" />
              <div className="question-review-list">
                {results.answers.map((answer) => (
                  <QuestionReviewItem key={answer.id} answer={answer} />
                ))}
              </div>
            </section>

            <section className="stack">
              <SectionHeading
                title="Your Improvement Plan"
                subtitle="Focus on these areas before your next practice session."
              />
              <div className="focus-area-list">
                {(results.followUpPlan.length > 0
                  ? results.followUpPlan
                  : ['Start another interview session to generate a personalized improvement plan.']
                ).map((item, index) => (
                  <article key={item} className="focus-area-item">
                    <span className="focus-index">{String(index + 1).padStart(2, '0')}</span>
                    <p>{item}</p>
                  </article>
                ))}
              </div>
            </section>

            <Card className="analysis-next-step" interactive>
              <SectionHeading
                title="Ready for another round?"
                subtitle="Practice your weak areas while they're fresh."
                className="section-heading-compact"
              />
              <div className="cta-actions">
                <Link href={routes.interviews} className="btn btn-primary">
                  Practice Again
                </Link>
                <Link href={routes.interviews} className="btn btn-secondary">
                  Back to Interviews
                </Link>
              </div>
            </Card>
          </>
        ) : null}
      </PageContainer>
    </AppShell>
  );
}
