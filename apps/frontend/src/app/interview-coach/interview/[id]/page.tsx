'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { InterviewProgress } from '@/components/interview/interview-progress';
import { QuestionReviewItem } from '@/components/interview/question-review-item';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { FeedbackState } from '@/components/ui/feedback-state';
import { LoadingState } from '@/components/ui/loading-state';
import { PageContainer } from '@/components/ui/page-container';
import { SectionHeading } from '@/components/ui/section-heading';
import { StatusBadge } from '@/components/ui/status-badge';
import { ApiClientError, apiRequest } from '@/lib/api-client';
import type {
  InterviewSessionDetail,
  SubmitInterviewAnswerRequest,
  SubmitInterviewAnswerResponse,
} from '@/lib/contracts';
import { routes } from '@/lib/routes';

export default function InterviewSessionPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const sessionId = Array.isArray(params.id) ? params.id[0] : (params.id ?? '');

  const [status, setStatus] = useState<'loading' | 'ready' | 'unauthenticated' | 'error'>(
    'loading',
  );
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [answerText, setAnswerText] = useState('');
  const [errorMessage, setErrorMessage] = useState('Unable to load interview session.');
  const [session, setSession] = useState<InterviewSessionDetail | null>(null);

  async function loadSession(token: string): Promise<void> {
    try {
      const response = await apiRequest<InterviewSessionDetail>(
        `/interviews/sessions/${sessionId}`,
        {
          token,
        },
      );

      setSession(response);
      setStatus('ready');
    } catch (error: unknown) {
      if (error instanceof ApiClientError && error.status === 401) {
        localStorage.removeItem('aiic.accessToken');
        setStatus('unauthenticated');
        return;
      }

      setErrorMessage("Couldn't load this interview session.");
      setStatus('error');
    }
  }

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

    setStatus('loading');
    void loadSession(token);
  }, [sessionId]);

  const isCompleted = useMemo(() => {
    if (!session) {
      return false;
    }

    return session.status === 'COMPLETED' || session.currentQuestion === null;
  }, [session]);

  async function submitAnswer(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const token = localStorage.getItem('aiic.accessToken');
    if (!token) {
      setStatus('unauthenticated');
      return;
    }

    if (!session?.currentQuestion) {
      setSubmitStatus('error');
      setErrorMessage('No active question is available.');
      return;
    }

    const trimmed = answerText.trim();
    if (trimmed.length < 40) {
      setSubmitStatus('error');
      setErrorMessage('Please provide a more complete answer before submitting.');
      return;
    }

    setSubmitStatus('loading');

    try {
      const payload: SubmitInterviewAnswerRequest = {
        questionId: session.currentQuestion.id,
        answerText: trimmed,
      };

      await apiRequest<SubmitInterviewAnswerResponse, SubmitInterviewAnswerRequest>(
        `/interviews/sessions/${sessionId}/answers`,
        {
          method: 'POST',
          token,
          body: payload,
        },
      );

      setAnswerText('');
      setSubmitStatus('idle');
      await loadSession(token);
    } catch (error: unknown) {
      if (error instanceof ApiClientError && error.status === 401) {
        localStorage.removeItem('aiic.accessToken');
        setStatus('unauthenticated');
        return;
      }

      setErrorMessage("Your answer couldn't be submitted. Please try again.");
      setSubmitStatus('error');
    }
  }

  function handleExitInterview(): void {
    if (answerText.trim().length > 0) {
      const shouldExit = window.confirm(
        'You have an unsaved answer draft. Exit interview and lose this draft?',
      );

      if (!shouldExit) {
        return;
      }
    }

    router.push(routes.interviews);
  }

  return (
    <AppShell>
      <PageContainer className="interview-reading-shell">
        {status === 'loading' ? (
          <section className="analysis-loading-sections">
            <LoadingState label="Loading interview..." />
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
            message="Log in to continue this interview session."
            action={
              <Link href={routes.login} className="btn btn-primary">
                Go to Login
              </Link>
            }
          />
        ) : null}

        {status === 'error' ? (
          <EmptyState
            title="Interview unavailable"
            message={errorMessage}
            action={
              <div className="hero-actions">
                <Link href={routes.interviews} className="btn btn-secondary">
                  Back to Interviews
                </Link>
              </div>
            }
          />
        ) : null}

        {status === 'ready' && session ? (
          <>
            {!isCompleted ? (
              <InterviewProgress
                title={session.title}
                answeredCount={session.answers.length}
                questionCount={session.questions.length}
                subtitle="Personalized from your resume and target role"
              />
            ) : (
              <Card className="interview-complete-hero" interactive>
                <StatusBadge label="Interview Complete" tone="success" />
                <h1 className="page-title">{session.title}</h1>
                <p className="muted">
                  {session.answers.length} of {session.questions.length} questions answered
                </p>
                <p className="interview-final-score">
                  <span className="muted">Score</span>{' '}
                  <strong>{session.evaluation?.overallScore ?? '--'}%</strong>
                </p>
                <div className="hero-actions">
                  <Link href={routes.results(session.id)} className="btn btn-primary">
                    View Full Results
                  </Link>
                  <Link href={routes.interviews} className="btn btn-secondary">
                    Back to Interviews
                  </Link>
                </div>
              </Card>
            )}

            {!isCompleted && session.currentQuestion ? (
              <section className="stack">
                <article className="interview-question-block">
                  <p className="eyebrow">
                    Question {session.currentQuestion.order + 1} of {session.questions.length}
                  </p>
                  <h2 className="interview-question-text">{session.currentQuestion.text}</h2>
                </article>

                <Card title="Your Answer" eyebrow="Response">
                  <form className="form-grid" onSubmit={submitAnswer}>
                    <p className="muted">Answer as you would in a real interview.</p>
                    <textarea
                      className="textarea interview-answer-textarea"
                      placeholder="Write your answer here..."
                      value={answerText}
                      onChange={(event) => setAnswerText(event.target.value)}
                      required
                      disabled={submitStatus === 'loading'}
                      minLength={40}
                    />
                    <div className="char-row">
                      <span className="muted">{answerText.trim().length} characters</span>
                      <StatusBadge
                        label={submitStatus === 'loading' ? 'Evaluating answer...' : 'Draft'}
                        tone={submitStatus === 'loading' ? 'info' : 'neutral'}
                      />
                    </div>

                    {submitStatus === 'error' ? (
                      <FeedbackState
                        variant="error"
                        title="Unable to submit answer"
                        message={errorMessage}
                      />
                    ) : null}

                    <div className="hero-actions">
                      <Button type="submit" disabled={submitStatus === 'loading'}>
                        {submitStatus === 'loading' ? 'Evaluating answer...' : 'Submit Answer'}
                      </Button>
                      <Button type="button" variant="ghost" onClick={handleExitInterview}>
                        Exit Interview
                      </Button>
                    </div>
                  </form>
                </Card>
              </section>
            ) : null}

            {isCompleted && session.answers.length > 0 ? (
              <section className="stack">
                <SectionHeading title="Question Summary" />
                <div className="question-review-list">
                  {session.answers.map((answer) => (
                    <QuestionReviewItem key={answer.id} answer={answer} />
                  ))}
                </div>
              </section>
            ) : null}
          </>
        ) : null}
      </PageContainer>
    </AppShell>
  );
}
