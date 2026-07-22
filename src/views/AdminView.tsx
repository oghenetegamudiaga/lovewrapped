import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Users, Layers, DollarSign, Heart, Trash2, Eye, Copy, RefreshCw, Key, Check } from 'lucide-react';
import { AdminMetrics, Experience, UserRecord } from '../types';
import { getAdminMetricsApi, getAdminUsersApi, getAdminExperiencesApi, deleteAdminExperienceApi } from '../lib/api';

interface AdminViewProps {
  onPreviewExperience: (slug: string) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ onPreviewExperience }) => {
  const [passcode, setPasscode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [activeTab, setActiveTab] = useState<'metrics' | 'experiences' | 'users'>('metrics');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const loadData = useCallback(async (code: string) => {
    setIsLoading(true);
    setAuthError(null);

    try {
      const [m, u, e] = await Promise.all([
        getAdminMetricsApi(code),
        getAdminUsersApi(code),
        getAdminExperiencesApi(code),
      ]);

      setMetrics(m);
      setUsers(u);
      setExperiences(e);
      setIsAuthenticated(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid passcode.';
      setAuthError(msg);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode) {
      loadData(passcode);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this experience?')) return;

    try {
      await deleteAdminExperienceApi(passcode, id);
      setExperiences((prev) => prev.filter((exp) => exp.id !== id));
      if (metrics) {
        setMetrics({ ...metrics, totalExperiences: metrics.totalExperiences - 1 });
      }
    } catch (err) {
      alert('Failed to delete experience.');
    }
  };

  const handleCopyLink = (slug: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `${origin}/w/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[85vh] bg-[#2b0818] text-[#fce7f3] py-12 px-4 flex items-center justify-center font-sans">
        <div className="glass-card p-8 rounded-3xl border border-rose-500/20 max-w-sm w-full shadow-2xl text-center space-y-6">
          <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-400/30 text-rose-300 flex items-center justify-center mx-auto">
            <Shield className="w-6 h-6" />
          </div>

          <div>
            <h1 className="font-serif font-bold text-2xl text-white">LoveWrapped Admin</h1>
            <p className="text-xs text-rose-300/70 mt-1">Enter passcode to access dashboard metrics.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {authError && (
              <p className="text-xs text-rose-300 bg-rose-950/80 p-2.5 rounded-xl border border-rose-800/80">
                {authError}
              </p>
            )}

            <div className="relative">
              <Key className="w-4 h-4 text-rose-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="Enter admin passcode..."
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#3a0d22] border border-rose-800/60 text-white text-sm focus:outline-none focus:border-rose-400 placeholder:text-rose-300/40"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-full bg-gradient-to-r from-rose-600 via-pink-600 to-rose-500 hover:from-rose-500 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 border border-rose-400/20 shadow-lg"
            >
              {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Login to Admin</span>}
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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-rose-900/40">
          <div>
            <div className="eyebrow-pill mb-2">
              <span />
              Admin Portal
            </div>
            <h1 className="font-serif font-bold text-2xl sm:text-3xl text-white">
              Platform Overview & Metrics
            </h1>
          </div>

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
          </div>
        </div>

        {/* Metrics Grid */}
        {activeTab === 'metrics' && metrics && (
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
        )}

        {/* Experiences Table */}
        {activeTab === 'experiences' && (
          <div className="glass-card rounded-3xl border border-rose-500/20 overflow-hidden">
            <div className="p-6 border-b border-rose-800/50 flex items-center justify-between">
              <h2 className="font-serif font-bold text-lg text-white">Created Story Cards</h2>
              <span className="text-xs text-rose-300/80 font-medium">{experiences.length} records</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-rose-100">
                <thead className="bg-[#3a0d22] text-rose-300 uppercase font-bold text-[10px] tracking-wider border-b border-rose-800/60">
                  <tr>
                    <th className="p-4">Sender & Receiver</th>
                    <th className="p-4">Occasion</th>
                    <th className="p-4">Tier & Payment</th>
                    <th className="p-4">Views / Reactions</th>
                    <th className="p-4">Created Date</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rose-900/40">
                  {experiences.map((exp) => (
                    <tr key={exp.id} className="hover:bg-rose-950/40 transition-colors">
                      <td className="p-4 font-semibold text-white">
                        {exp.sender_name} → {exp.receiver_name}
                        <div className="text-[10px] text-rose-300/60 font-mono font-normal">{exp.slug}</div>
                      </td>
                      <td className="p-4">{exp.occasion}</td>
                      <td className="p-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                            exp.tier === 'paid'
                              ? 'bg-rose-900/80 text-rose-200 border border-rose-700'
                              : 'bg-rose-950 text-rose-300/70 border border-rose-900'
                          }`}
                        >
                          {exp.tier} {exp.is_paid ? '• Active' : '• Pending'}
                        </span>
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
                          title="Preview"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleCopyLink(exp.slug)}
                          className="p-1.5 rounded-lg bg-rose-900/80 text-rose-200 hover:bg-rose-800"
                          title="Copy Link"
                        >
                          {copiedSlug === exp.slug ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleDelete(exp.id)}
                          className="p-1.5 rounded-lg bg-rose-950 text-rose-400 hover:bg-rose-900 hover:text-white border border-rose-800/60"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Users Table */}
        {activeTab === 'users' && (
          <div className="glass-card rounded-3xl border border-rose-500/20 overflow-hidden">
            <div className="p-6 border-b border-rose-800/50 flex items-center justify-between">
              <h2 className="font-serif font-bold text-lg text-white">Creator Users</h2>
              <span className="text-xs text-rose-300/80 font-medium">{users.length} records</span>
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
                  {users.map((usr) => (
                    <tr key={usr.id} className="hover:bg-rose-950/40 transition-colors">
                      <td className="p-4 font-semibold text-white">{usr.email}</td>
                      <td className="p-4 uppercase text-[10px] font-bold text-rose-300">{usr.tier}</td>
                      <td className="p-4 text-rose-300/70">
                        {new Date(usr.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

