import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  message: string;
  action?: ReactNode;
  variant?: 'default' | 'subtle';
}

export function EmptyState({ title, message, action, variant = 'default' }: EmptyStateProps) {
  return (
    <div
      className={['empty-state', variant === 'subtle' ? 'empty-state-subtle' : '']
        .filter(Boolean)
        .join(' ')}
      role="status"
      aria-live="polite"
    >
      <h4>{title}</h4>
      <p>{message}</p>
      {action ? <div className="empty-action">{action}</div> : null}
    </div>
  );
}
