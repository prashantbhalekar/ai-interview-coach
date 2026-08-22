import type { ReactNode } from 'react';

type FeedbackVariant = 'info' | 'success' | 'error';

interface FeedbackStateProps {
  variant?: FeedbackVariant;
  title: string;
  message: string;
  actions?: ReactNode;
}

export function FeedbackState({ variant = 'info', title, message, actions }: FeedbackStateProps) {
  return (
    <div className={`feedback feedback-${variant}`} role="status" aria-live="polite">
      <div className="feedback-copy">
        <h4>{title}</h4>
        <p>{message}</p>
      </div>
      {actions ? <div className="feedback-actions">{actions}</div> : null}
    </div>
  );
}
