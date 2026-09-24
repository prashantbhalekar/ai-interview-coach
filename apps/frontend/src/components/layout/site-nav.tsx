'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ApiClientError, apiRequest } from '@/lib/api-client';
import type { AuthUser } from '@/lib/contracts';
import {
  clearActiveUserId,
  clearResumeContextForToken,
  setActiveUserId,
} from '@/lib/resume-context';
import { routes } from '@/lib/routes';

const navItems = [
  { href: routes.coach, label: 'Interview Coach' },
  { href: routes.resume, label: 'Resume' },
  { href: routes.analysis, label: 'Analysis' },
  { href: routes.interviews, label: 'Interviews' },
];

export function SiteNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = useState<'loading' | 'guest' | 'authenticated'>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('aiic.accessToken');
    if (!token) {
      setStatus('guest');
      setUser(null);
      return;
    }

    const authToken: string = token;

    async function loadUser(): Promise<void> {
      try {
        const me = await apiRequest<AuthUser>('/users/me', {
          token: authToken,
        });
        setActiveUserId(me.id);
        setUser(me);
        setStatus('authenticated');
      } catch (error: unknown) {
        if (error instanceof ApiClientError && error.status === 401) {
          clearResumeContextForToken(authToken);
          clearActiveUserId();
          localStorage.removeItem('aiic.accessToken');
        }
        setStatus('guest');
        setUser(null);
      }
    }

    void loadUser();
  }, []);

  const initials = useMemo(() => {
    if (!user?.fullName) {
      return 'PB';
    }

    const words = user.fullName.trim().split(/\s+/).filter(Boolean);
    const first = words[0]?.[0] ?? '';
    const second = words.length > 1 ? (words[1]?.[0] ?? '') : '';
    return `${first}${second}`.toUpperCase() || 'PB';
  }, [user]);

  async function handleLogout(): Promise<void> {
    const token = localStorage.getItem('aiic.accessToken');

    if (token) {
      try {
        await apiRequest<{ success: boolean; message: string }>('/auth/logout', {
          method: 'POST',
          token,
        });
      } catch {
        // Logout is client-authoritative for JWT cleanup in this MVP.
      }

      clearResumeContextForToken(token);
    }

    clearActiveUserId();
    localStorage.removeItem('aiic.accessToken');
    setUser(null);
    setStatus('guest');
    router.push(routes.coach);
  }

  function isNavItemActive(href: string): boolean {
    if (href === routes.coach) {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <header className="site-nav-wrap">
      <nav className="site-nav container glass">
        <Link href={routes.home} className="brand" aria-label="Go to Engineering Lab home">
          {status === 'authenticated' ? initials : 'PB'}
        </Link>
        <div className="nav-links">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={['nav-link', isNavItemActive(item.href) ? 'nav-link-active' : '']
                .filter(Boolean)
                .join(' ')}
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div className="nav-actions">
          {status === 'authenticated' ? (
            <>
              <Link
                href={routes.dashboard}
                className={[
                  'nav-link quiet-link',
                  isNavItemActive(routes.dashboard) ? 'nav-link-active' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                Dashboard
              </Link>
              <button type="button" className="btn btn-secondary nav-cta" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href={routes.login} className="nav-link quiet-link">
                Log in
              </Link>
              <Link href={routes.register} className="btn btn-primary nav-cta">
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
