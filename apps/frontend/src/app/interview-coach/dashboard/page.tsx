'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { FeedbackState } from '@/components/ui/feedback-state';
import { LoadingState } from '@/components/ui/loading-state';
import { Progress } from '@/components/ui/progress';
import { apiRequest, ApiClientError } from '@/lib/api-client';
import type { AuthUser, InterviewSessionSummary } from '@/lib/contracts';
import { routes } from '@/lib/routes';

const RESUME_CONTEXT_STORAGE_KEY = 'aiic.resumeContext.v1';

interface ResumeContextSnapshot {
  resumeStatus?: string;
  resumeText?: string;
  jobDescription?: string;
}

export default function DashboardPage() {
  const [status, setStatus] = useState<'loading' | 'ready' | 'unauthenticated' | 'error'>(
    'loading',
  );
  const [errorMessage, setErrorMessage] = useState('Unable to load your profile right now.');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [sessions, setSessions] = useState<InterviewSessionSummary[]>([]);
  const [resumeContext, setResumeContext] = useState<ResumeContextSnapshot | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('aiic.accessToken');

    if (!token) {
      setStatus('unauthenticated');
      return;
    }

    const authToken: string = token;

    const storedContext = localStorage.getItem(RESUME_CONTEXT_STORAGE_KEY);
    if (storedContext) {
      try {
        setResumeContext(JSON.parse(storedContext) as ResumeContextSnapshot);
      } catch {
        setResumeContext(null);
      }
    }

    async function loadProfile(): Promise<void> {
      try {
        const [profile, history] = await Promise.all([
          apiRequest<AuthUser>('/users/me', {
            token: authToken,
          }),
          apiRequest<InterviewSessionSummary[]>('/interviews/sessions', {
            token: authToken,
          }),
        ]);

        setUser(profile);
        setSessions(history);
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

  const completedSessions = sessions.filter((entry) => entry.status === 'COMPLETED').length;
  const answeredQuestions = sessions.reduce((total, entry) => total + entry.answeredCount, 0);
  const scoredSessions = sessions.filter(
    (entry): entry is InterviewSessionSummary & { overallScore: number } =>
      typeof entry.overallScore === 'number',
  );
  const averageInterviewScore =
    scoredSessions.length > 0
      ? Math.round(
          scoredSessions.reduce((total, entry) => total + entry.overallScore, 0) /
            scoredSessions.length,
        )
      : 0;

  const resumeTextReady = (resumeContext?.resumeText?.trim().length ?? 0) >= 120;
  const jobDescriptionReady = (resumeContext?.jobDescription?.trim().length ?? 0) >= 80;
  const resumeReady = resumeTextReady && jobDescriptionReady;
  const profileCompleteness = resumeReady
    ? 100
    : Math.min(100, (resumeTextReady ? 50 : 0) + (jobDescriptionReady ? 50 : 0));

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

        {status === 'ready' ? (
          <>
            <section className="section-grid section-3">
              <Card title="Resume Status" eyebrow="Dashboard">
                <p className="muted">
                  {resumeReady
                    ? 'Resume context is complete and ready for analysis refresh.'
                    : 'Complete resume text and job description to unlock full analysis quality.'}
                </p>
                <Progress label="Profile completeness" value={profileCompleteness} />
              </Card>
              <Card title="Interview History" eyebrow="Dashboard">
                <p className="muted">
                  {sessions.length > 0
                    ? `${completedSessions} completed sessions across ${answeredQuestions} submitted answers.`
                    : 'No sessions yet. Start your first interview round.'}
                </p>
                <Progress
                  label="Average score"
                  value={averageInterviewScore > 0 ? averageInterviewScore : 5}
                />
              </Card>
              <Card title="Skill Insights" eyebrow="Dashboard">
                <p className="muted">
                  {scoredSessions.length > 0
                    ? `Latest average interview score is ${averageInterviewScore}. Review follow-up plans to improve depth.`
                    : 'Complete at least one Q&A cycle to generate strength and gap insights.'}
                </p>
                <Progress
                  label="Confidence trend"
                  value={scoredSessions.length > 0 ? averageInterviewScore : 10}
                />
              </Card>
            </section>

            <section className="info-grid">
              <Card title="Quick Actions" eyebrow="Next Steps">
                <ul className="metric-list">
                  <li>
                    <span>Update resume context and rerun analysis</span>
                    <Link className="btn btn-ghost" href={routes.resume}>
                      Resume
                    </Link>
                  </li>
                  <li>
                    <span>Start or continue an interview session</span>
                    <Link className="btn btn-ghost" href={routes.interviews}>
                      Interviews
                    </Link>
                  </li>
                  <li>
                    <span>Review evaluation history and follow-up plan</span>
                    <Link className="btn btn-ghost" href={routes.interviews}>
                      History
                    </Link>
                  </li>
                </ul>
              </Card>
              <Card title="Recent Analysis" eyebrow="Snapshot">
                <p className="muted">
                  {resumeContext?.resumeStatus
                    ? `Most recent resume context status: ${resumeContext.resumeStatus}.`
                    : 'No resume analysis context saved yet. Upload resume context to start matching.'}
                </p>
              </Card>
            </section>
          </>
        ) : null}
      </section>
    </AppShell>
  );
}
