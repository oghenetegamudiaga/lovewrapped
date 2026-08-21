import React, { useState, useEffect } from 'react';
import { Heart, Calendar, MapPin } from 'lucide-react';
import { resolveThemeStyles } from '../config/weddingThemes';
import { getPublicThemeAssetsApi } from '../lib/api';
import { TextZone } from '../types';

export const TEMPLATE_CARD_COUPLE_NAME_COLOR = '#3A0D22';
export const TEMPLATE_CARD_DETAIL_TEXT_COLOR = '#000000';

export interface StaticInviteCardProps {
  brideFirstName: string;
  groomFirstName: string;
  weddingDate?: string;
  venueName?: string;
  venueAddress?: string;
  customText?: string;
  themeId?: string;
  colorVariant?: string;
  fontVariant?: string;
  watermark?: boolean;
  cardTemplateUrl?: string | null;
  textZone?: TextZone | null;
  cardRef?: React.RefObject<HTMLDivElement | null>;
  className?: string;
}

export const StaticInviteCard: React.FC<StaticInviteCardProps> = ({
  brideFirstName,
  groomFirstName,
  weddingDate,
  venueName,
  venueAddress,
  customText,
  themeId = 'classic-burgundy',
  colorVariant = 'royal-gold',
  fontVariant = 'classic-serif',
  watermark = false,
  cardTemplateUrl,
  textZone,
  cardRef,
  className = '',
}) => {
  const styles = resolveThemeStyles(themeId, colorVariant, fontVariant);
  const { baseTheme, accentColor, secondaryColor, serifClass, sansClass, cardBgColor } = styles;

  const [activeTemplateUrl, setActiveTemplateUrl] = useState<string | null>(cardTemplateUrl || null);
  const [activeTextZone, setActiveTextZone] = useState<TextZone | null>(textZone || null);

  useEffect(() => {
    if (cardTemplateUrl !== undefined) {
      setActiveTemplateUrl(cardTemplateUrl);
    }
    if (textZone !== undefined) {
      setActiveTextZone(textZone);
    }

    if (cardTemplateUrl === undefined || textZone === undefined) {
      getPublicThemeAssetsApi()
        .then((map) => {
          const asset = map[themeId];
          if (asset) {
            if (cardTemplateUrl === undefined && asset.card_template_url) {
              setActiveTemplateUrl(asset.card_template_url);
            }
            if (textZone === undefined && asset.text_zone) {
              setActiveTextZone(asset.text_zone);
            }
          }
        })
        .catch(() => {});
    }
  }, [themeId, cardTemplateUrl, textZone]);

  // Format date display if provided
  const formattedDate = React.useMemo(() => {
    if (!weddingDate) return 'DATE TO BE ANNOUNCED';
    try {
      const d = new Date(weddingDate);
      if (isNaN(d.getTime())) return weddingDate.toUpperCase();
      return d.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).toUpperCase();
    } catch {
      return weddingDate.toUpperCase();
    }
  }, [weddingDate]);

  // Generate couple initials monogram
  const monogram = `${(brideFirstName[0] || 'B').toUpperCase()}&${(groomFirstName[0] || 'G').toUpperCase()}`;

  const zone = activeTextZone || { top: 50, left: 10, width: 80, height: 40 };

  return (
    <div
      ref={cardRef}
      id="static-invite-card"
      style={{ backgroundColor: cardBgColor, color: baseTheme.textColor }}
      className={`relative w-full max-w-[540px] mx-auto rounded-3xl p-8 sm:p-10 shadow-2xl overflow-hidden border-4 border-double border-opacity-40 transition-all select-none flex flex-col justify-between items-center text-center aspect-[4/5] min-h-[640px] ${className}`}
    >
      {/* Custom Card Template Backdrop (If present) */}
      {activeTemplateUrl ? (
        <>
          <img
            src={activeTemplateUrl}
            alt="Custom Invitation Card Template"
            className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
          />

          {/* Absolute Text Zone Container positioned via configured percentage box */}
          <div
            className="absolute z-10 p-2 flex flex-col justify-center items-center text-center overflow-hidden pointer-events-none"
            style={{
              top: `${zone.top}%`,
              left: `${zone.left}%`,
              width: `${zone.width}%`,
              height: `${zone.height}%`,
            }}
          >
            <div className="w-full my-auto px-2 space-y-2.5 overflow-hidden pointer-events-auto">
              <h1
                className={`text-2xl sm:text-3xl md:text-4xl font-bold tracking-wide leading-tight ${serifClass}`}
                style={{ color: TEMPLATE_CARD_COUPLE_NAME_COLOR }}
              >
                {brideFirstName || 'Bride'} & {groomFirstName || 'Groom'}
              </h1>

              {customText ? (
                <p
                  className="text-xs sm:text-sm font-semibold uppercase tracking-widest"
                  style={{ color: TEMPLATE_CARD_DETAIL_TEXT_COLOR }}
                >
                  {customText}
                </p>
              ) : (
                <p
                  className="text-[11px] sm:text-xs font-semibold uppercase tracking-widest"
                  style={{ color: TEMPLATE_CARD_DETAIL_TEXT_COLOR }}
                >
                  Save The Date
                </p>
              )}

              <div
                className="text-xs sm:text-sm font-bold tracking-wider pt-0.5 flex items-center justify-center gap-1.5"
                style={{ color: TEMPLATE_CARD_DETAIL_TEXT_COLOR }}
              >
                <Calendar className="w-3.5 h-3.5 shrink-0" style={{ color: TEMPLATE_CARD_DETAIL_TEXT_COLOR }} />
                <span>{formattedDate}</span>
              </div>

              {venueName && (
                <p
                  className="text-[11px] sm:text-xs font-semibold truncate max-w-xs mx-auto"
                  style={{ color: TEMPLATE_CARD_DETAIL_TEXT_COLOR }}
                >
                  {venueName} {venueAddress ? `• ${venueAddress}` : ''}
                </p>
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Decorative Outer Frame Trim */}
          <div
            className="absolute inset-3 border rounded-2xl pointer-events-none opacity-40"
            style={{ borderColor: accentColor }}
          />
          <div
            className="absolute inset-5 border rounded-xl pointer-events-none opacity-25"
            style={{ borderColor: accentColor }}
          />

          {/* Top Header Ornaments */}
          <div className="relative z-10 space-y-2 pt-2">
            <div className="flex items-center justify-center gap-2">
              <span className="h-[1px] w-8 bg-current opacity-40" style={{ backgroundColor: accentColor }} />
              <span
                className="text-[10px] tracking-[0.3em] font-semibold uppercase px-3 py-1 rounded-full border border-current opacity-90"
                style={{ color: accentColor, borderColor: `${accentColor}50` }}
              >
                {customText ? 'Official Invitation' : 'Save The Date'}
              </span>
              <span className="h-[1px] w-8 bg-current opacity-40" style={{ backgroundColor: accentColor }} />
            </div>

            <p className={`text-xs sm:text-sm opacity-80 ${sansClass} tracking-widest uppercase`}>
              Together with their families
            </p>
          </div>

          {/* Main Content Area */}
          <div className="relative z-10 space-y-5 my-auto py-4 w-full">
            {/* Couple Names */}
            <div className="space-y-1">
              <h1
                className={`text-3xl sm:text-4xl md:text-5xl font-bold tracking-wide leading-tight ${serifClass}`}
                style={{ color: accentColor }}
              >
                {brideFirstName || 'Bride'}
              </h1>
              <div className="flex items-center justify-center gap-3 my-1">
                <span className="h-[1px] w-12 opacity-30" style={{ backgroundColor: accentColor }} />
                <Heart className="w-4 h-4 animate-pulse fill-current" style={{ color: accentColor }} />
                <span className="h-[1px] w-12 opacity-30" style={{ backgroundColor: accentColor }} />
              </div>
              <h1
                className={`text-3xl sm:text-4xl md:text-5xl font-bold tracking-wide leading-tight ${serifClass}`}
                style={{ color: accentColor }}
              >
                {groomFirstName || 'Groom'}
              </h1>
            </div>

            {/* Personalized Guest Invitation Slot */}
            {customText && (
              <div className="space-y-1 my-2">
                <p className="text-[11px] uppercase tracking-[0.25em] opacity-75 font-light">
                  request the presence of
                </p>
                <div
                  className="inline-block px-5 py-2 rounded-2xl text-base sm:text-lg font-serif font-bold tracking-wide bg-black/25 backdrop-blur border shadow-md"
                  style={{ color: secondaryColor, borderColor: `${accentColor}40` }}
                >
                  {customText}
                </div>
              </div>
            )}

            {/* Monogram Seal */}
            <div className="my-3 flex justify-center">
              <div
                className="w-12 h-12 rounded-full border-2 flex items-center justify-center text-xs font-serif font-bold tracking-tighter shadow-inner opacity-90"
                style={{
                  borderColor: accentColor,
                  color: accentColor,
                  backgroundColor: 'rgba(0,0,0,0.15)',
                }}
              >
                {monogram}
              </div>
            </div>

            {/* Date Display */}
            <div className="space-y-1 pt-1">
              <p className="text-[11px] uppercase tracking-[0.2em] opacity-70">
                Are getting married on
              </p>
              <div
                className="inline-flex items-center gap-2 px-5 py-2 rounded-2xl bg-black/20 border border-white/10 text-xs sm:text-sm font-semibold tracking-wider"
                style={{ color: secondaryColor }}
              >
                <Calendar className="w-4 h-4" style={{ color: accentColor }} />
                <span>{formattedDate}</span>
              </div>
            </div>

            {/* Optional Venue Display */}
            {venueName && (
              <div className="pt-2 text-xs opacity-90 space-y-0.5 max-w-xs mx-auto">
                <div className="flex items-center justify-center gap-1.5 font-semibold" style={{ color: accentColor }}>
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{venueName}</span>
                </div>
                {venueAddress && (
                  <p className="text-[11px] opacity-75">{venueAddress}</p>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Footer / Watermark Slot */}
      <div className={`relative z-10 w-full pt-2 flex flex-col items-center justify-center gap-1.5 ${activeTemplateUrl ? '' : 'border-t border-white/10'}`}>
        <p
          className="text-[10px] tracking-[0.2em] uppercase font-semibold opacity-85"
          style={activeTemplateUrl ? { color: TEMPLATE_CARD_DETAIL_TEXT_COLOR } : undefined}
        >
          Formal Invitation To Follow
        </p>

        {/* Tasteful "Made with Amorah" Watermark (When enabled) */}
        {watermark && (
          <div
            id="amorah-watermark-badge"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold tracking-wider bg-black/40 backdrop-blur border border-white/20 text-white/90 shadow-sm"
          >
            <span>Made with <strong className="font-bold text-amber-200">Amorah</strong></span>
          </div>
        )}
      </div>
    </div>
  );
};
