import React, { useState, useEffect } from 'react';
import { Sparkles, Calendar, MapPin, Edit3, UserCheck, X, Check, AlertCircle, Copy, Share2, Shield, Heart, Users, Plus, Upload, Download, Search, Filter, Trash2, Link as LinkIcon, Eye, CheckCircle2, Gift, BookOpen, Save, ArrowUp, ArrowDown, Palette, Type, Layers } from 'lucide-react';
import { Wedding, WeddingEvent, WeddingRSVP, WeddingGuestWithEvents, CoupleAccount } from '../types';
import { WEDDING_THEMES, ACCENT_COLOR_VARIANTS, FONT_PAIRING_VARIANTS } from '../config/weddingThemes';
import {
  getCoupleWeddingDashboardApi,
  updateCoupleWeddingInfoApi,
  getCoupleWeddingGuestsApi,
  addCoupleWeddingGuestApi,
  updateCoupleWeddingGuestApi,
  deleteCoupleWeddingGuestApi,
  importCoupleWeddingGuestsCsvApi,
  exportCoupleWeddingGuestsCsvUrl,
} from '../lib/api';

interface WeddingsDashboardViewProps {
  weddingId: string;
  onNavigate: (path: string) => void;
  currentCouple?: CoupleAccount | null;
}

const SECTION_LABELS: Record<string, string> = {
  schedule: 'Event Schedule & Locations',
  love_story: 'Our Love Story',
  registry: 'Gift Registry & Account Notes',
  rsvp: 'RSVP Form',
};

