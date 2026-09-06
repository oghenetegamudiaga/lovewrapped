import React, { useState } from 'react';
import { Heart, Lock, Mail, ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { CoupleAccount } from '../types.js';
import { getCoupleMyWeddingsApi } from '../lib/api.js';
import { getPostAuthRedirect, validateRedirectTarget, buildAuthUrl } from '../lib/authIntent.js';
import { AUTH_COPY } from '../config/authCopy.js';

interface WeddingsLoginViewProps {
  onNavigate: (path: string) => void;
  onLoginSuccess: (couple: CoupleAccount) => void;
}

export const WeddingsLoginView: React.FC<WeddingsLoginViewProps> = ({ onNavigate, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Forgot password mode state
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState<string | null>(null);
  const [isForgotLoading, setIsForgotLoading] = useState(false);

  const queryParams = new URLSearchParams(window.location.search);
  const rawRedirect = queryParams.get('redirect');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/weddings/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMsg(data.message || 'Login failed. Invalid email or password.');
        setIsLoading(false);
        return;
      }

      if (data.couple) {
        onLoginSuccess(data.couple);
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
      console.error('Login request error:', err);
      setErrorMsg('An unexpected network error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setForgotSuccessMsg(null);

    if (!forgotEmail || !forgotEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setIsForgotLoading(true);

    try {
      const res = await fetch('/api/weddings/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });

      const data = await res.json();
      setForgotSuccessMsg(data.message || 'If an account exists with that email, a reset link has been sent.');
    } catch (err) {
      setErrorMsg('Failed to send reset link. Please try again.');
    } finally {
      setIsForgotLoading(false);
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
            {isForgotMode ? 'Reset Your Password' : AUTH_COPY.login.heading}
          </h1>
          <p className="text-xs text-mauve mt-1">
            {isForgotMode
              ? 'Enter your email address and we will send you a password reset link.'
              : AUTH_COPY.login.subtext}
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success Alert for Forgot Password Mode */}
        {forgotSuccessMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs leading-relaxed flex items-start gap-3">
            <Heart className="w-4 h-4 text-emerald-600 fill-emerald-600 shrink-0 mt-0.5" />
            <span>{forgotSuccessMsg}</span>
          </div>
        )}

        {/* Forgot Password Mode Form */}
        {isForgotMode ? (
          <form onSubmit={handleForgotPasswordSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-maroon mb-1.5" htmlFor="forgot-email">
                Account Email Address <span className="text-coral">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-mauve/60">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="forgot-email"
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="Enter your registered email"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-cream border border-cream-border text-maroon text-sm focus:outline-none focus:border-coral transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              id="weddings-forgot-submit-button"
              disabled={isForgotLoading}
              className="w-full mt-2 py-3.5 px-6 rounded-2xl bg-maroon hover:bg-maroon-light text-cream font-semibold text-sm shadow-md hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isForgotLoading ? (
                <div className="w-4 h-4 border-2 border-cream border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Send Reset Link</span>
                  <ArrowRight className="w-4 h-4 text-coral" />
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                id="weddings-back-to-login-button"
                onClick={() => {
                  setIsForgotMode(false);
                  setErrorMsg(null);
                  setForgotSuccessMsg(null);
                }}
                className="text-xs font-semibold text-maroon hover:text-coral transition-colors cursor-pointer"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        ) : (
          /* Standard Login Form */
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-maroon mb-1.5" htmlFor="login-email">
                {AUTH_COPY.login.emailLabel} <span className="text-coral">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-mauve/60">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={AUTH_COPY.login.emailPlaceholder}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-cream border border-cream-border text-maroon text-sm focus:outline-none focus:border-coral transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-maroon" htmlFor="login-password">
                  {AUTH_COPY.login.passwordLabel} <span className="text-coral">*</span>
                </label>
                <button
                  type="button"
                  id="weddings-forgot-password-link"
                  onClick={() => {
                    setIsForgotMode(true);
                    setErrorMsg(null);
                    setForgotSuccessMsg(null);
                    if (email) setForgotEmail(email);
                  }}
                  className="text-xs font-semibold text-maroon hover:text-coral transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-mauve/60">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={AUTH_COPY.login.passwordPlaceholder}
                  className="w-full pl-10 pr-10 py-3 rounded-2xl bg-cream border border-cream-border text-maroon text-sm focus:outline-none focus:border-coral transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-mauve/60 hover:text-maroon focus:outline-none transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              id="weddings-login-submit-button"
              disabled={isLoading}
              className="w-full mt-2 py-3.5 px-6 rounded-2xl bg-maroon hover:bg-maroon-light text-cream font-semibold text-sm shadow-md hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span>{AUTH_COPY.login.submittingText}</span>
              ) : (
                <>
                  <span>{AUTH_COPY.login.submitButtonText}</span>
                  <ArrowRight className="w-4 h-4 text-coral" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Signup Switch */}
        <div className="mt-6 pt-6 border-t border-cream-border text-center text-xs text-mauve">
          <span>{AUTH_COPY.login.footerPrompt} </span>
          <button
            type="button"
            id="weddings-goto-signup-button"
            onClick={() => onNavigate(buildAuthUrl(rawRedirect || '/weddings/create', true))}
            className="font-semibold text-maroon hover:text-coral transition-colors cursor-pointer"
          >
            {AUTH_COPY.login.footerLinkText}
          </button>
        </div>
      </div>
    </div>
  );
};
