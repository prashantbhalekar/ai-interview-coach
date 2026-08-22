import { AppShell } from '@/components/layout/app-shell';
import { CoachOverview } from '@/components/sections/coach-overview';
import { Card } from '@/components/ui/card';

export default function DashboardPage() {
  return (
    <AppShell>
      <section className="stack">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Track readiness, recent analyses, and interview momentum.</p>
        </div>
        <CoachOverview />
        <section className="info-grid">
          <Card title="Quick Actions" eyebrow="Next Steps">
            <ul className="metric-list">
              <li>
                <span>Analyze a new resume revision</span>
                <strong>Now</strong>
              </li>
              <li>
                <span>Schedule mock backend round</span>
                <strong>Today</strong>
              </li>
              <li>
                <span>Review improvement suggestions</span>
                <strong>5 min</strong>
              </li>
            </ul>
          </Card>
          <Card title="Recent Analysis" eyebrow="Snapshot">
            <p className="muted">Match score improved from 74% to 82% in the latest update.</p>
          </Card>
        </section>
      </section>
    </AppShell>
  );
}
