// src/app/forgot-password/page.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowRight, AlertCircle, CheckCircle2, KeyRound, ExternalLink } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetData, setResetData] = useState<{
    resetUrl: string;
    resetToken: string;
    email: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to process password reset request.');
      }

      setResetData({
        resetUrl: data.resetUrl,
        resetToken: data.resetToken,
        email: data.email,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white font-black text-2xl shadow-xl shadow-indigo-500/20 mb-4">
          <KeyRound className="w-7 h-7" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Recover Password
        </h1>
        <p className="mt-2 text-sm text-slate-300">
          Enter your registered mail ID to reset your account password
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-2xl rounded-2xl border border-slate-100">
          {!resetData ? (
            <form className="space-y-5" onSubmit={handleSubmit}>
              {error && (
                <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Registered Work Email (Mail ID)
                </label>
                <div className="mt-1 relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@enterprise.edu"
                    className="block w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 bg-white text-slate-900 placeholder:text-slate-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg shadow-md text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
              >
                {loading ? (
                  <span>Generating Recovery Link...</span>
                ) : (
                  <>
                    <span>Generate Reset Password Link</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span className="font-bold text-sm">Reset Link Generated!</span>
                </div>
                <p className="mt-1.5 text-xs text-emerald-800 leading-relaxed">
                  A secure 1-hour password recovery token was generated for{' '}
                  <strong className="underline">{resetData.email}</strong>.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Direct Password Reset Link:
                </span>
                <Link
                  href={resetData.resetUrl}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg shadow-sm text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
                >
                  <span>Click to Set New Password Now</span>
                  <ExternalLink className="w-4 h-4" />
                </Link>
                <div className="text-[11px] text-slate-500 text-center">
                  Token expires in 60 minutes for security purposes.
                </div>
              </div>
            </div>
          )}

          {/* Back to sign in */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <Link
              href="/login"
              className="font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              ← Back to Sign In
            </Link>
            <Link
              href="/register"
              className="font-bold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Register New Account →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
