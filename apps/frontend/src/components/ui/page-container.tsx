import type { ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export function PageContainer({ children, className = '' }: PageContainerProps) {
  return (
    <section className={['page-container', className].filter(Boolean).join(' ')}>
      {children}
    </section>
  );
}
