'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { FeedbackState } from '@/components/ui/feedback-state';
import { MetricCard } from '@/components/ui/metric-card';
import { PageContainer } from '@/components/ui/page-container';
import { Progress } from '@/components/ui/progress';
import { SectionHeading } from '@/components/ui/section-heading';
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

  const firstName = useMemo(() => {
    const normalized = user?.fullName?.trim() ?? '';
    if (!normalized) {
      return '';
    }
    return normalized.split(/\s+/)[0] ?? '';
  }, [user]);

  const resumeTextReady = (resumeContext?.resumeText?.trim().length ?? 0) >= 120;
  const jobDescriptionReady = (resumeContext?.jobDescription?.trim().length ?? 0) >= 80;
  const resumeReady = resumeTextReady && jobDescriptionReady;
  const profileCompleteness = resumeReady
    ? 100
    : Math.min(100, (resumeTextReady ? 50 : 0) + (jobDescriptionReady ? 50 : 0));

  const needsImprovementSessions = scoredSessions.filter(
    (session) => session.overallScore < 70,
  ).length;

  const latestSessions = useMemo(
    () =>
      [...sessions]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 2),
    [sessions],
  );

  const activities = useMemo(() => {
    const interviewActivities = latestSessions.map((session) => {
      const scoreLabel =
        typeof session.overallScore === 'number'
          ? `Score: ${session.overallScore}%`
          : 'Score pending';
      return {
        key: session.id,
        title: session.title,
        status: session.status === 'COMPLETED' ? 'Completed' : session.status,
        scoreLabel,
        timeLabel: formatRelativeDate(session.updatedAt),
        href:
          session.status === 'COMPLETED'
            ? routes.results(session.id)
            : routes.interview(session.id),
      };
    });

    if (!resumeContext?.resumeStatus) {
      return interviewActivities;
    }

    return [
      ...interviewActivities,
      {
        key: 'resume-context',
        title: 'Resume Analysis',
        status: 'Completed',
        scoreLabel: `Status: ${resumeContext.resumeStatus}`,
        timeLabel: 'Recently updated',
        href: routes.analysis,
      },
    ];
  }, [latestSessions, resumeContext]);

  const systemDesignScore = getAverageForFocus(scoredSessions, /(system|design|architecture)/i);
  const codeQualityScore = getAverageForFocus(scoredSessions, /(backend|api|code|quality)/i);
  const communicationScore =
    completedSessions > 0
      ? Math.round(
          (sessions
            .filter((session) => session.status === 'COMPLETED')
            .reduce((total, session) => {
              if (session.questionCount === 0) {
                return total;
              }
              return total + (session.answeredCount / session.questionCount) * 100;
            }, 0) /
            completedSessions) *
            0.65,
        )
      : null;

  const skillRows = [
    { label: 'Problem Solving', value: scoredSessions.length > 0 ? averageInterviewScore : null },
    { label: 'System Design', value: systemDesignScore },
    { label: 'Code Quality', value: codeQualityScore },
    { label: 'Communication', value: communicationScore },
  ] as const;

  const hasAnySkillScore = skillRows.some((row) => typeof row.value === 'number');

  return (
    <AppShell>
      <PageContainer>
        <SectionHeading
          title={status === 'ready' && firstName ? `Welcome back, ${firstName}` : 'Welcome back'}
          subtitle="Here’s your interview preparation overview."
          action={
            <Link href={routes.interviews} className="btn btn-primary">
              + Start Interview
            </Link>
          }
        />

        {status === 'loading' ? (
          <section className="dashboard-skeleton-grid" aria-label="Loading dashboard metrics">
            {Array.from({ length: 4 }).map((_, index) => (
              <Card key={index}>
                <span className="skeleton skeleton-sm" />
                <span className="skeleton skeleton-lg" />
                <span className="skeleton" />
              </Card>
            ))}
          </section>
        ) : null}

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
            <section className="dashboard-kpis">
              <MetricCard
                label="Profile Completeness"
                value={`${profileCompleteness}%`}
                supportingText={
                  resumeReady
                    ? 'Resume text and job description are fully configured.'
                    : 'Complete resume text and job description to improve quality.'
                }
                progressValue={profileCompleteness}
                icon={<ProfileMetricIcon />}
              />
              <MetricCard
                label="Average Interview Score"
                value={scoredSessions.length > 0 ? `${averageInterviewScore}%` : null}
                supportingText={
                  scoredSessions.length > 0
                    ? `Calculated from ${scoredSessions.length} scored sessions.`
                    : 'Complete a scored interview to populate this metric.'
                }
                icon={<ScoreMetricIcon />}
              />
              <MetricCard
                label="Interviews Completed"
                value={completedSessions}
                supportingText={`${answeredQuestions} answers submitted across all sessions.`}
                icon={<InterviewMetricIcon />}
              />
              <MetricCard
                label="Areas to Improve"
                value={scoredSessions.length > 0 ? needsImprovementSessions : null}
                supportingText={
                  scoredSessions.length > 0
                    ? 'Completed rounds with overall score below 70%.'
                    : 'Pending until scored interview data becomes available.'
                }
                icon={<ImproveMetricIcon />}
              />
            </section>

            <section className="activity-layout">
              <Card title="Recent Activity" eyebrow="Latest Updates">
                {activities.length > 0 ? (
                  <ul className="activity-list">
                    {activities.map((item) => (
                      <li key={item.key}>
                        <Link href={item.href} className="activity-link">
                          <strong>{item.title}</strong>
                          <span className="activity-meta">{item.status}</span>
                          <span className="activity-meta">{item.scoreLabel}</span>
                          <span className="activity-meta">{item.timeLabel}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState
                    variant="subtle"
                    title="No recent activity yet"
                    message="Start your first interview or upload resume context to see timeline updates here."
                    action={
                      <Link href={routes.interviews} className="btn btn-secondary">
                        Start Interview
                      </Link>
                    }
                  />
                )}
              </Card>

              <Card title="Skill Insights" eyebrow="Current Snapshot">
                {hasAnySkillScore ? (
                  <div className="skill-insight-list">
                    {skillRows.map((item) =>
                      typeof item.value === 'number' ? (
                        <Progress key={item.label} label={item.label} value={item.value} compact />
                      ) : (
                        <p key={item.label} className="activity-meta">
                          {item.label}: not enough data yet
                        </p>
                      ),
                    )}
                  </div>
                ) : (
                  <EmptyState
                    variant="subtle"
                    title="Skill insights are not ready"
                    message="Complete scored interviews to unlock skill-level breakdowns."
                  />
                )}

                <Link href={routes.interviews} className="btn btn-ghost">
                  View Detailed Analysis
                </Link>
              </Card>
            </section>

            <Card title="Quick Actions" eyebrow="Do Next">
              <div className="quick-actions-grid">
                <QuickActionCard
                  href={routes.resume}
                  icon={<UploadActionIcon />}
                  title="Upload Resume"
                  description="Add or refresh resume context for better question targeting."
                />
                <QuickActionCard
                  href={routes.interviews}
                  icon={<StartActionIcon />}
                  title="Start Interview"
                  description="Launch a focused interview round for your target role."
                />
                <QuickActionCard
                  href={routes.interviews}
                  icon={<HistoryActionIcon />}
                  title="View History"
                  description="Review previous sessions and identify improvement trends."
                />
                <QuickActionCard
                  href={routes.analysis}
                  icon={<ReportActionIcon />}
                  title="Analysis Report"
                  description="Inspect resume matching gaps and recommended next steps."
                />
              </div>
            </Card>

            <Card>
              <p>
                <strong>Keep practicing.</strong>
              </p>
              <p className="muted">
                Regular practice helps improve confidence, technical depth and communication.
              </p>
            </Card>
          </>
        ) : null}
      </PageContainer>
    </AppShell>
  );
}

