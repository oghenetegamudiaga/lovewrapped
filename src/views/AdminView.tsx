import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Shield,
  Users,
  Layers,
  DollarSign,
  Heart,
  Trash2,
  Settings,
  Key,
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
  BookOpen,
  Plus,
  Eye,
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
import { AdminMetrics, Experience, UserRecord, CRMContact, CRMContactStatus, CRMContactType, AdminRole, AdminRecord, BlogPost } from '../types';
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
  getAdminSubAdminsApi,
  createAdminSubAdminApi,
  updateAdminSubAdminRoleApi,
  deleteAdminSubAdminApi,
  changeAdminPasswordApi,
  getAdminBlogPostsApi,
  createAdminBlogPostApi,
  updateAdminBlogPostApi,
  deleteAdminBlogPostApi,
  AdminTimeseriesPoint,
} from '../lib/api';
import { fetchSiteContentApi, invalidateSiteContentCache } from '../lib/useSiteContent';

interface AdminViewProps {}

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

export const AdminView: React.FC<AdminViewProps> = () => {
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
  
  const [adminRole, setAdminRole] = useState<AdminRole>('super_admin');
  const [isRootAdmin, setIsRootAdmin] = useState(false);
  const [subAdmins, setSubAdmins] = useState<AdminRecord[]>([]);

  const [activeTab, setActiveTab] = useState<'metrics' | 'experiences' | 'users' | 'crm' | 'settings' | 'blog'>('metrics');
  const [crmSubTab, setCrmSubTab] = useState<'contacts' | 'cms'>('contacts');

  // Blog Management State
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [isBlogModalOpen, setIsBlogModalOpen] = useState(false);
  const [editingBlogPost, setEditingBlogPost] = useState<BlogPost | null>(null);
  const [blogTitle, setBlogTitle] = useState('');
  const [blogSlug, setBlogSlug] = useState('');
  const [blogExcerpt, setBlogExcerpt] = useState('');
  const [blogCoverUrl, setBlogCoverUrl] = useState('');
  const [blogContent, setBlogContent] = useState('');
  const [blogPublished, setBlogPublished] = useState(false);
  const [blogTabMode, setBlogTabMode] = useState<'write' | 'preview'>('write');
  const [blogError, setBlogError] = useState<string | null>(null);
  const [blogSuccess, setBlogSuccess] = useState<string | null>(null);
  const [blogIsSaving, setBlogIsSaving] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [crmStatusFilter, setCrmStatusFilter] = useState<'all' | CRMContactStatus>('all');
  const [crmTypeFilter, setCrmTypeFilter] = useState<'all' | CRMContactType>('all');

  // Sub-Admin Management State
  const [isAddAdminOpen, setIsAddAdminOpen] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<AdminRole>('admin');
  const [subAdminError, setSubAdminError] = useState<string | null>(null);
  const [subAdminSuccess, setSubAdminSuccess] = useState<string | null>(null);

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // CRM Add Contact Modal State
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [newContact, setNewContact] = useState<{
    name: string;
    email: string;
    phone: string;
    type: CRMContactType;
    status: CRMContactStatus;
    source: string;
    notes: string;
  }>({
    name: '',
    email: '',
    phone: '',
    type: 'lead',
    status: 'new',
    source: 'Website Lead',
    notes: '',
  });

  // CRM Edit Notes Modal State
  const [editingNotesContact, setEditingNotesContact] = useState<CRMContact | null>(null);
  const [notesText, setNotesText] = useState('');
  const [savedKey, setSavedKey] = useState<string | null>(null);

  const loadData = useCallback(async (role: AdminRole = adminRole) => {
    setIsLoading(true);
    try {
      if (role === 'support') {
        const [e, c] = await Promise.all([
          getAdminExperiencesApi(),
          getAdminCrmContactsApi(),
        ]);
        setExperiences(e);
        setCrmContacts(c);
      } else {
        const [m, t, u, e, c, cms] = await Promise.all([
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
        setCrmContacts(c);
        setSiteContent(cms);

        if (role === 'super_admin') {
          const admins = await getAdminSubAdminsApi().catch(() => []);
          setSubAdmins(admins);
        }

        const posts = await getAdminBlogPostsApi().catch(() => []);
        setBlogPosts(posts);
      }
    } catch (err: unknown) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [adminRole]);

  useEffect(() => {
    async function checkSession() {
      try {
        const me = await getAdminMeApi();
        if (me.authenticated) {
          setIsAuthenticated(true);
          setAdminEmail(me.email);
          const r = me.role || 'super_admin';
          setAdminRole(r);
          setIsRootAdmin(Boolean(me.isRootAdmin));
          if (r === 'support') {
            setActiveTab('experiences');
          }
          await loadData(r);
        }
      } catch (err) {
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
      const res = await adminLoginApi(emailInput.trim(), passwordInput);
      if (res.success) {
        setIsAuthenticated(true);
        setAdminEmail(res.email);
        const r = (res as any).role || 'super_admin';
        const root = Boolean((res as any).isRootAdmin);
        setAdminRole(r);
        setIsRootAdmin(root);
        if (r === 'support') {
          setActiveTab('experiences');
        }
        await loadData(r);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setAuthError(msg);
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

  /* Settings Handlers */
  const handleAddSubAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubAdminError(null);
    setSubAdminSuccess(null);

    if (!newAdminEmail || !newAdminEmail.includes('@')) {
      setSubAdminError('Please enter a valid email address.');
      return;
    }
    if (!newAdminPassword || newAdminPassword.length < 8) {
      setSubAdminError('Password must be at least 8 characters long.');
      return;
    }

    try {
      const created = await createAdminSubAdminApi({
        email: newAdminEmail.trim(),
        password: newAdminPassword,
        role: newAdminRole,
      });
      setSubAdmins((prev) => [created, ...prev]);
      setNewAdminEmail('');
      setNewAdminPassword('');
      setNewAdminRole('admin');
      setIsAddAdminOpen(false);
      setSubAdminSuccess(`Sub-admin ${created.email} created successfully.`);
      setTimeout(() => setSubAdminSuccess(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create sub-admin.';
      setSubAdminError(msg);
    }
  };

  const handleUpdateSubAdminRole = async (id: string, role: AdminRole) => {
    setSubAdminError(null);
    try {
      const res = await updateAdminSubAdminRoleApi(id, role);
      if (res.success) {
        setSubAdmins((prev) => prev.map((a) => (a.id === id ? { ...a, role } : a)));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update role.';
      alert(msg);
    }
  };

  const handleDeleteSubAdmin = async (id: string) => {
    if (!confirm('Are you sure you want to remove this sub-admin?')) return;
    setSubAdminError(null);

    try {
      await deleteAdminSubAdminApi(id);
      setSubAdmins((prev) => prev.filter((a) => a.id !== id));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to remove sub-admin.';
      alert(msg);
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (isRootAdmin) {
      setPasswordError('Root admin password is set via environment variables and cannot be changed here.');
      return;
    }

    if (!currentPassword) {
      setPasswordError('Current password is required.');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await changeAdminPasswordApi(currentPassword, newPassword);
      if (res.success) {
        setPasswordSuccess('Password changed successfully.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        setTimeout(() => setPasswordSuccess(null), 4000);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to change password.';
      setPasswordError(msg);
    } finally {
      setIsChangingPassword(false);
    }
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
    link.setAttribute('download', `amorah_experiences_${Date.now()}.csv`);
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
    link.setAttribute('download', `amorah_creators_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isInitializing) {
    return (
      <div className="min-h-[85vh] bg-cream text-maroon flex items-center justify-center font-sans">
        <RefreshCw className="w-8 h-8 text-coral animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[85vh] bg-cream text-maroon py-12 px-4 flex items-center justify-center font-sans">
        <div className="glass-card p-8 rounded-3xl border border-cream-border max-w-sm w-full shadow-md text-center space-y-6">
          <div className="flex justify-center mb-2">
            <img src="/logo.png" alt="Amorah" className="h-8 w-auto object-contain" />
          </div>

          <div>
            <h1 className="font-serif font-bold text-xl text-maroon">Admin Portal</h1>
            <p className="text-xs text-mauve mt-1">Sign in with your admin credentials.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            {authError && (
              <p className="text-xs text-maroon bg-rose-100 p-3 rounded-xl border border-coral/40">
                {authError}
              </p>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-medium text-mauve">Admin Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-coral absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="admin@amorah.xyz"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-cream-card border border-cream-border text-maroon text-xs focus:outline-none focus:border-coral placeholder:text-mauve/60"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-mauve">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-coral absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-cream-card border border-cream-border text-maroon text-xs focus:outline-none focus:border-coral placeholder:text-mauve/60"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3.5 px-4 rounded-full bg-maroon hover:bg-maroon-light text-cream font-semibold text-sm transition-all flex items-center justify-center gap-2 border border-maroon/20 shadow-md"
            >
              {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Sign In to Admin</span>}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream text-maroon py-10 px-4 sm:px-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-cream-border">
          <div>
            <div className="eyebrow-pill mb-2">
              <span />
              Admin Portal
            </div>
            <h1 className="font-serif font-bold text-2xl sm:text-3xl text-maroon">
              Platform Overview & Management
            </h1>
            {adminEmail && (
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-mauve">Logged in as {adminEmail}</p>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                  adminRole === 'super_admin'
                    ? 'bg-purple-100 text-purple-800 border-purple-200'
                    : adminRole === 'admin'
                    ? 'bg-blue-100 text-blue-800 border-blue-200'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                }`}>
                  {adminRole.replace('_', ' ')}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 p-1 rounded-full bg-cream-card border border-cream-border text-xs font-medium">
              {adminRole !== 'support' && (
                <button
                  onClick={() => setActiveTab('metrics')}
                  className={`px-4 py-2 rounded-full transition-all ${
                    activeTab === 'metrics' ? 'bg-maroon text-cream font-semibold shadow-sm' : 'text-mauve hover:text-maroon'
                  }`}
                >
                  Metrics
                </button>
              )}
              <button
                onClick={() => setActiveTab('experiences')}
                className={`px-4 py-2 rounded-full transition-all ${
                  activeTab === 'experiences' ? 'bg-maroon text-cream font-semibold shadow-sm' : 'text-mauve hover:text-maroon'
                }`}
              >
                Experiences ({experiences.length})
              </button>
              {adminRole !== 'support' && (
                <button
                  onClick={() => setActiveTab('users')}
                  className={`px-4 py-2 rounded-full transition-all ${
                    activeTab === 'users' ? 'bg-maroon text-cream font-semibold shadow-sm' : 'text-mauve hover:text-maroon'
                  }`}
                >
                  Creators ({users.length})
                </button>
              )}
              <button
                onClick={() => setActiveTab('crm')}
                className={`px-4 py-2 rounded-full transition-all flex items-center gap-1.5 ${
                  activeTab === 'crm' ? 'bg-maroon text-cream font-semibold shadow-sm' : 'text-mauve hover:text-maroon'
                }`}
              >
                <span>CRM & CMS</span>
                <span className="bg-cream-border px-1.5 py-0.5 rounded-full text-[10px] text-maroon">{crmContacts.length}</span>
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-2 rounded-full transition-all flex items-center gap-1.5 ${
                  activeTab === 'settings' ? 'bg-maroon text-cream font-semibold shadow-sm' : 'text-mauve hover:text-maroon'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Settings</span>
              </button>
              {adminRole !== 'support' && (
                <button
                  onClick={() => setActiveTab('blog')}
                  className={`px-4 py-2 rounded-full transition-all flex items-center gap-1.5 ${
                    activeTab === 'blog' ? 'bg-maroon text-cream font-semibold shadow-sm' : 'text-mauve hover:text-maroon'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Blog ({blogPosts.length})</span>
                </button>
              )}
            </div>

            <button
              onClick={handleLogout}
              className="p-2.5 rounded-full bg-cream-card hover:bg-cream-border text-maroon border border-cream-border transition-colors"
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
              <div className="p-6 rounded-3xl glass-card border border-cream-border space-y-2">
                <div className="flex items-center justify-between text-dustyRose">
                  <span className="text-xs font-semibold uppercase tracking-wider">Total Creators</span>
                  <Users className="w-5 h-5" />
                </div>
                <p className="text-3xl font-bold text-maroon">{metrics.totalUsers}</p>
                <p className="text-xs text-mauve">Registered creators & guests</p>
              </div>

              <div className="p-6 rounded-3xl glass-card border border-cream-border space-y-2">
                <div className="flex items-center justify-between text-coral">
                  <span className="text-xs font-semibold uppercase tracking-wider">Total Experiences</span>
                  <Layers className="w-5 h-5" />
                </div>
                <p className="text-3xl font-bold text-maroon">{metrics.totalExperiences}</p>
                <p className="text-xs text-mauve">
                  {metrics.freeExperiencesCount} Free • {metrics.paidExperiencesCount} Paid
                </p>
              </div>

              <div className="p-6 rounded-3xl glass-card border border-cream-border space-y-2">
                <div className="flex items-center justify-between text-emerald-700">
                  <span className="text-xs font-semibold uppercase tracking-wider">Total Revenue</span>
                  <DollarSign className="w-5 h-5" />
                </div>
                <p className="text-3xl font-bold text-maroon">
                  ₦{metrics.totalRevenueNgn.toLocaleString()}
                </p>
                <p className="text-xs text-mauve">Verified Paystack payments</p>
              </div>

              <div className="p-6 rounded-3xl glass-card border border-cream-border space-y-2">
                <div className="flex items-center justify-between text-coral">
                  <span className="text-xs font-semibold uppercase tracking-wider">Heart Reactions</span>
                  <Heart className="w-5 h-5 fill-coral text-coral" />
                </div>
                <p className="text-3xl font-bold text-maroon">{metrics.totalReactions}</p>
                <p className="text-xs text-mauve">Recipient appreciation taps</p>
              </div>
            </div>

            <div className="glass-card p-6 sm:p-8 rounded-3xl border border-cream-border space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-dustyRose text-xs font-semibold uppercase tracking-wider mb-1">
                    <TrendingUp className="w-4 h-4 text-emerald-700" />
                    <span>30-Day Performance Trends</span>
                  </div>
                  <h2 className="font-serif font-bold text-xl text-maroon">
                    Revenue (₦) & Signup Growth
                  </h2>
                </div>
              </div>

              <div className="h-72 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timeseries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#047857" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#047857" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="signupsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#df6d73" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#df6d73" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e8cfc0" />
                    <XAxis dataKey="displayDate" stroke="#6f4658" fontSize={11} />
                    <YAxis stroke="#6f4658" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#f7e6db',
                        borderColor: '#e8cfc0',
                        borderRadius: '12px',
                        color: '#3a0d22',
                        fontSize: '12px',
                      }}
                      formatter={(value: any, name: any) => {
                        if (name === 'Revenue (₦)') return [`₦${Number(value).toLocaleString()}`, name];
                        return [value, name];
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', color: '#3a0d22' }} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue (₦)"
                      stroke="#047857"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#revenueGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="signups"
                      name="Signups / Creations"
                      stroke="#df6d73"
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
          <div className="glass-card rounded-3xl border border-cream-border overflow-hidden space-y-4">
            <div className="p-6 border-b border-cream-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="font-serif font-bold text-lg text-maroon">Created Story Cards</h2>
                <p className="text-xs text-mauve">
                  Showing {filteredExperiences.length} of {experiences.length} total experiences
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="w-4 h-4 text-coral absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search name, slug, email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full sm:w-60 pl-9 pr-3 py-2 rounded-xl bg-cream-card border border-cream-border text-maroon text-xs focus:outline-none focus:border-coral placeholder:text-mauve/60"
                  />
                </div>

                <div className="relative">
                  <select
                    value={tierFilter}
                    onChange={(e) => setTierFilter(e.target.value as any)}
                    className="px-3 py-2 rounded-xl bg-cream-card border border-cream-border text-maroon text-xs focus:outline-none focus:border-coral appearance-none pr-8 cursor-pointer"
                  >
                    <option value="all">All Tiers</option>
                    <option value="free">Free Tier</option>
                    <option value="paid">Paid Tier</option>
                  </select>
                  <Filter className="w-3.5 h-3.5 text-coral absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                <button
                  onClick={exportExperiencesCsv}
                  className="px-4 py-2 rounded-xl bg-maroon hover:bg-maroon-light text-cream text-xs font-semibold transition-all flex items-center gap-1.5 border border-maroon/20 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5 text-coral" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-maroon">
                <thead className="bg-cream-card text-mauve uppercase font-bold text-[10px] tracking-wider border-b border-cream-border">
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
                <tbody className="divide-y divide-cream-border">
                  {filteredExperiences.map((exp) => (
                    <tr key={exp.id} className="hover:bg-cream-card/60 transition-colors">
                      <td className="p-4 font-semibold text-maroon">
                        {exp.sender_name} → {exp.receiver_name}
                        <div className="text-[10px] text-mauve font-mono font-normal">{exp.slug}</div>
                        {exp.creator_email && (
                          <div className="text-[10px] text-coral font-normal">{exp.creator_email}</div>
                        )}
                      </td>
                      <td className="p-4">{exp.occasion}</td>
                      <td className="p-4 uppercase font-bold text-[10px] text-dustyRose">{exp.tier}</td>
                      <td className="p-4">
                        <button
                          onClick={() => handleTogglePaymentStatus(exp)}
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-semibold transition-all ${
                            exp.is_paid
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-cream-card text-mauve border border-cream-border'
                          }`}
                          title="Click to toggle payment status manually"
                        >
                          {exp.is_paid ? (
                            <>
                              <ToggleRight className="w-3.5 h-3.5 text-emerald-700" />
                              <span>Paid • Active</span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="w-3.5 h-3.5 text-coral" />
                              <span>Pending / Mark Paid</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="p-4">
                        {exp.views_count} views • {exp.reactions_count} ❤️
                      </td>
                      <td className="p-4 text-mauve">
                        {new Date(exp.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handleDeleteExperience(exp.id)}
                          className="p-1.5 rounded-lg bg-rose-100 text-coral hover:bg-rose-200 border border-coral/30"
                          title="Delete Experience"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredExperiences.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-xs text-mauve">
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
          <div className="glass-card rounded-3xl border border-cream-border overflow-hidden space-y-4">
            <div className="p-6 border-b border-cream-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="font-serif font-bold text-lg text-maroon">Creator Users</h2>
                <p className="text-xs text-mauve">
                  Showing {filteredUsers.length} of {users.length} registered creators
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="w-4 h-4 text-coral absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full sm:w-60 pl-9 pr-3 py-2 rounded-xl bg-cream-card border border-cream-border text-maroon text-xs focus:outline-none focus:border-coral placeholder:text-mauve/60"
                  />
                </div>

                <div className="relative">
                  <select
                    value={tierFilter}
                    onChange={(e) => setTierFilter(e.target.value as any)}
                    className="px-3 py-2 rounded-xl bg-cream-card border border-cream-border text-maroon text-xs focus:outline-none focus:border-coral appearance-none pr-8 cursor-pointer"
                  >
                    <option value="all">All Tiers</option>
                    <option value="free">Free Tier</option>
                    <option value="paid">Paid Tier</option>
                  </select>
                  <Filter className="w-3.5 h-3.5 text-coral absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                <button
                  onClick={exportUsersCsv}
                  className="px-4 py-2 rounded-xl bg-maroon hover:bg-maroon-light text-cream text-xs font-semibold transition-all flex items-center gap-1.5 border border-maroon/20 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5 text-coral" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-maroon">
                <thead className="bg-cream-card text-mauve uppercase font-bold text-[10px] tracking-wider border-b border-cream-border">
                  <tr>
                    <th className="p-4">Email</th>
                    <th className="p-4">Tier</th>
                    <th className="p-4">Registered Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-border">
                  {filteredUsers.map((usr) => (
                    <tr key={usr.id} className="hover:bg-cream-card/60 transition-colors">
                      <td className="p-4 font-semibold text-maroon">{usr.email}</td>
                      <td className="p-4 uppercase text-[10px] font-bold text-dustyRose">{usr.tier}</td>
                      <td className="p-4 text-mauve">
                        {new Date(usr.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-xs text-mauve">
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
            <div className="flex items-center gap-3 border-b border-cream-border pb-4">
              <button
                onClick={() => setCrmSubTab('contacts')}
                className={`px-5 py-2.5 rounded-2xl text-xs font-semibold transition-all flex items-center gap-2 ${
                  crmSubTab === 'contacts'
                    ? 'bg-maroon text-cream shadow-md'
                    : 'bg-cream-card text-mauve hover:text-maroon border border-cream-border'
                }`}
              >
                <Users className="w-4 h-4 text-coral" />
                <span>Sales & Support Contacts</span>
                <span className="bg-cream-border px-2 py-0.5 rounded-full text-[10px] text-maroon">{crmContacts.length}</span>
              </button>

              <button
                onClick={() => setCrmSubTab('cms')}
                className={`px-5 py-2.5 rounded-2xl text-xs font-semibold transition-all flex items-center gap-2 ${
                  crmSubTab === 'cms'
                    ? 'bg-maroon text-cream shadow-md'
                    : 'bg-cream-card text-mauve hover:text-maroon border border-cream-border'
                }`}
              >
                <FileText className="w-4 h-4 text-coral" />
                <span>Live Site Content CMS</span>
              </button>
            </div>

            {/* Sub-Tab 1: Sales & Support Contacts */}
            {crmSubTab === 'contacts' && (
              <div className="glass-card rounded-3xl border border-cream-border overflow-hidden space-y-4">
                {/* Header Controls */}
                <div className="p-6 border-b border-cream-border flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  <div>
                    <h2 className="font-serif font-bold text-lg text-maroon">Lead & Support Contact Management</h2>
                    <p className="text-xs text-mauve">
                      Showing {filteredCrmContacts.length} of {crmContacts.length} total entries
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                    {/* Search */}
                    <div className="relative flex-1 sm:flex-initial">
                      <Search className="w-4 h-4 text-coral absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search name, email, notes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full sm:w-56 pl-9 pr-3 py-2 rounded-xl bg-cream-card border border-cream-border text-maroon text-xs focus:outline-none focus:border-coral placeholder:text-mauve/60"
                      />
                    </div>

                    {/* Type Filter */}
                    <select
                      value={crmTypeFilter}
                      onChange={(e) => setCrmTypeFilter(e.target.value as any)}
                      className="px-3 py-2 rounded-xl bg-cream-card border border-cream-border text-maroon text-xs focus:outline-none focus:border-coral cursor-pointer"
                    >
                      <option value="all">All Types</option>
                      <option value="lead">Sales Leads</option>
                      <option value="support">Support Tickets</option>
                    </select>

                    {/* Status Filter */}
                    <select
                      value={crmStatusFilter}
                      onChange={(e) => setCrmStatusFilter(e.target.value as any)}
                      className="px-3 py-2 rounded-xl bg-cream-card border border-cream-border text-maroon text-xs focus:outline-none focus:border-coral cursor-pointer"
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
                      className="px-4 py-2 rounded-xl bg-maroon hover:bg-maroon-light text-cream text-xs font-semibold transition-all flex items-center gap-1.5 shadow-md border border-maroon/20 shrink-0"
                    >
                      <UserPlus className="w-4 h-4 text-coral" />
                      <span>+ Add Contact</span>
                    </button>
                  </div>
                </div>

                {/* Contacts Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-maroon">
                    <thead className="bg-cream-card text-mauve uppercase font-bold text-[10px] tracking-wider border-b border-cream-border">
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
                    <tbody className="divide-y divide-cream-border">
                      {filteredCrmContacts.map((c) => (
                        <tr key={c.id} className="hover:bg-cream-card/60 transition-colors">
                          <td className="p-4 font-semibold text-maroon">
                            <div>{c.name}</div>
                            <div className="text-[10px] text-mauve font-normal">{c.email}</div>
                            {c.phone && <div className="text-[10px] text-coral font-mono font-normal">{c.phone}</div>}
                          </td>
                          <td className="p-4">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                                c.type === 'lead'
                                  ? 'bg-purple-100 text-purple-800 border border-purple-300'
                                  : 'bg-cyan-100 text-cyan-800 border border-cyan-300'
                              }`}
                            >
                              {c.type}
                            </span>
                          </td>
                          <td className="p-4">
                            <select
                              value={c.status}
                              onChange={(e) => handleUpdateContactStatus(c.id, e.target.value as CRMContactStatus)}
                              className="px-2.5 py-1 rounded-lg bg-cream-card border border-cream-border text-maroon text-[11px] font-medium focus:outline-none focus:border-coral cursor-pointer"
                            >
                              <option value="new">🆕 New</option>
                              <option value="contacted">💬 Contacted</option>
                              <option value="in_progress">⚙️ In Progress</option>
                              <option value="converted">🎉 Converted</option>
                              <option value="closed">✅ Closed</option>
                              <option value="lost">❌ Lost</option>
                            </select>
                          </td>
                          <td className="p-4 text-mauve">{c.source}</td>
                          <td className="p-4 max-w-xs truncate text-mauve">
                            {c.notes || <span className="italic text-mauve/50">No notes</span>}
                          </td>
                          <td className="p-4 text-mauve">
                            {new Date(c.updated_at).toLocaleDateString()}
                          </td>
                          <td className="p-4 text-right space-x-2">
                            <button
                              onClick={() => {
                                setEditingNotesContact(c);
                                setNotesText(c.notes || '');
                              }}
                              className="p-1.5 rounded-lg bg-cream-card text-maroon hover:bg-cream-border"
                              title="View & Edit Notes"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-coral" />
                            </button>
                            <button
                              onClick={() => handleDeleteContact(c.id)}
                              className="p-1.5 rounded-lg bg-rose-100 text-coral hover:bg-rose-200 border border-coral/30"
                              title="Delete Contact"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredCrmContacts.length === 0 && (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-xs text-mauve">
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
                <div className="glass-card p-6 rounded-3xl border border-cream-border">
                  <h2 className="font-serif font-bold text-xl text-maroon mb-1">
                    Live Marketing Copy CMS
                  </h2>
                  <p className="text-xs text-mauve">
                    Edit copy for the Landing and Pricing pages in real time without code redeployments.
                  </p>
                </div>

                {/* Hero Copy Fields */}
                <div className="glass-card p-6 sm:p-8 rounded-3xl border border-cream-border space-y-6">
                  <h3 className="font-serif font-bold text-lg text-maroon border-b border-cream-border pb-3 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-coral" />
                    <span>Hero Section Copy</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {DEFAULT_CMS_FIELDS.filter((f) => f.section === 'hero').map((field) => {
                      const currentValue = siteContent[field.key] || '';
                      return (
                        <div key={field.key} className="space-y-2 bg-cream-card/60 p-4 rounded-2xl border border-cream-border">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-maroon">{field.label}</label>
                            <span className="text-[10px] font-mono text-dustyRose bg-cream-card px-2 py-0.5 rounded-md border border-cream-border">
                              {field.key}
                            </span>
                          </div>

                          {field.type === 'textarea' ? (
                            <textarea
                              rows={3}
                              value={currentValue}
                              onChange={(e) => setSiteContent((prev) => ({ ...prev, [field.key]: e.target.value }))}
                              className="w-full p-3 rounded-xl bg-cream border border-cream-border text-maroon text-xs focus:outline-none focus:border-coral placeholder:text-mauve/60"
                            />
                          ) : (
                            <input
                              type="text"
                              value={currentValue}
                              onChange={(e) => setSiteContent((prev) => ({ ...prev, [field.key]: e.target.value }))}
                              className="w-full p-3 rounded-xl bg-cream border border-cream-border text-maroon text-xs focus:outline-none focus:border-coral placeholder:text-mauve/60"
                            />
                          )}

                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] text-mauve font-mono">
                              {currentValue.length} characters
                            </span>

                            <button
                              onClick={() => handleSaveContentKey(field.key, currentValue)}
                              className="px-3.5 py-1.5 rounded-lg bg-maroon hover:bg-maroon-light text-cream text-xs font-medium transition-all flex items-center gap-1.5 shadow-sm"
                            >
                              {savedKey === field.key ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>Saved!</span>
                                </>
                              ) : (
                                <>
                                  <Save className="w-3.5 h-3.5 text-coral" />
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
                <div className="glass-card p-6 sm:p-8 rounded-3xl border border-cream-border space-y-6">
                  <h3 className="font-serif font-bold text-lg text-maroon border-b border-cream-border pb-3 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-coral" />
                    <span>Pricing Section Copy</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {DEFAULT_CMS_FIELDS.filter((f) => f.section === 'pricing').map((field) => {
                      const currentValue = siteContent[field.key] || '';
                      return (
                        <div key={field.key} className="space-y-2 bg-cream-card/60 p-4 rounded-2xl border border-cream-border">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-maroon">{field.label}</label>
                            <span className="text-[10px] font-mono text-dustyRose bg-cream-card px-2 py-0.5 rounded-md border border-cream-border">
                              {field.key}
                            </span>
                          </div>

                          {field.type === 'textarea' ? (
                            <textarea
                              rows={3}
                              value={currentValue}
                              onChange={(e) => setSiteContent((prev) => ({ ...prev, [field.key]: e.target.value }))}
                              className="w-full p-3 rounded-xl bg-cream border border-cream-border text-maroon text-xs focus:outline-none focus:border-coral placeholder:text-mauve/60"
                            />
                          ) : (
                            <input
                              type="text"
                              value={currentValue}
                              onChange={(e) => setSiteContent((prev) => ({ ...prev, [field.key]: e.target.value }))}
                              className="w-full p-3 rounded-xl bg-cream border border-cream-border text-maroon text-xs focus:outline-none focus:border-coral placeholder:text-mauve/60"
                            />
                          )}

                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] text-mauve font-mono">
                              {currentValue.length} characters
                            </span>

                            <button
                              onClick={() => handleSaveContentKey(field.key, currentValue)}
                              className="px-3.5 py-1.5 rounded-lg bg-maroon hover:bg-maroon-light text-cream text-xs font-medium transition-all flex items-center gap-1.5 shadow-sm"
                            >
                              {savedKey === field.key ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>Saved!</span>
                                </>
                              ) : (
                                <>
                                  <Save className="w-3.5 h-3.5 text-coral" />
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

        {/* Settings Tab Content */}
        {activeTab === 'settings' && (
          <div className="space-y-8">
            {/* Sub-Admin Management Section (super_admin only) */}
            {adminRole === 'super_admin' && (
              <div className="bg-cream-card rounded-2xl p-6 border border-cream-border shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="font-serif font-bold text-xl text-maroon flex items-center gap-2">
                      <Shield className="w-5 h-5 text-coral" />
                      Sub-Admin Management
                    </h2>
                    <p className="text-xs text-mauve mt-1">
                      Add team members and assign role-based access permissions.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setIsAddAdminOpen(!isAddAdminOpen);
                      setSubAdminError(null);
                    }}
                    className="px-4 py-2 bg-maroon text-cream rounded-xl text-xs font-semibold hover:bg-maroon/90 transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{isAddAdminOpen ? 'Cancel' : 'Add Sub-Admin'}</span>
                  </button>
                </div>

                {subAdminSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{subAdminSuccess}</span>
                  </div>
                )}

                {/* Add Sub-Admin Form */}
                {isAddAdminOpen && (
                  <form onSubmit={handleAddSubAdmin} className="p-4 bg-white rounded-xl border border-cream-border space-y-4">
                    <h3 className="font-medium text-sm text-maroon">Create New Admin Account</h3>
                    {subAdminError && (
                      <div className="p-2.5 bg-rose-50 border border-rose-200 text-coral text-xs rounded-lg flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{subAdminError}</span>
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-mauve mb-1">Email Address</label>
                        <input
                          type="email"
                          required
                          placeholder="admin@example.com"
                          value={newAdminEmail}
                          onChange={(e) => setNewAdminEmail(e.target.value)}
                          className="w-full px-3 py-2 bg-cream-card border border-cream-border rounded-lg text-xs focus:outline-none focus:border-maroon"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-mauve mb-1">Temporary Password</label>
                        <input
                          type="password"
                          required
                          minLength={8}
                          placeholder="At least 8 characters"
                          value={newAdminPassword}
                          onChange={(e) => setNewAdminPassword(e.target.value)}
                          className="w-full px-3 py-2 bg-cream-card border border-cream-border rounded-lg text-xs focus:outline-none focus:border-maroon"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-mauve mb-1">Assigned Role</label>
                        <select
                          value={newAdminRole}
                          onChange={(e) => setNewAdminRole(e.target.value as AdminRole)}
                          className="w-full px-3 py-2 bg-cream-card border border-cream-border rounded-lg text-xs focus:outline-none focus:border-maroon"
                        >
                          <option value="super_admin">Super Admin (Full Access & Settings)</option>
                          <option value="admin">Admin (All tabs except Settings)</option>
                          <option value="support">Support (Read-only Experiences & CRM)</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsAddAdminOpen(false)}
                        className="px-3 py-1.5 text-xs text-mauve hover:text-maroon"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-maroon text-cream rounded-lg text-xs font-semibold hover:bg-maroon/90"
                      >
                        Create Account
                      </button>
                    </div>
                  </form>
                )}

                {/* Sub-Admins Table */}
                <div className="overflow-x-auto rounded-xl border border-cream-border">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-cream border-b border-cream-border text-mauve font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="p-3.5">Admin Email</th>
                        <th className="p-3.5">Role</th>
                        <th className="p-3.5">Created Date</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cream-border bg-white">
                      {subAdmins.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-6 text-center text-mauve">
                            No sub-admin accounts created yet.
                          </td>
                        </tr>
                      ) : (
                        subAdmins.map((admin) => (
                          <tr key={admin.id} className="hover:bg-cream/50 transition-colors">
                            <td className="p-3.5 font-medium text-maroon">{admin.email}</td>
                            <td className="p-3.5">
                              <select
                                value={admin.role}
                                onChange={(e) => handleUpdateSubAdminRole(admin.id, e.target.value as AdminRole)}
                                className="px-2 py-1 bg-cream-card border border-cream-border rounded-lg text-xs font-medium focus:outline-none focus:border-maroon"
                              >
                                <option value="super_admin">Super Admin</option>
                                <option value="admin">Admin</option>
                                <option value="support">Support</option>
                              </select>
                            </td>
                            <td className="p-3.5 text-mauve">
                              {new Date(admin.created_at).toLocaleDateString()}
                            </td>
                            <td className="p-3.5 text-right">
                              <button
                                onClick={() => handleDeleteSubAdmin(admin.id)}
                                className="p-1.5 rounded-lg bg-rose-100 text-coral hover:bg-rose-200 transition-colors"
                                title="Remove Sub-Admin"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Change Password Section */}
            <div className="bg-cream-card rounded-2xl p-6 border border-cream-border shadow-sm space-y-6">
              <div>
                <h2 className="font-serif font-bold text-xl text-maroon flex items-center gap-2">
                  <Key className="w-5 h-5 text-coral" />
                  Change Password
                </h2>
                <p className="text-xs text-mauve mt-1">
                  Update your login password securely.
                </p>
              </div>

              {isRootAdmin ? (
                <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold mb-0.5">Root Admin Account</p>
                    <p>
                      Root admin password is set via environment variables (<code className="bg-amber-100 px-1 py-0.5 rounded">ADMIN_PASSWORD_HASH</code>) and cannot be modified through the web interface.
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleChangePasswordSubmit} className="max-w-md space-y-4">
                  {passwordError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-coral text-xs rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{passwordError}</span>
                    </div>
                  )}

                  {passwordSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{passwordSuccess}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-mauve mb-1">Current Password</label>
                    <input
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-cream-border rounded-xl text-xs focus:outline-none focus:border-maroon"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-mauve mb-1">New Password</label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      placeholder="Minimum 8 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-cream-border rounded-xl text-xs focus:outline-none focus:border-maroon"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-mauve mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-cream-border rounded-xl text-xs focus:outline-none focus:border-maroon"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="px-5 py-2.5 bg-maroon text-cream rounded-xl text-xs font-semibold hover:bg-maroon/90 transition-all shadow-sm disabled:opacity-50"
                  >
                    {isChangingPassword ? 'Updating Password...' : 'Update Password'}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Contact Modal */}
      {isAddContactOpen && (
        <div className="fixed inset-0 z-50 bg-maroon/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-cream-border max-w-md w-full shadow-2xl space-y-6 relative bg-cream">
            <button
              onClick={() => setIsAddContactOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-cream-card text-maroon hover:bg-cream-border border border-cream-border"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <h3 className="font-serif font-bold text-xl text-maroon">Add New CRM Contact</h3>
              <p className="text-xs text-mauve mt-1">Record a sales lead or support inquiry.</p>
            </div>

            <form onSubmit={handleAddContactSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-mauve mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Funmi Adeleke"
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  className="w-full p-3 rounded-xl bg-cream-card border border-cream-border text-maroon focus:outline-none focus:border-coral"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-mauve mb-1">Email</label>
                  <input
                    type="email"
                    required
                    placeholder="funmi@example.com"
                    value={newContact.email}
                    onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                    className="w-full p-3 rounded-xl bg-cream-card border border-cream-border text-maroon focus:outline-none focus:border-coral"
                  />
                </div>
                <div>
                  <label className="block font-medium text-mauve mb-1">Phone (Optional)</label>
                  <input
                    type="text"
                    placeholder="+234 800 000 0000"
                    value={newContact.phone}
                    onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                    className="w-full p-3 rounded-xl bg-cream-card border border-cream-border text-maroon focus:outline-none focus:border-coral"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-mauve mb-1">Type</label>
                  <select
                    value={newContact.type}
                    onChange={(e) => setNewContact({ ...newContact, type: e.target.value as CRMContactType })}
                    className="w-full p-3 rounded-xl bg-cream-card border border-cream-border text-maroon focus:outline-none focus:border-coral"
                  >
                    <option value="lead">Sales Lead</option>
                    <option value="support">Support Ticket</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-mauve mb-1">Initial Status</label>
                  <select
                    value={newContact.status}
                    onChange={(e) => setNewContact({ ...newContact, status: e.target.value as CRMContactStatus })}
                    className="w-full p-3 rounded-xl bg-cream-card border border-cream-border text-maroon focus:outline-none focus:border-coral"
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
                <label className="block font-medium text-mauve mb-1">Source</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Landing Page, Checkout Help, Instagram"
                  value={newContact.source}
                  onChange={(e) => setNewContact({ ...newContact, source: e.target.value })}
                  className="w-full p-3 rounded-xl bg-cream-card border border-cream-border text-maroon focus:outline-none focus:border-coral"
                />
              </div>

              <div>
                <label className="block font-medium text-mauve mb-1">Notes</label>
                <textarea
                  rows={3}
                  placeholder="Additional context or customer request details..."
                  value={newContact.notes}
                  onChange={(e) => setNewContact({ ...newContact, notes: e.target.value })}
                  className="w-full p-3 rounded-xl bg-cream-card border border-cream-border text-maroon focus:outline-none focus:border-coral"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-full bg-maroon hover:bg-maroon-light text-cream font-semibold text-xs shadow-md transition-all border border-maroon/20"
              >
                Create Contact
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Notes Modal */}
      {editingNotesContact && (
        <div className="fixed inset-0 z-50 bg-maroon/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card p-6 rounded-3xl border border-cream-border max-w-md w-full shadow-2xl space-y-4 relative bg-cream">
            <button
              onClick={() => setEditingNotesContact(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-cream-card text-maroon hover:bg-cream-border border border-cream-border"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <h3 className="font-serif font-bold text-lg text-maroon">Contact Notes</h3>
              <p className="text-xs text-mauve">{editingNotesContact.name} ({editingNotesContact.email})</p>
            </div>

            <textarea
              rows={5}
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              placeholder="Enter contact notes or conversation history..."
              className="w-full p-3 rounded-2xl bg-cream-card border border-cream-border text-maroon text-xs focus:outline-none focus:border-coral placeholder:text-mauve/60"
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingNotesContact(null)}
                className="px-4 py-2 rounded-xl bg-cream-card text-maroon hover:bg-cream-border border border-cream-border text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveNotes}
                className="px-4 py-2 rounded-xl bg-maroon hover:bg-maroon-light text-cream text-xs font-semibold transition-all shadow-md"
              >
                Save Notes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Blog Management Tab View */}
      {activeTab === 'blog' && (
        <div className="space-y-6">
          {adminRole === 'support' ? (
            <div className="p-8 text-center rounded-3xl bg-cream-card border border-cream-border">
              <Shield className="w-10 h-10 text-coral mx-auto mb-3" />
              <h3 className="font-serif text-xl font-bold text-maroon mb-2">Access Restricted</h3>
              <p className="text-mauve text-sm">Blog authoring requires Admin or Super Admin privileges.</p>
            </div>
          ) : (
            <>
              {/* Header Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-cream-card p-6 rounded-3xl border border-cream-border">
                <div>
                  <h2 className="font-serif text-xl font-bold text-maroon">Blog Post Authoring</h2>
                  <p className="text-xs text-mauve">Create, edit, and publish articles for organic search & guest guidance.</p>
                </div>
                <button
                  onClick={() => {
                    setEditingBlogPost(null);
                    setBlogTitle('');
                    setBlogSlug('');
                    setBlogExcerpt('');
                    setBlogCoverUrl('');
                    setBlogContent('');
                    setBlogPublished(false);
                    setBlogError(null);
                    setIsBlogModalOpen(true);
                  }}
                  className="px-5 py-2.5 rounded-full bg-maroon hover:bg-maroon-light text-cream font-semibold text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-coral" />
                  <span>Create New Article</span>
                </button>
              </div>

              {blogSuccess && (
                <div className="p-4 rounded-2xl bg-green-50 border border-green-200 text-green-800 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600 shrink-0" />
                  <span>{blogSuccess}</span>
                </div>
              )}

              {/* Blog Table */}
              <div className="bg-cream-card rounded-3xl border border-cream-border overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-cream-border bg-cream/50 text-[11px] font-semibold text-mauve uppercase tracking-wider">
                        <th className="py-4 px-6">Title & Excerpt</th>
                        <th className="py-4 px-6">Slug</th>
                        <th className="py-4 px-6">Status</th>
                        <th className="py-4 px-6">Date</th>
                        <th className="py-4 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cream-border text-xs text-maroon">
                      {blogPosts.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-mauve">
                            No blog posts created yet. Click "Create New Article" to write your first post.
                          </td>
                        </tr>
                      ) : (
                        blogPosts.map((post) => (
                          <tr key={post.id} className="hover:bg-cream/40 transition-colors">
                            <td className="py-4 px-6 max-w-xs">
                              <p className="font-semibold text-maroon line-clamp-1">{post.title}</p>
                              <p className="text-mauve/80 text-[11px] line-clamp-1 mt-0.5">{post.excerpt}</p>
                            </td>
                            <td className="py-4 px-6 font-mono text-[11px] text-mauve">
                              /blog/{post.slug}
                            </td>
                            <td className="py-4 px-6">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                                post.published
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}>
                                {post.published ? 'Published' : 'Draft'}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-mauve">
                              {new Date(post.published_at || post.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </td>
                            <td className="py-4 px-6 text-right space-x-2">
                              <button
                                onClick={async () => {
                                  try {
                                    const updated = await updateAdminBlogPostApi(post.id, { published: !post.published });
                                    setBlogPosts((prev) => prev.map((p) => (p.id === post.id ? updated : p)));
                                  } catch (err: unknown) {
                                    alert(err instanceof Error ? err.message : 'Failed to toggle status');
                                  }
                                }}
                                className="p-1.5 rounded-lg bg-cream border border-cream-border text-maroon hover:text-coral transition-colors"
                                title={post.published ? 'Unpublish to Draft' : 'Publish Article'}
                              >
                                {post.published ? <ToggleRight className="w-4 h-4 text-emerald-600" /> : <ToggleLeft className="w-4 h-4 text-amber-600" />}
                              </button>
                              <button
                                onClick={() => {
                                  setEditingBlogPost(post);
                                  setBlogTitle(post.title);
                                  setBlogSlug(post.slug);
                                  setBlogExcerpt(post.excerpt);
                                  setBlogCoverUrl(post.cover_image_url || '');
                                  setBlogContent(post.content);
                                  setBlogPublished(post.published);
                                  setBlogError(null);
                                  setIsBlogModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg bg-cream border border-cream-border text-maroon hover:text-coral transition-colors"
                                title="Edit Article"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={async () => {
                                  if (!confirm(`Are you sure you want to delete "${post.title}"?`)) return;
                                  try {
                                    await deleteAdminBlogPostApi(post.id);
                                    setBlogPosts((prev) => prev.filter((p) => p.id !== post.id));
                                  } catch (err: unknown) {
                                    alert(err instanceof Error ? err.message : 'Failed to delete post');
                                  }
                                }}
                                className="p-1.5 rounded-lg bg-cream border border-cream-border text-red-600 hover:bg-red-50 transition-colors"
                                title="Delete Article"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Blog Article Editor Modal */}
      {isBlogModalOpen && (
        <div className="fixed inset-0 z-50 bg-maroon/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-cream-border max-w-2xl w-full shadow-2xl space-y-6 relative bg-cream my-8 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-cream-border pb-4">
              <div>
                <h3 className="font-serif font-bold text-xl text-maroon">
                  {editingBlogPost ? 'Edit Blog Article' : 'Create New Blog Article'}
                </h3>
                <p className="text-xs text-mauve">Format article content using standard Markdown syntax.</p>
              </div>
              <button
                onClick={() => setIsBlogModalOpen(false)}
                className="p-1.5 rounded-full bg-cream-card text-maroon hover:bg-cream-border border border-cream-border cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {blogError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{blogError}</span>
              </div>
            )}

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setBlogError(null);
                setBlogIsSaving(true);

                try {
                  if (editingBlogPost) {
                    const updated = await updateAdminBlogPostApi(editingBlogPost.id, {
                      title: blogTitle,
                      slug: blogSlug,
                      excerpt: blogExcerpt,
                      cover_image_url: blogCoverUrl,
                      content: blogContent,
                      published: blogPublished,
                    });
                    setBlogPosts((prev) => prev.map((p) => (p.id === editingBlogPost.id ? updated : p)));
                    setBlogSuccess(`Article "${updated.title}" updated successfully.`);
                  } else {
                    const created = await createAdminBlogPostApi({
                      title: blogTitle,
                      slug: blogSlug,
                      excerpt: blogExcerpt,
                      cover_image_url: blogCoverUrl,
                      content: blogContent,
                      published: blogPublished,
                    });
                    setBlogPosts((prev) => [created, ...prev]);
                    setBlogSuccess(`Article "${created.title}" created successfully.`);
                  }

                  setIsBlogModalOpen(false);
                  setTimeout(() => setBlogSuccess(null), 4000);
                } catch (err: unknown) {
                  const msg = err instanceof Error ? err.message : 'Failed to save blog post.';
                  setBlogError(msg);
                } finally {
                  setBlogIsSaving(false);
                }
              }}
              className="space-y-4 overflow-y-auto pr-1 flex-1"
            >
              <div>
                <label className="block text-xs font-semibold text-maroon mb-1">Article Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 10 Tips for Your Wedding Invitation Story"
                  value={blogTitle}
                  onChange={(e) => {
                    setBlogTitle(e.target.value);
                    if (!editingBlogPost && !blogSlug) {
                      setBlogSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                    }
                  }}
                  className="w-full p-3 rounded-2xl bg-cream-card border border-cream-border text-maroon text-xs focus:outline-none focus:border-coral"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-maroon mb-1">URL Slug (kebab-case)</label>
                <input
                  type="text"
                  placeholder="10-tips-for-your-wedding-invitation-story"
                  value={blogSlug}
                  onChange={(e) => setBlogSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                  className="w-full p-3 rounded-2xl bg-cream-card border border-cream-border text-maroon text-xs focus:outline-none focus:border-coral font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-maroon mb-1">Summary Excerpt *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="A short 1-2 sentence preview description for article cards and SEO meta tag..."
                  value={blogExcerpt}
                  onChange={(e) => setBlogExcerpt(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-cream-card border border-cream-border text-maroon text-xs focus:outline-none focus:border-coral"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-maroon mb-1">Cover Image URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={blogCoverUrl}
                  onChange={(e) => setBlogCoverUrl(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-cream-card border border-cream-border text-maroon text-xs focus:outline-none focus:border-coral"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-maroon">Content (Markdown Format) *</label>
                  <div className="flex items-center gap-1 bg-cream-card p-1 rounded-xl border border-cream-border text-[11px]">
                    <button
                      type="button"
                      onClick={() => setBlogTabMode('write')}
                      className={`px-3 py-1 rounded-lg transition-colors ${blogTabMode === 'write' ? 'bg-maroon text-cream font-semibold' : 'text-mauve'}`}
                    >
                      Write
                    </button>
                    <button
                      type="button"
                      onClick={() => setBlogTabMode('preview')}
                      className={`px-3 py-1 rounded-lg transition-colors ${blogTabMode === 'preview' ? 'bg-maroon text-cream font-semibold' : 'text-mauve'}`}
                    >
                      Preview
                    </button>
                  </div>
                </div>

                {blogTabMode === 'write' ? (
                  <textarea
                    required
                    rows={8}
                    placeholder="## Why Digital Invitations Matter&#10;&#10;Write your article content using Markdown (# Headings, **bold**, *italics*, - lists)..."
                    value={blogContent}
                    onChange={(e) => setBlogContent(e.target.value)}
                    className="w-full p-3.5 rounded-2xl bg-cream-card border border-cream-border text-maroon text-xs font-mono focus:outline-none focus:border-coral"
                  />
                ) : (
                  <div className="p-4 rounded-2xl bg-cream-card border border-cream-border min-h-[160px] text-xs text-mauve space-y-2">
                    <p className="text-[10px] font-semibold text-coral uppercase tracking-wider">Live Markdown Preview:</p>
                    <div className="prose text-maroon">
                      {blogContent ? blogContent.split('\n').map((line, idx) => <p key={idx}>{line}</p>) : <em className="text-mauve/60">No content entered yet.</em>}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="blog-publish-toggle"
                  checked={blogPublished}
                  onChange={(e) => setBlogPublished(e.target.checked)}
                  className="w-4 h-4 rounded text-coral focus:ring-coral border-cream-border"
                />
                <label htmlFor="blog-publish-toggle" className="text-xs font-semibold text-maroon cursor-pointer">
                  Publish immediately (makes article visible publicly on /blog)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-cream-border">
                <button
                  type="button"
                  onClick={() => setIsBlogModalOpen(false)}
                  className="px-5 py-2.5 rounded-full bg-cream-card text-maroon hover:bg-cream-border border border-cream-border text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={blogIsSaving}
                  className="px-6 py-2.5 rounded-full bg-maroon hover:bg-maroon-light text-cream text-xs font-semibold transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {blogIsSaving ? 'Saving...' : editingBlogPost ? 'Update Article' : 'Save Article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
