import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Shield,
  Users,
  Layers,
  DollarSign,
  Heart,
  Trash2,
  Eye,
  Copy,
  RefreshCw,
  Mail,
  Lock,
  Check,
  Search,
  Filter,
  Download,
  LogOut,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  UserPlus,
  Edit3,
  MessageSquare,
  FileText,
  Save,
  Phone,
  Tag,
  AlertCircle,
  X,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { AdminMetrics, Experience, UserRecord, CRMContact, CRMContactStatus, CRMContactType } from '../types';
import {
  getAdminMeApi,
  adminLoginApi,
  adminLogoutApi,
  getAdminMetricsApi,
  getAdminTimeseriesApi,
  getAdminUsersApi,
  getAdminExperiencesApi,
  deleteAdminExperienceApi,
  updateAdminExperiencePaymentStatusApi,
  getAdminCrmContactsApi,
  createAdminCrmContactApi,
  updateAdminCrmContactApi,
  deleteAdminCrmContactApi,
  updateSiteContentApi,
  AdminTimeseriesPoint,
} from '../lib/api';
import { fetchSiteContentApi, invalidateSiteContentCache } from '../lib/useSiteContent';

interface AdminViewProps {
  onPreviewExperience: (slug: string) => void;
}

const DEFAULT_CMS_FIELDS: Array<{ key: string; label: string; section: 'hero' | 'pricing'; type: 'input' | 'textarea' }> = [
  { key: 'hero_eyebrow', label: 'Hero Eyebrow Pill', section: 'hero', type: 'input' },
  { key: 'hero_title_prefix', label: 'Hero Headline Prefix', section: 'hero', type: 'input' },
  { key: 'hero_title_highlight', label: 'Hero Headline Italic Highlight', section: 'hero', type: 'input' },
  { key: 'hero_subtitle', label: 'Hero Subtitle', section: 'hero', type: 'textarea' },
  { key: 'hero_cta_create', label: 'Primary CTA Button Text', section: 'hero', type: 'input' },
  { key: 'hero_cta_view_demo', label: 'Secondary CTA (Watch Demo) Text', section: 'hero', type: 'input' },
  { key: 'hero_tagline', label: 'Hero Bottom Tagline', section: 'hero', type: 'input' },

  { key: 'pricing_badge', label: 'Pricing Eyebrow Badge', section: 'pricing', type: 'input' },
  { key: 'pricing_title', label: 'Pricing Main Title', section: 'pricing', type: 'input' },
  { key: 'pricing_free_title', label: 'Free Plan Title', section: 'pricing', type: 'input' },
  { key: 'pricing_free_desc', label: 'Free Plan Description', section: 'pricing', type: 'textarea' },
  { key: 'pricing_paid_title', label: 'Paid Plan Title', section: 'pricing', type: 'input' },
  { key: 'pricing_paid_desc', label: 'Paid Plan Description', section: 'pricing', type: 'textarea' },
];

