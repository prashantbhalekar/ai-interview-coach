import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AppShell } from '@/components/layout/app-shell';
import { routes } from '@/lib/routes';

export default function EngineeringLabPage() {
  return (
    <AppShell>
      <section className="hero grid-surface">
        <div className="hero-content">
          <p className="eyebrow">Prashant Bhalekar</p>
          <h1 className="page-title">
            Engineering Lab for <span className="text-gradient">AI Product Experiments</span>
          </h1>
          <p className="lead">
            A curated space for production-focused software projects. Start with Interview Coach and
            expand with future lab products under dedicated paths.
          </p>
          <div className="hero-actions">
            <Link href={routes.coach}>
              <Button>Open Interview Coach</Button>
            </Link>
            <Link href={routes.analysis}>
              <Button variant="secondary">View Resume Analysis</Button>
            </Link>
          </div>
        </div>
        <Card title="Current Featured Project" eyebrow="Live">
          <p className="muted">AI Interview Coach</p>
          <p>Resume-aware practice interviews with structured AI feedback.</p>
          <Link href={routes.coach}>
            <Button variant="secondary" block>
              Visit /interview-coach
            </Button>
          </Link>
        </Card>
      </section>
    </AppShell>
  );
}
