'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  LayoutDashboard,
  Users,
  LogOut,
  Menu,
  X,
  Stethoscope,
  ScrollText,
} from 'lucide-react';
import LanguageSwitcher from '@/components/LanguageSwitcher';

interface NavItem {
  labelKey: string;
  href: string;
  icon: React.ReactNode;
  admin?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { labelKey: 'dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { labelKey: 'patients', href: '/patients', icon: <Users className="w-5 h-5" /> },
  { labelKey: 'dentists', href: '/dentists', icon: <Stethoscope className="w-5 h-5" />, admin: true },
  { labelKey: 'logs', href: '/logs', icon: <ScrollText className="w-5 h-5" />, admin: true },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations('nav');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserName(user.user_metadata?.name || user.email?.split('@')[0] || tCommon('dentist'));
        // Admin detection: check user_metadata or known admin emails
        const adminEmails = ['admin@dp4.com', 'admin@admin.com', 'admin@sibx.com.br'];
        setIsAdmin(user.user_metadata?.role === 'admin' || adminEmails.includes(user.email || ''));
      }
    });
  }, []);

  const handleLogout = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }, [router]);

  const handleNav = useCallback(
    (href: string) => {
      router.push(href);
      setMobileOpen(false);
    },
    [router]
  );

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/[0.06]">
        <h1 className="text-xl font-bold text-foreground">{t('appTitle')}</h1>
        <p className="text-sm text-foreground/60 mt-0.5">{t('appSubtitle')}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.filter((item) => !item.admin).map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <button
              key={item.href}
              onClick={() => handleNav(item.href)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                transition-colors duration-200
                ${
                  isActive
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'text-muted-foreground/80 hover:text-foreground hover:bg-white/[0.04]'
                }
              `}
            >
              {item.icon}
              {t(item.labelKey)}
            </button>
          );
        })}

        {/* Admin section */}
        <div className="mt-4 pt-4 border-t border-white/[0.06]">
          <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-foreground/40">
            Admin
          </p>
          {NAV_ITEMS.filter((item) => item.admin && isAdmin).map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <button
                key={item.href}
                onClick={() => handleNav(item.href)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-colors duration-200
                  ${
                    isActive
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'text-muted-foreground/80 hover:text-foreground hover:bg-white/[0.04]'
                  }
                `}
              >
                {item.icon}
                {t(item.labelKey)}
              </button>
            );
          })}
        </div>
      </nav>

      {/* User + Logout */}
      <div className="px-3 py-4 border-t border-white/[0.06] space-y-2">
        <div className="px-3 py-2">
          <LanguageSwitcher />
        </div>
        <div className="px-3 py-2">
          <p className="text-sm font-medium text-foreground truncate">{userName}</p>
          <p className="text-sm text-foreground/50">{tCommon('dentist')}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground/90 hover:text-red-400 hover:bg-red-500/5 transition-colors duration-200"
        >
          <LogOut className="w-4 h-4" />
          {tCommon('logout')}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#07070C] overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-[240px] md:flex-shrink-0 border-r border-white/[0.06] bg-[#0A0A10]">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-[260px] h-full bg-[#0A0A10] border-r border-white/[0.06]">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground/90 hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar (mobile) */}
        <header className="md:hidden flex items-center justify-between px-4 h-14 border-b border-white/[0.06] bg-[#0A0A10]">
          <button onClick={() => setMobileOpen(true)}>
            <Menu className="w-5 h-5 text-muted-foreground/80" />
          </button>
          <h1 className="text-sm font-bold text-foreground">DP4</h1>
          <div className="w-5" />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <div className="bg-grid min-h-full relative">
            <div className="absolute inset-0 bg-radial-glow pointer-events-none opacity-30" />
            <div className="relative z-10 p-6 md:p-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
