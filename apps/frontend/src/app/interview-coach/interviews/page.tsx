import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { routes } from '@/lib/routes';

const sessions = [
  { id: 'session-001', title: 'Backend Round - API Design' },
  { id: 'session-002', title: 'System Design - Scalable Queueing' },
];

export default function InterviewsPage() {
  return (
    <AppShell>
      <section className="stack">
        <div>
          <h1 className="page-title">Interview Sessions</h1>
          <p className="page-subtitle">Review and continue active interview practice sessions.</p>
        </div>
        <section className="section-grid">
          {sessions.map((session) => (
            <Card key={session.id} title={session.title} eyebrow={session.id}>
              <Link className="nav-link" href={routes.interview(session.id)}>
                Open session
              </Link>
            </Card>
          ))}
        </section>
      </section>
    </AppShell>
  );
}
