'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { FeedbackState } from '@/components/ui/feedback-state';
import { LoadingState } from '@/components/ui/loading-state';
import { Progress } from '@/components/ui/progress';
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
  const [errorMessage, setErrorMessage] = useState(
    'Unable to fetch the latest analysis result. Retry once resume and job context are available.',
  );
  const [analysis, setAnalysis] = useState<AnalyzeResumeResponse | null>(null);
  const [context, setContext] = useState<PersistedResumeContext | null>(null);

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
    setErrorMessage(
      'Unable to fetch the latest analysis result. Retry once resume and job context are available.',
    );

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
        setErrorMessage(error.message);

        if (error.status === 401) {
          localStorage.removeItem('aiic.accessToken');
          setState('unauthenticated');
          return;
        }
      }

      setState('error');
    }
  }

  return (
    <AppShell>
      <section className="stack">
        <div>
          <h1 className="page-title">Resume Analysis</h1>
          <p className="page-subtitle">
            Structured insights generated from resume and job description.
          </p>
          <div className="hero-actions" style={{ marginTop: '0.75rem' }}>
            <Button variant="secondary" onClick={() => setAnalysis(null)}>
              Clear Result
            </Button>
            <Button onClick={refreshAnalysis}>Refresh Analysis</Button>
          </div>
        </div>

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
          <Card title="Current Context" eyebrow="Inputs">
            <p className="muted">
              Resume: {context.resumeFileName || 'Pasted resume text'} ({context.resumeStatus})
            </p>
            <p className="muted">
              Saved context updated at {new Date(context.updatedAt).toLocaleString()}.
            </p>
          </Card>
        ) : null}

        {state === 'loading' ? (
          <LoadingState label="Recomputing match score and skill deltas..." />
        ) : null}
        {state === 'error' ? (
          <FeedbackState
            variant="error"
            title="Analysis unavailable"
            message={errorMessage}
            actions={<Button onClick={refreshAnalysis}>Retry</Button>}
          />
        ) : null}

        {state === 'empty' ? (
          <EmptyState
            title="No complete context found"
            message="Upload a resume, add a job description, and provide resume text (at least 120 chars) before generating analysis. You can add resume text in Resume step 1 or by updating saved context."
            action={
              <Link href={routes.resume} className="btn btn-secondary">
                Complete Resume Context
              </Link>
            }
          />
        ) : null}

        {state === 'ready' && analysis ? (
          <FeedbackState
            variant="success"
            title="Latest analysis is ready"
            message={`Provider: ${analysis.provider} | Model: ${analysis.model}`}
          />
        ) : null}

        {state === 'ready' && analysis ? (
          <Card title="Overall Match" eyebrow="AI Evaluation">
            <Progress label="Match Score" value={analysis.result.overallScore} />
            <p className="muted">{analysis.result.summary}</p>
          </Card>
        ) : null}

        {state === 'ready' && analysis ? (
          <section className="info-grid">
            <Card title="Matching Skills" eyebrow="Strengths">
              <div className="chip-row">
                {analysis.result.strengths.map((strength) => (
                  <Chip key={strength}>{strength}</Chip>
                ))}
              </div>
            </Card>
            <Card title="Missing Skills" eyebrow="Gaps">
              <div className="chip-row">
                {analysis.result.gaps.map((gap) => (
                  <Chip key={gap}>{gap}</Chip>
                ))}
              </div>
            </Card>
            <Card title="Recommendations" eyebrow="Action Plan">
              <ul className="metric-list">
                {analysis.result.recommendations.map((recommendation) => (
                  <li key={recommendation}>
                    <span>{recommendation}</span>
                    <strong>Next</strong>
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        ) : null}
      </section>
    </AppShell>
  );
}
