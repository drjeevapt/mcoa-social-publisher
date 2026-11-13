'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Facebook,
  Instagram,
  MapPin,
  Calendar as CalendarIcon,
  Clock,
  X,
  ExternalLink,
} from 'lucide-react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
} from 'date-fns';
import { formatInKolkata, toKolkataTime } from '@/lib/date-utils';

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);

  useEffect(() => {
    async function fetchPosts() {
      try {
        setLoading(true);
        const res = await fetch('/api/posts');
        const data = await res.json();
        setPosts(data.posts || []);
      } catch (err) {
        console.error('Failed to load posts for calendar:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, []);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());

  // Generate calendar days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const getPostsForDay = (day: Date) => {
    return posts.filter((post) => {
      const dateToCompare = post.scheduled_at || post.published_at || post.created_at;
      if (!dateToCompare) return false;
      const postZonedDate = toKolkataTime(dateToCompare);
      return isSameDay(day, postZonedDate);
    });
  };

  const platformIcons: Record<string, React.ReactNode> = {
    facebook: <Facebook className="w-3 h-3 text-blue-400" />,
    instagram: <Instagram className="w-3 h-3 text-pink-400" />,
    google_business: <MapPin className="w-3 h-3 text-emerald-400" />,
  };

  return (
    <AppShell title="Academy Content Calendar">
      {/* Calendar Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gold-400/10 text-gold-400 border border-gold-400/20">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-gold-300/80">
              <Clock className="w-3 h-3" />
              <span>Asia/Kolkata Time (IST, UTC+05:30)</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-surface border border-border rounded-lg p-1">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-surface-hover"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={goToToday}
              className="px-3 py-1 text-xs font-semibold text-zinc-300 hover:text-white"
            >
              Today
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-surface-hover"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <Link href="/create-post">
            <Button size="sm" variant="primary" leftIcon={<PlusCircle className="w-4 h-4" />}>
              Schedule Post
            </Button>
          </Link>
        </div>
      </div>

      {/* Weekday Header */}
      <div className="grid grid-cols-7 gap-px bg-border rounded-t-xl overflow-hidden text-center text-xs font-semibold text-zinc-400 py-2.5 bg-surface-card border border-border">
        <span>Mon</span>
        <span>Tue</span>
        <span>Wed</span>
        <span>Thu</span>
        <span>Fri</span>
        <span>Sat</span>
        <span>Sun</span>
      </div>

      {/* Monthly Grid */}
      <div className="grid grid-cols-7 gap-px bg-border border border-border rounded-b-xl overflow-hidden">
        {days.map((day, idx) => {
          const dayPosts = getPostsForDay(day);
          const isCurrentMonthDay = isSameMonth(day, currentMonth);
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={idx}
              className={`min-h-[110px] sm:min-h-[130px] p-2 flex flex-col justify-between transition-colors ${
                isCurrentMonthDay ? 'bg-surface-card' : 'bg-surface/50 opacity-40'
              } ${isToday ? 'ring-1 ring-gold-400/50 bg-gold-400/5' : ''}`}
            >
              {/* Day Number Header */}
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-mono font-medium rounded-full w-6 h-6 flex items-center justify-center ${
                    isToday
                      ? 'bg-gold-400 text-black font-bold'
                      : 'text-zinc-400'
                  }`}
                >
                  {format(day, 'd')}
                </span>

                {dayPosts.length > 0 && (
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {dayPosts.length} post{dayPosts.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {/* Day Posts List */}
              <div className="space-y-1.5 mt-2 flex-1 overflow-y-auto max-h-24">
                {dayPosts.map((post) => {
                  const isScheduled = post.status === 'scheduled';
                  const isPublished = post.status === 'published';
                  const isFailed = post.status === 'failed';

                  return (
                    <div
                      key={post.id}
                      onClick={() => setSelectedPost(post)}
                      className={`p-1.5 rounded-lg border text-left cursor-pointer transition-transform hover:scale-[1.02] flex items-center gap-1.5 ${
                        isScheduled
                          ? 'bg-sky-950/40 border-sky-800/50 text-sky-200'
                          : isPublished
                          ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-200'
                          : isFailed
                          ? 'bg-rose-950/40 border-rose-800/50 text-rose-200'
                          : 'bg-zinc-800/60 border-zinc-700 text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center gap-1 shrink-0">
                        {post.post_destinations?.slice(0, 2).map((d: any) => (
                          <span key={d.id} title={d.platform}>
                            {platformIcons[d.platform]}
                          </span>
                        ))}
                      </div>
                      <span className="text-[11px] truncate font-medium flex-1">
                        {post.base_caption}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Post Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs uppercase font-bold text-gold-400">
                  {selectedPost.status}
                </span>
                <h3 className="text-base font-semibold text-white mt-1">Post Details</h3>
                <p className="text-xs text-zinc-400">
                  {formatInKolkata(selectedPost.scheduled_at || selectedPost.published_at || selectedPost.created_at)}
                </p>
              </div>
              <button
                onClick={() => setSelectedPost(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-surface-card"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedPost.media_url && (
              <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-border">
                <img
                  src={selectedPost.media_url}
                  alt="Post creative"
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            <div className="p-3 bg-surface-card rounded-xl border border-border text-xs text-zinc-200 whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">
              {selectedPost.base_caption}
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Destinations
              </h4>
              <div className="space-y-1.5">
                {(selectedPost.post_destinations || []).map((d: any) => (
                  <div
                    key={d.id}
                    className="p-2.5 rounded-lg bg-surface-card border border-border flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      {platformIcons[d.platform]}
                      <span className="font-medium text-white capitalize">{d.platform}</span>
                    </div>
                    <Badge
                      variant={
                        d.status === 'published'
                          ? 'green'
                          : d.status === 'scheduled'
                          ? 'blue'
                          : d.status === 'failed'
                          ? 'red'
                          : 'zinc'
                      }
                      dot
                    >
                      {d.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button size="sm" variant="secondary" onClick={() => setSelectedPost(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
