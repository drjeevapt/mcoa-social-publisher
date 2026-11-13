'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  PlusCircle,
  Calendar,
  History,
  Share2,
  Settings,
  GraduationCap,
  Globe2,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const pathname = usePathname();

  const navItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Create Post',
      href: '/create-post',
      icon: PlusCircle,
    },
    {
      name: 'Content Calendar',
      href: '/calendar',
      icon: Calendar,
    },
    {
      name: 'Publishing History',
      href: '/history',
      icon: History,
    },
    {
      name: 'Connected Accounts',
      href: '/accounts',
      icon: Share2,
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
    },
  ];

  return (
    <aside className="w-64 h-full bg-surface border-r border-border flex flex-col justify-between text-zinc-300">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-border/70 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-300 to-gold-600 flex items-center justify-center text-black font-bold shadow-md shadow-gold-500/10">
            <GraduationCap className="w-6 h-6 text-black" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white text-base tracking-tight">MCOA</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-gold-400/20 text-gold-300 font-semibold border border-gold-400/30">
                PRO
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-medium">Social Publisher</p>
          </div>
        </div>

        {/* Current Workspace Pill */}
        <div className="mx-4 my-4 p-2.5 rounded-lg bg-surface-card border border-border text-xs">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="font-semibold text-zinc-300">Workspace</span>
            <span className="flex items-center gap-1 text-[10px] text-gold-400">
              <ShieldCheck className="w-3 h-3" /> MCOA Academy
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-400">
            <Globe2 className="w-3 h-3 text-zinc-500" />
            <span className="truncate">Asia/Kolkata (IST)</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-gold-400/15 text-gold-300 border border-gold-400/30 font-semibold'
                    : 'text-zinc-400 hover:text-white hover:bg-surface-hover'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-gold-400' : 'text-zinc-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / Academy Reference */}
      <div className="p-4 border-t border-border/70 space-y-3">
        <div className="text-[11px] text-zinc-500 leading-relaxed">
          <p className="font-semibold text-zinc-400">Medical Coding Officers Academy</p>
          <p>Official Multi-Channel Publishing Engine</p>
        </div>
        <a
          href="https://medicalcodingofficers.com"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between text-xs text-gold-400/80 hover:text-gold-300 transition-colors"
        >
          <span>Academy Portal</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </aside>
  );
};
