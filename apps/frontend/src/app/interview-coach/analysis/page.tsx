'use client';

import { useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { FeedbackState } from '@/components/ui/feedback-state';
import { LoadingState } from '@/components/ui/loading-state';
import { Progress } from '@/components/ui/progress';

export default function AnalysisPage() {
  const [state, setState] = useState<'empty' | 'loading' | 'ready' | 'error'>('ready');

  async function refreshAnalysis(): Promise<void> {
    setState('loading');
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setState('ready');
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
            <Button variant="secondary" onClick={() => setState('empty')}>
              Show Empty State
            </Button>
            <Button variant="secondary" onClick={() => setState('error')}>
              Show Error State
            </Button>
            <Button onClick={refreshAnalysis}>Refresh Analysis</Button>
          </div>
        </div>
        {state === 'loading' ? (
          <LoadingState label="Recomputing match score and skill deltas..." />
        ) : null}
        {state === 'error' ? (
          <FeedbackState
            variant="error"
            title="Analysis unavailable"
            message="Unable to fetch the latest analysis result. Retry once resume and job context are available."
            actions={<Button onClick={refreshAnalysis}>Retry</Button>}
          />
        ) : null}
        {state === 'empty' ? (
          <EmptyState
            title="No analysis generated yet"
            message="Upload a resume and add job context to generate the first structured report."
            action={<Button onClick={refreshAnalysis}>Generate Demo Analysis</Button>}
          />
        ) : null}
        {state === 'ready' ? (
          <FeedbackState
            variant="success"
            title="Latest analysis is ready"
            message="The summary below reflects your most recent resume and job-description context."
          />
        ) : null}

        {state === 'ready' ? (
          <Card title="Overall Match" eyebrow="AI Evaluation">
            <Progress label="Match Score" value={82} />
            <p className="muted">Strong backend alignment with some architecture depth gaps.</p>
          </Card>
        ) : null}

        {state === 'ready' ? (
          <section className="info-grid">
            <Card title="Matching Skills" eyebrow="Strengths">
              <div className="chip-row">
                <Chip>Node.js</Chip>
                <Chip>NestJS</Chip>
                <Chip>PostgreSQL</Chip>
                <Chip>REST APIs</Chip>
              </div>
            </Card>
            <Card title="Missing Skills" eyebrow="Gaps">
              <div className="chip-row">
                <Chip>Kafka</Chip>
                <Chip>Kubernetes</Chip>
                <Chip>Distributed Tracing</Chip>
              </div>
            </Card>
            <Card title="Recommendations" eyebrow="Action Plan">
              <ul className="metric-list">
                <li>
                  <span>Prepare scalable eventing narrative</span>
                  <strong>High</strong>
                </li>
                <li>
                  <span>Add one deep-dive system design project</span>
                  <strong>Medium</strong>
                </li>
                <li>
                  <span>Practice reliability-focused answers</span>
                  <strong>Medium</strong>
                </li>
              </ul>
            </Card>
          </section>
        ) : null}
      </section>
    </AppShell>
  );
}
