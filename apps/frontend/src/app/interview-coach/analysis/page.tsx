'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { PageContainer } from '@/components/ui/page-container';
import { SectionHeading } from '@/components/ui/section-heading';
import { StatusBadge } from '@/components/ui/status-badge';
import { ApiClientError, apiRequest } from '@/lib/api-client';
import type { AnalyzeResumeResponse } from '@/lib/contracts';
import { routes } from '@/lib/routes';

const STORAGE_KEY = 'aiic.resumeContext.v1';

interface PersistedResumeContext {
  resumeId: string;
  resumeFileName: string;
  resumeStatus: string;
  resumeText: string;
  jobDescription: string;
  updatedAt: string;
}

export default function AnalysisPage() {
  const [state, setState] = useState<
    'checking-auth' | 'unauthenticated' | 'empty' | 'loading' | 'ready' | 'error'
  >('checking-auth');
  const [analysis, setAnalysis] = useState<AnalyzeResumeResponse | null>(null);
  const [context, setContext] = useState<PersistedResumeContext | null>(null);
  const [showAnalysisDetails, setShowAnalysisDetails] = useState(false);

  const hasContext = useMemo(() => {
    if (!context) {
      return false;
    }

    return context.resumeText.trim().length >= 120 && context.jobDescription.trim().length >= 80;
  }, [context]);

  useEffect(() => {
    const token = localStorage.getItem('aiic.accessToken');
    if (!token) {
      setState('unauthenticated');
      return;
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      setState('empty');
      return;
    }

    try {
      const parsed = JSON.parse(raw) as PersistedResumeContext;
      setContext(parsed);

      if (parsed.resumeText.trim().length < 120 || parsed.jobDescription.trim().length < 80) {
        setState('empty');
        return;
      }

      setState('ready');
    } catch {
      setState('empty');
    }
  }, []);

  async function refreshAnalysis(): Promise<void> {
    const token = localStorage.getItem('aiic.accessToken');
    if (!token) {
      setState('unauthenticated');
      return;
    }

    if (!context || !hasContext) {
      setState('empty');
      return;
    }

    setState('loading');

    try {
      const response = await apiRequest<
        AnalyzeResumeResponse,
        { resumeText: string; jobDescription: string }
      >('/ai/resume-analysis', {
        method: 'POST',
        token,
        body: {
          resumeText: context.resumeText,
          jobDescription: context.jobDescription,
        },
      });

      setAnalysis(response);
      setState('ready');
    } catch (error: unknown) {
      if (error instanceof ApiClientError) {
        if (error.status === 401) {
          localStorage.removeItem('aiic.accessToken');
          setState('unauthenticated');
          return;
        }
      }

      setState('error');
    }
  }

  const hasAnalysis = state === 'ready' && analysis !== null;

  const statusInfo = useMemo(() => {
    if (state === 'loading') {
      return {
        label: 'Analyzing',
        tone: 'info' as const,
        description: 'Comparing your experience against the target role.',
      };
    }

    if (state === 'error') {
      return {
        label: 'Failed',
        tone: 'error' as const,
        description: 'Analysis could not be completed right now.',
      };
    }

    if (hasAnalysis) {
      return {
        label: 'Analysis Ready',
        tone: 'success' as const,
        description: context?.updatedAt
          ? `Updated ${new Date(context.updatedAt).toLocaleString()}`
          : 'Ready',
      };
    }

    return {
      label: 'Not started',
      tone: 'neutral' as const,
      description: 'Run analysis once your context is complete.',
    };
  }, [context?.updatedAt, hasAnalysis, state]);

  const score = analysis?.result.overallScore ?? 0;
  const scoreLabel = getMatchLabel(score);
  const scoreDescription = getScoreHeading(score);

  const supportingMetrics = analysis
    ? [
        { label: 'Matched skills', value: analysis.result.strengths.length },
        { label: 'Skill gaps', value: analysis.result.gaps.length },
        { label: 'Recommendations', value: analysis.result.recommendations.length },
      ]
    : [];

  const focusPreviewItems = analysis
    ? Array.from(
        new Set([
          ...analysis.result.keywordsMissing,
          ...analysis.result.gaps.filter((item) => isShortSkill(item)),
          ...analysis.result.keywordsMatched.slice(0, 2),
        ]),
      ).slice(0, 6)
    : [];

  return (
    <AppShell>
      <PageContainer>
        <SectionHeading
          title="Resume Analysis"
          subtitle="See how your experience matches the target role and what to focus on before your interview."
          action={
            <div className="analysis-header-actions">
              <Button
                variant="secondary"
                onClick={refreshAnalysis}
                disabled={state === 'loading' || state === 'checking-auth'}
              >
                {state === 'loading' ? 'Refreshing...' : 'Refresh Analysis'}
              </Button>
              <button
                type="button"
                className="btn btn-ghost analysis-clear-btn"
                onClick={() => setAnalysis(null)}
                disabled={state === 'loading'}
              >
                Clear Result
              </button>
            </div>
          }
        />

        {state === 'checking-auth' ? (
          <LoadingState label="Preparing analysis workspace..." />
        ) : null}

        {state === 'unauthenticated' ? (
          <EmptyState
            title="You are not logged in"
            message="Log in to run resume analysis and view structured interview prep insights."
            action={
              <Link href={routes.login} className="btn btn-primary">
                Go to Login
              </Link>
            }
          />
        ) : null}

        {state !== 'unauthenticated' && context ? (
          <section className="analysis-context-row" aria-live="polite">
            <div className="analysis-context-main">
              <StatusBadge label={statusInfo.label} tone={statusInfo.tone} />
              <div className="analysis-context-copy">
                <p>
                  <strong>{context.resumeFileName || 'Resume context available'}</strong>
                </p>
                <p className="muted">{statusInfo.description}</p>
              </div>
            </div>
            <Link href={routes.resume} className="btn btn-ghost">
              Change Context
            </Link>
          </section>
        ) : null}

        {state === 'loading' ? (
          <section className="analysis-loading-sections" aria-label="Loading analysis report">
            <Card>
              <span className="skeleton skeleton-lg" />
              <span className="skeleton" />
              <span className="skeleton" />
            </Card>
            <div className="info-grid">
              <Card>
                <span className="skeleton" />
                <span className="skeleton" />
                <span className="skeleton" />
              </Card>
              <Card>
                <span className="skeleton" />
                <span className="skeleton" />
                <span className="skeleton" />
              </Card>
            </div>
          </section>
        ) : null}

        {state === 'error' ? (
          <EmptyState
            title="Analysis couldn't be completed"
            message="We couldn't generate your resume analysis right now."
            action={
              <div className="hero-actions">
                <Button onClick={refreshAnalysis}>Try Again</Button>
                <Link href={routes.resume} className="btn btn-secondary">
                  Review Resume Context
                </Link>
              </div>
            }
          />
        ) : null}

        {state === 'empty' ? (
          <EmptyState
            title="Complete your interview context first"
            message="Upload your resume and add the target job description before running analysis."
            action={
              <Link href={routes.resume} className="btn btn-secondary">
                Prepare Interview Context
              </Link>
            }
          />
        ) : null}

        {hasAnalysis ? (
          <Card className="analysis-hero-card" interactive>
            <div className="analysis-hero-score">
              <div
                className="analysis-score-ring"
                aria-hidden="true"
                style={{
                  background: `conic-gradient(from 180deg, var(--cyan) 0 ${score}%, rgba(255, 255, 255, 0.1) ${score}% 100%)`,
                }}
              >
                <span>{score}%</span>
              </div>
              <p className="analysis-score-label">{scoreLabel}</p>
            </div>

            <div className="analysis-hero-copy">
              <h3>{scoreDescription}</h3>
              <p className="muted">{analysis.result.summary}</p>
              <div className="analysis-support-metrics">
                {supportingMetrics.map((item) => (
                  <div key={item.label} className="analysis-support-item">
                    <span className="muted">{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        ) : null}

        {hasAnalysis ? (
          <section className="analysis-two-col">
            <Card title="Your Strengths" eyebrow="Alignment">
              <p className="muted">Skills and experience that align with this role.</p>
              {renderInsights(analysis.result.strengths, 'strength')}
            </Card>

            <Card title="Skills to Improve" eyebrow="Gaps">
              <p className="muted">Areas worth strengthening before the interview.</p>
              {renderInsights(analysis.result.gaps, 'gap')}
            </Card>
          </section>
        ) : null}

        {hasAnalysis ? (
          <section className="stack">
            <SectionHeading
              title="Recommended Focus Areas"
              subtitle="Prioritize these areas before starting your interview practice."
            />

            <div className="focus-area-list">
              {analysis.result.recommendations.map((recommendation, index) => (
                <article key={`${index}-${recommendation}`} className="focus-area-item">
                  <span className="focus-index">{String(index + 1).padStart(2, '0')}</span>
                  <p>{recommendation}</p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {hasAnalysis && focusPreviewItems.length > 0 ? (
          <section className="stack">
            <SectionHeading title="Your interview will focus on" />
            <div className="chip-row">
              {focusPreviewItems.map((item) => (
                <Chip key={`focus-${item}`}>{item}</Chip>
              ))}
            </div>
          </section>
        ) : null}

        {hasAnalysis ? (
          <Card className="analysis-next-step" interactive>
            <SectionHeading
              title="Ready to put this analysis into practice?"
              subtitle="We’ll use your resume, job description and identified skill gaps to generate a tailored interview."
              className="section-heading-compact"
            />
            <div className="cta-actions">
              <Link href={routes.interviews} className="btn btn-primary">
                Start Tailored Interview
              </Link>
              <Link href={routes.resume} className="btn btn-secondary">
                Update Resume or Job
              </Link>
            </div>
          </Card>
        ) : null}

        {hasAnalysis ? (
          <section className="analysis-details-block">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setShowAnalysisDetails((current) => !current)}
              aria-expanded={showAnalysisDetails}
            >
              Analysis details
            </button>
            {showAnalysisDetails ? (
              <div className="analysis-details-copy">
                <p className="muted">Provider: {analysis.provider}</p>
                <p className="muted">Model: {analysis.model}</p>
              </div>
            ) : null}
          </section>
        ) : null}
      </PageContainer>
    </AppShell>
  );
}

function getMatchLabel(score: number): string {
  if (score >= 90) {
    return 'Excellent Match';
  }
  if (score >= 75) {
    return 'Strong Match';
  }
  if (score >= 60) {
    return 'Moderate Match';
  }
  return 'Needs Improvement';
}

function getScoreHeading(score: number): string {
  if (score >= 90) {
    return 'Excellent alignment for this role';
  }
  if (score >= 75) {
    return 'Strong match for this role';
  }
  if (score >= 60) {
    return 'Moderate match for this role';
  }
  return 'There are important gaps to address';
}

function isShortSkill(value: string): boolean {
  return (
    value.length <= 28 && !/[,.]|\b(and|with|experience|understanding|knowledge)\b/i.test(value)
  );
}

function renderInsights(items: string[], kind: 'strength' | 'gap') {
  if (items.length === 0) {
    return (
      <EmptyState
        variant="subtle"
        title="No items available"
        message="Run refresh analysis to generate this section."
      />
    );
  }

  const allShort = items.every((item) => isShortSkill(item));

  if (allShort) {
    return (
      <div className="chip-row">
        {items.map((item) => (
          <Chip key={`${kind}-${item}`}>{item}</Chip>
        ))}
      </div>
    );
  }

  return (
    <ul className="analysis-list">
      {items.map((item) => (
        <li key={`${kind}-${item}`}>
          <span className="analysis-list-icon" aria-hidden="true">
            {kind === 'strength' ? '✓' : '!'}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
