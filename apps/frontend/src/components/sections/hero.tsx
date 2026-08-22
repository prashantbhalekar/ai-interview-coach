import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { routes } from '@/lib/routes';

export function HeroSection() {
  return (
    <section className="hero grid-surface">
      <div className="hero-content">
        <p className="eyebrow">Engineering Lab</p>
        <h1>
          AI Interview Coach with{' '}
          <span className="text-gradient">Production-Ready Foundations</span>
        </h1>
        <p className="lead">
          Prepare with resume-aware interviews, structured AI feedback, and measurable skill
          improvement loops.
        </p>
        <div className="hero-actions">
          <Link href={routes.interview('demo')}>
            <Button>Start Interview</Button>
          </Link>
          <Link href={routes.resume}>
            <Button variant="secondary">Analyze Resume</Button>
          </Link>
        </div>
        <div className="chip-row">
          <Chip>Gemini Structured Output</Chip>
          <Chip>Async Resume Processing</Chip>
          <Chip>RAG-Ready Architecture</Chip>
        </div>
      </div>
      <Card title="Live Preview" eyebrow="Current Focus" className="hero-panel">
        <ul className="metric-list">
          <li>
            <span>Interview Readiness</span>
            <strong>82%</strong>
          </li>
          <li>
            <span>Coverage Gaps</span>
            <strong>4 skills</strong>
          </li>
          <li>
            <span>Recent Practice</span>
            <strong>6 sessions</strong>
          </li>
        </ul>
      </Card>
    </section>
  );
}
