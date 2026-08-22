import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export function CoachOverview() {
  return (
    <section className="section-grid section-3">
      <Card title="Resume Status" eyebrow="Dashboard">
        <p className="muted">Latest resume is parsed and ready for skill match analysis.</p>
        <Progress label="Profile completeness" value={78} />
      </Card>
      <Card title="Interview History" eyebrow="Dashboard">
        <p className="muted">Last session: Backend Architecture Round</p>
        <Progress label="Average score" value={74} />
      </Card>
      <Card title="Skill Insights" eyebrow="Dashboard">
        <p className="muted">Strong in Node.js and API design. Work on cache strategy depth.</p>
        <Progress label="Confidence trend" value={69} />
      </Card>
    </section>
  );
}
