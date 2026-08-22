import type { ReactNode } from 'react';
import { SiteNav } from './site-nav';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-bg">
      <SiteNav />
      <main className="container main-content">{children}</main>
    </div>
  );
}
