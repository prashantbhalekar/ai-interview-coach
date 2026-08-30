import { useState } from 'react';
import type { InterviewAnswer } from '@/lib/contracts';

interface QuestionReviewItemProps {
  answer: InterviewAnswer;
}

export function QuestionReviewItem({ answer }: QuestionReviewItemProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <article className="question-review-item">
      <button
        type="button"
        className="question-review-toggle"
        onClick={() => setExpanded((current) => !current)}
        aria-expanded={expanded}
      >
        <span className="question-review-index">Q{answer.order + 1}</span>
        <span className="question-review-title">{answer.questionText}</span>
        <strong className="question-review-score">{answer.score} / 100</strong>
      </button>

      {expanded ? (
        <div className="question-review-body">
          <p>
            <strong>Your Answer</strong>
          </p>
          <p className="muted">{answer.answerText}</p>

          {answer.feedbackSummary ? (
            <>
              <p>
                <strong>Feedback</strong>
              </p>
              <p className="muted">{answer.feedbackSummary}</p>
            </>
          ) : null}

          {answer.followUpQuestion ? (
            <>
              <p>
                <strong>Suggested Improvement</strong>
              </p>
              <p className="muted">{answer.followUpQuestion}</p>
            </>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
