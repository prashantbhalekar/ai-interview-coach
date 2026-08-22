'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { FeedbackState } from '@/components/ui/feedback-state';
import { LoadingState } from '@/components/ui/loading-state';
import { ApiClientError, apiRequest } from '@/lib/api-client';
import type {
  InterviewSessionDetail,
  SubmitInterviewAnswerRequest,
  SubmitInterviewAnswerResponse,
} from '@/lib/contracts';
import { routes } from '@/lib/routes';

export default function InterviewSessionPage() {
  const params = useParams<{ id: string }>();
  const sessionId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [status, setStatus] = useState<'loading' | 'ready' | 'unauthenticated' | 'error'>(
    'loading',
  );
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [answerText, setAnswerText] = useState('');
  const [errorMessage, setErrorMessage] = useState('Unable to load interview session.');
  const [session, setSession] = useState<InterviewSessionDetail | null>(null);
  const [latestFeedback, setLatestFeedback] = useState<SubmitInterviewAnswerResponse | null>(null);

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

    void loadSession(token);
  }, [sessionId]);

  async function submitAnswer(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const token = localStorage.getItem('aiic.accessToken');
    if (!token) {
      setStatus('unauthenticated');
      return;
    }

    if (!session?.currentQuestion) {
      setSubmitStatus('error');
      setErrorMessage('No active question is available in this session.');
      return;
    }

    setSubmitStatus('loading');

    try {
      const payload: SubmitInterviewAnswerRequest = {
        questionId: session.currentQuestion.id,
        answerText,
      };

      const response = await apiRequest<
        SubmitInterviewAnswerResponse,
        SubmitInterviewAnswerRequest
      >(`/interviews/sessions/${sessionId}/answers`, {
        method: 'POST',
        token,
        body: payload,
      });

      setLatestFeedback(response);
      setAnswerText('');
      setSubmitStatus('idle');
      await loadSession(token);
    } catch (error: unknown) {
      if (error instanceof ApiClientError) {
        setErrorMessage(error.message);
      }
      setSubmitStatus('error');
    }
  }

  return (
    <AppShell>
      <section className="stack">
        <div>
          <h1 className="page-title">Interview Session</h1>
          <p className="page-subtitle">Session ID: {sessionId}</p>
        </div>

        {status === 'loading' ? <LoadingState label="Loading interview prompts..." /> : null}

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
          <FeedbackState variant="error" title="Session unavailable" message={errorMessage} />
        ) : null}

        {status === 'ready' && session ? (
          <>
            <Card title={session.title} eyebrow={session.status}>
              <p className="muted">
                Answered {session.answers.length}/{session.questions.length} questions.
              </p>
              {session.evaluation ? (
                <p className="muted">Current score: {session.evaluation.overallScore}</p>
              ) : null}
              <div className="hero-actions">
                <Link href={routes.results(session.id)} className="btn btn-secondary">
                  Open Results
                </Link>
                <Link href={routes.interviews} className="btn btn-ghost">
                  Back to History
                </Link>
              </div>
            </Card>

            {session.currentQuestion ? (
              <Card title="Question" eyebrow={`Prompt ${session.currentQuestion.order + 1}`}>
                <p>{session.currentQuestion.text}</p>
              </Card>
            ) : (
              <FeedbackState
                variant="success"
                title="Interview session complete"
                message="All questions are answered. Review your full evaluation and follow-up plan."
                actions={
                  <Link href={routes.results(session.id)} className="btn btn-secondary">
                    View Final Results
                  </Link>
                }
              />
            )}

            {session.currentQuestion ? (
              <Card title="Your Answer" eyebrow="Response">
                <form className="form-grid" onSubmit={submitAnswer}>
                  <textarea
                    className="textarea"
                    placeholder="Type your answer with architecture, trade-offs, and measurable impact..."
                    value={answerText}
                    onChange={(event) => setAnswerText(event.target.value)}
                    required
                    minLength={40}
                  />
                  {submitStatus === 'error' ? (
                    <FeedbackState
                      variant="error"
                      title="Unable to submit"
                      message={errorMessage}
                    />
                  ) : null}
                  <div className="hero-actions">
                    <Button type="submit" disabled={submitStatus === 'loading'}>
                      {submitStatus === 'loading' ? 'Submitting...' : 'Submit Answer'}
                    </Button>
                  </div>
                </form>
              </Card>
            ) : null}

            {latestFeedback ? (
              <Card
                title="Latest Evaluation"
                eyebrow={`Score ${latestFeedback.submittedAnswer.score}`}
              >
                <p className="muted">{latestFeedback.submittedAnswer.feedbackSummary}</p>
                <p>{latestFeedback.submittedAnswer.followUpQuestion}</p>
              </Card>
            ) : null}

            {session.answers.length > 0 ? (
              <Card title="Q&A History" eyebrow="Session Transcript">
                <ul className="metric-list">
                  {session.answers.map((answer) => (
                    <li key={answer.id}>
                      <span>
                        Q{answer.order + 1}: {answer.questionText.slice(0, 52)}...
                      </span>
                      <strong>{answer.score}</strong>
                    </li>
                  ))}
                </ul>
              </Card>
            ) : null}
          </>
        ) : null}
      </section>
    </AppShell>
  );
}
