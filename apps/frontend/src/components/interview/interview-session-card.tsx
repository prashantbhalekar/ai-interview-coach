import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { StatusBadge } from '@/components/ui/status-badge';
import type { InterviewSessionSummary } from '@/lib/contracts';
import { routes } from '@/lib/routes';

interface InterviewSessionCardProps {
  session: InterviewSessionSummary;
}

export function InterviewSessionCard({ session }: InterviewSessionCardProps) {
  const isCompleted = session.status === 'COMPLETED';
  const total = Math.max(1, session.questionCount);
  const progress = Math.max(0, Math.min(100, Math.round((session.answeredCount / total) * 100)));

  return (
    <Card className="interview-session-card" interactive>
      <div className="interview-session-head">
        <div>
          <h3>{session.title}</h3>
          <p className="muted">{new Date(session.updatedAt).toLocaleDateString()}</p>
        </div>
        <StatusBadge
          label={isCompleted ? 'Completed' : 'In Progress'}
          tone={isCompleted ? 'success' : 'info'}
        />
      </div>

      {isCompleted ? (
        <div className="interview-score-row">
          <p className="muted">Score</p>
          <strong>
            {typeof session.overallScore === 'number' ? `${session.overallScore}%` : '--'}
          </strong>
        </div>
      ) : (
        <Progress label="Session completion" value={progress} compact />
      )}

      <p className="muted">
        {session.answeredCount} of {session.questionCount} questions answered
      </p>

      <div className="hero-actions">
        <Link
          className="btn btn-secondary"
          href={isCompleted ? routes.results(session.id) : routes.interview(session.id)}
        >
          {isCompleted ? 'View Results' : 'Continue Interview'}
        </Link>
        <Link className="btn btn-ghost" href={routes.interview(session.id)}>
          Review Answers
        </Link>
      </div>
    </Card>
  );
}
