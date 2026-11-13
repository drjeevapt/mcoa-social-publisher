'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import {
  CalendarClock,
  CheckCircle2,
  AlertTriangle,
  Share2,
  PlusCircle,
  RotateCw,
  ArrowRight,
  Facebook,
  Instagram,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { formatInKolkata } from '@/lib/date-utils';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [retryLoadingId, setRetryLoadingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [postsRes, accRes] = await Promise.all([
        fetch('/api/posts').then((r) => r.json()),
        fetch('/api/accounts').then((r) => r.json()),
      ]);

      setPosts(postsRes.posts || []);
      setAccounts(accRes.accounts || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRetryPost = async (postId: string) => {
    try {
      setRetryLoadingId(postId);
      const res = await fetch(`/api/posts/${postId}/retry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage('Retry sequence triggered for failed destinations!');
        await fetchData();
      } else {
        alert(data.error || 'Retry failed');
      }
    } catch (e: any) {
      alert(e.message || 'Error triggering retry');
    } finally {
      setRetryLoadingId(null);
    }
  };

  // Metrics
  const scheduledPosts = posts.filter((p) => p.status === 'scheduled');
  const publishedPosts = posts.filter((p) => p.status === 'published' || p.status === 'partially_published');
  const failedPosts = posts.filter(
    (p) => p.status === 'failed' || (p.post_destinations && p.post_destinations.some((d: any) => d.status === 'failed'))
  );

  return (
    <AppShell title="Academy Social Dashboard">
      {actionMessage && (
        <Alert type="success" title="Action Completed">
          {actionMessage}
        </Alert>
      )}

      {/* Hero Welcome & Quick Action */}
      <div className="relative rounded-2xl bg-gradient-to-r from-surface via-surface-card to-zinc-900 border border-border p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden">
        <div className="relative z-10 max-w-xl space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-gold-400/10 text-gold-300 border border-gold-400/20 text-xs font-semibold">
            Medical Coding Officers Academy
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Multi-Network Social Publisher
          </h2>
          <p className="text-sm text-zinc-400">
            Publish or schedule updates seamlessly across Facebook Pages, Instagram Professional, and Google Business Profile in Asia/Kolkata time.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={fetchData}
            isLoading={loading}
            leftIcon={<RotateCw className="w-4 h-4" />}
          >
            Refresh
          </Button>
          <Link href="/create-post">
            <Button variant="primary" leftIcon={<PlusCircle className="w-4 h-4" />}>
              Create New Post
            </Button>
          </Link>
        </div>

        {/* Subtle decorative gold circle */}
        <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-gold-500/5 blur-3xl pointer-events-none" />
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card hoverEffect>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Scheduled Posts</span>
            <div className="p-2 rounded-lg bg-sky-950/60 text-sky-400 border border-sky-800/40">
              <CalendarClock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white">{scheduledPosts.length}</div>
            <p className="text-xs text-zinc-500 mt-0.5">Awaiting automated queue</p>
          </div>
        </Card>

        <Card hoverEffect>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Published Posts</span>
            <div className="p-2 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white">{publishedPosts.length}</div>
            <p className="text-xs text-zinc-500 mt-0.5">Live on social channels</p>
          </div>
        </Card>

        <Card hoverEffect>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Needs Attention</span>
            <div className="p-2 rounded-lg bg-rose-950/60 text-rose-400 border border-rose-800/40">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-rose-400">{failedPosts.length}</div>
            <p className="text-xs text-zinc-500 mt-0.5">Failed destination attempts</p>
          </div>
        </Card>

        <Card hoverEffect>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Connected Accounts</span>
            <div className="p-2 rounded-lg bg-gold-950/60 text-gold-400 border border-gold-800/40">
              <Share2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-gold-300">{accounts.length}</div>
            <p className="text-xs text-zinc-500 mt-0.5">
              {accounts.filter((a) => a.status === 'active').length} active connections
            </p>
          </div>
        </Card>
      </div>

      {/* Connected Accounts Status Overview */}
      <Card>
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div>
            <h3 className="font-semibold text-white text-base">Channel Connection Status</h3>
            <p className="text-xs text-zinc-400">Active credentials and live publishing permissions</p>
          </div>
          <Link href="/accounts" className="text-xs text-gold-400 hover:text-gold-300 font-medium flex items-center gap-1">
            Manage Accounts <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          {/* Facebook Status */}
          <div className="p-4 rounded-xl bg-surface border border-border space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Facebook className="w-5 h-5 text-blue-400" />
                <span className="font-semibold text-sm text-white">Facebook</span>
              </div>
              {accounts.some((a) => a.platform === 'meta') ? (
                <Badge variant="green" dot>Connected</Badge>
              ) : (
                <Badge variant="zinc">Not Connected</Badge>
              )}
            </div>
            <p className="text-xs text-zinc-400">
              Pages API v21.0 • Single image publishing
            </p>
          </div>

          {/* Instagram Status */}
          <div className="p-4 rounded-xl bg-surface border border-border space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Instagram className="w-5 h-5 text-pink-400" />
                <span className="font-semibold text-sm text-white">Instagram</span>
              </div>
              {accounts.some((a) => a.platform === 'meta') ? (
                <Badge variant="green" dot>Active</Badge>
              ) : (
                <Badge variant="zinc">Not Connected</Badge>
              )}
            </div>
            <p className="text-xs text-zinc-400">
              Professional Account • 2-Step Container Publishing
            </p>
          </div>

          {/* Google Business Profile Status */}
          <div className="p-4 rounded-xl bg-surface border border-border space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-400" />
                <span className="font-semibold text-sm text-white">Google Profile</span>
              </div>
              {process.env.ENABLE_GOOGLE_BUSINESS_LIVE_PUBLISHING === 'true' ? (
                <Badge variant="green" dot>Active</Badge>
              ) : (
                <Badge variant="amber" dot>Awaiting API Approval</Badge>
              )}
            </div>
            <p className="text-xs text-zinc-400">
              Locations API • Live publishing disabled until approved
            </p>
          </div>
        </div>
      </Card>

      {/* Attention Required / Failed Destinations */}
      {failedPosts.length > 0 && (
        <Card className="border-rose-900/50 bg-rose-950/10">
          <div className="flex items-center justify-between pb-3 border-b border-rose-900/40">
            <div className="flex items-center gap-2 text-rose-300">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              <h3 className="font-semibold text-base">Failed Posts Needing Attention</h3>
            </div>
            <span className="text-xs text-rose-400 font-medium">
              {failedPosts.length} post(s) require intervention
            </span>
          </div>

          <div className="divide-y divide-border/50 pt-2">
            {failedPosts.map((post) => {
              const failedDests = (post.post_destinations || []).filter((d: any) => d.status === 'failed');

              return (
                <div key={post.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1 max-w-xl">
                    <p className="text-xs text-zinc-300 font-medium line-clamp-1">
                      "{post.base_caption}"
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-400">
                      <span>Created: {formatInKolkata(post.created_at)}</span>
                      <span>•</span>
                      <span className="text-rose-400">
                        Failed on: {failedDests.map((d: any) => d.platform).join(', ')}
                      </span>
                    </div>
                    {failedDests[0]?.error_message && (
                      <p className="text-xs text-rose-300 bg-rose-950/40 px-2 py-1 rounded border border-rose-900/40">
                        {failedDests[0].error_message}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      isLoading={retryLoadingId === post.id}
                      onClick={() => handleRetryPost(post.id)}
                      leftIcon={<RotateCw className="w-3.5 h-3.5" />}
                    >
                      Retry Failed
                    </Button>
                    <Link href={`/history`}>
                      <Button size="sm" variant="ghost">
                        View Log
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Two Column Grid: Scheduled vs Recently Published */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scheduled Posts */}
        <Card>
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-sky-400" />
              <h3 className="font-semibold text-white text-sm">Upcoming Scheduled Posts</h3>
            </div>
            <Link href="/calendar" className="text-xs text-gold-400 hover:text-gold-300">
              View Calendar →
            </Link>
          </div>

          <div className="pt-3">
            {scheduledPosts.length === 0 ? (
              <div className="py-8 text-center text-zinc-500 text-xs">
                No scheduled posts. Use "Create Post" to plan your content calendar.
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {scheduledPosts.slice(0, 5).map((post) => (
                  <div key={post.id} className="py-3 flex items-start gap-3">
                    {post.media_url && (
                      <img
                        src={post.media_url}
                        alt="Thumbnail"
                        className="w-12 h-12 rounded-lg object-cover bg-zinc-900 shrink-0 border border-border"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-zinc-200 font-medium line-clamp-2">
                        {post.base_caption}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 text-[11px] text-sky-300">
                        <CalendarClock className="w-3 h-3" />
                        <span>{post.scheduled_at ? formatInKolkata(post.scheduled_at) : 'Scheduled'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Recently Published */}
        <Card>
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <h3 className="font-semibold text-white text-sm">Recently Published</h3>
            </div>
            <Link href="/history" className="text-xs text-gold-400 hover:text-gold-300">
              Full History →
            </Link>
          </div>

          <div className="pt-3">
            {publishedPosts.length === 0 ? (
              <div className="py-8 text-center text-zinc-500 text-xs">
                No posts published yet.
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {publishedPosts.slice(0, 5).map((post) => (
                  <div key={post.id} className="py-3 flex items-start gap-3">
                    {post.media_url && (
                      <img
                        src={post.media_url}
                        alt="Thumbnail"
                        className="w-12 h-12 rounded-lg object-cover bg-zinc-900 shrink-0 border border-border"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-zinc-200 font-medium line-clamp-2">
                        {post.base_caption}
                      </p>
                      <div className="flex items-center justify-between mt-1.5 text-[11px] text-zinc-400">
                        <span>{formatInKolkata(post.published_at || post.created_at)}</span>
                        <div className="flex items-center gap-1.5">
                          {post.post_destinations?.map((d: any) => (
                            <span key={d.id} className="text-[10px] text-emerald-400 font-medium">
                              {d.platform}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
