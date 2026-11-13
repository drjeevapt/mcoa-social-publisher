'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import {
  RotateCw,
  ExternalLink,
  Facebook,
  Instagram,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  CalendarClock,
  Clock,
  Trash2,
  Info,
  X,
  Filter,
} from 'lucide-react';
import { formatInKolkata } from '@/lib/date-utils';

export default function HistoryPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [selectedError, setSelectedError] = useState<any | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const url = filterStatus === 'all' ? '/api/posts' : `/api/posts?status=${filterStatus}`;
      const res = await fetch(url);
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [filterStatus]);

  const handleRetryFailed = async (postId: string, destinationId?: string) => {
    try {
      setRetryingId(postId);
      const payload: any = {};
      if (destinationId) {
        payload.destinationIds = [destinationId];
      }

      const res = await fetch(`/api/posts/${postId}/retry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setNotification({
          type: 'success',
          message: data.message || 'Targeted retry executed successfully!',
        });
        await fetchHistory();
      } else {
        setNotification({
          type: 'error',
          message: data.error || 'Failed to retry destination',
        });
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Retry request error',
      });
    } finally {
      setRetryingId(null);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post record?')) return;

    try {
      const res = await fetch(`/api/posts/${postId}`, { method: 'DELETE' });
      if (res.ok) {
        setNotification({ type: 'success', message: 'Post removed successfully.' });
        fetchHistory();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to delete');
      }
    } catch (err: any) {
      alert(err.message || 'Delete error');
    }
  };

  const platformIcons: Record<string, React.ReactNode> = {
    facebook: <Facebook className="w-4 h-4 text-blue-400" />,
    instagram: <Instagram className="w-4 h-4 text-pink-400" />,
    google_business: <MapPin className="w-4 h-4 text-emerald-400" />,
  };

  return (
    <AppShell title="Publishing History & Multi-Channel Audit">
      {notification && (
        <Alert type={notification.type} title={notification.type === 'success' ? 'Success' : 'Error'}>
          {notification.message}
        </Alert>
      )}

      {/* Header and Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Delivery Results</h2>
          <p className="text-xs text-zinc-400">
            Per-destination delivery logs, platform IDs, and safe retry controls.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-surface border border-border p-1 rounded-lg text-xs">
            <Filter className="w-3.5 h-3.5 text-zinc-500 ml-2" />
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-2.5 py-1 rounded font-medium ${
                filterStatus === 'all' ? 'bg-gold-400/20 text-gold-300 font-semibold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('published')}
              className={`px-2.5 py-1 rounded font-medium ${
                filterStatus === 'published' ? 'bg-emerald-950/60 text-emerald-300 font-semibold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Published
            </button>
            <button
              onClick={() => setFilterStatus('scheduled')}
              className={`px-2.5 py-1 rounded font-medium ${
                filterStatus === 'scheduled' ? 'bg-sky-950/60 text-sky-300 font-semibold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Scheduled
            </button>
            <button
              onClick={() => setFilterStatus('failed')}
              className={`px-2.5 py-1 rounded font-medium ${
                filterStatus === 'failed' ? 'bg-rose-950/60 text-rose-300 font-semibold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Failed
            </button>
          </div>

          <Button
            size="sm"
            variant="secondary"
            onClick={fetchHistory}
            isLoading={loading}
            leftIcon={<RotateCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Posts History List */}
      <div className="space-y-4">
        {posts.length === 0 ? (
          <Card className="text-center py-12">
            <Clock className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-zinc-300">No posts found</p>
            <p className="text-xs text-zinc-500 mt-1">
              Create your first post or adjust filters to view historical records.
            </p>
          </Card>
        ) : (
          posts.map((post) => {
            const hasFailedDestinations = (post.post_destinations || []).some(
              (d: any) => d.status === 'failed'
            );

            return (
              <Card key={post.id} className="space-y-4">
                {/* Post Summary Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-border">
                  <div className="flex items-start gap-3">
                    {post.media_url ? (
                      <img
                        src={post.media_url}
                        alt="Post media"
                        className="w-14 h-14 rounded-xl object-cover bg-black border border-border shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-zinc-900 border border-border flex items-center justify-center text-zinc-600 shrink-0">
                        None
                      </div>
                    )}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            post.status === 'published'
                              ? 'green'
                              : post.status === 'partially_published'
                              ? 'amber'
                              : post.status === 'scheduled'
                              ? 'blue'
                              : post.status === 'failed'
                              ? 'red'
                              : 'zinc'
                          }
                          dot
                        >
                          {post.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <span className="text-xs text-zinc-400">
                          {formatInKolkata(post.published_at || post.scheduled_at || post.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-200 line-clamp-2 max-w-2xl font-medium">
                        {post.base_caption}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-start">
                    {hasFailedDestinations && (
                      <Button
                        size="sm"
                        variant="primary"
                        isLoading={retryingId === post.id}
                        leftIcon={<RotateCw className="w-3.5 h-3.5" />}
                        onClick={() => handleRetryFailed(post.id)}
                      >
                        Retry Failed
                      </Button>
                    )}
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-surface transition-colors"
                      title="Delete post"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Per-Destination Status Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {(post.post_destinations || []).map((dest: any) => {
                    const isPublished = dest.status === 'published';
                    const isFailed = dest.status === 'failed';
                    const isScheduled = dest.status === 'scheduled';

                    return (
                      <div
                        key={dest.id}
                        className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                          isPublished
                            ? 'bg-emerald-950/15 border-emerald-800/40'
                            : isFailed
                            ? 'bg-rose-950/20 border-rose-800/40'
                            : isScheduled
                            ? 'bg-sky-950/20 border-sky-800/40'
                            : 'bg-surface border-border'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {platformIcons[dest.platform]}
                              <span className="text-xs font-semibold text-white capitalize">
                                {dest.connected_destinations?.destination_name || dest.platform}
                              </span>
                            </div>
                            <Badge
                              variant={
                                isPublished
                                  ? 'green'
                                  : isScheduled
                                  ? 'blue'
                                  : isFailed
                                  ? 'red'
                                  : 'zinc'
                              }
                            >
                              {dest.status}
                            </Badge>
                          </div>

                          {/* Success Permalink */}
                          {isPublished && dest.platform_permalink && (
                            <a
                              href={dest.platform_permalink}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:underline pt-1"
                            >
                              <span>View live post</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}

                          {/* Failure Error Message */}
                          {isFailed && dest.error_message && (
                            <div className="space-y-1.5 pt-1">
                              <p className="text-xs text-rose-300 line-clamp-2 leading-relaxed">
                                {dest.error_message}
                              </p>
                              <button
                                onClick={() => setSelectedError(dest)}
                                className="text-[11px] text-rose-400 hover:underline font-medium flex items-center gap-1"
                              >
                                <Info className="w-3 h-3" /> Details & Error Code
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Granular Single-Destination Retry */}
                        {isFailed && (
                          <div className="pt-3 border-t border-rose-900/40 mt-3 flex items-center justify-between">
                            <span className="text-[10px] text-zinc-400">
                              Attempts: {dest.attempts}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              isLoading={retryingId === post.id}
                              onClick={() => handleRetryFailed(post.id, dest.destination_id)}
                            >
                              Retry Platform
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Error Details Modal */}
      {selectedError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-surface border border-border rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-rose-400">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-base font-semibold text-white">
                  Publishing Error Diagnostic
                </h3>
              </div>
              <button
                onClick={() => setSelectedError(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-surface-card"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-surface-card rounded-xl border border-border space-y-1.5">
                <div className="text-zinc-400">Platform & Code:</div>
                <div className="font-mono text-rose-300 font-semibold">
                  {selectedError.platform.toUpperCase()} — {selectedError.error_code || 'ERROR'}
                </div>
              </div>

              <div className="p-3 bg-surface-card rounded-xl border border-border space-y-1.5">
                <div className="text-zinc-400">Error Description:</div>
                <div className="text-zinc-200 leading-relaxed">
                  {selectedError.error_message}
                </div>
              </div>

              {selectedError.error_details && (
                <div className="p-3 bg-surface-card rounded-xl border border-border space-y-1.5">
                  <div className="text-zinc-400">Technical Trace:</div>
                  <pre className="font-mono text-[10px] text-zinc-400 overflow-x-auto p-2 bg-black/60 rounded">
                    {JSON.stringify(selectedError.error_details, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <Button size="sm" variant="secondary" onClick={() => setSelectedError(null)}>
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
