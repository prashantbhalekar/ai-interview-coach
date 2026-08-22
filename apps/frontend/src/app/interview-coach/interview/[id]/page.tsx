import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface InterviewPageProps {
  params: Promise<{ id: string }>;
}

export default async function InterviewSessionPage({ params }: InterviewPageProps) {
  const { id } = await params;

  return (
    <AppShell>
      <section className="stack">
        <div>
          <h1 className="page-title">Interview Session</h1>
          <p className="page-subtitle">Session ID: {id}</p>
        </div>
        <Card title="Question" eyebrow="Current Prompt">
          <p>
            Explain how you would design a resilient asynchronous resume processing pipeline with
            retries, idempotency, and observability.
          </p>
        </Card>
        <Card title="Your Answer" eyebrow="Response">
          <form className="form-grid">
            <textarea className="textarea" placeholder="Type your answer here..." />
            <div className="hero-actions">
              <Button type="submit">Submit Answer</Button>
              <Button type="button" variant="secondary">
                Next Question
              </Button>
            </div>
          </form>
        </Card>
      </section>
    </AppShell>
  );
}
