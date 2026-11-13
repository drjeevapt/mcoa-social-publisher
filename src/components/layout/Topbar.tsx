'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, PlusCircle, Clock, ShieldAlert } from 'lucide-react';
import { Button } from '../ui/Button';
import { formatInKolkata } from '@/lib/date-utils';

interface TopbarProps {
  onOpenMobileMenu?: () => void;
  title?: string;
}

export const Topbar: React.FC<TopbarProps> = ({ onOpenMobileMenu, title }) => {
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      setCurrentTimeStr(formatInKolkata(new Date(), 'hh:mm:ss a'));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 border-b border-border bg-surface/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-surface-hover"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        {title && <h1 className="text-lg font-semibold text-white tracking-tight">{title}</h1>}
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Asia/Kolkata Timezone Badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-card border border-border text-xs text-zinc-300">
          <Clock className="w-3.5 h-3.5 text-gold-400" />
          <span className="font-mono text-zinc-200">{currentTimeStr || 'Loading IST...'}</span>
          <span className="text-[10px] text-zinc-500 font-semibold uppercase">Asia/Kolkata</span>
        </div>

        {/* Diagnostics link */}
        <Link
          href="/settings#diagnostics"
          className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-400 hover:text-gold-300 transition-colors"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-gold-400/80" />
          <span>API Status</span>
        </Link>

        {/* Quick Post Button */}
        <Link href="/create-post">
          <Button size="sm" variant="primary" leftIcon={<PlusCircle className="w-4 h-4" />}>
            Create Post
          </Button>
        </Link>
      </div>
    </header>
  );
};
