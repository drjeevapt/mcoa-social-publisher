'use client';

import React, { useState } from 'react';
import {
  Facebook,
  Instagram,
  MapPin,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Send,
  ThumbsUp,
  Globe,
  MoreHorizontal,
  ExternalLink,
} from 'lucide-react';

interface PostPreviewProps {
  baseCaption: string;
  customCaptions: {
    facebook?: string;
    instagram?: string;
    google_business?: string;
  };
  mediaUrl?: string;
  selectedPlatforms: ('facebook' | 'instagram' | 'google_business')[];
}

export const PostPreview: React.FC<PostPreviewProps> = ({
  baseCaption,
  customCaptions,
  mediaUrl,
  selectedPlatforms,
}) => {
  const [activeTab, setActiveTab] = useState<'facebook' | 'instagram' | 'google_business'>(
    selectedPlatforms[0] || 'facebook'
  );

  // If active tab was unselected, default to first available
  const currentTab = selectedPlatforms.includes(activeTab)
    ? activeTab
    : selectedPlatforms[0] || 'facebook';

  const getCaptionForPlatform = (platform: 'facebook' | 'instagram' | 'google_business') => {
    const custom = customCaptions[platform];
    if (custom && custom.trim() !== '') return custom;
    return baseCaption || 'Your caption will appear here...';
  };

  const caption = getCaptionForPlatform(currentTab);

  return (
    <div className="bg-surface-card border border-border rounded-xl p-5 space-y-4">
      {/* Header and Platform Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <h3 className="font-semibold text-white text-sm">Live Platform Preview</h3>
          <p className="text-xs text-zinc-400">See how your post renders on each network</p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-surface rounded-lg border border-border">
          {selectedPlatforms.includes('facebook') && (
            <button
              type="button"
              onClick={() => setActiveTab('facebook')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                currentTab === 'facebook'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Facebook className="w-3.5 h-3.5" />
              <span>Facebook</span>
            </button>
          )}

          {selectedPlatforms.includes('instagram') && (
            <button
              type="button"
              onClick={() => setActiveTab('instagram')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                currentTab === 'instagram'
                  ? 'bg-pink-600/20 text-pink-400 border border-pink-500/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Instagram className="w-3.5 h-3.5" />
              <span>Instagram</span>
            </button>
          )}

          {selectedPlatforms.includes('google_business') && (
            <button
              type="button"
              onClick={() => setActiveTab('google_business')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                currentTab === 'google_business'
                  ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Google Profile</span>
            </button>
          )}
        </div>
      </div>

      {/* Preview Card Body */}
      <div className="flex justify-center py-2">
        {/* FACEBOOK PREVIEW */}
        {currentTab === 'facebook' && (
          <div className="w-full max-w-md bg-[#242526] rounded-xl border border-zinc-700/60 overflow-hidden shadow-xl text-zinc-200">
            {/* FB Header */}
            <div className="p-3.5 flex items-center justify-between border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gold-500 flex items-center justify-center font-bold text-black text-sm">
                  MC
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-white leading-tight">
                    Medical Coding Officers Academy
                  </h4>
                  <div className="flex items-center gap-1 text-[11px] text-zinc-400 mt-0.5">
                    <span>Just now</span>
                    <span>•</span>
                    <Globe className="w-3 h-3 text-zinc-400" />
                  </div>
                </div>
              </div>
              <MoreHorizontal className="w-5 h-5 text-zinc-400" />
            </div>

            {/* FB Caption */}
            <div className="p-3.5 text-sm whitespace-pre-wrap leading-relaxed text-zinc-100">
              {caption}
            </div>

            {/* FB Media */}
            {mediaUrl ? (
              <div className="relative w-full aspect-square sm:aspect-video bg-black flex items-center justify-center overflow-hidden">
                <img
                  src={mediaUrl}
                  alt="Post preview"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-full h-48 bg-zinc-900 border-y border-zinc-800 flex flex-col items-center justify-center text-zinc-500 text-xs">
                <span>Upload an image to preview</span>
              </div>
            )}

            {/* FB Engagement bar */}
            <div className="p-2 border-t border-zinc-800 grid grid-cols-3 text-xs text-zinc-400 font-medium">
              <button type="button" className="flex items-center justify-center gap-2 py-1.5 hover:bg-zinc-800/80 rounded-lg">
                <ThumbsUp className="w-4 h-4 text-zinc-400" /> Like
              </button>
              <button type="button" className="flex items-center justify-center gap-2 py-1.5 hover:bg-zinc-800/80 rounded-lg">
                <MessageCircle className="w-4 h-4 text-zinc-400" /> Comment
              </button>
              <button type="button" className="flex items-center justify-center gap-2 py-1.5 hover:bg-zinc-800/80 rounded-lg">
                <Share2 className="w-4 h-4 text-zinc-400" /> Share
              </button>
            </div>
          </div>
        )}

        {/* INSTAGRAM PREVIEW */}
        {currentTab === 'instagram' && (
          <div className="w-full max-w-sm bg-black rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl text-white">
            {/* IG Header */}
            <div className="p-3 flex items-center justify-between border-b border-zinc-800/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full p-0.5 bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600">
                  <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-[10px] font-bold text-gold-400">
                    MCOA
                  </div>
                </div>
                <div>
                  <span className="font-semibold text-xs tracking-tight">medicalcodingofficers</span>
                  <p className="text-[10px] text-zinc-400 leading-none">Original audio</p>
                </div>
              </div>
              <MoreHorizontal className="w-4 h-4 text-zinc-400" />
            </div>

            {/* IG Media (Square or 4:5) */}
            {mediaUrl ? (
              <div className="relative w-full aspect-square bg-zinc-950 overflow-hidden">
                <img
                  src={mediaUrl}
                  alt="Post preview"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-full aspect-square bg-zinc-900 flex flex-col items-center justify-center text-zinc-500 text-xs">
                <span>Upload an image to preview Instagram feed</span>
              </div>
            )}

            {/* IG Actions Bar */}
            <div className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Heart className="w-5 h-5 text-white" />
                  <MessageCircle className="w-5 h-5 text-white" />
                  <Send className="w-5 h-5 text-white" />
                </div>
                <Bookmark className="w-5 h-5 text-white" />
              </div>

              {/* Likes counter */}
              <div className="text-xs font-semibold">Liked by academy_members and others</div>

              {/* Caption */}
              <div className="text-xs text-zinc-200 leading-relaxed">
                <span className="font-semibold text-white mr-1.5">medicalcodingofficers</span>
                <span className="whitespace-pre-wrap">{caption}</span>
              </div>

              <div className="text-[10px] text-zinc-500 uppercase">Just now • Asia/Kolkata</div>
            </div>
          </div>
        )}

        {/* GOOGLE BUSINESS PROFILE PREVIEW */}
        {currentTab === 'google_business' && (
          <div className="w-full max-w-md bg-surface border border-zinc-700/60 rounded-xl overflow-hidden shadow-xl text-zinc-200">
            {/* GBP Header */}
            <div className="p-4 bg-zinc-900 border-b border-border flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold mb-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Google Business Profile Post</span>
                </div>
                <h4 className="font-semibold text-white text-sm">Medical Coding Officers Academy</h4>
                <p className="text-xs text-zinc-400">Chennai Training Hub & Online Academy</p>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                Local Update
              </span>
            </div>

            {/* GBP Media */}
            {mediaUrl ? (
              <div className="relative w-full aspect-video bg-black overflow-hidden">
                <img
                  src={mediaUrl}
                  alt="Post preview"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-full h-44 bg-zinc-900 flex flex-col items-center justify-center text-zinc-500 text-xs">
                <span>Upload a 720x540 image for Google Business</span>
              </div>
            )}

            {/* GBP Body */}
            <div className="p-4 space-y-4">
              <div className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">
                {caption}
              </div>

              {/* CTA Button */}
              <div className="pt-2">
                <a
                  href="#cta-preview"
                  onClick={(e) => e.preventDefault()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors"
                >
                  <span>Learn More</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