export const AdminView: React.FC<AdminViewProps> = ({ onPreviewExperience }) => {
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [timeseries, setTimeseries] = useState<AdminTimeseriesPoint[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [crmContacts, setCrmContacts] = useState<CRMContact[]>([]);
  const [siteContent, setSiteContent] = useState<Record<string, string>>({});
  
  const [activeTab, setActiveTab] = useState<'metrics' | 'experiences' | 'users' | 'crm'>('metrics');
  const [crmSubTab, setCrmSubTab] = useState<'contacts' | 'cms'>('contacts');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [crmTypeFilter, setCrmTypeFilter] = useState<'all' | 'lead' | 'support'>('all');
  const [crmStatusFilter, setCrmStatusFilter] = useState<'all' | CRMContactStatus>('all');

  // Modals state
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [newContact, setNewContact] = useState({
    name: '',
    email: '',
    phone: '',
    type: 'lead' as CRMContactType,
    status: 'new' as CRMContactStatus,
    source: 'Website Lead',
    notes: '',
  });

  const [editingNotesContact, setEditingNotesContact] = useState<CRMContact | null>(null);
  const [notesText, setNotesText] = useState('');

  // CMS Save status feedback per key
  const [savedKey, setSavedKey] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [m, t, u, e, crm, cnt] = await Promise.all([
        getAdminMetricsApi(),
        getAdminTimeseriesApi(),
        getAdminUsersApi(),
        getAdminExperiencesApi(),
        getAdminCrmContactsApi(),
        fetchSiteContentApi(),
      ]);

      setMetrics(m);
      setTimeseries(t);
      setUsers(u);
      setExperiences(e);
      setCrmContacts(crm);
      setSiteContent(cnt || {});
      setIsAuthenticated(true);
    } catch (err: unknown) {
      console.error('Failed to load admin data:', err);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check initial session on mount
  useEffect(() => {
    async function checkSession() {
      setIsInitializing(true);
      try {
        const me = await getAdminMeApi();
        if (me.authenticated) {
          setIsAuthenticated(true);
          setAdminEmail(me.email);
          await loadData();
        }
      } catch {
        setIsAuthenticated(false);
      } finally {
        setIsInitializing(false);
      }
    }

    checkSession();
  }, [loadData]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsLoading(true);

    try {
      const res = await adminLoginApi({ email: emailInput.trim(), password: passwordInput });
      if (res.success) {
        setIsAuthenticated(true);
        setAdminEmail(res.email);
        await loadData();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid admin email or password.';
      setAuthError(msg);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await adminLogoutApi();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsAuthenticated(false);
      setAdminEmail(null);
      setEmailInput('');
      setPasswordInput('');
    }
  };

  const handleDeleteExperience = async (id: string) => {
    if (!confirm('Are you sure you want to delete this experience?')) return;

    try {
      await deleteAdminExperienceApi(id);
      setExperiences((prev) => prev.filter((exp) => exp.id !== id));
      if (metrics) {
        setMetrics({ ...metrics, totalExperiences: metrics.totalExperiences - 1 });
      }
    } catch (err) {
      alert('Failed to delete experience.');
    }
  };

  const handleTogglePaymentStatus = async (exp: Experience) => {
    const newStatus = !exp.is_paid;
    const actionLabel = newStatus ? 'Mark Paid' : 'Mark Refunded/Unpaid';
    if (!confirm(`Are you sure you want to ${actionLabel} for "${exp.sender_name} → ${exp.receiver_name}"?`)) return;

    try {
      const res = await updateAdminExperiencePaymentStatusApi(exp.id, newStatus);
      if (res.success && res.experience) {
        setExperiences((prev) =>
          prev.map((item) => (item.id === exp.id ? { ...item, is_paid: newStatus } : item))
        );
        loadData();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update payment status.';
      alert(msg);
    }
  };

  /* CRM Actions */
  const handleAddContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await createAdminCrmContactApi(newContact);
      setCrmContacts((prev) => [created, ...prev]);
      setIsAddContactOpen(false);
      setNewContact({
        name: '',
        email: '',
        phone: '',
        type: 'lead',
        status: 'new',
        source: 'Website Lead',
        notes: '',
      });
    } catch (err: unknown) {
      alert('Failed to create contact.');
    }
  };

  const handleUpdateContactStatus = async (id: string, status: CRMContactStatus) => {
    try {
      const updated = await updateAdminCrmContactApi(id, { status });
      setCrmContacts((prev) => prev.map((c) => (c.id === id ? updated : c)));
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  const handleSaveNotes = async () => {
    if (!editingNotesContact) return;
    try {
      const updated = await updateAdminCrmContactApi(editingNotesContact.id, { notes: notesText });
      setCrmContacts((prev) => prev.map((c) => (c.id === editingNotesContact.id ? updated : c)));
      setEditingNotesContact(null);
    } catch (err) {
      alert('Failed to save notes.');
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;
    try {
      await deleteAdminCrmContactApi(id);
      setCrmContacts((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      alert('Failed to delete contact.');
    }
  };

  /* CMS Live Content Actions */
  const handleSaveContentKey = async (key: string, val: string) => {
    try {
      await updateSiteContentApi(key, val);
      setSiteContent((prev) => ({ ...prev, [key]: val }));
      invalidateSiteContentCache();
      setSavedKey(key);
      setTimeout(() => setSavedKey(null), 2500);
    } catch (err) {
      alert(`Failed to save content for key "${key}".`);
    }
  };

  const handleCopyLink = (slug: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `${origin}/w/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  // Client-side filtering for Experiences
  const filteredExperiences = useMemo(() => {
    return experiences.filter((exp) => {
      const matchesTier = tierFilter === 'all' || exp.tier === tierFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        exp.sender_name.toLowerCase().includes(q) ||
        exp.receiver_name.toLowerCase().includes(q) ||
        exp.slug.toLowerCase().includes(q) ||
        exp.occasion.toLowerCase().includes(q) ||
        (exp.creator_email && exp.creator_email.toLowerCase().includes(q));

      return matchesTier && matchesQuery;
    });
  }, [experiences, tierFilter, searchQuery]);

  // Client-side filtering for Users
  const filteredUsers = useMemo(() => {
    return users.filter((usr) => {
      const matchesTier = tierFilter === 'all' || usr.tier === tierFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery = !q || usr.email.toLowerCase().includes(q);

      return matchesTier && matchesQuery;
    });
  }, [users, tierFilter, searchQuery]);

  // Client-side filtering for CRM Contacts
  const filteredCrmContacts = useMemo(() => {
    return crmContacts.filter((c) => {
      const matchesType = crmTypeFilter === 'all' || c.type === crmTypeFilter;
      const matchesStatus = crmStatusFilter === 'all' || c.status === crmStatusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.phone && c.phone.toLowerCase().includes(q)) ||
        c.source.toLowerCase().includes(q) ||
        (c.notes && c.notes.toLowerCase().includes(q));

      return matchesType && matchesStatus && matchesQuery;
    });
  }, [crmContacts, crmTypeFilter, crmStatusFilter, searchQuery]);

  // Export Experiences CSV
  const exportExperiencesCsv = () => {
    if (filteredExperiences.length === 0) return;

    const headers = ['ID', 'Slug', 'Sender', 'Receiver', 'Occasion', 'Tier', 'Paid Status', 'Views', 'Reactions', 'Creator Email', 'Created Date'];
    const rows = filteredExperiences.map((e) => [
      `"${e.id}"`,
      `"${e.slug}"`,
      `"${e.sender_name.replace(/"/g, '""')}"`,
      `"${e.receiver_name.replace(/"/g, '""')}"`,
      `"${e.occasion.replace(/"/g, '""')}"`,
      `"${e.tier}"`,
      `"${e.is_paid ? 'Paid' : 'Unpaid'}"`,
      e.views_count,
      e.reactions_count,
      `"${e.creator_email || ''}"`,
      `"${new Date(e.created_at).toISOString()}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `lovewrapped_experiences_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Users CSV
  const exportUsersCsv = () => {
    if (filteredUsers.length === 0) return;

    const headers = ['ID', 'Email', 'Tier', 'Created Date'];
    const rows = filteredUsers.map((u) => [
      `"${u.id}"`,
      `"${u.email}"`,
      `"${u.tier}"`,
      `"${new Date(u.created_at).toISOString()}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `lovewrapped_creators_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isInitializing) {
    return (
      <div className="min-h-[85vh] bg-[#2b0818] text-[#fce7f3] flex items-center justify-center font-sans">
        <RefreshCw className="w-8 h-8 text-rose-400 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[85vh] bg-[#2b0818] text-[#fce7f3] py-12 px-4 flex items-center justify-center font-sans">
        <div className="glass-card p-8 rounded-3xl border border-rose-500/20 max-w-sm w-full shadow-2xl text-center space-y-6">
          <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-400/30 text-rose-300 flex items-center justify-center mx-auto">
            <Shield className="w-6 h-6" />
          </div>

          <div>
            <h1 className="font-serif font-bold text-2xl text-white">LoveWrapped Admin</h1>
            <p className="text-xs text-rose-300/70 mt-1">Sign in with your admin credentials.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            {authError && (
              <p className="text-xs text-rose-300 bg-rose-950/90 p-3 rounded-xl border border-rose-500/50">
                {authError}
              </p>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-medium text-rose-200">Admin Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-rose-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="admin@lovewrapped.app"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#3a0d22] border border-rose-800/60 text-white text-xs focus:outline-none focus:border-rose-400 placeholder:text-rose-300/40"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-rose-200">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-rose-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#3a0d22] border border-rose-800/60 text-white text-xs focus:outline-none focus:border-rose-400 placeholder:text-rose-300/40"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3.5 px-4 rounded-full bg-gradient-to-r from-rose-600 via-pink-600 to-rose-500 hover:from-rose-500 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 border border-rose-400/20 shadow-lg"
            >
              {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Sign In to Admin</span>}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#2b0818] text-[#fce7f3] py-10 px-4 sm:px-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-rose-900/40">
          <div>
            <div className="eyebrow-pill mb-2">
              <span />
              Admin Portal
            </div>
            <h1 className="font-serif font-bold text-2xl sm:text-3xl text-white">
              Platform Overview & Management
            </h1>
            {adminEmail && (
              <p className="text-xs text-rose-300/70 mt-1">Logged in as {adminEmail}</p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 p-1 rounded-full bg-rose-950/80 border border-rose-800/60 text-xs font-medium">
              <button
                onClick={() => setActiveTab('metrics')}
                className={`px-4 py-2 rounded-full transition-all ${
                  activeTab === 'metrics' ? 'bg-rose-600 text-white font-semibold shadow-md' : 'text-rose-300/80 hover:text-white'
                }`}
              >
                Metrics
              </button>
              <button
                onClick={() => setActiveTab('experiences')}
                className={`px-4 py-2 rounded-full transition-all ${
                  activeTab === 'experiences' ? 'bg-rose-600 text-white font-semibold shadow-md' : 'text-rose-300/80 hover:text-white'
                }`}
              >
                Experiences ({experiences.length})
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`px-4 py-2 rounded-full transition-all ${
                  activeTab === 'users' ? 'bg-rose-600 text-white font-semibold shadow-md' : 'text-rose-300/80 hover:text-white'
                }`}
              >
                Creators ({users.length})
              </button>
              <button
                onClick={() => setActiveTab('crm')}
                className={`px-4 py-2 rounded-full transition-all flex items-center gap-1.5 ${
                  activeTab === 'crm' ? 'bg-rose-600 text-white font-semibold shadow-md' : 'text-rose-300/80 hover:text-white'
                }`}
              >
                <span>CRM & CMS</span>
                <span className="bg-rose-900 px-1.5 py-0.5 rounded-full text-[10px]">{crmContacts.length}</span>
              </button>
            </div>

            <button
              onClick={handleLogout}
              className="p-2.5 rounded-full bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800/60 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Metrics Tab Content */}
        {activeTab === 'metrics' && metrics && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-6 rounded-3xl glass-card border border-rose-500/20 space-y-2">
                <div className="flex items-center justify-between text-rose-300">
                  <span className="text-xs font-semibold uppercase tracking-wider">Total Creators</span>
                  <Users className="w-5 h-5" />
                </div>
                <p className="text-3xl font-bold text-white">{metrics.totalUsers}</p>
                <p className="text-xs text-rose-300/60">Registered creators & guests</p>
              </div>

              <div className="p-6 rounded-3xl glass-card border border-rose-500/20 space-y-2">
                <div className="flex items-center justify-between text-pink-300">
                  <span className="text-xs font-semibold uppercase tracking-wider">Total Experiences</span>
                  <Layers className="w-5 h-5" />
                </div>
                <p className="text-3xl font-bold text-white">{metrics.totalExperiences}</p>
                <p className="text-xs text-rose-300/60">
                  {metrics.freeExperiencesCount} Free • {metrics.paidExperiencesCount} Paid
                </p>
              </div>

              <div className="p-6 rounded-3xl glass-card border border-rose-500/20 space-y-2">
                <div className="flex items-center justify-between text-emerald-400">
                  <span className="text-xs font-semibold uppercase tracking-wider">Total Revenue</span>
                  <DollarSign className="w-5 h-5" />
                </div>
                <p className="text-3xl font-bold text-white">
                  ₦{metrics.totalRevenueNgn.toLocaleString()}
                </p>
                <p className="text-xs text-rose-300/60">Verified Paystack payments</p>
              </div>

              <div className="p-6 rounded-3xl glass-card border border-rose-500/20 space-y-2">
                <div className="flex items-center justify-between text-rose-300">
                  <span className="text-xs font-semibold uppercase tracking-wider">Heart Reactions</span>
                  <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
                </div>
                <p className="text-3xl font-bold text-white">{metrics.totalReactions}</p>
                <p className="text-xs text-rose-300/60">Recipient appreciation taps</p>
              </div>
            </div>

            <div className="glass-card p-6 sm:p-8 rounded-3xl border border-rose-500/20 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-rose-300 text-xs font-semibold uppercase tracking-wider mb-1">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span>30-Day Performance Trends</span>
                  </div>
                  <h2 className="font-serif font-bold text-xl text-white">
                    Revenue (₦) & Signup Growth
                  </h2>
                </div>
              </div>

              <div className="h-72 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timeseries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="signupsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#4c1d38" />
                    <XAxis dataKey="displayDate" stroke="#fda4af" fontSize={11} />
                    <YAxis stroke="#fda4af" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#2b0818',
                        borderColor: '#9f1239',
                        borderRadius: '12px',
                        color: '#fce7f3',
                        fontSize: '12px',
                      }}
                      formatter={(value: any, name: any) => {
                        if (name === 'Revenue (₦)') return [`₦${Number(value).toLocaleString()}`, name];
                        return [value, name];
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', color: '#fce7f3' }} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue (₦)"
                      stroke="#10b981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#revenueGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="signups"
                      name="Signups / Creations"
                      stroke="#f43f5e"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#signupsGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Experiences Tab Content */}
        {activeTab === 'experiences' && (
          <div className="glass-card rounded-3xl border border-rose-500/20 overflow-hidden space-y-4">
            <div className="p-6 border-b border-rose-800/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="font-serif font-bold text-lg text-white">Created Story Cards</h2>
                <p className="text-xs text-rose-300/70">
                  Showing {filteredExperiences.length} of {experiences.length} total experiences
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="w-4 h-4 text-rose-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search name, slug, email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full sm:w-60 pl-9 pr-3 py-2 rounded-xl bg-[#3a0d22] border border-rose-800/60 text-white text-xs focus:outline-none focus:border-rose-400 placeholder:text-rose-300/40"
                  />
                </div>

                <div className="relative">
                  <select
                    value={tierFilter}
                    onChange={(e) => setTierFilter(e.target.value as any)}
                    className="px-3 py-2 rounded-xl bg-[#3a0d22] border border-rose-800/60 text-white text-xs focus:outline-none focus:border-rose-400 appearance-none pr-8 cursor-pointer"
                  >
                    <option value="all">All Tiers</option>
                    <option value="free">Free Tier</option>
                    <option value="paid">Paid Tier</option>
                  </select>
                  <Filter className="w-3.5 h-3.5 text-rose-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                <button
                  onClick={exportExperiencesCsv}
                  className="px-4 py-2 rounded-xl bg-rose-900/80 hover:bg-rose-800 text-white text-xs font-semibold transition-all flex items-center gap-1.5 border border-rose-700/60 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5 text-rose-300" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-rose-100">
                <thead className="bg-[#3a0d22] text-rose-300 uppercase font-bold text-[10px] tracking-wider border-b border-rose-800/60">
                  <tr>
                    <th className="p-4">Sender & Receiver</th>
                    <th className="p-4">Occasion</th>
                    <th className="p-4">Tier</th>
                    <th className="p-4">Payment Status</th>
                    <th className="p-4">Views / Reactions</th>
                    <th className="p-4">Created Date</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rose-900/40">
                  {filteredExperiences.map((exp) => (
                    <tr key={exp.id} className="hover:bg-rose-950/40 transition-colors">
                      <td className="p-4 font-semibold text-white">
                        {exp.sender_name} → {exp.receiver_name}
                        <div className="text-[10px] text-rose-300/60 font-mono font-normal">{exp.slug}</div>
                        {exp.creator_email && (
                          <div className="text-[10px] text-rose-400 font-normal">{exp.creator_email}</div>
                        )}
                      </td>
                      <td className="p-4">{exp.occasion}</td>
                      <td className="p-4 uppercase font-bold text-[10px] text-rose-300">{exp.tier}</td>
                      <td className="p-4">
                        <button
                          onClick={() => handleTogglePaymentStatus(exp)}
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-semibold transition-all ${
                            exp.is_paid
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/80 hover:bg-rose-950 hover:text-rose-300 hover:border-rose-700'
                              : 'bg-rose-950 text-rose-300/70 border border-rose-900 hover:bg-emerald-950 hover:text-emerald-300 hover:border-emerald-700'
                          }`}
                          title="Click to toggle payment status manually"
                        >
                          {exp.is_paid ? (
                            <>
                              <ToggleRight className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Paid • Active</span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="w-3.5 h-3.5 text-rose-400" />
                              <span>Pending / Mark Paid</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="p-4">
                        {exp.views_count} views • {exp.reactions_count} ❤️
                      </td>
                      <td className="p-4 text-rose-300/70">
                        {new Date(exp.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => onPreviewExperience(exp.slug)}
                          className="p-1.5 rounded-lg bg-rose-900/80 text-rose-200 hover:bg-rose-800"
                          title="Preview Story Card"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleCopyLink(exp.slug)}
                          className="p-1.5 rounded-lg bg-rose-900/80 text-rose-200 hover:bg-rose-800"
                          title="Copy Public Link"
                        >
                          {copiedSlug === exp.slug ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleDeleteExperience(exp.id)}
                          className="p-1.5 rounded-lg bg-rose-950 text-rose-400 hover:bg-rose-900 hover:text-white border border-rose-800/60"
                          title="Delete Experience"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredExperiences.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-xs text-rose-300/60">
                        No story cards match your search and filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Users Tab Content */}
        {activeTab === 'users' && (
          <div className="glass-card rounded-3xl border border-rose-500/20 overflow-hidden space-y-4">
            <div className="p-6 border-b border-rose-800/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="font-serif font-bold text-lg text-white">Creator Users</h2>
                <p className="text-xs text-rose-300/70">
                  Showing {filteredUsers.length} of {users.length} registered creators
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="w-4 h-4 text-rose-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full sm:w-60 pl-9 pr-3 py-2 rounded-xl bg-[#3a0d22] border border-rose-800/60 text-white text-xs focus:outline-none focus:border-rose-400 placeholder:text-rose-300/40"
                  />
                </div>

                <div className="relative">
                  <select
                    value={tierFilter}
                    onChange={(e) => setTierFilter(e.target.value as any)}
                    className="px-3 py-2 rounded-xl bg-[#3a0d22] border border-rose-800/60 text-white text-xs focus:outline-none focus:border-rose-400 appearance-none pr-8 cursor-pointer"
                  >
                    <option value="all">All Tiers</option>
                    <option value="free">Free Tier</option>
                    <option value="paid">Paid Tier</option>
                  </select>
                  <Filter className="w-3.5 h-3.5 text-rose-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                <button
                  onClick={exportUsersCsv}
                  className="px-4 py-2 rounded-xl bg-rose-900/80 hover:bg-rose-800 text-white text-xs font-semibold transition-all flex items-center gap-1.5 border border-rose-700/60 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5 text-rose-300" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-rose-100">
                <thead className="bg-[#3a0d22] text-rose-300 uppercase font-bold text-[10px] tracking-wider border-b border-rose-800/60">
                  <tr>
                    <th className="p-4">Email</th>
                    <th className="p-4">Tier</th>
                    <th className="p-4">Registered Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rose-900/40">
                  {filteredUsers.map((usr) => (
                    <tr key={usr.id} className="hover:bg-rose-950/40 transition-colors">
                      <td className="p-4 font-semibold text-white">{usr.email}</td>
                      <td className="p-4 uppercase text-[10px] font-bold text-rose-300">{usr.tier}</td>
                      <td className="p-4 text-rose-300/70">
                        {new Date(usr.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-xs text-rose-300/60">
                        No creator users match your search and filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CRM & CMS Tab Content */}
        {activeTab === 'crm' && (
          <div className="space-y-6">
            {/* CRM Sub-Navigation Toggle */}
            <div className="flex items-center gap-3 border-b border-rose-900/40 pb-4">
              <button
                onClick={() => setCrmSubTab('contacts')}
                className={`px-5 py-2.5 rounded-2xl text-xs font-semibold transition-all flex items-center gap-2 ${
                  crmSubTab === 'contacts'
                    ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-lg'
                    : 'bg-rose-950/80 text-rose-300 hover:text-white border border-rose-800/60'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Sales & Support Contacts</span>
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px]">{crmContacts.length}</span>
              </button>

              <button
                onClick={() => setCrmSubTab('cms')}
                className={`px-5 py-2.5 rounded-2xl text-xs font-semibold transition-all flex items-center gap-2 ${
                  crmSubTab === 'cms'
                    ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-lg'
                    : 'bg-rose-950/80 text-rose-300 hover:text-white border border-rose-800/60'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Live Site Content CMS</span>
              </button>
            </div>

            {/* Sub-Tab 1: Sales & Support Contacts */}
            {crmSubTab === 'contacts' && (
              <div className="glass-card rounded-3xl border border-rose-500/20 overflow-hidden space-y-4">
                {/* Header Controls */}
                <div className="p-6 border-b border-rose-800/50 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  <div>
                    <h2 className="font-serif font-bold text-lg text-white">Lead & Support Contact Management</h2>
                    <p className="text-xs text-rose-300/70">
                      Showing {filteredCrmContacts.length} of {crmContacts.length} total entries
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                    {/* Search */}
                    <div className="relative flex-1 sm:flex-initial">
                      <Search className="w-4 h-4 text-rose-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search name, email, notes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full sm:w-56 pl-9 pr-3 py-2 rounded-xl bg-[#3a0d22] border border-rose-800/60 text-white text-xs focus:outline-none focus:border-rose-400 placeholder:text-rose-300/40"
                      />
                    </div>

                    {/* Type Filter */}
                    <select
                      value={crmTypeFilter}
                      onChange={(e) => setCrmTypeFilter(e.target.value as any)}
                      className="px-3 py-2 rounded-xl bg-[#3a0d22] border border-rose-800/60 text-white text-xs focus:outline-none focus:border-rose-400 cursor-pointer"
                    >
                      <option value="all">All Types</option>
                      <option value="lead">Sales Leads</option>
                      <option value="support">Support Tickets</option>
                    </select>

                    {/* Status Filter */}
                    <select
                      value={crmStatusFilter}
                      onChange={(e) => setCrmStatusFilter(e.target.value as any)}
                      className="px-3 py-2 rounded-xl bg-[#3a0d22] border border-rose-800/60 text-white text-xs focus:outline-none focus:border-rose-400 cursor-pointer"
                    >
                      <option value="all">All Statuses</option>
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="in_progress">In Progress</option>
                      <option value="converted">Converted</option>
                      <option value="closed">Closed</option>
                      <option value="lost">Lost</option>
                    </select>

                    {/* Add Contact Button */}
                    <button
                      onClick={() => setIsAddContactOpen(true)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-md border border-rose-400/20 shrink-0"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>+ Add Contact</span>
                    </button>
                  </div>
                </div>

                {/* Contacts Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-rose-100">
                    <thead className="bg-[#3a0d22] text-rose-300 uppercase font-bold text-[10px] tracking-wider border-b border-rose-800/60">
                      <tr>
                        <th className="p-4">Contact Person</th>
                        <th className="p-4">Type</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Source</th>
                        <th className="p-4">Notes</th>
                        <th className="p-4">Last Updated</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-rose-900/40">
                      {filteredCrmContacts.map((c) => (
                        <tr key={c.id} className="hover:bg-rose-950/40 transition-colors">
                          <td className="p-4 font-semibold text-white">
                            <div>{c.name}</div>
                            <div className="text-[10px] text-rose-300/70 font-normal">{c.email}</div>
                            {c.phone && <div className="text-[10px] text-rose-400 font-mono font-normal">{c.phone}</div>}
                          </td>
                          <td className="p-4">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                                c.type === 'lead'
                                  ? 'bg-purple-950 text-purple-300 border border-purple-800'
                                  : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                              }`}
                            >
                              {c.type}
                            </span>
                          </td>
                          <td className="p-4">
                            <select
                              value={c.status}
                              onChange={(e) => handleUpdateContactStatus(c.id, e.target.value as CRMContactStatus)}
                              className="px-2.5 py-1 rounded-lg bg-[#3a0d22] border border-rose-800/60 text-white text-[11px] font-medium focus:outline-none focus:border-rose-400 cursor-pointer"
                            >
                              <option value="new">🆕 New</option>
                              <option value="contacted">💬 Contacted</option>
                              <option value="in_progress">⚙️ In Progress</option>
                              <option value="converted">🎉 Converted</option>
                              <option value="closed">✅ Closed</option>
                              <option value="lost">❌ Lost</option>
                            </select>
                          </td>
                          <td className="p-4 text-rose-300/80">{c.source}</td>
                          <td className="p-4 max-w-xs truncate text-rose-300/70">
                            {c.notes || <span className="italic text-rose-500/50">No notes</span>}
                          </td>
                          <td className="p-4 text-rose-300/70">
                            {new Date(c.updated_at).toLocaleDateString()}
                          </td>
                          <td className="p-4 text-right space-x-2">
                            <button
                              onClick={() => {
                                setEditingNotesContact(c);
                                setNotesText(c.notes || '');
                              }}
                              className="p-1.5 rounded-lg bg-rose-900/80 text-rose-200 hover:bg-rose-800"
                              title="View & Edit Notes"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteContact(c.id)}
                              className="p-1.5 rounded-lg bg-rose-950 text-rose-400 hover:bg-rose-900 hover:text-white border border-rose-800/60"
                              title="Delete Contact"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredCrmContacts.length === 0 && (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-xs text-rose-300/60">
                            No contact entries match your search and filter criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Sub-Tab 2: Live Site Content (CMS) */}
            {crmSubTab === 'cms' && (
              <div className="space-y-8">
                <div className="glass-card p-6 rounded-3xl border border-rose-500/20">
                  <h2 className="font-serif font-bold text-xl text-white mb-1">
                    Live Marketing Copy CMS
                  </h2>
                  <p className="text-xs text-rose-300/70">
                    Edit copy for the Landing and Pricing pages in real time without code redeployments.
                  </p>
                </div>

                {/* Hero Copy Fields */}
                <div className="glass-card p-6 sm:p-8 rounded-3xl border border-rose-500/20 space-y-6">
                  <h3 className="font-serif font-bold text-lg text-white border-b border-rose-800/50 pb-3 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-rose-400" />
                    <span>Hero Section Copy</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {DEFAULT_CMS_FIELDS.filter((f) => f.section === 'hero').map((field) => {
                      const currentValue = siteContent[field.key] || '';
                      return (
                        <div key={field.key} className="space-y-2 bg-[#3a0d22]/40 p-4 rounded-2xl border border-rose-800/40">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-rose-200">{field.label}</label>
                            <span className="text-[10px] font-mono text-rose-400/60 bg-rose-950 px-2 py-0.5 rounded-md">
                              {field.key}
                            </span>
                          </div>

                          {field.type === 'textarea' ? (
                            <textarea
                              rows={3}
                              value={currentValue}
                              onChange={(e) => setSiteContent((prev) => ({ ...prev, [field.key]: e.target.value }))}
                              className="w-full p-3 rounded-xl bg-[#2b0818] border border-rose-800/60 text-white text-xs focus:outline-none focus:border-rose-400 placeholder:text-rose-300/30"
                            />
                          ) : (
                            <input
                              type="text"
                              value={currentValue}
                              onChange={(e) => setSiteContent((prev) => ({ ...prev, [field.key]: e.target.value }))}
                              className="w-full p-3 rounded-xl bg-[#2b0818] border border-rose-800/60 text-white text-xs focus:outline-none focus:border-rose-400 placeholder:text-rose-300/30"
                            />
                          )}

                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] text-rose-300/50 font-mono">
                              {currentValue.length} characters
                            </span>

                            <button
                              onClick={() => handleSaveContentKey(field.key, currentValue)}
                              className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium transition-all flex items-center gap-1.5 shadow-sm"
                            >
                              {savedKey === field.key ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                                  <span>Saved!</span>
                                </>
                              ) : (
                                <>
                                  <Save className="w-3.5 h-3.5" />
                                  <span>Save</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Pricing Copy Fields */}
                <div className="glass-card p-6 sm:p-8 rounded-3xl border border-rose-500/20 space-y-6">
                  <h3 className="font-serif font-bold text-lg text-white border-b border-rose-800/50 pb-3 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-rose-400" />
                    <span>Pricing Section Copy</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {DEFAULT_CMS_FIELDS.filter((f) => f.section === 'pricing').map((field) => {
                      const currentValue = siteContent[field.key] || '';
                      return (
                        <div key={field.key} className="space-y-2 bg-[#3a0d22]/40 p-4 rounded-2xl border border-rose-800/40">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-rose-200">{field.label}</label>
                            <span className="text-[10px] font-mono text-rose-400/60 bg-rose-950 px-2 py-0.5 rounded-md">
                              {field.key}
                            </span>
                          </div>

                          {field.type === 'textarea' ? (
                            <textarea
                              rows={3}
                              value={currentValue}
                              onChange={(e) => setSiteContent((prev) => ({ ...prev, [field.key]: e.target.value }))}
                              className="w-full p-3 rounded-xl bg-[#2b0818] border border-rose-800/60 text-white text-xs focus:outline-none focus:border-rose-400 placeholder:text-rose-300/30"
                            />
                          ) : (
                            <input
                              type="text"
                              value={currentValue}
                              onChange={(e) => setSiteContent((prev) => ({ ...prev, [field.key]: e.target.value }))}
                              className="w-full p-3 rounded-xl bg-[#2b0818] border border-rose-800/60 text-white text-xs focus:outline-none focus:border-rose-400 placeholder:text-rose-300/30"
                            />
                          )}

                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] text-rose-300/50 font-mono">
                              {currentValue.length} characters
                            </span>

                            <button
                              onClick={() => handleSaveContentKey(field.key, currentValue)}
                              className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium transition-all flex items-center gap-1.5 shadow-sm"
                            >
                              {savedKey === field.key ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                                  <span>Saved!</span>
                                </>
                              ) : (
                                <>
                                  <Save className="w-3.5 h-3.5" />
                                  <span>Save</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Contact Modal */}
      {isAddContactOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-rose-500/30 max-w-md w-full shadow-2xl space-y-6 relative">
            <button
              onClick={() => setIsAddContactOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-rose-950 text-rose-300 hover:text-white border border-rose-800/60"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <h3 className="font-serif font-bold text-xl text-white">Add New CRM Contact</h3>
              <p className="text-xs text-rose-300/70 mt-1">Record a sales lead or support inquiry.</p>
            </div>

            <form onSubmit={handleAddContactSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-rose-200 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Funmi Adeleke"
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  className="w-full p-3 rounded-xl bg-[#3a0d22] border border-rose-800/60 text-white focus:outline-none focus:border-rose-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-rose-200 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    placeholder="funmi@example.com"
                    value={newContact.email}
                    onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                    className="w-full p-3 rounded-xl bg-[#3a0d22] border border-rose-800/60 text-white focus:outline-none focus:border-rose-400"
                  />
                </div>
                <div>
                  <label className="block font-medium text-rose-200 mb-1">Phone (Optional)</label>
                  <input
                    type="text"
                    placeholder="+234 800 000 0000"
                    value={newContact.phone}
                    onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                    className="w-full p-3 rounded-xl bg-[#3a0d22] border border-rose-800/60 text-white focus:outline-none focus:border-rose-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-rose-200 mb-1">Type</label>
                  <select
                    value={newContact.type}
                    onChange={(e) => setNewContact({ ...newContact, type: e.target.value as CRMContactType })}
                    className="w-full p-3 rounded-xl bg-[#3a0d22] border border-rose-800/60 text-white focus:outline-none focus:border-rose-400"
                  >
                    <option value="lead">Sales Lead</option>
                    <option value="support">Support Ticket</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-rose-200 mb-1">Initial Status</label>
                  <select
                    value={newContact.status}
                    onChange={(e) => setNewContact({ ...newContact, status: e.target.value as CRMContactStatus })}
                    className="w-full p-3 rounded-xl bg-[#3a0d22] border border-rose-800/60 text-white focus:outline-none focus:border-rose-400"
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="in_progress">In Progress</option>
                    <option value="converted">Converted</option>
                    <option value="closed">Closed</option>
                    <option value="lost">Lost</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-rose-200 mb-1">Source</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Landing Page, Checkout Help, Instagram"
                  value={newContact.source}
                  onChange={(e) => setNewContact({ ...newContact, source: e.target.value })}
                  className="w-full p-3 rounded-xl bg-[#3a0d22] border border-rose-800/60 text-white focus:outline-none focus:border-rose-400"
                />
              </div>

              <div>
                <label className="block font-medium text-rose-200 mb-1">Notes</label>
                <textarea
                  rows={3}
                  placeholder="Additional context or customer request details..."
                  value={newContact.notes}
                  onChange={(e) => setNewContact({ ...newContact, notes: e.target.value })}
                  className="w-full p-3 rounded-xl bg-[#3a0d22] border border-rose-800/60 text-white focus:outline-none focus:border-rose-400"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-full bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 text-white font-semibold text-xs shadow-lg transition-all"
              >
                Create Contact
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Notes Modal */}
      {editingNotesContact && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card p-6 rounded-3xl border border-rose-500/30 max-w-md w-full shadow-2xl space-y-4 relative">
            <button
              onClick={() => setEditingNotesContact(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-rose-950 text-rose-300 hover:text-white border border-rose-800/60"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <h3 className="font-serif font-bold text-lg text-white">Contact Notes</h3>
              <p className="text-xs text-rose-300/70">{editingNotesContact.name} ({editingNotesContact.email})</p>
            </div>

            <textarea
              rows={5}
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              placeholder="Enter contact notes or conversation history..."
              className="w-full p-3 rounded-2xl bg-[#3a0d22] border border-rose-800/60 text-white text-xs focus:outline-none focus:border-rose-400 placeholder:text-rose-300/40"
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingNotesContact(null)}
                className="px-4 py-2 rounded-xl bg-rose-950 text-rose-300 hover:text-white border border-rose-800/60 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveNotes}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-all shadow-md"
              >
                Save Notes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
