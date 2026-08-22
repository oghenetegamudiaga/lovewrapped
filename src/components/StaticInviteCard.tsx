import React, { useState, useEffect, useMemo } from 'react';
import { Heart, Calendar, MapPin } from 'lucide-react';
import { resolveThemeStyles } from '../config/weddingThemes';
import { getPublicThemeAssetsApi } from '../lib/api';
import { TextZone, CardTemplateRecord, CardTemplateField } from '../types';

export const TEMPLATE_CARD_COUPLE_NAME_COLOR = '#3A0D22';
export const TEMPLATE_CARD_DETAIL_TEXT_COLOR = '#000000';

export interface StaticInviteCardProps {
  brideFirstName: string;
  groomFirstName: string;
  weddingDate?: string;
  venueName?: string;
  venueAddress?: string;
  customText?: string;
  inviteeName?: string;
  themeId?: string;
  colorVariant?: string;
  fontVariant?: string;
  watermark?: boolean;
  cardTemplateUrl?: string | null;
  template?: CardTemplateRecord | null;
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
  inviteeName,
  themeId = 'classic-burgundy',
  colorVariant = 'royal-gold',
  fontVariant = 'classic-serif',
  watermark = false,
  cardTemplateUrl,
  template,
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

  const resolvedTemplateUrl = template?.image_url || activeTemplateUrl;

  const splitDateParts = useMemo(() => {
    if (!weddingDate) return { month: 'FEB', day: '14', year: '2028' };
    try {
      const d = new Date(weddingDate);
      if (isNaN(d.getTime())) {
        return { month: 'FEB', day: '14', year: '2028' };
      }
      const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
      const day = d.getDate().toString();
      const year = d.getFullYear().toString();
      return { month, day, year };
    } catch {
      return { month: 'FEB', day: '14', year: '2028' };
    }
  }, [weddingDate]);

  const resolveFieldValue = (field: CardTemplateField): string => {
    switch (field.field_key) {
      case 'couple_names':
        return brideFirstName && groomFirstName ? `${brideFirstName} & ${groomFirstName}` : customText || 'JOYCE & MARTINS';
      case 'invites_line':
        return field.static_text || 'SPECIALLY INVITES THE PRESENCE OF';
      case 'invitee_name':
        return inviteeName || customText || 'HONORED GUEST';
      case 'custom_text':
        return customText || 'Save The Date';
      case 'date':
        return formattedDate;
      case 'venue':
        return venueName ? `${venueName}${venueAddress ? ` • ${venueAddress}` : ''}` : 'LAGOS, NIGERIA';
      default:
        return field.static_text || '';
    }
  };

  const isCustomTemplateActive = Boolean(template || resolvedTemplateUrl);