export const WeddingsDashboardView: React.FC<WeddingsDashboardViewProps> = ({
  weddingId,
  onNavigate,
  currentCouple,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'guests'>('overview');
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [rsvps, setRsvps] = useState<WeddingRSVP[]>([]);
  const [guests, setGuests] = useState<WeddingGuestWithEvents[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filters for Guest List
  const [searchQuery, setSearchQuery] = useState('');
  const [rsvpFilter, setRsvpFilter] = useState<'all' | 'attending' | 'declined' | 'pending'>('all');

  // Phase 4 Settings & Variant State
  const [editThemeId, setEditThemeId] = useState('classic-burgundy');
  const [editColorVariant, setEditColorVariant] = useState('royal-gold');
  const [editFontVariant, setEditFontVariant] = useState('classic-serif');
  const [editSectionOrder, setEditSectionOrder] = useState<string[]>(['schedule', 'love_story', 'registry', 'rsvp']);
  const [editLoveStory, setEditLoveStory] = useState('');
  const [editRegistryInfo, setEditRegistryInfo] = useState('');
  const [editBrideFirstName, setEditBrideFirstName] = useState('');
  const [editBrideOtherNames, setEditBrideOtherNames] = useState('');
  const [editGroomFirstName, setEditGroomFirstName] = useState('');
  const [editGroomOtherNames, setEditGroomOtherNames] = useState('');
  const [editCoupleNames, setEditCoupleNames] = useState('');
  const [isSavingInfo, setIsSavingInfo] = useState(false);
  const [infoSaveSuccess, setInfoSaveSuccess] = useState(false);

  // Add / Edit Guest Modal State
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<WeddingGuestWithEvents | null>(null);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [plusOneAllowed, setPlusOneAllowed] = useState(false);
  const [dietaryNotes, setDietaryNotes] = useState('');
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [isSavingGuest, setIsSavingGuest] = useState(false);

  // CSV Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [csvRawText, setCsvRawText] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const loadDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [dashRes, guestsRes] = await Promise.all([
        getCoupleWeddingDashboardApi(weddingId),
        getCoupleWeddingGuestsApi(weddingId).catch(() => []),
      ]);

      setWedding(dashRes.wedding);
      const evList = dashRes.events || (dashRes.event ? [dashRes.event] : []);
      setEvents(evList);
      setRsvps(dashRes.rsvps || []);
      setGuests(guestsRes);

      if (dashRes.wedding) {
        setEditThemeId(dashRes.wedding.theme_id || 'classic-burgundy');
        setEditColorVariant(dashRes.wedding.color_variant || 'royal-gold');
        setEditFontVariant(dashRes.wedding.font_variant || 'classic-serif');
        setEditSectionOrder(
          dashRes.wedding.section_order && dashRes.wedding.section_order.length > 0
            ? dashRes.wedding.section_order
            : ['schedule', 'love_story', 'registry', 'rsvp']
        );
        setEditRegistryInfo(dashRes.wedding.registry_info || '');
        setEditLoveStory(dashRes.wedding.love_story || '');
        setEditBrideFirstName(dashRes.wedding.bride_first_name || '');
        setEditBrideOtherNames(dashRes.wedding.bride_other_names || '');
        setEditGroomFirstName(dashRes.wedding.groom_first_name || '');
        setEditGroomOtherNames(dashRes.wedding.groom_other_names || '');
        setEditCoupleNames(dashRes.wedding.couple_names || '');
      }

      if (evList.length > 0) {
        setSelectedEventIds(evList.map((e) => e.id));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load wedding dashboard.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [weddingId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6 text-center">
        <Sparkles className="w-8 h-8 text-coral animate-spin mb-3" />
        <p className="text-xs font-semibold text-mauve">Loading Couple Dashboard...</p>
      </div>
    );
  }

  if (error || !wedding) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6 text-center">
        <div className="p-8 rounded-3xl bg-cream-card border border-cream-border max-w-md w-full shadow-lg">
          <Shield className="w-10 h-10 text-coral mx-auto mb-3" />
          <h2 className="font-serif text-xl font-bold text-maroon mb-2">Dashboard Access</h2>
          <p className="text-xs text-mauve mb-6">{error || 'Wedding invitation not found.'}</p>
          <button
            onClick={() => onNavigate('/weddings')}
            className="px-6 py-2.5 rounded-full bg-maroon text-cream font-semibold text-xs"
          >
            Back to Weddings
          </button>
        </div>
      </div>
    );
  }

  const generalShareUrl = `${window.location.origin}/w/wedding/${wedding.slug}`;

  const getGuestRsvpStatus = (guestId: string) => {
    const gRsvps = rsvps.filter((r) => r.guest_id === guestId);
    if (gRsvps.length === 0) return 'pending';
    return gRsvps.some((r) => r.attending) ? 'attending' : 'declined';
  };

  const filteredGuests = guests.filter((g) => {
    const status = getGuestRsvpStatus(g.id);
    const matchesFilter = rsvpFilter === 'all' || status === rsvpFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      g.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      (g.email && g.email.toLowerCase().includes(searchQuery.toLowerCase().trim()));

    return matchesFilter && matchesSearch;
  });

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...editSectionOrder];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;

    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;
    setEditSectionOrder(newOrder);
  };

  const toggleSectionVisibility = (key: string) => {
    if (editSectionOrder.includes(key)) {
      if (editSectionOrder.length <= 1) {
        alert('You must keep at least one active section.');
        return;
      }
      setEditSectionOrder(editSectionOrder.filter((k) => k !== key));
    } else {
      setEditSectionOrder([...editSectionOrder, key]);
    }
  };

  const handleSaveWeddingInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingInfo(true);
    setInfoSaveSuccess(false);

    try {
      const fullCoupleNames = `${editBrideFirstName}${editBrideOtherNames ? ' ' + editBrideOtherNames : ''} & ${editGroomFirstName}${editGroomOtherNames ? ' ' + editGroomOtherNames : ''}`;
      const res = await updateCoupleWeddingInfoApi(weddingId, {
        bride_first_name: editBrideFirstName,
        bride_other_names: editBrideOtherNames,
        groom_first_name: editGroomFirstName,
        groom_other_names: editGroomOtherNames,
        couple_names: fullCoupleNames,
        theme_id: editThemeId,
        color_variant: editColorVariant,
        font_variant: editFontVariant,
        section_order: editSectionOrder,
        registry_info: editRegistryInfo,
        love_story: editLoveStory,
      });

      setWedding(res.wedding);
      setInfoSaveSuccess(true);
      setTimeout(() => setInfoSaveSuccess(false), 3000);
    } catch (err: unknown) {
      alert('Failed to update wedding details & customization settings.');
    } finally {
      setIsSavingInfo(false);
    }
  };

  const handleOpenAddGuestModal = () => {
    setEditingGuest(null);
    setGuestName('');
    setGuestEmail('');
    setPlusOneAllowed(false);
    setDietaryNotes('');
    setSelectedEventIds(events.map((e) => e.id));
    setIsGuestModalOpen(true);
  };

  const handleOpenEditGuestModal = (g: WeddingGuestWithEvents) => {
    setEditingGuest(g);
    setGuestName(g.name);
    setGuestEmail(g.email || '');
    setPlusOneAllowed(g.plus_one_allowed);
    setDietaryNotes(g.dietary_notes || '');
    setSelectedEventIds(g.event_ids || events.map((e) => e.id));
    setIsGuestModalOpen(true);
  };

  const handleSaveGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;

    setIsSavingGuest(true);
    try {
      if (editingGuest) {
        const res = await updateCoupleWeddingGuestApi(weddingId, editingGuest.id, {
          name: guestName,
          email: guestEmail,
          plus_one_allowed: plusOneAllowed,
          dietary_notes: dietaryNotes,
          event_ids: selectedEventIds,
        });
        setGuests((prev) => prev.map((g) => (g.id === editingGuest.id ? res.guest : g)));
      } else {
        const res = await addCoupleWeddingGuestApi(weddingId, {
          name: guestName,
          email: guestEmail,
          plus_one_allowed: plusOneAllowed,
          dietary_notes: dietaryNotes,
          event_ids: selectedEventIds,
        });
        setGuests((prev) => [...prev, res.guest]);
      }
      setIsGuestModalOpen(false);
    } catch (err: unknown) {
      alert('Failed to save guest record.');
    } finally {
      setIsSavingGuest(false);
    }
  };

  const handleDeleteGuest = async (guestId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete guest "${name}"?`)) return;
    try {
      await deleteCoupleWeddingGuestApi(weddingId, guestId);
      setGuests((prev) => prev.filter((g) => g.id !== guestId));
    } catch (err) {
      alert('Failed to delete guest.');
    }
  };

  const handleParseAndImportCsv = async () => {
    if (!csvRawText.trim()) return;
    setIsImporting(true);

    try {
      const lines = csvRawText.split(/\r?\n/).filter((l) => l.trim());
      if (lines.length <= 1) {
        alert('CSV must contain a header row and at least one guest data row.');
        setIsImporting(false);
        return;
      }

      const parsedGuests = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map((c) => c.trim().replace(/^"(.*)"$/, '$1'));
        if (!cols[0]) continue;

        const name = cols[0];
        const email = cols[1] || undefined;
        const plusOne = cols[2] ? cols[2].toLowerCase() === 'yes' || cols[2].toLowerCase() === 'true' : false;
        const notes = cols[3] || undefined;

        parsedGuests.push({
          name,
          email,
          plus_one_allowed: plusOne,
          dietary_notes: notes,
          event_ids: events.map((e) => e.id),
        });
      }

      const res = await importCoupleWeddingGuestsCsvApi(weddingId, parsedGuests);
      alert(`Successfully imported ${res.imported_count} guests!`);
      setGuests((prev) => [...prev, ...res.guests]);
      setIsImportModalOpen(false);
      setCsvRawText('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to import CSV guests.';
      alert(msg);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream text-maroon font-sans py-10 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header Bar */}
        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-cream-border shadow-md bg-cream-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-maroon">
              {wedding.bride_first_name && wedding.groom_first_name
                ? `${wedding.bride_first_name}${wedding.bride_other_names ? ' ' + wedding.bride_other_names : ''} & ${wedding.groom_first_name}${wedding.groom_other_names ? ' ' + wedding.groom_other_names : ''}`
                : wedding.couple_names || 'Wedding Dashboard'}
            </h1>
            <p className="text-xs text-mauve mt-1">
              Manage multi-event schedules, guest RSVPs, visual customization, and section order.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate(`/w/wedding/${wedding.slug}`)}
              className="px-5 py-2.5 rounded-full bg-maroon hover:bg-maroon-light text-cream font-semibold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>General Invitation View</span>
            </button>
          </div>
        </div>

        {/* Dashboard Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-cream-border pb-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-5 py-2.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-maroon text-cream shadow-sm'
                : 'bg-cream text-mauve hover:text-maroon'
            }`}
          >
            Overview & Settings ({events.length} Events)
          </button>
          <button
            onClick={() => setActiveTab('guests')}
            className={`px-5 py-2.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'guests'
                ? 'bg-maroon text-cream shadow-sm'
                : 'bg-cream text-mauve hover:text-maroon'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Guest List & RSVPs ({guests.length})</span>
          </button>
        </div>

        {/* TAB 1: Overview, Schedule & Phase 4 Settings */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Share General Link Banner */}
            <div className="p-4 sm:p-5 rounded-3xl bg-cream-card border border-cream-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
              <div>
                <p className="font-semibold text-maroon">General Public Link:</p>
                <p className="font-mono text-mauve text-[11px] truncate max-w-md">{generalShareUrl}</p>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generalShareUrl);
                  alert('General invitation link copied!');
                }}
                className="px-4 py-2 rounded-full bg-cream border border-cream-border text-maroon font-semibold text-xs hover:border-coral transition-colors flex items-center gap-1.5 shrink-0"
              >
                <Copy className="w-3.5 h-3.5 text-coral" />
                <span>Copy General Link</span>
              </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="p-5 rounded-3xl bg-cream-card border border-cream-border text-center">
                <p className="text-[10px] font-semibold text-mauve uppercase tracking-wider">Total Guests</p>
                <p className="font-serif text-3xl font-bold text-maroon mt-1">{guests.length}</p>
              </div>
              <div className="p-5 rounded-3xl bg-cream-card border border-cream-border text-center">
                <p className="text-[10px] font-semibold text-mauve uppercase tracking-wider">Opened Invitations</p>
                <p className="font-serif text-3xl font-bold text-coral mt-1">
                  {guests.filter((g) => g.opened_at).length}
                </p>
              </div>
              <div className="p-5 rounded-3xl bg-cream-card border border-cream-border text-center">
                <p className="text-[10px] font-semibold text-mauve uppercase tracking-wider">Confirmed Attending</p>
                <p className="font-serif text-3xl font-bold text-emerald-700 mt-1">
                  {guests.filter((g) => getGuestRsvpStatus(g.id) === 'attending').length}
                </p>
              </div>
              <div className="p-5 rounded-3xl bg-cream-card border border-cream-border text-center">
                <p className="text-[10px] font-semibold text-mauve uppercase tracking-wider">Total Responses</p>
                <p className="font-serif text-3xl font-bold text-amber-700 mt-1">{rsvps.length}</p>
              </div>
            </div>

            {/* PHASE 4: VISUAL THEMES, VARIANTS & SECTION REORDERING SETTINGS */}
            <div className="p-6 sm:p-8 rounded-3xl bg-cream-card border border-cream-border space-y-6">
              <div className="flex items-center justify-between border-b border-cream-border pb-4">
                <div>
                  <h2 className="font-serif text-lg font-bold text-maroon flex items-center gap-2">
                    <Palette className="w-5 h-5 text-coral" /> Visual Customization & Section Order
                  </h2>
                  <p className="text-xs text-mauve">Customize base themes, curated color/font variants, and reorder Scene 4 info sections.</p>
                </div>
              </div>

              {infoSaveSuccess && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Customization settings and registry details updated successfully!</span>
                </div>
              )}

              <form onSubmit={handleSaveWeddingInfo} className="space-y-6 text-xs">
                {/* 1. Base Theme Selection */}
                <div className="space-y-3">
                  <label className="block font-bold text-maroon uppercase tracking-wider text-[11px]">1. Base Visual Theme</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {Object.values(WEDDING_THEMES).map((t) => (
                      <button
                        type="button"
                        key={t.id}
                        onClick={() => setEditThemeId(t.id)}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                          editThemeId === t.id
                            ? 'border-maroon bg-cream/90 font-bold shadow-xs'
                            : 'border-cream-border bg-cream/40 hover:bg-cream/70'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-3 h-3 rounded-full border border-black/20" style={{ backgroundColor: t.accentColor }} />
                          <span className="text-xs text-maroon">{t.name}</span>
                        </div>
                        <p className="text-[10px] text-mauve leading-tight">{t.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Curated Accent Color Selection */}
                <div className="space-y-3 pt-3 border-t border-cream-border">
                  <label className="block font-bold text-maroon uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-coral" /> 2. Accent Color Variant
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {Object.values(ACCENT_COLOR_VARIANTS).map((c) => (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => setEditColorVariant(c.id)}
                        className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                          editColorVariant === c.id
                            ? 'border-maroon bg-cream/90 shadow-xs font-bold'
                            : 'border-cream-border bg-cream/40 hover:bg-cream/70'
                        }`}
                      >
                        <span className="w-4 h-4 rounded-full border border-black/20" style={{ backgroundColor: c.accentColor }} />
                        <span className="text-[11px] text-maroon">{c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Curated Font Pairing Selection */}
                <div className="space-y-3 pt-3 border-t border-cream-border">
                  <label className="block font-bold text-maroon uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Type className="w-3.5 h-3.5 text-coral" /> 3. Font Pairing Variant
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {Object.values(FONT_PAIRING_VARIANTS).map((f) => (
                      <button
                        type="button"
                        key={f.id}
                        onClick={() => setEditFontVariant(f.id)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          editFontVariant === f.id
                            ? 'border-maroon bg-cream/90 shadow-xs'
                            : 'border-cream-border bg-cream/40 hover:bg-cream/70'
                        }`}
                      >
                        <p className={`text-xs font-bold text-maroon ${f.serifClass}`}>{f.name}</p>
                        <p className="text-[10px] text-mauve mt-1 leading-tight">{f.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Section Order & Visibility Toggles */}
                <div className="space-y-3 pt-3 border-t border-cream-border">
                  <label className="block font-bold text-maroon uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-coral" /> 4. Scene 4 Info Section Display Order & Visibility
                  </label>

                  <div className="space-y-2 max-w-lg">
                    {editSectionOrder.map((secKey, idx) => (
                      <div
                        key={secKey}
                        className="p-3 rounded-2xl bg-cream border border-cream-border flex items-center justify-between gap-3 text-xs"
                      >
                        <span className="font-semibold text-maroon">
                          {idx + 1}. {SECTION_LABELS[secKey] || secKey}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => moveSection(idx, 'up')}
                            className="p-1.5 rounded-lg bg-cream-card border border-cream-border text-maroon hover:border-coral disabled:opacity-30 cursor-pointer"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === editSectionOrder.length - 1}
                            onClick={() => moveSection(idx, 'down')}
                            className="p-1.5 rounded-lg bg-cream-card border border-cream-border text-maroon hover:border-coral disabled:opacity-30 cursor-pointer"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleSectionVisibility(secKey)}
                            className="px-2.5 py-1 rounded-lg bg-red-50 text-red-700 text-[10px] font-semibold hover:bg-red-100 cursor-pointer"
                          >
                            Hide
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Toggle Disabled Sections Quick Add */}
                  {Object.keys(SECTION_LABELS).some((k) => !editSectionOrder.includes(k)) && (
                    <div className="flex items-center gap-2 pt-2">
                      <span className="text-[11px] text-mauve">Disabled Sections:</span>
                      {Object.keys(SECTION_LABELS)
                        .filter((k) => !editSectionOrder.includes(k))
                        .map((k) => (
                          <button
                            key={k}
                            type="button"
                            onClick={() => toggleSectionVisibility(k)}
                            className="px-2.5 py-1 rounded-full bg-cream border border-cream-border text-maroon text-[11px] font-semibold hover:border-coral cursor-pointer flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3 text-coral" /> {SECTION_LABELS[k]}
                          </button>
                        ))}
                    </div>
                  )}
                </div>

                {/* 5. Text Information Inputs */}
                <div className="space-y-4 pt-3 border-t border-cream-border">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-maroon mb-1 text-xs">Bride's First Name</label>
                      <input
                        type="text"
                        required
                        value={editBrideFirstName}
                        onChange={(e) => setEditBrideFirstName(e.target.value)}
                        className="w-full p-3 rounded-2xl bg-cream border border-cream-border text-maroon text-xs focus:outline-none focus:border-coral"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-maroon mb-1 text-xs">Bride's Other Names</label>
                      <input
                        type="text"
                        value={editBrideOtherNames}
                        onChange={(e) => setEditBrideOtherNames(e.target.value)}
                        className="w-full p-3 rounded-2xl bg-cream border border-cream-border text-maroon text-xs focus:outline-none focus:border-coral"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-maroon mb-1 text-xs">Groom's First Name</label>
                      <input
                        type="text"
                        required
                        value={editGroomFirstName}
                        onChange={(e) => setEditGroomFirstName(e.target.value)}
                        className="w-full p-3 rounded-2xl bg-cream border border-cream-border text-maroon text-xs focus:outline-none focus:border-coral"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-maroon mb-1 text-xs">Groom's Other Names</label>
                      <input
                        type="text"
                        value={editGroomOtherNames}
                        onChange={(e) => setEditGroomOtherNames(e.target.value)}
                        className="w-full p-3 rounded-2xl bg-cream border border-cream-border text-maroon text-xs focus:outline-none focus:border-coral"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-maroon mb-1">Gift Registry Notes & Account Details</label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Account Name: Becky & Martins / Bank: GTBank / Account No: 0123456789"
                      value={editRegistryInfo}
                      onChange={(e) => setEditRegistryInfo(e.target.value)}
                      className="w-full p-3.5 rounded-2xl bg-cream border border-cream-border text-maroon text-xs focus:outline-none focus:border-coral leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-maroon mb-1">Our Love Story Text</label>
                    <textarea
                      rows={3}
                      placeholder="Share a short note about your love story..."
                      value={editLoveStory}
                      onChange={(e) => setEditLoveStory(e.target.value)}
                      className="w-full p-3.5 rounded-2xl bg-cream border border-cream-border text-maroon text-xs focus:outline-none focus:border-coral leading-relaxed"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-cream-border flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingInfo}
                    className="px-6 py-2.5 rounded-full bg-maroon hover:bg-maroon-light text-cream font-semibold text-xs shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5 text-coral" />
                    <span>{isSavingInfo ? 'Saving Settings...' : 'Save All Settings'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Multi-Event Schedule Cards */}
            <div className="p-6 sm:p-8 rounded-3xl bg-cream-card border border-cream-border space-y-6">
              <div className="flex items-center justify-between border-b border-cream-border pb-4">
                <div>
                  <h2 className="font-serif text-lg font-bold text-maroon">Multi-Event Schedule</h2>
                  <p className="text-xs text-mauve">Overview of all events included in your invitation.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {events.map((ev, idx) => {
                  const eventRsvps = rsvps.filter((r) => r.event_id === ev.id && r.attending);
                  const invitedCount = guests.filter((g) => g.event_ids.includes(ev.id)).length;
                  return (
                    <div key={ev.id} className="p-5 rounded-2xl bg-cream/70 border border-cream-border space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-coral uppercase tracking-wider">Event #{idx + 1}</span>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold">
                          {eventRsvps.length} Confirmed
                        </span>
                      </div>
                      <h3 className="font-serif font-bold text-base text-maroon">{ev.title}</h3>
                      <div className="space-y-1 text-xs text-mauve">
                        <p className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-coral shrink-0" />
                          <span>{ev.date} at {ev.time}</span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-coral shrink-0" />
                          <span>{ev.venue_name} {ev.venue_address ? `(${ev.venue_address})` : ''}</span>
                        </p>
                      </div>
                      <div className="pt-2 border-t border-cream-border text-[11px] text-mauve flex justify-between">
                        <span>Invited Guests: <strong>{invitedCount || guests.length}</strong></span>
                        <span>Confirmed: <strong>{eventRsvps.length}</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Guest List & Proactive Management */}
        {activeTab === 'guests' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-cream-card border border-cream-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-xl font-bold text-maroon">Proactive Guest List</h2>
                <p className="text-xs text-mauve">Generate personalized invitation links, manage plus-ones, and track RSVPs.</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setIsImportModalOpen(true)}
                  className="px-4 py-2.5 rounded-full bg-cream border border-cream-border text-maroon hover:border-coral text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-coral" />
                  <span>Bulk Import CSV</span>
                </button>
                <a
                  href={exportCoupleWeddingGuestsCsvUrl(weddingId)}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 rounded-full bg-cream border border-cream-border text-maroon hover:border-coral text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-coral" />
                  <span>Export CSV</span>
                </a>
                <button
                  onClick={handleOpenAddGuestModal}
                  className="px-5 py-2.5 rounded-full bg-maroon hover:bg-maroon-light text-cream font-semibold text-xs shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-coral" />
                  <span>Add Guest</span>
                </button>
              </div>
            </div>

            <div className="p-4 rounded-3xl bg-cream-card border border-cream-border flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-mauve absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search guest name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-2xl bg-cream border border-cream-border text-maroon text-xs focus:outline-none focus:border-coral"
                />
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-mauve font-semibold flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" /> RSVP Filter:
                </span>
                {(['all', 'attending', 'declined', 'pending'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setRsvpFilter(f)}
                    className={`px-3 py-1.5 rounded-full capitalize text-[11px] font-semibold cursor-pointer ${
                      rsvpFilter === f
                        ? 'bg-maroon text-cream'
                        : 'bg-cream border border-cream-border text-mauve hover:text-maroon'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-cream-card rounded-3xl border border-cream-border overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-cream-border bg-cream/50 text-[11px] font-semibold text-mauve uppercase tracking-wider">
                      <th className="py-4 px-6">Guest Name</th>
                      <th className="py-4 px-6">Plus-One</th>
                      <th className="py-4 px-6">Link Status</th>
                      <th className="py-4 px-6">RSVP Status</th>
                      <th className="py-4 px-6">Personalized URL</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cream-border text-xs text-maroon">
                    {filteredGuests.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-mauve">
                          No guests found. Click "Add Guest" or "Bulk Import CSV" to populate your guest list.
                        </td>
                      </tr>
                    ) : (
                      filteredGuests.map((g) => {
                        const status = getGuestRsvpStatus(g.id);
                        const personalizedUrl = `${window.location.origin}/w/wedding/${wedding.slug}?g=${g.unique_link_token}`;

                        return (
                          <tr key={g.id} className="hover:bg-cream/40 transition-colors">
                            <td className="py-4 px-6">
                              <p className="font-semibold text-maroon">{g.name}</p>
                              {g.email && <p className="text-[11px] text-mauve font-mono">{g.email}</p>}
                            </td>
                            <td className="py-4 px-6">
                              {g.plus_one_allowed ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-semibold">
                                  Allowed {g.plus_one_name ? `(${g.plus_one_name})` : ''}
                                </span>
                              ) : (
                                <span className="text-mauve text-[11px]">No</span>
                              )}
                            </td>
                            <td className="py-4 px-6">
                              {g.opened_at ? (
                                <span className="inline-flex items-center gap-1 text-emerald-700 text-[11px] font-semibold">
                                  <Eye className="w-3.5 h-3.5 text-emerald-600" /> Opened
                                </span>
                              ) : (
                                <span className="text-mauve text-[11px]">Not Opened</span>
                              )}
                            </td>
                            <td className="py-4 px-6">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                                  status === 'attending'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : status === 'declined'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : 'bg-cream text-mauve border border-cream-border'
                                }`}
                              >
                                {status}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(personalizedUrl);
                                  alert(`Personalized link for ${g.name} copied!`);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-cream border border-cream-border text-maroon hover:border-coral font-mono text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <LinkIcon className="w-3 h-3 text-coral" />
                                <span>Copy Guest Link</span>
                              </button>
                            </td>
                            <td className="py-4 px-6 text-right space-x-2">
                              <button
                                onClick={() => handleOpenEditGuestModal(g)}
                                className="p-1.5 rounded-lg bg-cream border border-cream-border text-maroon hover:border-coral"
                                title="Edit Guest"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteGuest(g.id, g.name)}
                                className="p-1.5 rounded-lg bg-cream border border-cream-border text-red-600 hover:bg-red-50"
                                title="Delete Guest"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Guest Modal */}
      {isGuestModalOpen && (
        <div className="fixed inset-0 z-50 bg-maroon/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-cream-border max-w-md w-full shadow-2xl space-y-5 bg-cream">
            <div className="flex items-center justify-between border-b border-cream-border pb-3">
              <h3 className="font-serif font-bold text-lg text-maroon">
                {editingGuest ? 'Edit Guest' : 'Add Guest'}
              </h3>
              <button
                onClick={() => setIsGuestModalOpen(false)}
                className="p-1.5 rounded-full bg-cream-card text-maroon border border-cream-border"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveGuest} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-maroon mb-1">Guest Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chief & Mrs. Adebayo"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-cream-card border border-cream-border text-maroon"
                />
              </div>

              <div>
                <label className="block font-semibold text-maroon mb-1">Email Address (Optional)</label>
                <input
                  type="email"
                  placeholder="e.g. guest@example.com"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-cream-card border border-cream-border text-maroon"
                />
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-maroon">
                  <input
                    type="checkbox"
                    checked={plusOneAllowed}
                    onChange={(e) => setPlusOneAllowed(e.target.checked)}
                    className="w-4 h-4 rounded text-maroon focus:ring-maroon"
                  />
                  <span>Allow Plus-One Guest</span>
                </label>
              </div>

              <div>
                <label className="block font-semibold text-maroon mb-1">Dietary Notes / Table Tags (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. VIP, Vegetarian"
                  value={dietaryNotes}
                  onChange={(e) => setDietaryNotes(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-cream-card border border-cream-border text-maroon"
                />
              </div>

              <div>
                <label className="block font-semibold text-maroon mb-1.5">Assign Events:</label>
                <div className="space-y-2 max-h-36 overflow-y-auto p-3 rounded-2xl bg-cream-card border border-cream-border">
                  {events.map((ev) => (
                    <label key={ev.id} className="flex items-center gap-2 cursor-pointer text-[11px] text-maroon">
                      <input
                        type="checkbox"
                        checked={selectedEventIds.includes(ev.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedEventIds((prev) => [...prev, ev.id]);
                          } else {
                            setSelectedEventIds((prev) => prev.filter((id) => id !== ev.id));
                          }
                        }}
                        className="w-3.5 h-3.5 rounded text-maroon focus:ring-maroon"
                      />
                      <span>{ev.title}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-cream-border">
                <button
                  type="button"
                  onClick={() => setIsGuestModalOpen(false)}
                  className="px-4 py-2 rounded-full bg-cream-card border border-cream-border text-maroon"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingGuest}
                  className="px-6 py-2.5 rounded-full bg-maroon text-cream font-semibold shadow-md disabled:opacity-50"
                >
                  {isSavingGuest ? 'Saving...' : 'Save Guest'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk CSV Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-maroon/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-cream-border max-w-lg w-full shadow-2xl space-y-5 bg-cream">
            <div className="flex items-center justify-between border-b border-cream-border pb-3">
              <h3 className="font-serif font-bold text-lg text-maroon">Bulk CSV Guest Import</h3>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="p-1.5 rounded-full bg-cream-card text-maroon border border-cream-border"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <p className="text-mauve leading-relaxed">
                Paste your CSV content below (or upload a .csv file). The first line must be a header row with columns: <strong className="text-maroon">name, email, plus_one_allowed, dietary_notes</strong>.
              </p>

              <div>
                <label className="block font-semibold text-maroon mb-1">CSV File Upload</label>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      setCsvRawText(ev.target?.result as string);
                    };
                    reader.readAsText(file);
                  }}
                  className="w-full text-xs text-mauve file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-maroon file:text-cream cursor-pointer"
                />
              </div>

              <div>
                <label className="block font-semibold text-maroon mb-1">Raw CSV Text Data</label>
                <textarea
                  rows={6}
                  placeholder={`name,email,plus_one_allowed,dietary_notes\nChief Adebayo,adebayo@example.com,yes,Vegetarian\nDr. Grace Johnson,grace@example.com,no,No shellfish`}
                  value={csvRawText}
                  onChange={(e) => setCsvRawText(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-cream-card border border-cream-border text-maroon font-mono text-[11px]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-cream-border">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 rounded-full bg-cream-card border border-cream-border text-maroon"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isImporting || !csvRawText.trim()}
                  onClick={handleParseAndImportCsv}
                  className="px-6 py-2.5 rounded-full bg-maroon text-cream font-semibold shadow-md disabled:opacity-50"
                >
                  {isImporting ? 'Importing...' : 'Start Import'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
