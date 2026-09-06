import React, { useState } from 'react';
import { Lock, ArrowRight, CheckCircle2, AlertCircle, KeyRound, Eye, EyeOff } from 'lucide-react';

interface WeddingsResetPasswordViewProps {
  onNavigate: (path: string) => void;
}

export const WeddingsResetPasswordView: React.FC<WeddingsResetPasswordViewProps> = ({ onNavigate }) => {
  // Extract token query parameter from URL
  const searchParams = new URLSearchParams(window.location.search);
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('Missing or invalid password reset token link.');
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please check and try again.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/weddings/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsSuccess(true);
      } else {
        setError(data.message || 'Failed to reset password. The link may have expired or been used already.');
      }
    } catch (err) {
      setError('Network error. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFEFE] text-maroon flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-coral selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <button
          onClick={() => onNavigate('/')}
          className="inline-flex items-center gap-2 group cursor-pointer focus:outline-none mb-4"
        >
          <img src="/logo.png" alt="Amorah" className="h-9 w-auto object-contain" />
        </button>
        <h2 className="hero-title text-3xl font-bold tracking-tight text-maroon">
          Set New Password
        </h2>
        <p className="mt-2 text-sm text-mauve">
          Enter a new password for your Weddings by Amorah account.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 border border-cream-border rounded-3xl sm:px-10">
          {!token ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-maroon">Invalid Reset Link</h3>
              <p className="text-sm text-mauve leading-relaxed">
                This password reset link is missing a valid token. Please request a new link from the login page.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('/weddings/login')}
                className="w-full py-3.5 px-4 rounded-full bg-maroon hover:bg-maroon-light text-cream font-semibold text-sm transition-all cursor-pointer shadow-md mt-2"
              >
                Go to Login
              </button>
            </div>
          ) : isSuccess ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-maroon">Password Reset Complete</h3>
              <p className="text-sm text-mauve leading-relaxed">
                Your password has been updated successfully. You can now log in with your new credentials.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('/weddings/login')}
                className="w-full py-3.5 px-4 rounded-full bg-maroon hover:bg-maroon-light text-cream font-semibold text-sm transition-all cursor-pointer shadow-md mt-2 flex items-center justify-center gap-2"
              >
                <span>Log In Now</span>
                <ArrowRight className="w-4 h-4 text-coral" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-maroon uppercase tracking-wider mb-2">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-mauve/60">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full pl-10 pr-10 py-3 rounded-xl border border-cream-border bg-cream-field text-maroon focus:outline-none focus:border-coral text-sm transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-mauve/60 hover:text-maroon focus:outline-none transition-colors cursor-pointer"
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-maroon uppercase tracking-wider mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-mauve/60">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full pl-10 pr-10 py-3 rounded-xl border border-cream-border bg-cream-field text-maroon focus:outline-none focus:border-coral text-sm transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-mauve/60 hover:text-maroon focus:outline-none transition-colors cursor-pointer"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-full bg-maroon hover:bg-maroon-light text-cream font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-cream border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Reset Password</span>
                    <ArrowRight className="w-4 h-4 text-coral" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
