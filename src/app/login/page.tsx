// src/app/login/page.tsx
'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, Mail, ArrowRight, AlertCircle, CheckCircle2, ShieldCheck, UserPlus, KeyRound } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get('registered');
  const reset = searchParams.get('reset');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed. Please verify your credentials.');
      }

      // Route to user's dedicated portal based on their verified database role
      if (data.user.role === 'CEO') {
        router.push('/ceo/dashboard');
      } else if (data.user.role === 'HR') {
        router.push('/hr/dashboard');
      } else {
        router.push('/bdm/dashboard');
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white py-8 px-6 sm:px-10 shadow-2xl rounded-2xl border border-slate-100">
      {registered && (
        <div className="mb-5 p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
          <span>Account created successfully! Please sign in with your credentials.</span>
        </div>
      )}

      {reset && (
        <div className="mb-5 p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
          <span>Password reset successful! Sign in with your new password.</span>
        </div>
      )}

      {error && (
        <div className="mb-5 p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Work Email Address (Mail ID)
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

        <div>
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="mt-1 relative rounded-lg shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
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
            <span>Signing in...</span>
          ) : (
            <>
              <span>Sign In to Platform</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Account Registration & Security Options */}
      <div className="mt-6 pt-5 border-t border-slate-100 space-y-3">
        <Link
          href="/register"
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
        >
          <UserPlus className="w-4 h-4 text-indigo-600" />
          <span>Don&apos;t have an account? Register Here</span>
        </Link>

        <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 font-medium pt-1">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Role-Based Access Control & Strict Encryption Active</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white font-black text-2xl shadow-xl shadow-indigo-500/20 mb-4">
          B
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          EduDeal Enterprise
        </h1>
        <p className="mt-2 text-sm text-slate-300">
          College Business Deal Management & Executive Governance Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Suspense fallback={<div className="bg-white p-8 rounded-2xl text-center text-sm text-slate-500">Loading portal...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
