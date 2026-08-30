import { Progress } from '@/components/ui/progress';

interface InterviewProgressProps {
  title: string;
  answeredCount: number;
  questionCount: number;
  subtitle?: string;
}

export function InterviewProgress({
  title,
  answeredCount,
  questionCount,
  subtitle,
}: InterviewProgressProps) {
  const safeTotal = Math.max(1, questionCount);
  const progress = Math.max(0, Math.min(100, Math.round((answeredCount / safeTotal) * 100)));
  const currentQuestion = Math.min(questionCount, answeredCount + 1);

  return (
    <section className="interview-progress-head" aria-label="Interview progress">
      <div>
        <h1 className="page-title">{title}</h1>
        <p className="page-subtitle">
          {questionCount > 0
            ? `Question ${currentQuestion} of ${questionCount}`
            : 'Interview questions are being prepared'}
        </p>
        {subtitle ? <p className="muted">{subtitle}</p> : null}
      </div>
      <div className="interview-progress-bar">
        <Progress label="Interview progress" value={progress} compact />
        <p className="muted">{progress}% complete</p>
      </div>
    </section>
  );
}
