'use client';

import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageContainer } from '@/components/ui/page-container';
import { SectionHeading } from '@/components/ui/section-heading';
import { routes } from '@/lib/routes';

const features = [
  {
    title: 'Resume Analysis',
    description: 'Identify strengths, missing skills and job-match gaps.',
    icon: <FeatureSparkIcon />,
  },
  {
    title: 'Tailored Questions',
    description: 'Generate interview questions based on your resume and target role.',
    icon: <FeatureQuestionIcon />,
  },
  {
    title: 'AI Feedback',
    description: 'Get structured feedback on technical depth, clarity and communication.',
    icon: <FeatureInsightIcon />,
  },
  {
    title: 'Progress Tracking',
    description: 'Track scores, improvement areas and interview history.',
    icon: <FeatureTrackIcon />,
  },
] as const;

const workflowSteps = [
  {
    title: 'Upload Resume',
    detail: 'Add your resume so the coach can understand your baseline profile.',
  },
  {
    title: 'Add Job Description',
    detail: 'Paste the target role to compare expectations against your experience.',
  },
  {
    title: 'Practice Interview',
    detail: 'Answer tailored questions that reflect your stack and target role.',
  },
  {
    title: 'Review Feedback',
    detail: 'Use structured scoring and suggestions to improve your next round.',
  },
] as const;

export default function InterviewCoachPage() {
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    setAuthenticated(Boolean(localStorage.getItem('aiic.accessToken')));
  }, []);

  function handleScrollToHowItWorks(event: React.MouseEvent<HTMLAnchorElement>): void {
    event.preventDefault();

    const target = document.getElementById('how-it-works');
    if (!target) {
      return;
    }

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const navOffset = 104;
    const targetTop = window.scrollY + target.getBoundingClientRect().top - navOffset;

    window.scrollTo({
      top: Math.max(0, targetTop),
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
  }

  return (
    <AppShell>
      <PageContainer>
        <section className="landing-hero">
          <div className="landing-hero-copy">
            <p className="eyebrow">AI Interview Coach</p>
            <h1 className="landing-headline">
              Practice Smarter. Interview Better. <span className="text-gradient">Get Hired.</span>
            </h1>
            <p className="landing-subtitle">
              Upload your resume, match it against a job description, practice tailored interview
              questions, and get structured AI feedback.
            </p>
            <div className="hero-actions">
              <Link href={authenticated ? routes.resume : routes.register}>
                <Button>Start with Your Resume</Button>
              </Link>
              <Link href="#how-it-works" onClick={handleScrollToHowItWorks}>
                <Button variant="secondary">See How It Works</Button>
              </Link>
            </div>
          </div>

          <Card title="Product Preview" eyebrow="What You Will Get" className="landing-preview">
            <div className="preview-score">
              <div className="preview-ring" aria-hidden="true">
                <span>82%</span>
              </div>
              <div className="preview-label">
                <h3>Resume Match</h3>
                <p>Aligned with backend platform roles</p>
              </div>
            </div>

            <div className="sample-block">
              <strong>Strong Skills</strong>
              <ul className="sample-list">
                <li>Node.js</li>
                <li>NestJS</li>
                <li>PostgreSQL</li>
              </ul>
            </div>

            <div className="sample-block">
              <strong>Needs Improvement</strong>
              <ul className="sample-list">
                <li>System Design</li>
                <li>Kubernetes</li>
              </ul>
            </div>
          </Card>
        </section>

        <section className="stack">
          <SectionHeading
            title="Core Features"
            subtitle="Everything you need to run a focused interview preparation loop."
          />
          <div className="feature-grid">
            {features.map((feature) => (
              <Card key={feature.title} className="feature-card">
                <div className="feature-title">
                  <span className="icon-badge" aria-hidden="true">
                    {feature.icon}
                  </span>
                  <h3>{feature.title}</h3>
                </div>
                <p className="muted">{feature.description}</p>
              </Card>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="stack scroll-target">
          <SectionHeading
            title="How It Works"
            subtitle="From resume upload to iterative improvement in four clear steps."
          />
          <div className="step-grid">
            {workflowSteps.map((step, index) => (
              <article key={step.title} className="step-item">
                <span className="step-badge">{index + 1}</span>
                <h3>{step.title}</h3>
                <p className="muted">{step.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="stack">
          <SectionHeading
            title="Sample Feedback"
            subtitle="Structured output designed to be specific and immediately actionable."
          />
          <div className="sample-feedback-grid">
            <Card title="Question" eyebrow="Interview Feedback">
              <p>How would you design a scalable notification system?</p>
              <p className="muted">Score: 78/100</p>

              <div className="sample-block">
                <strong>Strengths</strong>
                <ul className="sample-list">
                  <li>Good understanding of queues</li>
                  <li>Mentioned retry handling</li>
                </ul>
              </div>

              <div className="sample-block">
                <strong>Improve</strong>
                <ul className="sample-list">
                  <li>Discuss idempotency</li>
                  <li>Explain horizontal scaling</li>
                </ul>
              </div>
            </Card>

            <Card title="Why It Helps" eyebrow="Clarity">
              <p className="muted">
                The feedback format keeps every response grounded in score, strengths, and next
                improvements so you can practice with clear direction.
              </p>
            </Card>
          </div>
        </section>

        <Card className="cta-card">
          <SectionHeading
            title="Ready to practice for your next interview?"
            className="section-heading-compact"
          />
          <div className="cta-actions">
            <Link href={routes.interviews}>
              <Button>Start Interview</Button>
            </Link>
            <Link href={routes.resume}>
              <Button variant="secondary">Analyze Resume</Button>
            </Link>
          </div>
        </Card>
      </PageContainer>
    </AppShell>
  );
}

function FeatureSparkIcon(): ReactNode {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2L14.7 9.3L22 12L14.7 14.7L12 22L9.3 14.7L2 12L9.3 9.3L12 2Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function FeatureQuestionIcon(): ReactNode {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9.1 9A2.9 2.9 0 1114.2 11C13 11.7 12 12.6 12 14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="12" cy="17.5" r="1" fill="currentColor" />
      <path
        d="M12 22C17.5 22 22 17.5 22 12S17.5 2 12 2 2 6.5 2 12s4.5 10 10 10Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function FeatureInsightIcon(): ReactNode {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2L4 6.5V12C4 17 7.4 21.4 12 22C16.6 21.4 20 17 20 12V6.5L12 2Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M9 12L11 14L15 10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FeatureTrackIcon(): ReactNode {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 19H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M7 15L10 11L13 13L17 8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="7" cy="15" r="1" fill="currentColor" />
      <circle cx="10" cy="11" r="1" fill="currentColor" />
      <circle cx="13" cy="13" r="1" fill="currentColor" />
      <circle cx="17" cy="8" r="1" fill="currentColor" />
    </svg>
  );
}
