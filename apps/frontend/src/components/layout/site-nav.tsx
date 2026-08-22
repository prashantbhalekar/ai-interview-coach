import Link from 'next/link';
import { routes } from '@/lib/routes';

const navItems = [
  { href: routes.coach, label: 'Interview Coach' },
  { href: routes.resume, label: 'Resume' },
  { href: routes.analysis, label: 'Analysis' },
  { href: routes.interviews, label: 'Interviews' },
];

export function SiteNav() {
  return (
    <header className="site-nav-wrap">
      <nav className="site-nav container glass">
        <Link href={routes.home} className="brand" aria-label="Go to Engineering Lab home">
          PB
        </Link>
        <div className="nav-links">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="nav-link">
              {item.label}
            </Link>
          ))}
        </div>
        <div className="nav-actions">
          <Link href={routes.login} className="nav-link quiet-link">
            Log in
          </Link>
          <Link href={routes.register} className="btn btn-primary nav-cta">
            Get Started
          </Link>
        </div>
      </nav>
    </header>
  );
}
