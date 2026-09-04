import React, { useState } from 'react';
import { Heart, Lock, Mail, User, ArrowRight, AlertCircle } from 'lucide-react';
import { CoupleAccount } from '../types.js';
import { getCoupleMyWeddingsApi } from '../lib/api.js';
import { getPostAuthRedirect, validateRedirectTarget, buildAuthUrl } from '../lib/authIntent.js';

interface WeddingsSignupViewProps {
  onNavigate: (path: string) => void;
  onSignupSuccess: (couple: CoupleAccount) => void;
}

export const WeddingsSignupView: React.FC<WeddingsSignupViewProps> = ({ onNavigate, onSignupSuccess }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const queryParams = new URLSearchParams(window.location.search);
  const rawRedirect = queryParams.get('redirect');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (!password || password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/weddings/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          full_name: fullName.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMsg(data.message || 'Failed to create account. Please try again.');
        setIsLoading(false);
        return;
      }

      if (data.couple) {
        onSignupSuccess(data.couple);
      }

      // Resume explicit intended destination if present
      if (rawRedirect) {
        const validated = validateRedirectTarget(rawRedirect, '');
        if (validated && !validated.includes('/login') && !validated.includes('/signup')) {
          onNavigate(validated);
          return;
        }
      }

      // Smart fallback based on portfolio if no explicit intent
      try {
        const mineRes = await getCoupleMyWeddingsApi();
        const list = mineRes.weddings || [];
        const destination = getPostAuthRedirect(null, list.length, list[0]?.id);
        onNavigate(destination);
      } catch (err) {
        onNavigate('/weddings/create');
      }
    } catch (err) {
      console.error('Signup request error:', err);
      setErrorMsg('An unexpected network error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-[80vh] bg-[#FFFEFE] text-maroon font-sans items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white border border-cream-border p-8 rounded-3xl shadow-lg relative overflow-hidden">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-coral/10 text-coral mb-3">
            <Heart className="w-6 h-6 fill-coral" />
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-maroon">
            Weddings by Amorah
          </h1>
          <p className="text-xs text-mauve mt-1">
            Create your couple account to begin building your digital invitation.
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-maroon mb-1.5" htmlFor="signup-fullname">
              Full Name / Couple Names (Optional)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-mauve/60">
                <User className="w-4 h-4" />
              </div>
              <input
                id="signup-fullname"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Alex & Sam"
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-cream border border-cream-border text-maroon text-sm focus:outline-none focus:border-coral transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-maroon mb-1.5" htmlFor="signup-email">
              Email Address <span className="text-coral">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-mauve/60">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="signup-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="couple@example.com"
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-cream border border-cream-border text-maroon text-sm focus:outline-none focus:border-coral transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-maroon mb-1.5" htmlFor="signup-password">
              Password <span className="text-coral">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-mauve/60">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="signup-password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-cream border border-cream-border text-maroon text-sm focus:outline-none focus:border-coral transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            id="weddings-signup-submit-button"
            disabled={isLoading}
            className="w-full mt-2 py-3.5 px-6 rounded-2xl bg-maroon hover:bg-maroon-light text-cream font-semibold text-sm shadow-md hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <span>Creating account...</span>
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight className="w-4 h-4 text-coral" />
              </>
            )}
          </button>
        </form>

        {/* Login Switch */}
        <div className="mt-6 pt-6 border-t border-cream-border text-center text-xs text-mauve">
          <span>Already have a couple account? </span>
          <button
            type="button"
            id="weddings-goto-login-button"
            onClick={() => onNavigate(buildAuthUrl(rawRedirect || '/weddings/create', false))}
            className="font-semibold text-maroon hover:text-coral transition-colors cursor-pointer"
          >
            Sign in here
          </button>
        </div>
      </div>
    </div>
  );
};
