import { AppShell } from '@/components/layout/app-shell';
import { HeroSection } from '@/components/sections/hero';
import { CoachOverview } from '@/components/sections/coach-overview';
import { Card } from '@/components/ui/card';

export default function InterviewCoachPage() {
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
      </section>
    </AppShell>
  );
}
