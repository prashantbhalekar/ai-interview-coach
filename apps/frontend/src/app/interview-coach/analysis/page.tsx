import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Progress } from '@/components/ui/progress';

export default function AnalysisPage() {
  return (
    <AppShell>
      <section className="stack">
        <div>
          <h1 className="page-title">Resume Analysis</h1>
          <p className="page-subtitle">
            Structured insights generated from resume and job description.
          </p>
        </div>
        <Card title="Overall Match" eyebrow="AI Evaluation">
          <Progress label="Match Score" value={82} />
          <p className="muted">Strong backend alignment with some architecture depth gaps.</p>
        </Card>
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
      </section>
    </AppShell>
  );
}