  return (
    <div
      ref={cardRef}
      id="static-invite-card"
      style={{ backgroundColor: cardBgColor, color: baseTheme.textColor }}
      className={`relative w-full max-w-[540px] mx-auto overflow-hidden transition-all select-none flex flex-col justify-between items-center text-center aspect-[4/5] min-h-[640px] ${
        isCustomTemplateActive
          ? 'p-0 border-0 rounded-none shadow-none'
          : 'rounded-3xl p-8 sm:p-10 shadow-2xl border-4 border-double border-opacity-40'
      } ${className}`}
    >
      {/* Custom Card Template Backdrop (If present) */}
      {template && template.text_fields && template.text_fields.length > 0 ? (
        <>
          <img
            src={template.image_url}
            alt={template.name || 'Invitation Card Template'}
            className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
          />

          {/* Config-driven absolute text fields */}
          {template.text_fields.map((field) => {
            if (field.field_key === 'date_split') {
              return (
                <div
                  key={field.field_key}
                  className="absolute z-10 pointer-events-none flex items-center justify-center overflow-hidden"
                  style={{
                    left: `${field.x}%`,
                    top: `${field.y}%`,
                    width: `${field.width}%`,
                  }}
                >
                  <div
                    className={`flex items-center justify-center gap-2.5 w-full ${field.font_family === 'serif' ? serifClass : sansClass}`}
                    style={{ color: field.color || '#1B3B2B', fontSize: `${field.max_font_size || 18}px` }}
                  >
                    <span className="uppercase text-[0.85em] tracking-widest font-semibold">{splitDateParts.month}</span>
                    <span className="opacity-40 font-light text-[0.9em]">|</span>
                    <span className="text-[1.4em] font-bold tracking-tight">{splitDateParts.day}</span>
                    <span className="opacity-40 font-light text-[0.9em]">|</span>
                    <span className="uppercase text-[0.85em] tracking-widest font-semibold">{splitDateParts.year}</span>
                  </div>
                </div>
              );
            }

            if (field.field_key === 'invitation_badge') {
              const badgeText = field.static_text || 'OFFICIAL INVITATION';
              return (
                <div
                  key={field.field_key}
                  className="absolute z-10 pointer-events-none flex items-center justify-center overflow-hidden"
                  style={{
                    left: `${field.x}%`,
                    top: `${field.y}%`,
                    width: `${field.width}%`,
                  }}
                >
                  <div className="flex items-center justify-center gap-3 w-full">
                    <span className="h-[1px] w-6 sm:w-12 opacity-30 bg-current" style={{ backgroundColor: field.color || accentColor }} />
                    <span
                      className="inline-block px-3 py-0.5 rounded-full border text-[0.75em] font-bold tracking-[0.2em] uppercase"
                      style={{
                        borderColor: `${field.color || accentColor}40`,
                        backgroundColor: `${field.color || accentColor}10`,
                        color: field.color || accentColor,
                      }}
                    >
                      {badgeText}
                    </span>
                    <span className="h-[1px] w-6 sm:w-12 opacity-30 bg-current" style={{ backgroundColor: field.color || accentColor }} />
                  </div>
                </div>
              );
            }

            if (field.field_key === 'couple_names') {
              const bride = brideFirstName || 'Bride';
              const groom = groomFirstName || 'Groom';
              const maxSz = field.max_font_size || 38;
              const minSz = field.min_font_size || 22;
              const longestNameLen = Math.max(bride.length, groom.length);
              const computedSize = longestNameLen <= 8 ? maxSz : Math.max(minSz, Math.round(maxSz - (longestNameLen - 8) * 1.2));

              return (
                <div
                  key={field.field_key}
                  className="absolute z-10 pointer-events-none flex flex-col items-center justify-center text-center overflow-hidden"
                  style={{
                    left: `${field.x}%`,
                    top: `${field.y}%`,
                    width: `${field.width}%`,
                  }}
                >
                  <span
                    className={`font-bold leading-tight truncate w-full ${field.font_family === 'serif' ? serifClass : sansClass}`}
                    style={{ color: field.color || TEMPLATE_CARD_COUPLE_NAME_COLOR, fontSize: `${computedSize}px` }}
                  >
                    {bride}
                  </span>
                  <div className="flex items-center justify-center gap-2 my-1 opacity-70">
                    <span className="h-[1px] w-5 bg-current" style={{ backgroundColor: field.color || accentColor }} />
                    <Heart className="w-3.5 h-3.5 fill-current" style={{ color: field.color || accentColor }} />
                    <span className="h-[1px] w-5 bg-current" style={{ backgroundColor: field.color || accentColor }} />
                  </div>
                  <span
                    className={`font-bold leading-tight truncate w-full ${field.font_family === 'serif' ? serifClass : sansClass}`}
                    style={{ color: field.color || TEMPLATE_CARD_COUPLE_NAME_COLOR, fontSize: `${computedSize}px` }}
                  >
                    {groom}
                  </span>
                </div>
              );
            }

            if (field.field_key === 'invitee_name') {
              const nameVal = inviteeName || customText || 'HONORED GUEST';
              const maxSz = field.max_font_size || 20;
              const minSz = field.min_font_size || 14;
              const len = nameVal.length;
              const computedSize = len <= 12 ? maxSz : Math.max(minSz, Math.round(maxSz - (len - 12) * 0.5));

              return (
                <div
                  key={field.field_key}
                  className="absolute z-10 pointer-events-none flex items-center justify-center overflow-hidden"
                  style={{
                    left: `${field.x}%`,
                    top: `${field.y}%`,
                    width: `${field.width}%`,
                  }}
                >
                  <div
                    className="inline-block px-5 py-1.5 rounded-full border shadow-2xs backdrop-blur-xs text-center"
                    style={{
                      borderColor: `${field.color || accentColor}40`,
                      backgroundColor: `${field.color || accentColor}12`,
                      color: field.color || TEMPLATE_CARD_COUPLE_NAME_COLOR,
                    }}
                  >
                    <span
                      className={`font-semibold tracking-wide ${field.font_family === 'serif' ? serifClass : sansClass}`}
                      style={{ fontSize: `${computedSize}px` }}
                    >
                      {nameVal}
                    </span>
                  </div>
                </div>
              );
            }

            if (field.field_key === 'monogram_seal') {
              return (
                <div
                  key={field.field_key}
                  className="absolute z-10 pointer-events-none flex items-center justify-center overflow-hidden"
                  style={{
                    left: `${field.x}%`,
                    top: `${field.y}%`,
                    width: `${field.width}%`,
                  }}
                >
                  <div
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border-2 border-double flex items-center justify-center font-serif text-xs sm:text-sm font-bold tracking-tighter shadow-xs"
                    style={{
                      borderColor: field.color || accentColor,
                      color: field.color || accentColor,
                      backgroundColor: `${field.color || accentColor}0D`,
                    }}
                  >
                    {monogram}
                  </div>
                </div>
              );
            }

            if (field.field_key === 'marriage_date_line') {
              const prefixText = field.static_text || 'ARE GETTING MARRIED ON';
              return (
                <div
                  key={field.field_key}
                  className="absolute z-10 pointer-events-none flex flex-col items-center justify-center gap-1.5 overflow-hidden text-center"
                  style={{
                    left: `${field.x}%`,
                    top: `${field.y}%`,
                    width: `${field.width}%`,
                  }}
                >
                  <span
                    className="text-[0.7em] font-semibold uppercase tracking-[0.2em] opacity-85"
                    style={{ color: field.color || TEMPLATE_CARD_DETAIL_TEXT_COLOR }}
                  >
                    {prefixText}
                  </span>
                  <div
                    className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full border shadow-2xs"
                    style={{
                      borderColor: `${field.color || accentColor}40`,
                      backgroundColor: `${field.color || accentColor}10`,
                      color: field.color || TEMPLATE_CARD_DETAIL_TEXT_COLOR,
                    }}
                  >
                    <Calendar className="w-3.5 h-3.5 shrink-0" style={{ color: field.color || accentColor }} />
                    <span
                      className={`font-semibold uppercase tracking-wider text-[0.8em] ${field.font_family === 'serif' ? serifClass : sansClass}`}
                    >
                      {formattedDate}
                    </span>
                  </div>
                </div>
              );
            }

            if (field.field_key === 'venue') {
              const venueVal = venueName ? `${venueName}${venueAddress ? ` • ${venueAddress}` : ''}` : 'LAGOS, NIGERIA';
              return (
                <div
                  key={field.field_key}
                  className="absolute z-10 pointer-events-none flex items-center justify-center overflow-hidden"
                  style={{
                    left: `${field.x}%`,
                    top: `${field.y}%`,
                    width: `${field.width}%`,
                  }}
                >
                  <div
                    className="inline-flex items-center justify-center gap-1.5 w-full text-[0.85em]"
                    style={{ color: field.color || TEMPLATE_CARD_DETAIL_TEXT_COLOR }}
                  >
                    <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: field.color || accentColor }} />
                    <span className={`truncate max-w-full font-medium ${field.font_family === 'serif' ? serifClass : sansClass}`}>
                      {venueVal}
                    </span>
                  </div>
                </div>
              );
            }

            if (field.field_key === 'footer_note') {
              const noteText = field.static_text || 'FORMAL INVITATION TO FOLLOW';
              return (
                <div
                  key={field.field_key}
                  className="absolute z-10 pointer-events-none flex flex-col items-center justify-center w-full overflow-hidden"
                  style={{
                    left: `${field.x}%`,
                    top: `${field.y}%`,
                    width: `${field.width}%`,
                  }}
                >
                  <span className="h-[1px] w-3/4 bg-current opacity-25 mb-2" style={{ backgroundColor: field.color || accentColor }} />
                  <span
                    className="text-[0.7em] font-semibold uppercase tracking-[0.25em]"
                    style={{ color: field.color || TEMPLATE_CARD_DETAIL_TEXT_COLOR }}
                  >
                    {noteText}
                  </span>
                </div>
              );
            }

            const val = resolveFieldValue(field);
            if (!val) return null;

            const maxSz = field.max_font_size || 24;
            const minSz = field.min_font_size || 12;
            const len = val.length;
            const computedSize = len <= 15 ? maxSz : len >= 40 ? minSz : Math.round(maxSz - ((len - 15) / 25) * (maxSz - minSz));

            return (
              <div
                key={field.field_key}
                className="absolute z-10 pointer-events-none flex items-center overflow-hidden"
                style={{
                  left: `${field.x}%`,
                  top: `${field.y}%`,
                  width: `${field.width}%`,
                  justifyContent: field.align === 'left' ? 'flex-start' : field.align === 'right' ? 'flex-end' : 'center',
                  textAlign: field.align || 'center',
                }}
              >
                <span
                  className={`w-full leading-tight truncate ${field.font_family === 'serif' ? serifClass : sansClass}`}
                  style={{
                    color: field.color || (field.field_key === 'couple_names' ? TEMPLATE_CARD_COUPLE_NAME_COLOR : TEMPLATE_CARD_DETAIL_TEXT_COLOR),
                    fontSize: `${computedSize}px`,
                  }}
                >
                  {val}
                </span>
              </div>
            );
          })}
        </>
      ) : resolvedTemplateUrl ? (
        <>
          <img
            src={resolvedTemplateUrl}
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
