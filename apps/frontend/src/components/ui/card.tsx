import type { ReactNode } from 'react';

interface CardProps {
  title?: string;
  eyebrow?: string;
  children: ReactNode;
  className?: string;
}

export function Card({ title, eyebrow, children, className = '' }: CardProps) {
  return (
    <section className={['card glass glow-border', className].filter(Boolean).join(' ')}>
      {(eyebrow || title) && (
        <header className="card-header">
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          {title ? <h3>{title}</h3> : null}
        </header>
      )}
      <div className="card-body">{children}</div>
    </section>
  );
}