interface QuickActionCardProps {
  href: string;
  icon: ReactNode;
  title: string;
  description: string;
}

function QuickActionCard({ href, icon, title, description }: QuickActionCardProps) {
  return (
    <Link href={href} className="action-card">
      <span className="icon-badge" aria-hidden="true">
        {icon}
      </span>
      <strong>{title}</strong>
      <span className="action-copy">{description}</span>
    </Link>
  );
}

function getAverageForFocus(
  sessions: Array<InterviewSessionSummary & { overallScore: number }>,
  pattern: RegExp,
): number | null {
  const matching = sessions.filter((session) =>
    `${session.focusArea ?? ''} ${session.title}`.match(pattern),
  );

  if (matching.length === 0) {
    return null;
  }

  const average =
    matching.reduce((total, session) => total + session.overallScore, 0) / matching.length;
  return Math.round(average);
}

function formatRelativeDate(dateValue: string): string {
  const now = Date.now();
  const target = new Date(dateValue).getTime();

  if (Number.isNaN(target)) {
    return 'Recently';
  }

  const hours = Math.max(1, Math.floor((now - target) / 36e5));
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function ProfileMetricIcon(): ReactNode {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 12a4 4 0 100-8 4 4 0 000 8Zm0 2c-3.9 0-7 2.2-7 5v1h14v-1c0-2.8-3.1-5-7-5Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function ScoreMetricIcon(): ReactNode {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 19h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M8 16V9M12 16V5M16 16v-3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function InterviewMetricIcon(): ReactNode {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 5h16v10H8l-4 4V5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ImproveMetricIcon(): ReactNode {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3v18M3 12h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M16.5 7.5L7.5 16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function UploadActionIcon(): ReactNode {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 16V5M12 5l-4 4M12 5l4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M4 17v2h16v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function StartActionIcon(): ReactNode {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 6l10 6-10 6V6Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function HistoryActionIcon(): ReactNode {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 12a8 8 0 118 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M4 12V7M4 7h5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 8v4l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ReportActionIcon(): ReactNode {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 3h10l4 4v14H7V3Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M17 3v5h4" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M10 12h8M10 16h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
