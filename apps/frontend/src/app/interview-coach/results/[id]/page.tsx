import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface ResultsPageProps {
  params: Promise<{ id: string }>;
}

export default async function ResultsPage({ params }: ResultsPageProps) {
  const { id } = await params;

  return (
    <AppShell>
      <section className="stack">
        <div>
          <h1 className="page-title">Interview Results</h1>
          <p className="page-subtitle">Session ID: {id}</p>
        </div>
        <Card title="Overall Score" eyebrow="Summary">
          <Progress label="Interview Performance" value={76} />
        </Card>
        <section className="info-grid">
          <Card title="Strengths" eyebrow="Evaluation">
            <ul className="metric-list">
              <li>
                <span>Clear API design communication</span>
                <strong>Strong</strong>
              </li>
              <li>
                <span>Good trade-off explanation</span>
                <strong>Strong</strong>
              </li>
            </ul>
          </Card>
          <Card title="Improvements" eyebrow="Evaluation">
            <ul className="metric-list">
              <li>
                <span>Expand failure handling depth</span>
                <strong>High</strong>
              </li>
              <li>
                <span>Add concrete scaling limits</span>
                <strong>Medium</strong>
              </li>
            </ul>
          </Card>
        </section>
      </section>
    </AppShell>
  );
}
