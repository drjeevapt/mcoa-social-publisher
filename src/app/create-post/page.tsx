'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { ImageUploader } from '@/components/posts/ImageUploader';
import { DestinationSelector, DestinationOption } from '@/components/posts/DestinationSelector';
import { PostPreview } from '@/components/posts/PostPreview';
import {
  Send,
  Calendar,
  Save,
  Sparkles,
  Facebook,
  Instagram,
  MapPin,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { kolkataToUtcIso } from '@/lib/date-utils';
import { PLATFORM_CONSTRAINTS } from '@/lib/validation/post-validation';

export default function CreatePostPage() {
  const router = useRouter();

  // Form states
  const [baseCaption, setBaseCaption] = useState('');
  const [customCaptions, setCustomCaptions] = useState<{
    facebook?: string;
    instagram?: string;
    google_business?: string;
  }>({});
  const [mediaUrl, setMediaUrl] = useState<string>('');
  const [mediaInfo, setMediaInfo] = useState<{ name: string; size: number; type: string } | null>(null);

  // Available & selected destinations
  const [destinations, setDestinations] = useState<DestinationOption[]>([]);
  const [selectedDestinationIds, setSelectedDestinationIds] = useState<string[]>([]);

  // Scheduling states
  const [scheduleType, setScheduleType] = useState<'now' | 'schedule' | 'draft'>('now');
  const [scheduledDateTime, setScheduledDateTime] = useState<string>(''); // YYYY-MM-DDTHH:mm

  // UI state
  const [activeTab, setActiveTab] = useState<'base' | 'facebook' | 'instagram' | 'google_business'>('base');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load connected destinations
  useEffect(() => {
    async function loadAccounts() {
      try {
        const res = await fetch('/api/accounts');
        const data = await res.json();
        const dests: DestinationOption[] = [];

        (data.accounts || []).forEach((acc: any) => {
          (acc.connected_destinations || []).forEach((d: any) => {
            dests.push({
              id: d.id,
              platform: d.platform,
              destinationName: d.destination_name,
              destinationType: d.destination_type,
              isEnabled: d.is_enabled,
              requiresApproval: d.requires_approval,
              approvalStatus: d.approval_status,
              accountStatus: acc.status,
            });
          });
        });

        setDestinations(dests);
        // Pre-select all ready destinations by default
        const initialSelected = dests
          .filter((d) => d.isEnabled && d.approvalStatus === 'approved')
          .map((d) => d.id);
        setSelectedDestinationIds(initialSelected);
      } catch (err) {
        console.error('Failed to load destinations:', err);
      }
    }

    loadAccounts();

    // Default scheduled time: tomorrow at 10:00 AM IST
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    setScheduledDateTime(`${yyyy}-${mm}-${dd}T10:00`);
  }, []);

  const handleCustomCaptionChange = (platform: 'facebook' | 'instagram' | 'google_business', value: string) => {
    setCustomCaptions((prev) => ({
      ...prev,
      [platform]: value,
    }));
  };

  // Derive platforms of selected destinations
  const selectedPlatforms = Array.from(
    new Set(
      destinations
        .filter((d) => selectedDestinationIds.includes(d.id))
        .map((d) => d.platform)
    )
  ) as ('facebook' | 'instagram' | 'google_business')[];

  const handleSubmit = async (overrideType?: 'now' | 'schedule' | 'draft') => {
    const finalType = overrideType || scheduleType;
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validations
    if (!baseCaption.trim()) {
      setErrorMessage('Please provide a base caption for your post.');
      return;
    }

    if (!mediaUrl) {
      setErrorMessage('Please upload a creative image for your social post.');
      return;
    }

    if (finalType !== 'draft' && selectedDestinationIds.length === 0) {
      setErrorMessage('Please select at least one publishing destination.');
      return;
    }

    let scheduledAtUtc: string | undefined = undefined;
    if (finalType === 'schedule') {
      if (!scheduledDateTime) {
        setErrorMessage('Please select a date and time in Asia/Kolkata time for scheduled publishing.');
        return;
      }
      try {
        scheduledAtUtc = kolkataToUtcIso(scheduledDateTime);
      } catch (err) {
        setErrorMessage('Invalid scheduled date/time format.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const destinationPayload = selectedDestinationIds.map((id) => {
        const dest = destinations.find((d) => d.id === id)!;
        return {
          destinationId: id,
          platform: dest.platform,
          customCaption: customCaptions[dest.platform],
        };
      });

      const payload = {
        workspaceId: 'a0000000-0000-0000-0000-000000000001', // MCOA workspace
        baseCaption,
        mediaUrl,
        mediaType: mediaInfo?.type || 'image/jpeg',
        mediaSizeBytes: mediaInfo?.size,
        destinations: destinationPayload,
        scheduleType: finalType,
        scheduledAt: scheduledAtUtc,
      };

      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit post');
      }

      setSuccessMessage(
        finalType === 'now'
          ? 'Post published successfully across selected platforms!'
          : finalType === 'schedule'
          ? 'Post scheduled successfully in Asia/Kolkata time!'
          : 'Draft saved successfully!'
      );

      // Redirect after a brief moment
      setTimeout(() => {
        if (finalType === 'schedule') {
          router.push('/calendar');
        } else {
          router.push('/history');
        }
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error creating post');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell title="Create Academy Post">
      {errorMessage && (
        <Alert type="error" title="Action Failed">
          {errorMessage}
        </Alert>
      )}

      {successMessage && (
        <Alert type="success" title="Success">
          {successMessage}
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Destination Selector */}
          <Card>
            <DestinationSelector
              destinations={destinations}
              selectedDestinationIds={selectedDestinationIds}
              onChange={setSelectedDestinationIds}
            />
          </Card>

          {/* Media Creative Upload */}
          <Card>
            <ImageUploader
              currentImageUrl={mediaUrl}
              onImageSelected={(url, info) => {
                setMediaUrl(url);
                setMediaInfo(info);
              }}
              onImageRemoved={() => {
                setMediaUrl('');
                setMediaInfo(null);
              }}
            />
          </Card>

          {/* Captions & Customizations */}
          <Card className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="font-semibold text-white text-sm">Post Caption</h3>
                <p className="text-xs text-zinc-400">
                  Write once, or customize uniquely for each network
                </p>
              </div>

              {/* Caption platform tabs */}
              <div className="flex items-center gap-1 bg-surface p-1 rounded-lg border border-border">
                <button
                  type="button"
                  onClick={() => setActiveTab('base')}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    activeTab === 'base'
                      ? 'bg-gold-400/20 text-gold-300 font-semibold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Main Caption
                </button>

                {selectedPlatforms.includes('facebook') && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('facebook')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      activeTab === 'facebook'
                        ? 'bg-blue-600/20 text-blue-300 font-semibold'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Facebook className="w-3 h-3" />
                    <span>Facebook</span>
                  </button>
                )}

                {selectedPlatforms.includes('instagram') && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('instagram')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      activeTab === 'instagram'
                        ? 'bg-pink-600/20 text-pink-300 font-semibold'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Instagram className="w-3 h-3" />
                    <span>Instagram</span>
                  </button>
                )}

                {selectedPlatforms.includes('google_business') && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('google_business')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      activeTab === 'google_business'
                        ? 'bg-emerald-600/20 text-emerald-300 font-semibold'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <MapPin className="w-3 h-3" />
                    <span>Google</span>
                  </button>
                )}
              </div>
            </div>

            {/* Main Base Caption */}
            {activeTab === 'base' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>Base Caption (used by default for all selected channels)</span>
                  <span className="font-mono">{baseCaption.length} characters</span>
                </div>
                <textarea
                  rows={6}
                  value={baseCaption}
                  onChange={(e) => setBaseCaption(e.target.value)}
                  placeholder="e.g. Exciting announcement! Medical Coding Officers Academy is opening registrations for our Advanced CPC Certification batch. Empowering healthcare professionals with world-class training. Contact us today! #MedicalCoding #CPC #HealthcareCareers"
                  className="w-full rounded-xl bg-surface border border-border p-3.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-gold-400/50"
                />
              </div>
            )}

            {/* Custom Facebook Caption */}
            {activeTab === 'facebook' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span className="flex items-center gap-1.5 text-blue-400">
                    <Facebook className="w-3.5 h-3.5" /> Facebook Specific Caption (overrides base)
                  </span>
                  <span className="font-mono">
                    {(customCaptions.facebook ?? baseCaption).length} / {PLATFORM_CONSTRAINTS.facebook.maxCaptionLength}
                  </span>
                </div>
                <textarea
                  rows={6}
                  value={customCaptions.facebook ?? ''}
                  onChange={(e) => handleCustomCaptionChange('facebook', e.target.value)}
                  placeholder={baseCaption || 'Leave blank to use base caption...'}
                  className="w-full rounded-xl bg-surface border border-border p-3.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
            )}

            {/* Custom Instagram Caption */}
            {activeTab === 'instagram' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span className="flex items-center gap-1.5 text-pink-400">
                    <Instagram className="w-3.5 h-3.5" /> Instagram Specific Caption (max 2,200 chars, 30 hashtags)
                  </span>
                  <span className="font-mono">
                    {(customCaptions.instagram ?? baseCaption).length} / {PLATFORM_CONSTRAINTS.instagram.maxCaptionLength}
                  </span>
                </div>
                <textarea
                  rows={6}
                  value={customCaptions.instagram ?? ''}
                  onChange={(e) => handleCustomCaptionChange('instagram', e.target.value)}
                  placeholder={baseCaption || 'Leave blank to use base caption with hashtags...'}
                  className="w-full rounded-xl bg-surface border border-border p-3.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                />
              </div>
            )}

            {/* Custom Google Business Caption */}
            {activeTab === 'google_business' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <MapPin className="w-3.5 h-3.5" /> Google Business Profile Summary (max 1,500 chars)
                  </span>
                  <span className="font-mono">
                    {(customCaptions.google_business ?? baseCaption).length} / {PLATFORM_CONSTRAINTS.google_business.maxCaptionLength}
                  </span>
                </div>
                <textarea
                  rows={6}
                  value={customCaptions.google_business ?? ''}
                  onChange={(e) => handleCustomCaptionChange('google_business', e.target.value)}
                  placeholder={baseCaption || 'Leave blank to use base caption...'}
                  className="w-full rounded-xl bg-surface border border-border p-3.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
            )}
          </Card>

          {/* Publishing & Scheduling Mode */}
          <Card className="space-y-4">
            <h3 className="font-semibold text-white text-sm">Publishing Schedule</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setScheduleType('now')}
                className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  scheduleType === 'now'
                    ? 'border-gold-400 bg-gold-400/10 text-white'
                    : 'border-border bg-surface hover:bg-surface-hover text-zinc-400'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Send className={`w-4 h-4 ${scheduleType === 'now' ? 'text-gold-400' : 'text-zinc-500'}`} />
                  <span className="text-[10px] uppercase font-bold text-gold-400">Instant</span>
                </div>
                <span className="text-xs font-semibold text-white">Publish Now</span>
                <span className="text-[11px] text-zinc-400 mt-1">Dispatches to channels immediately</span>
              </button>

              <button
                type="button"
                onClick={() => setScheduleType('schedule')}
                className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  scheduleType === 'schedule'
                    ? 'border-gold-400 bg-gold-400/10 text-white'
                    : 'border-border bg-surface hover:bg-surface-hover text-zinc-400'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Calendar className={`w-4 h-4 ${scheduleType === 'schedule' ? 'text-gold-400' : 'text-zinc-500'}`} />
                  <span className="text-[10px] uppercase font-bold text-sky-400">Automated</span>
                </div>
                <span className="text-xs font-semibold text-white">Schedule</span>
                <span className="text-[11px] text-zinc-400 mt-1">Runs via durable worker</span>
              </button>

              <button
                type="button"
                onClick={() => setScheduleType('draft')}
                className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  scheduleType === 'draft'
                    ? 'border-gold-400 bg-gold-400/10 text-white'
                    : 'border-border bg-surface hover:bg-surface-hover text-zinc-400'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Save className={`w-4 h-4 ${scheduleType === 'draft' ? 'text-gold-400' : 'text-zinc-500'}`} />
                  <span className="text-[10px] uppercase font-bold text-zinc-400">Offline</span>
                </div>
                <span className="text-xs font-semibold text-white">Save as Draft</span>
                <span className="text-[11px] text-zinc-400 mt-1">Review and publish later</span>
              </button>
            </div>

            {/* Scheduled Date Picker in Asia/Kolkata */}
            {scheduleType === 'schedule' && (
              <div className="p-4 rounded-xl bg-surface border border-border space-y-2 mt-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-gold-400" />
                    <span>Select Publishing Date & Time</span>
                  </label>
                  <span className="text-[11px] text-gold-300 bg-gold-950/60 px-2 py-0.5 rounded border border-gold-800/40 font-mono">
                    India Time (IST / Asia/Kolkata)
                  </span>
                </div>
                <input
                  type="datetime-local"
                  value={scheduledDateTime}
                  onChange={(e) => setScheduledDateTime(e.target.value)}
                  className="w-full bg-surface-card border border-border rounded-lg p-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-gold-400/50"
                />
                <p className="text-[11px] text-zinc-500">
                  The background worker will automatically dispatch this post even when your browser is closed.
                </p>
              </div>
            )}
          </Card>

          {/* Action Bar */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              isLoading={isSubmitting}
              leftIcon={<Save className="w-4 h-4" />}
              onClick={() => handleSubmit('draft')}
            >
              Save as Draft
            </Button>

            <Button
              type="button"
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              leftIcon={scheduleType === 'schedule' ? <Calendar className="w-4 h-4" /> : <Send className="w-4 h-4" />}
              onClick={() => handleSubmit()}
            >
              {scheduleType === 'schedule' ? 'Confirm & Schedule' : 'Publish to Channels'}
            </Button>
          </div>
        </div>

        {/* Right Column: Live Network Previews (5 cols) */}
        <div className="lg:col-span-5 sticky top-20">
          <PostPreview
            baseCaption={baseCaption}
            customCaptions={customCaptions}
            mediaUrl={mediaUrl}
            selectedPlatforms={selectedPlatforms.length > 0 ? selectedPlatforms : ['facebook', 'instagram', 'google_business']}
          />
        </div>
      </div>
    </AppShell>
  );
}
