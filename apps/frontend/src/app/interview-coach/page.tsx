'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { HeroSection } from '@/components/sections/hero';
import { CoachOverview } from '@/components/sections/coach-overview';
import { Card } from '@/components/ui/card';
import { FeedbackState } from '@/components/ui/feedback-state';
import { apiRequest, ApiClientError } from '@/lib/api-client';
import type { HealthResponse } from '@/lib/contracts';

export default function InterviewCoachPage() {
  const [healthStatus, setHealthStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [healthMessage, setHealthMessage] = useState('Checking backend connectivity...');

  useEffect(() => {
    const controller = new AbortController();

    async function loadHealth(): Promise<void> {
      try {
        const response = await apiRequest<HealthResponse>('/health', {
          headers: {
            'X-Request-Source': 'frontend-shell',
          },
        });

        if (controller.signal.aborted) {
          return;
        }

        setHealthStatus(response.status === 'ok' ? 'ok' : 'error');
        setHealthMessage(
          response.status === 'ok'
            ? `Backend ready (${response.service})`
            : 'Backend responded but reported non-ok status',
        );
      } catch (error: unknown) {
        if (controller.signal.aborted) {
          return;
        }

        setHealthStatus('error');
        if (error instanceof ApiClientError) {
          setHealthMessage(error.message);
        } else {
          setHealthMessage('Backend is currently unavailable');
        }
      }
    }

    void loadHealth();

    return () => {
      controller.abort();
    };
  }, []);

  return (
    <AppShell>
      <HeroSection />
      <CoachOverview />
      <section className="info-grid">
        <Card title="Resume Analysis" eyebrow="Primary UX">
          <p className="muted">
            Upload resume, attach job description, and generate strengths, missing skills, and
            recommendations in a single guided workflow.
          </p>
        </Card>
        <Card title="Interview Loop" eyebrow="Primary UX">
          <p className="muted">
            Configure interview focus, answer generated questions, and receive structured
            evaluations with actionable follow-up prompts.
          </p>
        </Card>
        <Card title="Backend Connection" eyebrow="Integration Status">
          {healthStatus === 'loading' ? (
            <FeedbackState variant="info" title="Connecting" message={healthMessage} />
          ) : null}
          {healthStatus === 'ok' ? (
            <FeedbackState variant="success" title="Connected" message={healthMessage} />
          ) : null}
          {healthStatus === 'error' ? (
            <FeedbackState
              variant="error"
              title="Connection issue"
              message={`${healthMessage}. Ensure backend is running on /api/v1.`}
            />
          ) : null}
        </Card>
      </section>
    </AppShell>
  );
}
