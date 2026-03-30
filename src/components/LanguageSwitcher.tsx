'use client';

import { useState, useRef, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { locales, localeNames, localeFlags, type Locale } from '@/i18n/config';

export default function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSelect = (newLocale: Locale) => {
    if (newLocale === locale) {
      setOpen(false);
      return;
    }
    // Set cookie so next-intl remembers the choice on future visits
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000;SameSite=Lax`;
    // Navigate to same page in new locale (client-side, no full reload)
    router.replace(pathname, { locale: newLocale });
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="
          flex items-center gap-2 px-3 py-1.5 rounded-lg
          bg-white/[0.03] border border-amber-500/15
          backdrop-blur-sm
          text-sm text-foreground/80
          hover:bg-white/[0.06] hover:border-amber-500/30
          transition-colors duration-200
          focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40
        "
      >
        <span className="text-base leading-none">{localeFlags[locale]}</span>
        <span className="text-xs font-medium uppercase">{locale}</span>
      </button>

      {open && (
        <div className="
          absolute right-0 mt-2 z-50
          min-w-[180px] rounded-xl
          bg-[#0E0E14]/95 backdrop-blur-lg
          border border-amber-500/15
          shadow-[0_8px_32px_rgba(0,0,0,0.5)]
          overflow-hidden
        ">
          {locales.map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => handleSelect(loc)}
              className={`
                w-full flex items-center gap-3 px-4 py-2.5 text-sm
                transition-colors duration-150
                ${
                  loc === locale
                    ? 'bg-amber-500/10 text-amber-400'
                    : 'text-foreground/80 hover:bg-white/[0.04] hover:text-foreground'
                }
              `}
            >
              <span className="text-base leading-none">{localeFlags[loc]}</span>
              <span className="font-medium">{localeNames[loc]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
