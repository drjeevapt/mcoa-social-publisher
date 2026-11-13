'use client';

import React from 'react';
import { Facebook, Instagram, MapPin, Check, AlertTriangle, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export interface DestinationOption {
  id: string;
  platform: 'facebook' | 'instagram' | 'google_business';
  destinationName: string;
  destinationType: string;
  isEnabled: boolean;
  requiresApproval: boolean;
  approvalStatus: 'approved' | 'pending_api_access' | 'denied';
  accountStatus?: string;
}

interface DestinationSelectorProps {
  destinations: DestinationOption[];
  selectedDestinationIds: string[];
  onChange: (selectedIds: string[]) => void;
}

export const DestinationSelector: React.FC<DestinationSelectorProps> = ({
  destinations,
  selectedDestinationIds,
  onChange,
}) => {
  const toggleDestination = (id: string, requiresApproval: boolean, isEnabled: boolean) => {
    if (!isEnabled || requiresApproval) return;

    if (selectedDestinationIds.includes(id)) {
      onChange(selectedDestinationIds.filter((item) => item !== id));
    } else {
      onChange([...selectedDestinationIds, id]);
    }
  };

  const platformIcons = {
    facebook: <Facebook className="w-4 h-4 text-blue-400" />,
    instagram: <Instagram className="w-4 h-4 text-pink-400" />,
    google_business: <MapPin className="w-4 h-4 text-emerald-400" />,
  };

  const platformLabels = {
    facebook: 'Facebook Page',
    instagram: 'Instagram Professional',
    google_business: 'Google Business Profile',
  };

  if (destinations.length === 0) {
    return (
      <div className="p-4 rounded-xl border border-dashed border-border bg-surface-card text-center space-y-2">
        <p className="text-sm text-zinc-300 font-medium">No connected accounts found</p>
        <p className="text-xs text-zinc-500">
          Connect your Facebook Page, Instagram account, or Google location to publish.
        </p>
        <Link
          href="/accounts"
          className="inline-flex items-center text-xs font-semibold text-gold-400 hover:text-gold-300 pt-1"
        >
          Connect Accounts Now →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
          Publishing Destinations
        </label>
        <span className="text-[11px] text-zinc-400">
          {selectedDestinationIds.length} of {destinations.length} selected
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {destinations.map((dest) => {
          const isSelected = selectedDestinationIds.includes(dest.id);
          const isPendingGbpApproval = dest.platform === 'google_business' && dest.approvalStatus === 'pending_api_access';
          const isDisabled = !dest.isEnabled || isPendingGbpApproval;

          return (
            <div
              key={dest.id}
              onClick={() => toggleDestination(dest.id, isPendingGbpApproval, dest.isEnabled)}
              className={`p-3.5 rounded-xl border transition-all text-left relative flex flex-col justify-between ${
                isDisabled
                  ? 'border-border/50 bg-zinc-950/40 opacity-70 cursor-not-allowed'
                  : isSelected
                  ? 'border-gold-400/80 bg-gold-400/10 cursor-pointer shadow-sm shadow-gold-500/5'
                  : 'border-border bg-surface-card hover:border-zinc-700 cursor-pointer'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-surface border border-border">
                    {platformIcons[dest.platform]}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white leading-tight">
                      {dest.destinationName}
                    </h4>
                    <span className="text-[10px] text-zinc-400">
                      {platformLabels[dest.platform]}
                    </span>
                  </div>
                </div>

                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors shrink-0 ${
                    isSelected
                      ? 'bg-gold-400 border-gold-400 text-black'
                      : 'border-zinc-700 bg-surface text-transparent'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Status footer pill */}
              <div className="mt-2 pt-2 border-t border-border/40 text-[10px]">
                {isPendingGbpApproval ? (
                  <div className="flex items-center gap-1.5 text-amber-400">
                    <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                    <span>Awaiting Google Cloud API Approval</span>
                  </div>
                ) : !dest.isEnabled ? (
                  <div className="flex items-center gap-1 text-zinc-500">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Destination Disabled in Settings</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Ready to publish</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
