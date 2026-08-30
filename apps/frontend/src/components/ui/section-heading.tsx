import type { ReactNode } from 'react';

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  action?: ReactNode;
  className?: string;
}

export function SectionHeading({
  title,
  subtitle,
  eyebrow,
  action,
  className = '',
}: SectionHeadingProps) {
  return (
    <header className={['section-heading', className].filter(Boolean).join(' ')}>
      <div className="section-heading-copy">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2>{title}</h2>
        {subtitle ? <p className="section-subtitle">{subtitle}</p> : null}
      </div>
      {action ? <div className="section-heading-action">{action}</div> : null}
    </header>
  );
}
