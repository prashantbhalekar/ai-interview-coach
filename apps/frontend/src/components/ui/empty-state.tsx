import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  message: string;
  action?: ReactNode;
}

export function EmptyState({ title, message, action }: EmptyStateProps) {
  return (
    <div className="empty-state" role="status" aria-live="polite">
      <h4>{title}</h4>
      <p>{message}</p>
      {action ? <div className="empty-action">{action}</div> : null}
    </div>
  );
}
